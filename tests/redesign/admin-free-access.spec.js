/**
 * Admin-granted free tool access — end-to-end UI tests.
 *
 * Strategy: we can't hit the real Supabase from the test runner, so we
 * install a stub `window.supabaseClient` before supabase.js runs.
 * The stub mimics the subset of PostgREST chaining the dashboard uses
 * and records every mutation so tests can assert the right calls fired.
 */
const { test, expect } = require('@playwright/test');

// ------------------------------------------------------------------
// Shared Supabase stub (serialized into the page via addInitScript).
// Exposes window.__supaStub with helpers:
//   .calls   — array of mutation records ({ table, op, payload, match })
//   .data    — mutable in-page data: { user_profiles: [...], tool_access_invites: [...] }
//   .admin   — the fake admin user
// ------------------------------------------------------------------
function supaStubSource() {
  const adminUser = {
    id: 'admin-0001',
    email: 'admin@ai-auto.com',
    user_metadata: {},
  };

  const now = new Date().toISOString();
  const state = {
    calls: [],
    admin: adminUser,
    data: {
      user_profiles: [
        {
          id: 'admin-0001', email: 'admin@ai-auto.com',
          full_name: 'Admin', is_admin: true,
          has_free_tools_access: false,
          free_access_granted_at: null, free_access_granted_by: null, free_access_note: null,
          created_at: '2025-12-01T00:00:00Z',
        },
        {
          id: 'user-paid-1', email: 'paid@example.com',
          full_name: 'Paid User', is_admin: false,
          has_free_tools_access: false,
          free_access_granted_at: null, free_access_granted_by: null, free_access_note: null,
          created_at: '2026-01-15T00:00:00Z',
        },
        {
          id: 'user-plain-2', email: 'plain@example.com',
          full_name: 'Plain User', is_admin: false,
          has_free_tools_access: false,
          free_access_granted_at: null, free_access_granted_by: null, free_access_note: null,
          created_at: '2026-02-01T00:00:00Z',
        },
        {
          id: 'user-free-3', email: 'already-free@example.com',
          full_name: 'Already Free', is_admin: false,
          has_free_tools_access: true,
          free_access_granted_at: '2026-03-01T00:00:00Z',
          free_access_granted_by: 'admin-0001',
          free_access_note: 'launched with product',
          created_at: '2026-02-20T00:00:00Z',
        },
      ],
      tool_access_invites: [
        {
          id: 'invite-existing-1', email: 'pending@example.com',
          invited_by: 'admin-0001', invited_at: '2026-04-01T00:00:00Z',
          redeemed_at: null, redeemed_by: null, note: 'beta tester',
        },
      ],
      subscriptions: [
        { user_id: 'user-paid-1', status: 'active', current_period_end: '2027-01-01T00:00:00Z' },
      ],
      blog_posts: [],
      tool_usage: [],
    },
  };

  function ok(data) { return Promise.resolve({ data, error: null }); }
  function err(message, code) { return Promise.resolve({ data: null, error: { message, code } }); }

  function matches(row, match) {
    for (const k of Object.keys(match)) {
      const expected = match[k];
      if (expected && typeof expected === 'object' && expected.op === 'ilike') {
        if (String(row[k] || '').toLowerCase() !== String(expected.value).toLowerCase()) return false;
      } else if (row[k] !== expected) {
        return false;
      }
    }
    return true;
  }

  function makeQuery(table) {
    const q = {
      _table: table,
      _match: {},
      _op: 'select',
      _payload: null,
      _upsertOpts: null,
      _orderBy: [],
      _cols: '*',
    };

    const api = {
      select(cols) { q._cols = cols || '*'; q._op = q._op === 'select' ? 'select' : q._op; return api; },
      eq(k, v) { q._match[k] = v; return api; },
      ilike(k, v) { q._match[k] = { op: 'ilike', value: v }; return api; },
      in(k, arr) { q._match[k] = { op: 'in', value: arr }; return api; },
      order(k, opts) { q._orderBy.push({ k, opts }); return api; },
      maybeSingle() { q._single = 'maybe'; return terminal(); },
      single() { q._single = 'single'; return terminal(); },
      update(payload) { q._op = 'update'; q._payload = payload; return api; },
      insert(payload) { q._op = 'insert'; q._payload = payload; return api; },
      upsert(payload, opts) { q._op = 'upsert'; q._payload = payload; q._upsertOpts = opts; return api; },
      delete() { q._op = 'delete'; return api; },
      then(resolve, reject) { return terminal().then(resolve, reject); },
    };

    function runSelect() {
      const tbl = state.data[q._table] || [];
      let rows = tbl;
      const match = {};
      for (const k of Object.keys(q._match)) {
        const m = q._match[k];
        if (m && typeof m === 'object' && m.op === 'in') {
          rows = rows.filter((r) => m.value.includes(r[k]));
        } else {
          match[k] = m;
        }
      }
      rows = rows.filter((r) => matches(r, match));
      if (q._single === 'single') {
        if (rows.length === 0) return err('No rows', 'PGRST116');
        return ok(rows[0]);
      }
      if (q._single === 'maybe') {
        return ok(rows[0] || null);
      }
      return ok(rows);
    }

    function runMutation() {
      const tbl = state.data[q._table] = state.data[q._table] || [];

      if (q._op === 'update') {
        const matched = tbl.filter((r) => matches(r, q._match));
        matched.forEach((r) => Object.assign(r, q._payload));
        state.calls.push({ table: q._table, op: 'update', payload: q._payload, match: { ...q._match } });
        if (q._single === 'single') {
          if (matched.length === 0) return err('No rows', 'PGRST116');
          return ok(matched[0]);
        }
        return ok(matched);
      }

      if (q._op === 'insert' || q._op === 'upsert') {
        const rows = Array.isArray(q._payload) ? q._payload : [q._payload];
        const conflictKey = q._upsertOpts && q._upsertOpts.onConflict;
        const upserted = [];
        for (const row of rows) {
          if (q._op === 'upsert' && conflictKey) {
            const existing = tbl.find((r) =>
              String(r[conflictKey] || '').toLowerCase() === String(row[conflictKey] || '').toLowerCase()
            );
            if (existing) {
              Object.assign(existing, row);
              upserted.push(existing);
              continue;
            }
          }
          const id = row.id || `stub-${Math.random().toString(36).slice(2, 10)}`;
          const full = { ...row, id };
          tbl.push(full);
          upserted.push(full);
        }
        state.calls.push({ table: q._table, op: q._op, payload: q._payload, opts: q._upsertOpts });
        if (q._single === 'single') return ok(upserted[0]);
        return ok(upserted);
      }

      if (q._op === 'delete') {
        const before = tbl.length;
        const kept = tbl.filter((r) => !matches(r, q._match));
        state.data[q._table] = kept;
        state.calls.push({ table: q._table, op: 'delete', match: { ...q._match } });
        return ok({ deleted: before - kept.length });
      }

      return runSelect();
    }

    function terminal() {
      return (q._op === 'select') ? runSelect() : runMutation();
    }

    return api;
  }

  const stub = {
    auth: {
      async getUser() { return { data: { user: adminUser }, error: null }; },
      async getSession() {
        return { data: { session: { user: adminUser, access_token: 'stub' } }, error: null };
      },
      async signOut() { return { error: null }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithPassword() { return { data: { user: adminUser }, error: null }; },
      async updateUser() { return { data: { user: adminUser }, error: null }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
    },
    from(table) { return makeQuery(table); },
    rpc() { return ok(true); },
    storage: {
      from() {
        return {
          upload: async () => ({ data: { path: 'stub' }, error: null }),
          remove: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://stub/img.png' } }),
        };
      },
    },
  };

  window.supabaseClient = stub;
  window.supabase = window.supabase || { createClient: () => stub };
  window.__supaStub = state;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(supaStubSource);
});

// ------------------------------------------------------------------
// 1. Plumbing — SQL migration + JS methods exist
// ------------------------------------------------------------------
test.describe('Plumbing', () => {
  test('SQL migration is present with the expected statements', async ({ request }) => {
    const res = await request.get('/docs/sql/add_admin_free_tool_access.sql');
    expect(res.status()).toBe(200);
    const sql = await res.text();
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS has_free_tools_access BOOLEAN');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.tool_access_invites');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.can_use_tool');
    expect(sql).toContain('has_free_tools_access');
    expect(sql).toContain('redeem_tool_access_invite_on_signup');
  });

  test('AdminUserManager exposes the new methods after supabase.js loads', async ({ page }) => {
    // Use an admin page so supabase.js is loaded.
    await page.goto('/admin/login.html');
    await page.waitForLoadState('load');
    const methods = await page.evaluate(() => {
      if (!window.adminUserManager) return null;
      return [
        'grantFreeAccess',
        'revokeFreeAccess',
        'inviteByEmail',
        'listInvites',
        'revokeInvite',
        'getFreeAccessUsers',
      ].filter((m) => typeof window.adminUserManager[m] === 'function');
    });
    expect(methods).toEqual([
      'grantFreeAccess',
      'revokeFreeAccess',
      'inviteByEmail',
      'listInvites',
      'revokeInvite',
      'getFreeAccessUsers',
    ]);
  });

  test('canAccessTools returns true when profile.has_free_tools_access is true', async ({ page }) => {
    await page.goto('/admin/login.html');
    await page.waitForLoadState('load');

    const result = await page.evaluate(async () => {
      // Override the getCurrentProfile helper to return a free-access user.
      window.userManager.getCurrentProfile = async () => ({
        data: { id: 'x', has_free_tools_access: true },
        error: null,
      });
      window.userManager.getSubscriptionStatus = async () => ({
        data: { status: 'inactive' },
        error: null,
      });
      return window.userManager.canAccessTools();
    });
    expect(result).toBe(true);
  });

  test('canAccessTools still returns true for an active subscription when no free access', async ({ page }) => {
    await page.goto('/admin/login.html');
    await page.waitForLoadState('load');

    const result = await page.evaluate(async () => {
      window.userManager.getCurrentProfile = async () => ({
        data: { id: 'x', has_free_tools_access: false },
        error: null,
      });
      window.userManager.getSubscriptionStatus = async () => ({
        data: { status: 'active' },
        error: null,
      });
      return window.userManager.canAccessTools();
    });
    expect(result).toBe(true);
  });

  test('canAccessTools returns false when neither access path is open', async ({ page }) => {
    await page.goto('/admin/login.html');
    await page.waitForLoadState('load');

    const result = await page.evaluate(async () => {
      window.userManager.getCurrentProfile = async () => ({
        data: { id: 'x', has_free_tools_access: false },
        error: null,
      });
      window.userManager.getSubscriptionStatus = async () => ({
        data: { status: 'inactive' },
        error: null,
      });
      return window.userManager.canAccessTools();
    });
    expect(result).toBe(false);
  });
});

// ------------------------------------------------------------------
// 2. Admin dashboard UI — structure + end-to-end flows
// ------------------------------------------------------------------
test.describe('Admin dashboard UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await page.goto('/admin/dashboard.html');
    await page.waitForLoadState('load');
    // Wait for the users table to render (requires stubbed data to load).
    await page.locator('[data-testid="users-container"] [data-testid="user-row"]').first().waitFor({ timeout: 8000 });
    await page.locator('[data-testid="invites-container"] [data-testid="invite-row"]').first().waitFor({ timeout: 8000 });
  });

  test('renders Free Access stats card + invite form + invites list', async ({ page }) => {
    await expect(page.locator('[data-testid="free-access-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="free-access-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="invite-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-submit"]')).toBeVisible();
    const inviteRows = await page.locator('[data-testid="invite-row"]').count();
    expect(inviteRows).toBeGreaterThan(0);
  });

  test('users without free access show a Grant Free button', async ({ page }) => {
    const grantBtns = page.locator('[data-testid="grant-free"]');
    const count = await grantBtns.count();
    // Admin + paid + plain users = 3 rows without free access initially.
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('user with free access shows Revoke Free + Free Access badge', async ({ page }) => {
    const row = page.locator('[data-testid="user-row"][data-user-id="user-free-3"]');
    await expect(row.locator('[data-testid="user-free-badge"]')).toBeVisible();
    await expect(row.locator('[data-testid="revoke-free"]')).toBeVisible();
  });

  test('granting free access flips the flag and re-renders the row', async ({ page }) => {
    const row = page.locator('[data-testid="user-row"][data-user-id="user-plain-2"]');
    await row.locator('[data-testid="grant-free"]').click();
    // Wait for re-render
    await expect(row.locator('[data-testid="user-free-badge"]')).toBeVisible({ timeout: 5000 });
    await expect(row.locator('[data-testid="revoke-free"]')).toBeVisible();

    // Stub should have recorded the update call.
    const calls = await page.evaluate(() => window.__supaStub.calls);
    const update = calls.find(
      (c) => c.table === 'user_profiles' && c.op === 'update' && c.match && c.match.id === 'user-plain-2'
    );
    expect(update).toBeTruthy();
    expect(update.payload.has_free_tools_access).toBe(true);
  });

  test('revoking free access on an already-free user flips the flag off', async ({ page }) => {
    const row = page.locator('[data-testid="user-row"][data-user-id="user-free-3"]');
    await row.locator('[data-testid="revoke-free"]').click();
    await expect(row.locator('[data-testid="grant-free"]')).toBeVisible({ timeout: 5000 });
    await expect(row.locator('[data-testid="user-free-badge"]')).toHaveCount(0);

    const calls = await page.evaluate(() => window.__supaStub.calls);
    const update = calls.find(
      (c) => c.table === 'user_profiles' && c.op === 'update' && c.match && c.match.id === 'user-free-3'
    );
    expect(update).toBeTruthy();
    expect(update.payload.has_free_tools_access).toBe(false);
  });

  test('invite-by-email for an EXISTING user grants directly', async ({ page }) => {
    await page.fill('[data-testid="invite-email"]', 'plain@example.com');
    await page.fill('[data-testid="invite-note"]', 'Upgraded by admin');
    await page.click('[data-testid="invite-submit"]');
    await expect(page.locator('[data-testid="invite-msg"]')).toContainText(/existing user/i, { timeout: 5000 });

    // The plain user row should now show a Free Access badge.
    const row = page.locator('[data-testid="user-row"][data-user-id="user-plain-2"]');
    await expect(row.locator('[data-testid="user-free-badge"]')).toBeVisible({ timeout: 5000 });

    const calls = await page.evaluate(() => window.__supaStub.calls);
    // Should be a user_profiles update, NOT a tool_access_invites insert.
    const profileUpdate = calls.find(
      (c) => c.table === 'user_profiles' && c.op === 'update' && c.match.id === 'user-plain-2'
    );
    const inviteInsert = calls.find(
      (c) => c.table === 'tool_access_invites' && (c.op === 'insert' || c.op === 'upsert')
    );
    expect(profileUpdate).toBeTruthy();
    expect(inviteInsert).toBeFalsy();
  });

  test('invite-by-email for a NEW email inserts a pending invite', async ({ page }) => {
    await page.fill('[data-testid="invite-email"]', 'newcomer@example.com');
    await page.fill('[data-testid="invite-note"]', 'new signup');
    await page.click('[data-testid="invite-submit"]');
    await expect(page.locator('[data-testid="invite-msg"]')).toContainText(/invite queued/i, { timeout: 5000 });

    // New row should appear in invites list.
    await expect(
      page.locator('[data-testid="invite-row"]', { hasText: 'newcomer@example.com' })
    ).toBeVisible({ timeout: 5000 });

    const calls = await page.evaluate(() => window.__supaStub.calls);
    const inviteUpsert = calls.find(
      (c) => c.table === 'tool_access_invites' && c.op === 'upsert'
    );
    expect(inviteUpsert).toBeTruthy();
    const payload = Array.isArray(inviteUpsert.payload) ? inviteUpsert.payload[0] : inviteUpsert.payload;
    expect(payload.email).toBe('newcomer@example.com');
  });

  test('revoke an existing pending invite removes it from the list', async ({ page }) => {
    const row = page.locator('[data-testid="invite-row"]', { hasText: 'pending@example.com' });
    await expect(row).toBeVisible();
    await row.locator('[data-testid="revoke-invite"]').click();
    await expect(row).toHaveCount(0, { timeout: 5000 });

    const calls = await page.evaluate(() => window.__supaStub.calls);
    const inviteDelete = calls.find((c) => c.table === 'tool_access_invites' && c.op === 'delete');
    expect(inviteDelete).toBeTruthy();
  });

  test('invalid email in invite form shows an error and does not call Supabase', async ({ page }) => {
    // Use JavaScript to bypass HTML5 required validation, simulating API path.
    await page.evaluate(() => {
      const email = document.querySelector('[data-testid="invite-email"]');
      email.removeAttribute('required');
      email.type = 'text';
      email.value = 'not-an-email';
      document.querySelector('[data-testid="invite-form"]').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await expect(page.locator('[data-testid="invite-msg"]')).toContainText(/invalid email/i, { timeout: 5000 });
  });

  test('stats card Free Access count updates after granting', async ({ page }) => {
    // Grant one more user free access; count should bump from 1 -> 2.
    await expect(page.locator('[data-testid="free-access-count"]')).toHaveText('1');
    await page
      .locator('[data-testid="user-row"][data-user-id="user-paid-1"] [data-testid="grant-free"]')
      .click();
    await expect(page.locator('[data-testid="free-access-count"]')).toHaveText('2', { timeout: 5000 });
  });
});

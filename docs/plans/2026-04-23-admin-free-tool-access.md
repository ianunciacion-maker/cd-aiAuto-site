# Admin-Granted Free Access to the 4 AI Tools

**Goal:** Admin invites a person (by email) to use the 4 AI tools (Blog Generator, Social Captions, Email Campaigns, Product Descriptions) without paying — they become a "free user" with the same per-month usage limits as paid users but no Stripe subscription required.

**Branch:** `redesign`
**Date:** 2026-04-23

---

## Design

### Two flows

1. **User already signed up** — admin clicks "Grant Free Access" on their row in the Users table. Their `user_profiles.has_free_tools_access` flips to `TRUE` immediately. Tool gate respects this from the next request.
2. **User not yet signed up** — admin enters email in an "Invite by email" form. A row is inserted into `tool_access_invites`. When the user later signs up with that email, a trigger flips their profile flag and marks the invite redeemed.

Either flow can be **revoked** at any time (flag → FALSE; pending invite → deleted).

### Access gate evolution

Tools currently gate via `can_use_tool(user_id, tool_type)` which checks active Stripe subscription. After this change:

```
can_use_tool = (subscription is active AND usage < limit)
             OR (profile.has_free_tools_access = TRUE AND usage < limit)
```

Tool usage counters (`tool_usage.generation_count`) still apply — free users get the same monthly_limit as paid users (currently 100/tool). That prevents abuse while keeping the behavior identical from the user's POV.

### Schema changes

**`user_profiles`** — add columns:
- `has_free_tools_access BOOLEAN DEFAULT FALSE`
- `free_access_granted_at TIMESTAMPTZ`
- `free_access_granted_by UUID REFERENCES auth.users(id)`
- `free_access_note TEXT`

**New table `tool_access_invites`**:
- `id UUID PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `invited_by UUID NOT NULL REFERENCES auth.users(id)`
- `invited_at TIMESTAMPTZ DEFAULT NOW()`
- `redeemed_at TIMESTAMPTZ NULL`
- `note TEXT`

**Replace `can_use_tool()` function** to include the `has_free_tools_access` branch.

**New trigger `redeem_tool_access_invite_on_signup`** on `user_profiles INSERT`:
if a matching invite exists and is not yet redeemed, set the profile's flag and stamp `redeemed_at`.

**RLS policies** on `tool_access_invites`: admins read/write all; regular users no access.

### Client changes (`supabase.js`)

- `UserManager.canAccessTools()` — returns `true` when **either** subscription is active/trialing **or** profile.has_free_tools_access is true.
- `AdminUserManager` — add:
  - `grantFreeAccess(userId, note)`
  - `revokeFreeAccess(userId)`
  - `inviteByEmail(email, note)` — grants immediately if a profile with that email exists, else inserts a pending invite.
  - `listInvites()` — all invite rows.
  - `revokeInvite(inviteId)` — deletes a pending invite.
  - `getFreeAccessUsers()` — users with `has_free_tools_access = true`.

### Admin dashboard UI (`admin/dashboard.html`)

- **Stats card**: new "Free Access" count card alongside existing stats.
- **Users table**: per-row Grant / Revoke button with a gold "Free Access" badge; status column shows "Free Access" when flag is on.
- **New section above Users**: "Tool Access Invites"
  - Email input + optional note + "Invite" button.
  - List of pending invites with Revoke button and redeemed invites with timestamp.

### Test strategy

Live Supabase can't be reached from the test runner, so Playwright uses `page.addInitScript` to set `window.supabaseClient` to a stub that returns canned responses. Tests verify:

1. **Plumbing** — the SQL migration file exists and contains the expected ALTER/CREATE statements; `supabase.js` exports each new AdminUserManager method.
2. **UI** — the admin dashboard has the expected new UI elements (Free Access stats card, invite form, invite list container, per-row Grant button).
3. **End-to-end UI logic** — with the stubbed client, simulate:
   - Grant Free Access on a user row → stub receives the right UPDATE → row re-renders with Free Access badge.
   - Revoke on the now-free-access user → badge removed.
   - Invite by email for a non-existent user → stub records an invite insert → invites list renders the new row.
   - Invite an existing user → stub upgrades the flag directly instead of inserting.
   - Revoke invite on a pending row → stub records a delete.
4. **Gate behavior** — `canAccessTools()` on the tool pages returns `true` both when subscription is active and when `has_free_tools_access` is true.

All tests pass 3× consecutive before commit.

---

## Runtime checklist for Ian

1. Open Supabase SQL editor, run `docs/sql/add_admin_free_tool_access.sql`.
2. Verify one test user by visiting `/admin/dashboard.html`, clicking "Grant Free Access" on any row.
3. Log in as that user and visit a tool page — should work without subscription.
4. Revoke to confirm gating restores.

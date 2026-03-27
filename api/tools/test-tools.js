#!/usr/bin/env node
/**
 * Integration tests for all 4 AI tool endpoints.
 * Validates response contracts match what the frontend expects.
 *
 * Usage:
 *   1. Start vercel dev: npx vercel dev
 *   2. Run tests:        node api/tools/test-tools.js
 *
 * Requires OPENROUTER_API_KEY in environment (via .env.local or export).
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// ─── Test Utilities ──────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertType(value, type, fieldName) {
  assert(typeof value === type, `${fieldName} should be ${type}, got ${typeof value}`);
}

function assertPresent(value, fieldName) {
  assert(value !== undefined && value !== null && value !== '', `${fieldName} should be present, got: ${value}`);
}

async function runTest(name, fn) {
  process.stdout.write(`  ${name} ... `);
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`PASS (${ms}ms)`);
    passed++;
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`FAIL (${ms}ms)`);
    console.log(`    Error: ${err.message}`);
    failed++;
  }
}

async function postJSON(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─── Blog Generator Tests ────────────────────────────────────────

async function testBlogGenerator() {
  console.log('\n--- Blog Generator (/api/tools/generate-blog) ---');

  await runTest('returns 200 with valid topic', async () => {
    const { status, data } = await postJSON('/api/tools/generate-blog', {
      topic: 'Benefits of remote work for small businesses',
      length: 'medium',
      tone: 'professional',
      keywords: 'remote work, productivity, small business'
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert(data.success === true, `success should be true, got ${data.success}`);
  });

  await runTest('response has title (string, non-empty)', async () => {
    const { data } = await postJSON('/api/tools/generate-blog', {
      topic: 'Why AI tools save time',
      length: 'short',
      tone: 'casual'
    });
    assertPresent(data.title, 'title');
    assertType(data.title, 'string', 'title');
    assert(data.title.length > 3, `title too short: "${data.title}"`);
  });

  await runTest('response has content (string, HTML)', async () => {
    const { data } = await postJSON('/api/tools/generate-blog', {
      topic: 'Email marketing tips',
      length: 'short',
      tone: 'professional'
    });
    assertPresent(data.content, 'content');
    assertType(data.content, 'string', 'content');
    assert(data.content.length > 50, `content too short (${data.content.length} chars)`);
  });

  await runTest('response has isHtml: true', async () => {
    const { data } = await postJSON('/api/tools/generate-blog', {
      topic: 'Content marketing basics',
      length: 'short',
      tone: 'casual'
    });
    assert(data.isHtml === true, `isHtml should be true, got ${data.isHtml}`);
  });

  await runTest('rejects missing topic', async () => {
    const { status, data } = await postJSON('/api/tools/generate-blog', {
      length: 'short'
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(data.success === false, 'success should be false');
  });
}

// ─── Social Captions Tests ───────────────────────────────────────

async function testSocialCaptions() {
  console.log('\n--- Social Captions (/api/tools/generate-captions) ---');

  await runTest('returns 200 with valid payload', async () => {
    const { status, data } = await postJSON('/api/tools/generate-captions', {
      topic: 'New product launch for fitness app',
      platforms: ['instagram', 'twitter'],
      tone: 'energetic',
      hashtags: true,
      length: 'medium'
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert(data.success === true, `success should be true, got ${data.success}`);
  });

  await runTest('response has captions object', async () => {
    const { data } = await postJSON('/api/tools/generate-captions', {
      topic: 'Summer sale announcement',
      platforms: ['instagram', 'facebook'],
      tone: 'excited',
      hashtags: true,
      length: 'short'
    });
    assertPresent(data.captions, 'captions');
    assertType(data.captions, 'object', 'captions');
  });

  await runTest('captions contain requested platforms', async () => {
    const platforms = ['instagram', 'linkedin'];
    const { data } = await postJSON('/api/tools/generate-captions', {
      topic: 'Company milestone celebration',
      platforms,
      tone: 'professional',
      hashtags: false,
      length: 'medium'
    });
    for (const p of platforms) {
      assertPresent(data.captions[p], `captions.${p}`);
    }
  });

  await runTest('caption values are non-empty strings', async () => {
    const { data } = await postJSON('/api/tools/generate-captions', {
      topic: 'Weekend brunch restaurant promo',
      platforms: ['instagram'],
      tone: 'fun',
      hashtags: true,
      length: 'short'
    });
    const caption = data.captions.instagram;
    assertType(caption, 'string', 'captions.instagram');
    assert(caption.length > 10, `caption too short: "${caption}"`);
  });

  await runTest('rejects missing topic', async () => {
    const { status } = await postJSON('/api/tools/generate-captions', {
      platforms: ['instagram']
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await runTest('rejects missing platforms', async () => {
    const { status } = await postJSON('/api/tools/generate-captions', {
      topic: 'Test'
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await runTest('rejects empty platforms array', async () => {
    const { status } = await postJSON('/api/tools/generate-captions', {
      topic: 'Test',
      platforms: []
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });
}

// ─── Email Campaigns Tests ───────────────────────────────────────

async function testEmailCampaigns() {
  console.log('\n--- Email Campaigns (/api/tools/generate-email-campaign) ---');

  await runTest('returns 200 with valid payload', async () => {
    const { status, data } = await postJSON('/api/tools/generate-email-campaign', {
      subject: 'Welcome series for new subscribers',
      purpose: 'onboarding',
      audience: 'New SaaS trial users',
      tone: 'friendly',
      keyPoints: 'Feature highlights, quick wins, support resources',
      cta: 'Start your first project',
      length: 'short'
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert(data.success === true, `success should be true`);
  });

  await runTest('response has email.campaign array', async () => {
    const { data } = await postJSON('/api/tools/generate-email-campaign', {
      subject: 'Flash sale notification',
      purpose: 'promotional',
      audience: 'Existing customers',
      tone: 'urgent',
      cta: 'Shop now',
      length: 'short'
    });
    assertPresent(data.email, 'email');
    assert(Array.isArray(data.email.campaign), 'email.campaign should be an array');
    assert(data.email.campaign.length >= 1, 'campaign should have at least 1 email');
  });

  await runTest('campaign emails have required fields', async () => {
    const { data } = await postJSON('/api/tools/generate-email-campaign', {
      subject: 'Product update announcement',
      purpose: 'informational',
      audience: 'All users',
      tone: 'professional',
      cta: 'See what is new',
      length: 'short'
    });
    const email = data.email.campaign[0];
    assertPresent(email.subjectLine, 'campaign[0].subjectLine');
    assertPresent(email.body, 'campaign[0].body');
  });

  await runTest('rejects missing subject', async () => {
    const { status, data } = await postJSON('/api/tools/generate-email-campaign', {
      purpose: 'promotional'
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(data.success === false, 'success should be false');
  });
}

// ─── Product Descriptions Tests ──────────────────────────────────

async function testProductDescriptions() {
  console.log('\n--- Product Descriptions (/api/tools/generate-product-description) ---');

  await runTest('returns 200 with valid payload', async () => {
    const { status, data } = await postJSON('/api/tools/generate-product-description', {
      productName: 'AirFlow Pro Wireless Earbuds',
      category: 'Electronics',
      features: 'Noise cancellation, 30hr battery, waterproof',
      targetAudience: 'Remote workers and fitness enthusiasts',
      tone: 'energetic',
      length: 'medium'
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert(data.success === true, `success should be true`);
  });

  await runTest('response has description with required fields', async () => {
    const { data } = await postJSON('/api/tools/generate-product-description', {
      productName: 'SmartDesk Standing Desk',
      category: 'Furniture',
      features: 'Electric height adjustment, memory presets',
      targetAudience: 'Office workers',
      tone: 'professional',
      length: 'short'
    });
    const d = data.description;
    assertPresent(d, 'description');
    assertPresent(d.headline, 'description.headline');
    assertPresent(d.shortDescription, 'description.shortDescription');
    assertPresent(d.fullDescription, 'description.fullDescription');
    assert(Array.isArray(d.keyFeatures), 'keyFeatures should be array');
    assert(Array.isArray(d.benefits), 'benefits should be array');
    assertPresent(d.callToAction, 'description.callToAction');
  });

  await runTest('rejects missing productName', async () => {
    const { status, data } = await postJSON('/api/tools/generate-product-description', {
      category: 'Electronics'
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(data.success === false, 'success should be false');
  });
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('=== AI Tool Integration Tests ===');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Check server is reachable
  try {
    await fetch(`${BASE_URL}/api/tools/generate-blog`, { method: 'OPTIONS' });
  } catch {
    console.error(`Cannot reach ${BASE_URL}. Start the dev server first:\n  npx vercel dev\n`);
    process.exit(1);
  }

  await testBlogGenerator();
  await testSocialCaptions();
  await testEmailCampaigns();
  await testProductDescriptions();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();

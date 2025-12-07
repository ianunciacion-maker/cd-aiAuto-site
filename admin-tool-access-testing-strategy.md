# Admin Tool Access Management - Testing Strategy

## Overview

This document outlines a comprehensive testing strategy for the Admin Tool Access Management system, covering unit tests, integration tests, and end-to-end testing scenarios.

## Testing Objectives

1. **Functionality**: Verify all admin features work as expected
2. **Security**: Ensure proper authentication and authorization
3. **Performance**: Validate system performance under load
4. **Usability**: Confirm admin interface is intuitive and functional
5. **Data Integrity**: Ensure database operations maintain data consistency

## Test Environment Setup

### 1. Database Setup
- Create test database separate from production
- Populate with test data including:
  - Admin user (setyourownsalary@gmail.com)
  - Multiple regular users with different subscription statuses
  - Various tool usage scenarios
  - Existing tool access records

### 2. Test Users
```sql
-- Test admin user
INSERT INTO auth.users (id, email) VALUES 
('admin-test-uuid', 'setyourownsalary@gmail.com');

-- Test regular users
INSERT INTO auth.users (id, email) VALUES 
('user1-test-uuid', 'user1@test.com'),
('user2-test-uuid', 'user2@test.com'),
('user3-test-uuid', 'user3@test.com');
```

### 3. Test Data
```sql
-- User profiles
INSERT INTO user_profiles (id, email, full_name) VALUES
('user1-test-uuid', 'user1@test.com', 'Test User One'),
('user2-test-uuid', 'user2@test.com', 'Test User Two'),
('user3-test-uuid', 'user3@test.com', 'Test User Three');

-- Subscriptions
INSERT INTO subscriptions (user_id, status, current_period_end) VALUES
('user1-test-uuid', 'active', NOW() + INTERVAL '1 month'),
('user2-test-uuid', 'inactive', NOW() - INTERVAL '1 day'),
('user3-test-uuid', 'trialing', NOW() + INTERVAL '15 days');

-- Tool usage
INSERT INTO tool_usage (user_id, tool_type, generation_count, monthly_limit) VALUES
('user1-test-uuid', 'blog_generator', 50, 100),
('user1-test-uuid', 'social_captions', 25, 100),
('user2-test-uuid', 'blog_generator', 100, 100),
('user3-test-uuid', 'social_captions', 0, 100);
```

## Unit Tests

### 1. Database Function Tests

#### Test: set_tool_access
```sql
-- Test Case 1: Grant access to new tool
SELECT set_tool_access(
  'user1-test-uuid',
  'email_campaigns',
  true,
  'admin-test-uuid'
);
-- Verify: Record created in user_tool_access table
-- Verify: Audit log entry created

-- Test Case 2: Revoke existing access
SELECT set_tool_access(
  'user1-test-uuid',
  'blog_generator',
  false,
  'admin-test-uuid'
);
-- Verify: Record updated in user_tool_access table
-- Verify: Audit log entry created with previous state

-- Test Case 3: Invalid tool type
SELECT set_tool_access(
  'user1-test-uuid',
  'invalid_tool',
  true,
  'admin-test-uuid'
);
-- Expected: Exception thrown
```

#### Test: reset_tool_usage
```sql
-- Test Case 1: Reset usage counter
SELECT reset_tool_usage(
  'user1-test-uuid',
  'blog_generator',
  'admin-test-uuid'
);
-- Verify: generation_count set to 0
-- Verify: last_used_at set to NULL
-- Verify: Audit log entry created

-- Test Case 2: Reset non-existent tool
SELECT reset_tool_usage(
  'user1-test-uuid',
  'product_descriptions',
  'admin-test-uuid'
);
-- Expected: No error, but no changes made
```

#### Test: can_use_tool (Updated)
```sql
-- Test Case 1: Active subscription, tool enabled, usage available
SELECT can_use_tool('user1-test-uuid', 'blog_generator');
-- Expected: TRUE

-- Test Case 2: Inactive subscription
SELECT can_use_tool('user2-test-uuid', 'blog_generator');
-- Expected: FALSE

-- Test Case 3: Tool access revoked
-- First revoke access
SELECT set_tool_access('user1-test-uuid', 'blog_generator', false, 'admin-test-uuid');
-- Then test
SELECT can_use_tool('user1-test-uuid', 'blog_generator');
-- Expected: FALSE

-- Test Case 4: Usage limit exceeded
-- First set usage to limit
UPDATE tool_usage SET generation_count = 100 WHERE user_id = 'user1-test-uuid' AND tool_type = 'blog_generator';
-- Then test
SELECT can_use_tool('user1-test-uuid', 'blog_generator');
-- Expected: FALSE
```

#### Test: get_user_tool_access
```sql
-- Test Case 1: User with mixed access
SELECT * FROM get_user_tool_access('user1-test-uuid');
-- Expected: All tools with appropriate access status and usage

-- Test Case 2: User with no specific access records
SELECT * FROM get_user_tool_access('user3-test-uuid');
-- Expected: All tools with is_enabled = TRUE (default)
```

### 2. API Endpoint Tests

#### Test: grant-tool-access endpoint
```javascript
// Test Case 1: Successful grant
const response1 = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_jwt>'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'email_campaigns',
    is_enabled: true
  })
});
// Expected: 200 status, success: true

// Test Case 2: Invalid tool type
const response2 = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_jwt>'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'invalid_tool',
    is_enabled: true
  })
});
// Expected: 400 status, error message

// Test Case 3: Missing fields
const response3 = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_jwt>'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid'
    // Missing tool_type and is_enabled
  })
});
// Expected: 400 status, error message

// Test Case 4: Non-admin user
const response4 = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <user_jwt>'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'email_campaigns',
    is_enabled: true
  })
});
// Expected: 403 status, admin access required

// Test Case 5: No authentication
const response5 = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Missing Authorization header
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'email_campaigns',
    is_enabled: true
  })
});
// Expected: 401 status, unauthorized
```

#### Test: reset-usage-counter endpoint
```javascript
// Similar test cases as grant-tool-access
// Test successful reset, invalid inputs, authorization, etc.
```

#### Test: user-tool-access endpoint
```javascript
// Test Case 1: Successful retrieval
const response1 = await fetch('/api/admin/user-tool-access?user_id=user1-test-uuid', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin_jwt>'
  }
});
// Expected: 200 status, array of tool access data

// Test Case 2: Missing user_id parameter
const response2 = await fetch('/api/admin/user-tool-access', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin_jwt>'
  }
});
// Expected: 400 status, missing parameter error
```

## Integration Tests

### 1. Admin Workflow Tests

#### Test: Complete Tool Access Management Workflow
```javascript
// Step 1: Get initial user tool access
const initialAccess = await adminUserManager.getUserToolAccess('user1-test-uuid');

// Step 2: Grant access to new tool
const grantResult = await adminUserManager.grantToolAccess('user1-test-uuid', 'product_descriptions');
assert(grantResult.success === true);

// Step 3: Verify access granted
const updatedAccess = await adminUserManager.getUserToolAccess('user1-test-uuid');
const productAccess = updatedAccess.find(tool => tool.tool_type === 'product_descriptions');
assert(productAccess.is_enabled === true);

// Step 4: Revoke access
const revokeResult = await adminUserManager.revokeToolAccess('user1-test-uuid', 'product_descriptions');
assert(revokeResult.success === true);

// Step 5: Verify access revoked
const finalAccess = await adminUserManager.getUserToolAccess('user1-test-uuid');
const finalProductAccess = finalAccess.find(tool => tool.tool_type === 'product_descriptions');
assert(finalProductAccess.is_enabled === false);

// Step 6: Verify audit log
const auditLog = await getAdminActionLog();
const grantEntry = auditLog.find(log => 
  log.action_type === 'grant_access' && 
  log.tool_type === 'product_descriptions'
);
const revokeEntry = auditLog.find(log => 
  log.action_type === 'revoke_access' && 
  log.tool_type === 'product_descriptions'
);
assert(grantEntry !== undefined);
assert(revokeEntry !== undefined);
```

#### Test: Usage Counter Reset Workflow
```javascript
// Step 1: Get initial usage
const initialUsage = await getUserToolUsage('user1-test-uuid', 'blog_generator');
const initialCount = initialUsage.generation_count;

// Step 2: Use tool to increment counter
await incrementToolUsage('user1-test-uuid', 'blog_generator');
const afterUsage = await getUserToolUsage('user1-test-uuid', 'blog_generator');
assert(afterUsage.generation_count === initialCount + 1);

// Step 3: Reset usage counter
const resetResult = await adminUserManager.resetUsageCounter('user1-test-uuid', 'blog_generator');
assert(resetResult.success === true);

// Step 4: Verify counter reset
const finalUsage = await getUserToolUsage('user1-test-uuid', 'blog_generator');
assert(finalUsage.generation_count === 0);

// Step 5: Verify audit log
const auditLog = await getAdminActionLog();
const resetEntry = auditLog.find(log => 
  log.action_type === 'reset_usage' && 
  log.tool_type === 'blog_generator'
);
assert(resetEntry !== undefined);
assert(resetEntry.details.previous_usage === initialCount + 1);
```

### 2. Tool Access Validation Tests

#### Test: Tool Access Validation in Tool Usage
```javascript
// Test Case 1: User with active subscription and tool access
const canUse1 = await canUseTool('user1-test-uuid', 'blog_generator');
assert(canUse1 === true);

// Test Case 2: User with active subscription but tool access revoked
await adminUserManager.revokeToolAccess('user1-test-uuid', 'blog_generator');
const canUse2 = await canUseTool('user1-test-uuid', 'blog_generator');
assert(canUse2 === false);

// Test Case 3: User with inactive subscription
const canUse3 = await canUseTool('user2-test-uuid', 'blog_generator');
assert(canUse3 === false);

// Test Case 4: User with usage limit exceeded
await setToolUsage('user1-test-uuid', 'social_captions', 100);
const canUse4 = await canUseTool('user1-test-uuid', 'social_captions');
assert(canUse4 === false);
```

## End-to-End Tests

### 1. Admin Dashboard UI Tests

#### Test: Tool Access Management UI
```javascript
// Test Case 1: Load admin dashboard
await page.goto('/admin/dashboard.html');
await page.waitForSelector('#usersContainer');

// Test Case 2: Expand user tool access section
await page.click('.user-row:first-child .expand-btn');
await page.waitForSelector('.user-tool-access');

// Test Case 3: Toggle tool access
const toolToggle = await page.$('#tool-user1-test-uuid-blog_generator');
const initialState = await toolToggle.isChecked();
await toolToggle.click();
await page.waitForTimeout(1000); // Wait for API call

// Verify toggle state changed
const finalState = await toolToggle.isChecked();
assert(finalState !== initialState);

// Test Case 4: Reset usage counter
await page.click('.reset-btn:first-child');
await page.waitForSelector('.confirm-dialog');
await page.click('.confirm-dialog .confirm-btn');
await page.waitForTimeout(1000); // Wait for API call

// Verify success message
const successMessage = await page.$('.success-message');
assert(successMessage !== null);
```

#### Test: User Dashboard with Restricted Access
```javascript
// Test Case 1: User with tool access revoked
await loginUser('user1@test.com');
await adminUserManager.revokeToolAccess('user1-test-uuid', 'blog_generator');
await page.goto('/user/dashboard.html');
await page.waitForSelector('.tools-grid');

// Verify blog generator is disabled
const blogGenerator = await page.$('[data-tool="blog_generator"]');
const isDisabled = await blogGenerator.getAttribute('disabled');
assert(isDisabled !== null);

// Test Case 2: User with tool access granted
await adminUserManager.grantToolAccess('user1-test-uuid', 'blog_generator');
await page.reload();
await page.waitForSelector('.tools-grid');

// Verify blog generator is enabled
const blogGeneratorReloaded = await page.$('[data-tool="blog_generator"]');
const isEnabled = await blogGeneratorReloaded.getAttribute('disabled');
assert(isEnabled === null);
```

## Performance Tests

### 1. Database Performance

#### Test: Tool Access Check Performance
```sql
-- Test with 10,000 users
EXPLAIN ANALYZE SELECT can_use_tool(user_id, 'blog_generator')
FROM generate_series(1, 10000) AS s(user_id)
JOIN user_profiles ON user_profiles.id = s.user_id::text;
-- Expected: Query completes within acceptable time (< 100ms)
```

#### Test: Admin Action Logging Performance
```sql
-- Test bulk admin actions
EXPLAIN ANALYZE 
SELECT set_tool_access(
  generate_series(1, 1000)::text,
  'blog_generator',
  true,
  'admin-test-uuid'
);
-- Expected: All operations complete within acceptable time
```

### 2. API Performance

#### Test: Concurrent Admin Actions
```javascript
// Test 100 concurrent admin actions
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(
    fetch('/api/admin/grant-tool-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <admin_jwt>'
      },
      body: JSON.stringify({
        user_id: `user${i}-test-uuid`,
        tool_type: 'blog_generator',
        is_enabled: true
      })
    })
  );
}

const startTime = Date.now();
const results = await Promise.all(promises);
const endTime = Date.now();

// Expected: All requests complete within acceptable time (< 5 seconds)
assert(endTime - startTime < 5000);
assert(results.every(r => r.ok === true));
```

## Security Tests

### 1. Authentication Tests

#### Test: Invalid JWT Token
```javascript
const response = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer invalid_jwt_token'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'blog_generator',
    is_enabled: true
  })
});

// Expected: 401 status, unauthorized
assert(response.status === 401);
```

#### Test: SQL Injection Attempts
```javascript
const maliciousInput = "'; DROP TABLE user_tool_access; --";
const response = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_jwt>'
  },
  body: JSON.stringify({
    user_id: maliciousInput,
    tool_type: 'blog_generator',
    is_enabled: true
  })
});

// Expected: 400 status, invalid input
assert(response.status === 400);

// Verify table still exists
const tableExists = await checkTableExists('user_tool_access');
assert(tableExists === true);
```

### 2. Authorization Tests

#### Test: Non-Admin Access
```javascript
// Test with regular user JWT
const response = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <regular_user_jwt>'
  },
  body: JSON.stringify({
    user_id: 'user1-test-uuid',
    tool_type: 'blog_generator',
    is_enabled: true
  })
});

// Expected: 403 status, admin access required
assert(response.status === 403);
```

## Test Automation

### 1. Automated Test Suite
```javascript
// test/setup.js
const { setupTestDatabase, createTestUsers, cleanupTestData } = require('./test-helpers');

beforeAll(async () => {
  await setupTestDatabase();
  await createTestUsers();
});

afterAll(async () => {
  await cleanupTestData();
});

// test/admin-tool-access.test.js
describe('Admin Tool Access Management', () => {
  test('should grant tool access', async () => {
    // Test implementation
  });

  test('should revoke tool access', async () => {
    // Test implementation
  });

  test('should reset usage counter', async () => {
    // Test implementation
  });
});
```

### 2. Continuous Integration
```yaml
# .github/workflows/admin-tests.yml
name: Admin Tool Access Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run database migrations
      run: npm run db:migrate:test
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run e2e tests
      run: npm run test:e2e
```

## Test Data Management

### 1. Test Data Cleanup
```sql
-- Clean up test data after tests
DELETE FROM admin_action_log WHERE admin_id = 'admin-test-uuid';
DELETE FROM user_tool_access WHERE user_id LIKE '%-test-uuid';
DELETE FROM tool_usage WHERE user_id LIKE '%-test-uuid';
DELETE FROM subscriptions WHERE user_id LIKE '%-test-uuid';
DELETE FROM user_profiles WHERE id LIKE '%-test-uuid';
DELETE FROM auth.users WHERE id LIKE '%-test-uuid';
```

### 2. Test Data Isolation
- Use separate test database
- Implement database transactions for test isolation
- Rollback changes after each test
- Use mock data for external dependencies

## Reporting and Monitoring

### 1. Test Results
- Generate HTML test reports
- Track test coverage metrics
- Monitor flaky tests
- Alert on test failures

### 2. Performance Metrics
- Track API response times
- Monitor database query performance
- Measure UI interaction response times
- Set performance thresholds and alerts

## Test Schedule

### 1. Pre-Deployment
- Run full test suite
- Verify all tests pass
- Check performance benchmarks
- Review security scan results

### 2. Post-Deployment
- Run smoke tests
- Monitor system health
- Check error rates
- Validate user workflows

### 3. Ongoing
- Daily automated tests
- Weekly performance tests
- Monthly security scans
- Quarterly full regression tests

This comprehensive testing strategy ensures the Admin Tool Access Management system is reliable, secure, and performs well under various conditions.
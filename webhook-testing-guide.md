# Webhook Integration Testing Guide

## Overview
This guide provides comprehensive testing procedures for the blog generator webhook integration with n8n.

## Testing Prerequisites

### 1. Environment Setup
- [ ] Local development environment running (`vercel dev`)
- [ ] n8n instance accessible (local or cloud)
- [ ] Webhook URLs configured in environment
- [ ] Test user account created and authenticated

### 2. Tools Required
- Browser with Developer Tools
- curl or Postman for API testing
- Access to n8n workflow execution logs
- Supabase dashboard for database monitoring

## Testing Phases

### Phase 1: Unit Testing (Frontend)

#### 1.1 Form Validation Testing
```javascript
// Test in browser console
const blogGen = new BlogGenerator();

// Test empty topic
blogGen.handleSubmit({ preventDefault: () => {} });
// Expected: Error message "Please enter a topic"

// Test valid submission
document.getElementById('topic').value = 'Test Topic';
document.getElementById('length').value = 'medium';
document.getElementById('tone').value = 'casual';
document.getElementById('keywords').value = 'test, webhook';
```

#### 1.2 Authentication Testing
```javascript
// Test unauthenticated access
localStorage.removeItem('supabase.auth.token');
// Expected: Redirect to login page

// Test authenticated access
// Login with test user
// Expected: Tool loads and shows usage info
```

#### 1.3 Usage Tracking Testing
```javascript
// Test usage display
await blogGen.loadUsage();
// Expected: Usage bar and text update correctly

// Test usage increment
await blogGen.handleSubmit(mockEvent);
// Expected: Usage counter increases by 1
```

### Phase 2: Webhook Testing (Backend)

#### 2.1 Mock Webhook Testing
Create a mock webhook server for testing:

```javascript
// mock-webhook.js (run with node)
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/blog-generator', (req, res) => {
  console.log('Received payload:', JSON.stringify(req.body, null, 2));
  
  // Test different response scenarios
  const { testScenario } = req.query;
  
  switch(testScenario) {
    case 'success':
      res.json({ content: 'Test blog content generated successfully' });
      break;
    case 'error':
      res.status(500).json({ error: 'Simulated webhook error' });
      break;
    case 'timeout':
      setTimeout(() => res.json({ content: 'Delayed response' }), 10000);
      break;
    default:
      res.json({ content: 'Default test content' });
  }
});

app.listen(3001, () => console.log('Mock webhook running on port 3001'));
```

#### 2.2 Real Webhook Testing
Test with actual n8n webhook:

```bash
# Test successful request
curl -X POST https://your-n8n-instance.com/webhook/blog-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "user_id": "test-user-123",
    "tool_type": "blog_generator",
    "inputs": {
      "topic": "AI content creation",
      "length": "medium",
      "tone": "casual",
      "keywords": ["AI", "automation", "productivity"]
    }
  }' \
  --max-time 30
```

#### 2.3 Error Scenario Testing
Test various error conditions:

```bash
# Test invalid payload
curl -X POST https://your-n8n-instance.com/webhook/blog-generator \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'

# Test missing authentication
curl -X POST https://your-n8n-instance.com/webhook/blog-generator \
  -H "Content-Type: application/json" \
  -d '{"valid": "payload"}'

# Test timeout scenario
curl -X POST https://your-n8n-instance.com/webhook/blog-generator \
  -H "Content-Type: application/json" \
  -d '{"timeout": "test"}' \
  --max-time 5
```

### Phase 3: Integration Testing (End-to-End)

#### 3.1 Complete User Flow Testing
1. **Setup Test Environment**
   ```bash
   # Start local development
   vercel dev
   
   # Start mock webhook (if testing locally)
   node mock-webhook.js
   ```

2. **Execute Test Scenarios**
   - Navigate to `/tools/blog-generator.html`
   - Login with test user
   - Fill form with test data
   - Submit form
   - Verify content appears
   - Check usage counter updates
   - Test copy to clipboard functionality

3. **Test Error Handling**
   - Simulate webhook failure
   - Verify fallback content appears
   - Check error message display
   - Ensure UI remains functional

#### 3.2 Performance Testing
```javascript
// Add performance monitoring to blog generator
async callN8nWebhook(topic, length, tone, keywords) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(this.n8nWebhookUrl, {
      // ... existing code
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Webhook call took ${duration.toFixed(2)}ms`);
    
    // Log performance warnings
    if (duration > 5000) {
      console.warn('Slow webhook response detected:', duration);
    }
    
    return await response.json();
  } catch (error) {
    const endTime = performance.now();
    console.error(`Webhook failed after ${endTime - startTime}ms:`, error);
    throw error;
  }
}
```

#### 3.3 Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config (load-test.yml)
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Blog Generator Load Test"
    weight: 100
    flow:
      - post:
          url: "/api/tools/use-tool"
          json:
            user_id: "test-user-123"
            tool_type: "blog_generator"

# Run load test
artillery run load-test.yml
```

### Phase 4: Security Testing

#### 4.1 Input Validation Testing
```javascript
// Test XSS prevention
const xssPayload = '<script>alert("xss")</script>';
document.getElementById('topic').value = xssPayload;
blogGen.handleSubmit(mockEvent);
// Expected: Content should be escaped, no alert should fire

// Test SQL injection attempts
const sqlPayload = "'; DROP TABLE users; --";
document.getElementById('keywords').value = sqlPayload;
blogGen.handleSubmit(mockEvent);
// Expected: No database errors, payload treated as text
```

#### 4.2 Authentication Testing
```javascript
// Test with invalid session
localStorage.setItem('supabase.auth.token', 'invalid-token');
blogGen.init();
// Expected: Redirect to login page

// Test session expiry
// Expire session in Supabase dashboard
// Try to use tool
// Expected: Redirect to login page
```

## Test Data Templates

### Valid Test Cases
```javascript
const validTestCases = [
  {
    name: "Short Professional Blog",
    inputs: {
      topic: "AI in Business",
      length: "short",
      tone: "professional",
      keywords: "AI, business, automation"
    }
  },
  {
    name: "Long Casual Blog",
    inputs: {
      topic: "Remote Work Tips",
      length: "long",
      tone: "casual",
      keywords: "remote, work, productivity, tips"
    }
  },
  {
    name: "No Keywords",
    inputs: {
      topic: "Simple Topic",
      length: "medium",
      tone: "friendly",
      keywords: ""
    }
  }
];
```

### Error Test Cases
```javascript
const errorTestCases = [
  {
    name: "Empty Topic",
    inputs: {
      topic: "",
      length: "medium",
      tone: "casual",
      keywords: "test"
    },
    expectedError: "Please enter a topic"
  },
  {
    name: "Very Long Topic",
    inputs: {
      topic: "A".repeat(1000),
      length: "medium",
      tone: "casual",
      keywords: "test"
    },
    expectedError: "Topic too long"
  }
];
```

## Automated Testing Setup

### 1. Jest Unit Tests
```javascript
// blog-generator.test.js
describe('BlogGenerator', () => {
  let blogGen;
  
  beforeEach(() => {
    blogGen = new BlogGenerator();
  });
  
  test('should validate topic input', () => {
    expect(blogGen.validateTopic('')).toBe(false);
    expect(blogGen.validateTopic('Valid Topic')).toBe(true);
  });
  
  test('should format keywords correctly', () => {
    const result = blogGen.formatKeywords('AI, automation, productivity');
    expect(result).toEqual(['AI', 'automation', 'productivity']);
  });
});
```

### 2. Cypress E2E Tests
```javascript
// cypress/integration/blog-generator.spec.js
describe('Blog Generator', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/tools/blog-generator.html');
  });
  
  it('should generate blog post', () => {
    cy.get('#topic').type('Test Topic');
    cy.get('#length').select('medium');
    cy.get('#tone').select('casual');
    cy.get('#keywords').type('test, automation');
    cy.get('#submitBtn').click();
    
    cy.get('#outputContent').should('not.be.empty');
    cy.get('#copyBtn').should('be.visible');
  });
});
```

## Monitoring and Logging

### 1. Client-Side Logging
```javascript
// Add comprehensive logging
class BlogGeneratorLogger {
  static log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console[level](message, data);
    
    // Send to logging service if needed
    if (window.AI_AUTO_CONFIG?.loggingEndpoint) {
      fetch(window.AI_AUTO_CONFIG.loggingEndpoint, {
        method: 'POST',
        body: JSON.stringify(logEntry)
      });
    }
  }
}

// Usage in BlogGenerator
BlogGeneratorLogger.log('info', 'Webhook call initiated', { topic, length });
BlogGeneratorLogger.log('error', 'Webhook failed', { error: error.message });
```

### 2. Performance Monitoring
```javascript
// Add performance metrics
class PerformanceMonitor {
  static trackWebhookCall(url, startTime, success, responseTime) {
    const metric = {
      url,
      startTime,
      success,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'webhook_call', {
        event_category: 'API',
        event_label: url,
        value: responseTime
      });
    }
  }
}
```

## Test Results Documentation

### Test Report Template
```markdown
# Webhook Integration Test Report

## Test Environment
- Date: 2024-XX-XX
- Browser: Chrome XX.X.X
- Node Version: XX.X.X
- n8n Version: X.X.X

## Test Results Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Success Rate: XX%

## Failed Tests
1. Test Name: XXX
   Expected: XXX
   Actual: XXX
   Status: Failed

## Performance Metrics
- Average Response Time: XXXms
- 95th Percentile: XXXms
- Max Response Time: XXXms

## Issues Found
1. Issue Description
   Severity: High/Medium/Low
   Recommended Fix: XXX

## Recommendations
1. Performance optimization suggestions
2. Security improvements
3. User experience enhancements
```

This comprehensive testing guide ensures the webhook integration is robust, performant, and secure before production deployment.
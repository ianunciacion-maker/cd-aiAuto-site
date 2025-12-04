# Blog Generator Webhook Implementation Guide

## Overview
This guide provides step-by-step instructions to integrate the blog generator with your n8n webhook using the direct approach.

## Files to Modify

### 1. tools/blog-generator.html
Replace the `generatePlaceholderContent()` function (lines 474-492) with the new webhook integration.

## Implementation Steps

### Step 1: Add Configuration
Add these configuration variables at the top of the BlogGenerator class (around line 387):

```javascript
constructor() {
  // ... existing code ...
  this.toolType = 'blog_generator';
  // Add n8n webhook configuration
  this.n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/blog-generator';
  this.n8nApiKey = 'your-n8n-api-key-if-required'; // Optional
  this.init();
}
```

### Step 2: Replace generatePlaceholderContent Function
Replace the entire `generatePlaceholderContent` function (lines 474-492) with:

```javascript
async generatePlaceholderContent(topic, length, tone, keywords) {
  try {
    // Prepare keywords array
    const keywordsArray = keywords 
      ? keywords.split(',').map(k => k.trim()).filter(k => k)
      : [];

    // Prepare payload for n8n
    const payload = {
      user_id: this.currentUser?.id || 'anonymous',
      tool_type: this.toolType,
      inputs: {
        topic,
        length,
        tone,
        keywords: keywordsArray
      }
    };

    // Call n8n webhook
    const response = await fetch(this.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.n8nApiKey && { 'Authorization': `Bearer ${this.n8nApiKey}` })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.content) {
      return data.content;
    } else if (data.blog_content) {
      return data.blog_content;
    } else if (data.result) {
      return data.result;
    } else {
      console.warn('Unexpected response format from n8n:', data);
      return this.generateFallbackContent(topic, length);
    }

  } catch (error) {
    console.error('n8n webhook error:', error);
    return this.generateFallbackContent(topic, length);
  }
}
```

### Step 3: Add Fallback Content Function
Add this new function after the `generatePlaceholderContent` function:

```javascript
generateFallbackContent(topic, length) {
  // Fallback content generation in case webhook fails
  const wordCount = length === 'short' ? 400 : length === 'long' ? 1200 : 750;
  const loremWords = [
    'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna'
  ];

  let content = `# ${topic}\n\n`;
  let words = 0;

  while (words < wordCount) {
    content += loremWords[Math.floor(Math.random() * loremWords.length)] + ' ';
    words++;
    if (words % 15 === 0) content += '\n\n';
  }

  return content;
}
```

### Step 4: Update handleSubmit Function
Modify the `handleSubmit` function (around line 459) to make the content generation async:

```javascript
// Replace this line:
const content = this.generatePlaceholderContent(topic, length);

// With this:
const content = await this.generatePlaceholderContent(topic, length, tone, keywords);
```

### Step 5: Add Current User Tracking
Add this to the `init()` function (around line 400) to get the current user:

```javascript
async init() {
  try {
    // Check authentication
    const isAuth = await authManager.isAuthenticated();
    if (!isAuth) {
      window.location.href = '../user/login.html';
      return;
    }

    // Get current user for webhook
    const { data: { user } } = await authManager.supabase.auth.getUser();
    this.currentUser = user;

    // Check access and load usage
    await this.loadUsage();
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.copyBtn.addEventListener('click', () => this.copyOutput());

  } catch (error) {
    console.error('Init error:', error);
    this.showError('Failed to load tool');
  }
}
```

## Expected n8n Webhook Payload

Your n8n workflow should expect this payload format:

```json
{
  "user_id": "uuid-of-current-user",
  "tool_type": "blog_generator",
  "inputs": {
    "topic": "AI content creation",
    "length": "medium",
    "tone": "casual",
    "keywords": ["AI", "automation", "productivity"]
  }
}
```

## Expected n8n Response Format

Your n8n workflow should return JSON with one of these formats:

```json
{
  "content": "Generated blog post content here..."
}
```

OR

```json
{
  "blog_content": "Generated blog post content here..."
}
```

OR

```json
{
  "result": "Generated blog post content here..."
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors**: Catches fetch failures and returns fallback content
2. **HTTP Errors**: Handles non-200 responses from n8n
3. **Response Format Issues**: Handles unexpected JSON structures
4. **Fallback Content**: Provides placeholder content if webhook fails

## Security Considerations

1. **API Key Protection**: Store n8n API keys in environment variables if needed
2. **Content Sanitization**: The existing `escapeHtml()` function sanitizes all output
3. **User Authentication**: Only authenticated users can access the tool

## Testing

### Local Testing
1. Set up a local mock server to simulate n8n responses
2. Test with different input combinations
3. Verify error handling with intentional failures

### Production Testing
1. Replace the webhook URL with your actual n8n endpoint
2. Test with real n8n workflow
3. Monitor response times and error rates

## Configuration Options

### Option 1: Hardcoded URL (Simple)
```javascript
this.n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/blog-generator';
```

### Option 2: Environment Variable (Recommended)
Add to your HTML file:
```javascript
this.n8nWebhookUrl = window.N8N_BLOG_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/blog-generator';
```

Then configure in your deployment environment.

### Option 3: Configuration File
Create a `config.js` file:
```javascript
// config.js
window.AI_AUTO_CONFIG = {
  n8nWebhooks: {
    blogGenerator: 'https://your-n8n-instance.com/webhook/blog-generator'
  }
};
```

And reference it in blog-generator.html:
```html
<script src="../config.js"></script>
```

## Performance Considerations

1. **Timeout Handling**: Consider adding a timeout to the fetch request
2. **Loading States**: The existing loading spinner will show during webhook calls
3. **Retry Logic**: Could add automatic retry for failed requests

## Next Steps

1. Implement the changes above in `tools/blog-generator.html`
2. Set up your n8n workflow to handle the expected payload format
3. Test the integration with your actual n8n endpoint
4. Monitor performance and error rates
5. Consider implementing similar integration for other tools (social-captions, email-campaigns, product-descriptions)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your n8n endpoint allows requests from your domain
2. **Timeout Issues**: Check n8n workflow execution time
3. **Authentication Failures**: Verify API keys if using them
4. **Response Format Issues**: Ensure n8n returns expected JSON structure

### Debug Tips

1. Check browser console for error messages
2. Use browser DevTools Network tab to inspect webhook requests
3. Add console.log statements to debug payload format
4. Test n8n workflow separately with sample payload

This implementation provides a robust, production-ready integration between the blog generator and your n8n backend while maintaining the existing user experience and error handling patterns.
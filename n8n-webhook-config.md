# n8n Webhook Configuration Template

## Environment Variables

Add these to your environment configuration (`.env.local` for local, Vercel dashboard for production):

```bash
# n8n Webhook URLs
N8N_BLOG_GENERATOR_WEBHOOK=https://your-n8n-instance.com/webhook/blog-generator
N8N_SOCIAL_CAPTIONS_WEBHOOK=https://your-n8n-instance.com/webhook/social-captions
N8N_EMAIL_CAMPAIGNS_WEBHOOK=https://your-n8n-instance.com/webhook/email-campaigns
N8N_PRODUCT_DESCRIPTIONS_WEBHOOK=https://your-n8n-instance.com/webhook/product-descriptions

# Optional: n8n API Key (if your workflows require authentication)
N8N_API_KEY=your-n8n-api-key-here

# Optional: Request timeout in milliseconds
N8N_REQUEST_TIMEOUT=30000
```

## Webhook Payload Standards

All tools send the same payload structure to n8n:

```json
{
  "user_id": "uuid-of-current-user",
  "tool_type": "blog_generator|social_captions|email_campaigns|product_descriptions",
  "inputs": {
    // Tool-specific input fields
  }
}
```

### Blog Generator Payload
```json
{
  "user_id": "uuid-here",
  "tool_type": "blog_generator",
  "inputs": {
    "topic": "AI content creation",
    "length": "short|medium|long",
    "tone": "professional|casual|friendly|expert",
    "keywords": ["AI", "automation", "productivity"]
  }
}
```

### Social Captions Payload
```json
{
  "user_id": "uuid-here",
  "tool_type": "social_captions",
  "inputs": {
    "content_description": "Product launch announcement",
    "platform": "instagram|twitter|linkedin|facebook",
    "tone": "professional|casual|friendly|expert",
    "hashtags": ["#AI", "#automation", "#productivity"]
  }
}
```

### Email Campaigns Payload
```json
{
  "user_id": "uuid-here",
  "tool_type": "email_campaigns",
  "inputs": {
    "product": "AI Content Suite",
    "audience": "freelancers|entrepreneurs|creators",
    "cta": "Try it free",
    "style": "professional|casual|friendly|expert"
  }
}
```

### Product Descriptions Payload
```json
{
  "user_id": "uuid-here",
  "tool_type": "product_descriptions",
  "inputs": {
    "product_name": "AI Content Generator",
    "features": ["AI-powered", "Fast", "Easy to use"],
    "audience": "freelancers|entrepreneurs|creators",
    "length": "short|medium|long"
  }
}
```

## Expected Response Format

All n8n workflows should return JSON with one of these formats:

```json
{
  "content": "Generated content here..."
}
```

OR

```json
{
  "result": "Generated content here..."
}
```

OR

```json
{
  "tool_specific_field": "Generated content here..."
}
```

## n8n Workflow Setup

### 1. Create Webhook Trigger
- Use "Webhook" trigger node
- Set to "POST" method
- Enable "Response" node to return content

### 2. Authentication (Optional)
- If using API key, add "Header Auth" node
- Set header: `Authorization: Bearer your-api-key`

### 3. Input Validation
- Add "Set" node to validate and process inputs
- Handle missing or invalid fields gracefully

### 4. AI Processing
- Connect to your AI service (OpenAI, Claude, etc.)
- Use input parameters to generate content
- Include user_id for tracking/analytics

### 5. Response Formatting
- Use "Response" node to return generated content
- Format as JSON with proper content field

### 6. Error Handling
- Add error handling nodes
- Return appropriate error messages
- Log errors for debugging

## Security Considerations

### 1. Webhook Security
- Use HTTPS endpoints only
- Implement API key authentication
- Validate request origins if possible

### 2. Rate Limiting
- Implement rate limiting in n8n workflows
- Consider user-based rate limits
- Handle exceeded limits gracefully

### 3. Input Sanitization
- Sanitize all input parameters
- Validate data types and ranges
- Prevent injection attacks

## Monitoring and Logging

### 1. Request Logging
- Log all incoming requests with user_id
- Track response times and success rates
- Monitor for unusual patterns

### 2. Error Tracking
- Log all errors with context
- Include user_id and input parameters
- Set up alerts for high error rates

### 3. Performance Monitoring
- Track response times
- Monitor AI service latency
- Set up alerts for slow responses

## Testing

### 1. Local Testing
```bash
# Test webhook with curl
curl -X POST https://your-n8n-instance.com/webhook/blog-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "user_id": "test-user-123",
    "tool_type": "blog_generator",
    "inputs": {
      "topic": "Test topic",
      "length": "short",
      "tone": "casual",
      "keywords": ["test", "webhook"]
    }
  }'
```

### 2. Integration Testing
- Test with actual frontend
- Verify all input combinations
- Test error scenarios

### 3. Load Testing
- Test with multiple concurrent requests
- Monitor performance under load
- Verify rate limiting works

## Deployment Checklist

- [ ] Configure all webhook URLs in environment
- [ ] Set up API key authentication
- [ ] Test all 4 tool workflows
- [ ] Verify error handling
- [ ] Set up monitoring and logging
- [ ] Document workflow configurations
- [ ] Test with production data
- [ ] Set up backup workflows if needed

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure n8n allows requests from your domain
   - Check CORS headers in n8n response

2. **Timeout Issues**
   - Increase timeout values in n8n
   - Optimize AI service calls
   - Consider async processing for long tasks

3. **Authentication Failures**
   - Verify API keys are correct
   - Check header format
   - Ensure keys are properly escaped

4. **Invalid Response Format**
   - Ensure response is valid JSON
   - Check content field names
   - Verify response node configuration

### Debug Tools

1. **Browser DevTools**
   - Network tab to inspect requests
   - Console for error messages
   - Response tab to check format

2. **n8n Execution Logs**
   - Check workflow execution history
   - Review node-by-node execution
   - Monitor error messages

3. **Server Logs**
   - Check Vercel function logs
   - Monitor webhook endpoint logs
   - Track error rates and patterns

This configuration template provides a comprehensive setup for integrating all Ai-Auto tools with your n8n backend workflows.
# Blog Generator Webhook Implementation - Ready for Integration

## Overview
This guide provides the exact implementation needed to connect the blog generator to your test webhook at `https://n8n.autonoiq.com/webhook-test/blog-generator`.

## Quick Implementation

### Step 1: Update Blog Generator Constructor
Replace the constructor in `tools/blog-generator.html` (around line 387):

```javascript
constructor() {
  this.form = document.getElementById('generatorForm');
  this.submitBtn = document.getElementById('submitBtn');
  this.outputContent = document.getElementById('outputContent');
  this.copyBtn = document.getElementById('copyBtn');
  this.errorMessage = document.getElementById('errorMessage');
  this.usageBar = document.getElementById('usageBar');
  this.usageText = document.getElementById('usageText');
  this.toolType = 'blog_generator';
  
  // n8n webhook configuration
  this.n8nWebhookUrl = 'https://n8n.autonoiq.com/webhook-test/blog-generator';
  this.currentUser = null;
  
  this.init();
}
```

### Step 2: Update init() Method
Replace the `init()` method (around line 400):

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

### Step 3: Replace generatePlaceholderContent Function
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

    console.log('Sending payload to n8n:', payload);

    // Call n8n webhook
    const response = await fetch(this.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('n8n response status:', response.status);

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('n8n response data:', data);
    
    // Handle different response formats
    if (data.content) {
      return data.content;
    } else if (data.blog_content) {
      return data.blog_content;
    } else if (data.result) {
      return data.result;
    } else if (data.output) {
      return data.output;
    } else {
      console.warn('Unexpected response format from n8n:', data);
      return this.generateFallbackContent(topic, length);
    }

  } catch (error) {
    console.error('n8n webhook error:', error);
    this.showError('Failed to generate content. Using fallback content.');
    return this.generateFallbackContent(topic, length);
  }
}
```

### Step 4: Add Fallback Content Function
Add this new function after the `generatePlaceholderContent` function:

```javascript
generateFallbackContent(topic, length) {
  // Fallback content generation in case webhook fails
  const wordCount = length === 'short' ? 400 : length === 'long' ? 1200 : 750;
  const loremWords = [
    'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
    'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
    'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat'
  ];

  let content = `# ${topic}\n\n`;
  content += `This is a fallback blog post about ${topic}. `;
  content += 'The webhook integration is currently experiencing issues, but this demonstrates how the tool would work with your n8n backend.\n\n';
  
  let words = 50; // Start with 50 words from the intro
  
  while (words < wordCount) {
    content += loremWords[Math.floor(Math.random() * loremWords.length)] + ' ';
    words++;
    if (words % 15 === 0) content += '\n\n';
  }

  return content;
}
```

### Step 5: Update handleSubmit Function
Update the `handleSubmit` function (around line 429) to make the content generation async:

```javascript
async handleSubmit(e) {
  e.preventDefault();
  this.clearError();

  const topic = document.getElementById('topic').value.trim();
  const length = document.getElementById('length').value;
  const tone = document.getElementById('tone').value;
  const keywords = document.getElementById('keywords').value.trim();

  if (!topic) {
    this.showError('Please enter a topic');
    return;
  }

  this.setSubmitting(true);

  try {
    // Check if user can use tool
    const { error, code } = await stripeManager.useTool(this.toolType);

    if (error) {
      if (code === 'USAGE_LIMIT_EXCEEDED') {
        this.showError('You\'ve reached your monthly usage limit. Upgrade your plan or try again next month.');
      } else {
        this.showError(error.message || 'Unable to generate content. Check your subscription.');
      }
      this.setSubmitting(false);
      return;
    }

    // Call n8n webhook instead of placeholder
    const content = await this.generatePlaceholderContent(topic, length, tone, keywords);

    this.displayOutput(content);
    await this.loadUsage(); // Reload usage after generation

  } catch (error) {
    console.error('Generation error:', error);
    this.showError('Failed to generate content. Please try again.');
  } finally {
    this.setSubmitting(false);
  }
}
```

## Expected Webhook Payload

The blog generator will send this payload to `https://n8n.autonoiq.com/webhook-test/blog-generator`:

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

## Expected Response Format

Your n8n webhook should return JSON with any of these field names:

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

OR

```json
{
  "output": "Generated blog post content here..."
}
```

## Testing the Integration

### 1. Test with curl
```bash
curl -X POST https://n8n.autonoiq.com/webhook-test/blog-generator \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "tool_type": "blog_generator",
    "inputs": {
      "topic": "AI content creation",
      "length": "medium",
      "tone": "casual",
      "keywords": ["AI", "automation", "productivity"]
    }
  }'
```

### 2. Test in Browser
1. Open `tools/blog-generator.html`
2. Login with your test user
3. Fill in the form:
   - Topic: "AI content creation"
   - Length: "medium"
   - Tone: "casual"
   - Keywords: "AI, automation, productivity"
4. Click "Generate Blog Post"
5. Check browser console for:
   - "Sending payload to n8n:" message
   - "n8n response status:" message
   - "n8n response data:" message

## Debugging Tips

### 1. Console Logs
The implementation includes detailed console logging to help debug:
- Payload being sent to n8n
- HTTP response status
- Response data from n8n
- Any errors that occur

### 2. Network Tab
Use browser DevTools Network tab to:
- See the actual HTTP request being made
- Check request headers and body
- View response status and content
- Identify any CORS issues

### 3. Common Issues
- **CORS Errors**: Ensure n8n allows requests from your domain
- **Timeout**: Check if n8n workflow takes too long to execute
- **Invalid Response**: Verify n8n returns valid JSON with expected fields
- **Network Issues**: Check if the webhook URL is accessible

## Complete File Replacement

If you want to replace the entire script section in `tools/blog-generator.html`, use this:

```html
<script>
  class BlogGenerator {
    constructor() {
      this.form = document.getElementById('generatorForm');
      this.submitBtn = document.getElementById('submitBtn');
      this.outputContent = document.getElementById('outputContent');
      this.copyBtn = document.getElementById('copyBtn');
      this.errorMessage = document.getElementById('errorMessage');
      this.usageBar = document.getElementById('usageBar');
      this.usageText = document.getElementById('usageText');
      this.toolType = 'blog_generator';
      
      // n8n webhook configuration
      this.n8nWebhookUrl = 'https://n8n.autonoiq.com/webhook-test/blog-generator';
      this.currentUser = null;
      
      this.init();
    }

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

    async loadUsage() {
      const { data: usage } = await userManager.getToolUsage(this.toolType);
      if (usage) {
        const percentage = (usage.generation_count / usage.monthly_limit) * 100;
        this.usageBar.style.width = percentage + '%';
        this.usageText.textContent = `${usage.generation_count}/${usage.monthly_limit}`;
      }
    }

    async handleSubmit(e) {
      e.preventDefault();
      this.clearError();

      const topic = document.getElementById('topic').value.trim();
      const length = document.getElementById('length').value;
      const tone = document.getElementById('tone').value;
      const keywords = document.getElementById('keywords').value.trim();

      if (!topic) {
        this.showError('Please enter a topic');
        return;
      }

      this.setSubmitting(true);

      try {
        // Check if user can use tool
        const { error, code } = await stripeManager.useTool(this.toolType);

        if (error) {
          if (code === 'USAGE_LIMIT_EXCEEDED') {
            this.showError('You\'ve reached your monthly usage limit. Upgrade your plan or try again next month.');
          } else {
            this.showError(error.message || 'Unable to generate content. Check your subscription.');
          }
          this.setSubmitting(false);
          return;
        }

        // Call n8n webhook
        const content = await this.generatePlaceholderContent(topic, length, tone, keywords);

        this.displayOutput(content);
        await this.loadUsage(); // Reload usage after generation

      } catch (error) {
        console.error('Generation error:', error);
        this.showError('Failed to generate content. Please try again.');
      } finally {
        this.setSubmitting(false);
      }
    }

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

        console.log('Sending payload to n8n:', payload);

        // Call n8n webhook
        const response = await fetch(this.n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        console.log('n8n response status:', response.status);

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('n8n response data:', data);
        
        // Handle different response formats
        if (data.content) {
          return data.content;
        } else if (data.blog_content) {
          return data.blog_content;
        } else if (data.result) {
          return data.result;
        } else if (data.output) {
          return data.output;
        } else {
          console.warn('Unexpected response format from n8n:', data);
          return this.generateFallbackContent(topic, length);
        }

      } catch (error) {
        console.error('n8n webhook error:', error);
        this.showError('Failed to generate content. Using fallback content.');
        return this.generateFallbackContent(topic, length);
      }
    }

    generateFallbackContent(topic, length) {
      // Fallback content generation in case webhook fails
      const wordCount = length === 'short' ? 400 : length === 'long' ? 1200 : 750;
      const loremWords = [
        'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
        'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
        'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat'
      ];

      let content = `# ${topic}\n\n`;
      content += `This is a fallback blog post about ${topic}. `;
      content += 'The webhook integration is currently experiencing issues, but this demonstrates how the tool would work with your n8n backend.\n\n';
      
      let words = 50; // Start with 50 words from the intro
      
      while (words < wordCount) {
        content += loremWords[Math.floor(Math.random() * loremWords.length)] + ' ';
        words++;
        if (words % 15 === 0) content += '\n\n';
      }

      return content;
    }

    displayOutput(content) {
      this.outputContent.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(content)}</pre>`;
      this.outputContent.classList.remove('empty');
      this.copyBtn.style.display = 'inline-block';
      this.currentOutput = content;
    }

    copyOutput() {
      if (this.currentOutput) {
        navigator.clipboard.writeText(this.currentOutput).then(() => {
          const originalText = this.copyBtn.textContent;
          this.copyBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            this.copyBtn.textContent = originalText;
          }, 2000);
        });
      }
    }

    escapeHtml(text) {
      const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }

    showError(message) {
      this.errorMessage.textContent = message;
      this.errorMessage.classList.add('show');
    }

    clearError() {
      this.errorMessage.classList.remove('show');
    }

    setSubmitting(isSubmitting) {
      this.submitBtn.disabled = isSubmitting;
      if (isSubmitting) {
        this.submitBtn.innerHTML = '<span class="loading-spinner"></span>Generating...';
        this.submitBtn.classList.add('loading');
      } else {
        this.submitBtn.textContent = 'Generate Blog Post';
        this.submitBtn.classList.remove('loading');
      }
    }
  }

  // Initialize blog generator when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new BlogGenerator();
  });
</script>
```

This implementation is ready to use with your test webhook at `https://n8n.autonoiq.com/webhook-test/blog-generator` and will display the webhook response in the blog generator's output box.
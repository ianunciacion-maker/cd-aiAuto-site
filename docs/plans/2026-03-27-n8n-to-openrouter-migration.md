# Migration Plan: n8n Webhooks to OpenRouter Direct

**Date:** 2026-03-27
**Goal:** Replace n8n webhook proxying with direct OpenRouter API calls for Blog Generator and Social Captions tools, matching the existing pattern used by Email Campaigns and Product Descriptions.

## Current State

| Tool | Backend | Env Var | Model |
|---|---|---|---|
| Blog Generator | n8n webhook proxy | `N8N_BLOG_GENERATOR_WEBHOOK` | Unknown (n8n controls) |
| Social Captions | n8n webhook proxy | `N8N_SOCIAL_CAPTIONS_WEBHOOK` | Unknown (n8n controls) |
| Email Campaigns | OpenRouter direct | `OPENROUTER_API_KEY` | `x-ai/grok-4.1-fast` |
| Product Descriptions | OpenRouter direct | `OPENROUTER_API_KEY` | `x-ai/grok-4.1-fast` |

## Target State

All 4 tools use OpenRouter direct with `x-ai/grok-4.1-fast`. Two env vars removed (`N8N_BLOG_GENERATOR_WEBHOOK`, `N8N_SOCIAL_CAPTIONS_WEBHOOK`).

## Response Contracts (MUST NOT CHANGE)

### Blog Generator
```json
{ "success": true, "title": "Blog Title", "content": "<p>HTML content...</p>", "isHtml": true }
```

### Social Captions
```json
{ "success": true, "captions": { "instagram": "...", "facebook": "...", "twitter": "...", "linkedin": "...", "tiktok": "..." } }
```

### Email Campaigns (unchanged)
```json
{ "success": true, "email": { "campaign": [...], "strategy": "..." } }
```

### Product Descriptions (unchanged)
```json
{ "success": true, "description": { "headline": "...", "tagline": "...", ... } }
```

## Implementation Steps

1. Write test script (`api/tools/test-tools.js`) that validates all 4 tool response contracts
2. Run tests against current n8n tools to establish baseline (blog + captions may fail if n8n is down)
3. Rewrite `api/tools/generate-blog.js` — OpenRouter direct, Alex Hormozi style prompt, JSON output parsed to `{ title, content, isHtml }`
4. Rewrite `api/tools/generate-captions.js` — OpenRouter direct, platform-specific prompt, JSON output parsed to `{ captions: { platform: text } }`
5. Run test script against all 4 tools — verify response contracts match
6. Remove `N8N_BLOG_GENERATOR_WEBHOOK` and `N8N_SOCIAL_CAPTIONS_WEBHOOK` from Vercel env vars (manual step)

## Tool-Specific Details

### Blog Generator
- `max_tokens: 4000` (long-form content)
- `temperature: 0.7`
- Prompt requests JSON: `{ "blogTitle": "...", "blogContent": "<p>HTML</p>" }`
- API maps to: `{ title: blogTitle, content: blogContent, isHtml: true }`
- Accepts: `{ topic, length, tone, keywords, userId, userEmail }`

### Social Captions
- `max_tokens: 2000`
- `temperature: 0.8` (more creative for social)
- Prompt requests JSON with platform keys: `{ "captions": { "instagram": "...", ... } }`
- Only generates for requested platforms (from `platforms` array)
- Accepts: `{ topic, platforms, tone, hashtags, length, image, userId, userEmail }`

## Test Script

Node.js script that:
1. Starts `vercel dev` (or hits localhost)
2. Sends POST to each of the 4 endpoints with sample payloads
3. Validates: HTTP 200, `success: true`, correct response shape
4. Reports pass/fail per tool with specific field validation

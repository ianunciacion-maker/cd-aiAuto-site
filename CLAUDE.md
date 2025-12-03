# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ai-Auto is a modern web platform offering AI-powered productivity tools for content creation, social media management, and marketing automation. The application uses a static frontend with serverless API functions for backend operations.

**Tech Stack:**
- Frontend: Vanilla HTML5, CSS3, JavaScript (ES6 modules)
- Backend: Serverless functions (Vercel)
- Database: Supabase (PostgreSQL)
- Payment: Stripe
- Hosting: Vercel

## Common Commands

### Development
```bash
# Start development server with live reload
npm run dev

# Start static file server (no live reload)
npm start

# Run linters
npm run lint           # Run all linters
npm run lint-css       # Lint CSS files only
npm run lint-js        # Lint JavaScript files only

# Validate HTML and run all linters
npm run validate
```

### Testing Locally
```bash
# Install dependencies first
npm install

# For testing serverless functions locally, use Vercel CLI
npx vercel dev

# For testing static site only
npm run dev
```

### Deployment
The site auto-deploys to Vercel on push to main branch. Manual deployment:
```bash
vercel --prod
```

**Important Vercel Configuration Notes:**
- `vercel.json` is intentionally minimal - Vercel auto-detects API functions in `/api/`
- Complex `functions` configuration can break static file serving
- Only include `functions` config for specific needs (memory, maxDuration)
- Current config only specifies settings for the Stripe webhook endpoint

## Architecture

### Directory Structure

```
aiAuto/
├── index.html                  # Homepage
├── about.html                  # About page
├── blog.html                   # Blog listing
├── tools.html                  # Tools catalog
├── supabase.js                 # Supabase client & managers (auth, blog, user, stripe)
├── package.json                # Project config & scripts
├── vercel.json                 # Vercel deployment config
│
├── admin/                      # Admin-only pages
│   ├── login.html              # Admin login
│   ├── dashboard.html          # Admin dashboard
│   ├── create-post.html        # Create blog post (uses Quill.js)
│   └── edit-post.html          # Edit blog post (uses Quill.js)
│
├── user/                       # User-facing pages
│   ├── login.html              # User login
│   ├── signup.html             # User signup
│   ├── dashboard.html          # User dashboard
│   └── checkout.html           # Stripe checkout page
│
├── blog/                       # Blog pages
│   └── post.html               # Single post template (query param: ?slug=)
│
├── tools/                      # AI tool pages
│   ├── blog-generator.html
│   ├── social-captions.html
│   ├── email-campaigns.html
│   └── product-descriptions.html
│
├── api/                        # Serverless API endpoints (Vercel functions)
│   ├── checkout.js             # Create Stripe checkout session
│   ├── billing-portal.js       # Stripe billing portal
│   ├── webhooks/
│   │   └── stripe.js           # Stripe webhook handler
│   └── tools/
│       └── use-tool.js         # Track tool usage
│
├── css/                        # Stylesheets (organized by category)
│   ├── main.css                # Global styles & imports
│   ├── base/                   # Reset, typography, variables
│   ├── components/             # Component-specific styles
│   ├── layout/                 # Layout & grid systems
│   ├── pages/                  # Page-specific styles
│   ├── themes/                 # Theme variations (dark mode)
│   └── utilities/              # Utility classes
│
└── js/                         # JavaScript modules
    ├── main.js                 # Entry point (ES6 module imports)
    ├── components/             # UI components (Navigation, Forms)
    ├── modules/                # Features (Theme, Animations)
    └── utils/                  # Helper functions
```

### Key Architectural Patterns

#### 1. Supabase Integration (`supabase.js`)

This file is the heart of the application and exports 5 manager classes:

- **AuthManager**: Handles user authentication (signup, login, logout, admin checks)
- **BlogManager**: CRUD operations for blog posts, image uploads, HTML content handling
- **UserManager**: User profile management, subscription status, tool usage tracking
- **StripeManager**: Client-side Stripe integration (checkout, billing portal, tool usage)
- **AdminUserManager**: Admin-only operations (user management, dashboard stats)

All managers are instantiated and exposed globally via `window` object for use in HTML files.

**Important Notes:**
- Blog posts use **HTML content** (content_type: 'html'), not markdown
- Blog editor uses **Quill.js** rich text editor (not SimpleMDE/markdown)
- Featured Image URL field was removed from create/edit post pages
- Admin email is hardcoded in AuthManager.adminEmails array (supabase.js:25-27)
- Supabase client is initialized with hardcoded URL and anon key (safe for client-side)
- Auth state listener is set up automatically on AuthManager construction

#### 2. Authentication Flow

1. User signs up via `/user/signup.html` → Supabase Auth
2. After signup, redirected to `/user/checkout.html` for Stripe subscription
3. Stripe webhook (`/api/webhooks/stripe.js`) updates subscription status in Supabase
4. User can access tools only with active subscription (`userManager.canAccessTools()`)

**Admin Access:**
- Admin login at `/admin/login.html`
- Admin routes protected by `authManager.protectAdminRoute()`
- Admin email whitelist in `supabase.js:24-26`

#### 3. Blog System

- **Public**: `/blog.html` lists all published posts
- **Admin**: `/admin/dashboard.html` shows all posts (including drafts)
- **Editing**: Uses Quill.js for WYSIWYG editing with rich formatting
- **Images**: Uploaded to Supabase Storage bucket `blog-images`
- **Content**: Stored as HTML, rendered with Quill styling classes

**Blog Post Structure:**
```javascript
{
  id: uuid,
  title: string,
  slug: string,           // URL-friendly identifier
  excerpt: string,
  content: string,        // HTML content
  content_type: 'html',   // Always 'html' (not markdown)
  author_id: uuid,
  status: 'draft' | 'published',
  published_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 4. Serverless API Functions

All API endpoints are in `/api/` and deployed as Vercel serverless functions:

- **POST /api/checkout**: Creates Stripe checkout session
- **POST /api/billing-portal**: Generates Stripe billing portal URL
- **POST /api/webhooks/stripe**: Handles Stripe events (subscription updates)
- **POST /api/tools/use-tool**: Increments tool usage counter

**Environment Variables Required:**
```bash
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_ID
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_KEY  # Service role key (server-side only)
VERCEL_URL            # Auto-set by Vercel
```

See `/api/.env.example` for template.

#### 5. Design System (Neobrutalist)

The design uses a bold, accessible neobrutalist aesthetic with:

- **Thick borders** (`var(--border-thick)`)
- **Hard shadows** (`var(--shadow-hard)`)
- **Bold colors** (blue, gold, coral, lavender, green, pink)
- **Uppercase headings** with tight letter-spacing
- **Serif headers** (Playfair Display) + **Sans-serif body** (Inter)

**Dark Mode:**
- Theme toggle in navigation
- Preference saved to localStorage
- CSS variables defined in `/css/themes/`
- ThemeManager class in `/js/modules/theme.js`

## Critical Implementation Details

### Blog Editor Specifics

1. **Use Quill.js**, not markdown editors
2. **Content type is 'html'**, not 'markdown'
3. **No Featured Image URL field** in create/edit forms
4. **High-specificity CSS** for Quill formatting (uses `!important`)
5. **Quill CSS must load in `<head>`** for proper cascade

### Authentication Edge Cases

1. **Checkout page authentication issue** (recently fixed):
   - User signs up but isn't immediately authenticated
   - Solution: Check auth state before requiring session
   - See commit: `5ad799c`

2. **Admin route protection**:
   - Always call `authManager.protectAdminRoute()` in admin pages
   - Returns false and redirects if not authenticated

### Stripe Integration

1. **Test mode keys** are in `.env.local` (not committed)
2. **Webhooks** must be configured in Stripe dashboard with endpoint URL and signing secret
3. **Success URL** includes session_id for verification
4. **Customer ID** stored in Supabase subscriptions table
5. **Webhook body parsing**: Vercel environment requires special handling - webhook handler converts parsed objects back to strings for signature verification (see api/webhooks/stripe.js:50-55)
6. **Subscription verification**: UserManager has two methods:
   - `getSubscriptionStatus()`: Checks database (faster, may be stale)
   - `getSubscriptionStatusFromStripe()`: Queries Stripe API directly (more reliable, client-side only in supabase.js:606-681)
7. **Environment validation**: All API endpoints validate environment variables before initialization to provide clear error messages

## Styling Guidelines

### When Adding New Components

1. Create component-specific CSS in `/css/components/`
2. Import in `/css/main.css`
3. Use existing CSS variables (colors, spacing, shadows)
4. Support dark mode by referencing theme-aware variables

### When Modifying Styles

1. **Never override Quill styles** directly without `!important`
2. **Always test dark mode** after CSS changes
3. **Maintain thick borders & hard shadows** for consistency
4. **Use uppercase** for primary headings

## Common Patterns

### Protecting Routes
```javascript
// In HTML file
authManager.protectAdminRoute().then(async (isAuthorized) => {
  if (!isAuthorized) return;
  // Load page content
});
```

### Creating Blog Posts
```javascript
const postData = {
  title: 'My Post',
  slug: 'my-post',
  excerpt: 'Short description',
  content: quill.root.innerHTML,  // Get HTML from Quill
  status: 'published'             // or 'draft'
};

const { data, error } = await blogManager.createPost(postData);
```

### Checking Subscription Status
```javascript
const canAccess = await userManager.canAccessTools();
if (!canAccess) {
  // Redirect to signup/checkout
}
```

### Using Stripe Checkout
```javascript
const priceId = 'price_xxx'; // From Stripe dashboard
const { error } = await stripeManager.checkout(priceId);
// Automatically redirects to Stripe if successful
```

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User signup creates account
- [ ] User can log in with credentials
- [ ] Admin can access admin routes
- [ ] Non-admin cannot access admin routes
- [ ] Logout clears session

**Blog:**
- [ ] Create post with Quill editor
- [ ] Upload images via Quill
- [ ] Save as draft vs. publish
- [ ] Edit existing posts
- [ ] Delete posts
- [ ] View published posts on public blog

**Subscription:**
- [ ] Checkout creates Stripe session
- [ ] Successful payment updates subscription status
- [ ] Billing portal allows subscription management
- [ ] Tools are locked for non-subscribers

**Design:**
- [ ] Dark mode toggle works
- [ ] Theme preference persists across pages
- [ ] Responsive on mobile, tablet, desktop
- [ ] All pages follow neobrutalist design

## Known Issues / Quirks

1. **Supabase credentials are in `supabase.js`**: The anon key is safe to expose (public-facing), but be careful not to commit service role key.

2. **Admin email hardcoded**: To add admins, edit `supabase.js:24-26`.

3. **Blog post slugs must be unique**: createPost/updatePost enforce this, but frontend should validate before submission.

4. **Quill images in blog posts**: Images uploaded through Quill are stored in Supabase Storage and referenced by full URL. Deleting posts does NOT automatically delete associated images.

5. **Vercel environment variables**: Must be set in Vercel dashboard for production. Local development uses `/api/.env.local`.

6. **Stripe webhook events table**: Webhook handler logs all events to `webhook_events` table for debugging and audit trail (see api/webhooks/stripe.js:68-78).

7. **Tool usage initialization**: When subscription becomes active, `initialize_tool_usage` RPC function is called to set up user's tool usage tracking (api/webhooks/stripe.js:179).

## Resources

- **Supabase Dashboard**: https://evzitnywfgbxzymddvyl.supabase.co
- **Stripe Dashboard**: Configure webhooks, view subscriptions
- **Vercel Dashboard**: View deployments, set environment variables
- **Quill.js Docs**: https://quilljs.com/docs/
- **Setup Guides**: See VERCEL_SETUP.md, STRIPE_WEBHOOK_SETUP.md, SUPABASE_SETUP_GUIDE.md for detailed configuration

## Performance Considerations

1. **Supabase queries**: Use `.select()` to fetch only needed columns
2. **Image optimization**: Compress images before uploading to Supabase Storage
3. **CSS loading**: main.css imports all styles; consider code-splitting for large apps
4. **JavaScript modules**: main.js uses ES6 imports; ensure browser compatibility

## Security Notes

- **XSS Protection**: Blog content is sanitized via DOMPurify (if available) or textarea fallback
- **CORS**: API endpoints have proper headers set in vercel.json
- **Environment Variables**: Never commit `.env` files with real credentials
- **Auth State**: Always verify authentication server-side for sensitive operations
- **Admin Access**: Controlled by email whitelist, not role-based (consider migrating to RLS policies)

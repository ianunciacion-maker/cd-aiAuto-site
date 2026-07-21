# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ai-Auto is a web platform offering AI-powered productivity tools (blog generation, social captions, email campaigns, product descriptions). Static frontend with Vercel serverless API functions.

**Tech Stack:** Vanilla HTML/CSS/JS (ES6 modules) | Vercel serverless functions | Supabase (PostgreSQL + Auth + Storage) | Stripe payments | Node.js 20.x

## Common Commands

```bash
npm run dev              # Dev server with live reload (port 8000)
npm start                # Static file server (no live reload)
npx vercel dev           # Full app with API functions (required for testing API endpoints)
npm run lint             # All linters (CSS + JS)
npm run lint-css         # Stylelint only
npm run lint-js          # ESLint only
npm run validate         # HTML validation + all linters
npx eslint path/to/file.js        # Lint single JS file
npx stylelint css/path/to/file.css # Lint single CSS file
vercel --prod            # Manual production deploy (auto-deploys on push to main)

# Playwright E2E tests (tests/redesign/) — not wired into package.json scripts
npx serve . -p 8123 &                                                         # tests expect baseURL http://localhost:8123
npx playwright test --config tests/redesign/playwright.config.js              # full suite
npx playwright test --config tests/redesign/playwright.config.js redesign.spec.js -g "some test name"  # single test
```

**No unit test suite exists** — no unit/integration tests, and `api/` is untested. There is a Playwright E2E suite at `tests/redesign/` (`redesign.spec.js`, `audit.spec.js`, `admin-free-access.spec.js`) covering marketing-page redesign consistency (design language vs. `openclaw.html`, required anchor copy, no console errors/broken assets) and a responsive-overflow audit across 7 breakpoints. It expects a static server already running on port 8123 (see command above) and isn't part of `npm run validate` or any CI — run it manually when touching marketing pages.

## Code Style Rules

**JavaScript (ESLint):** Single quotes, semicolons required, 2-space indent, `prefer-const` (error), `no-var` (error), `prefer-arrow-callback`, `prefer-template`, `object-shorthand`, max line length 100 (warn), `no-trailing-spaces` (error), `eol-last` (error). ESLint only covers `js/**/*.js` — API functions in `api/` are not linted.

**CSS (Stylelint):** Single quotes, `declaration-no-important: true`, `color-named: never`, kebab-case custom properties, numeric `font-weight-notation`, 2-space indent. **Exception:** Quill.js blog editor styles require `!important` overrides — these files must bypass or disable the `declaration-no-important` rule.

## Architecture

### Core File: `supabase.js`

The heart of the application — exports 8 manager classes, all exposed globally via `window`:

- **AuthManager** — signup, login, logout, admin checks. Admin status checked via `is_admin` column in `profiles` table (not hardcoded emails).
- **BlogManager** — CRUD for blog posts (HTML content, not markdown), image uploads to Supabase Storage `blog-images` bucket
- **BlogHistoryManager** — tracks AI-generated blog content history per user
- **UserManager** — profiles, subscription status, tool usage tracking. `canAccessTools()` gates tool access.
- **StripeManager** — client-side checkout, billing portal, tool usage
- **AdminUserManager** — admin dashboard stats, user management
- **AIResourcesManager** — CRUD for curated AI resource listings (public + admin pages)
- **WaitlistManager** — waitlist/email capture functionality

### Key Directories

- `api/` — Vercel serverless functions. All endpoints are POST. Has its own `package.json` (deps: `stripe`, `@supabase/supabase-js`). Stripe webhook at `api/webhooks/stripe.js` (1024MB memory, 10s timeout configured in `vercel.json`).
- `api/tools/` — AI generation endpoints. Blog + captions proxy to **n8n webhooks**; email campaign + product descriptions call **OpenRouter** directly. All require `use-tool.js` to track usage.
- `css/` — Organized: `base/` (variables, reset, typography), `components/`, `layout/`, `pages/`, `utilities/`. Entry point: `main.css`. Dark mode is in `css/base/variables.css` via `[data-theme="dark"]` selector, not a separate folder.
- `js/` — ES6 modules. Entry point: `main.js` (plus `marketing-animations.js` for marketing pages). Components: `navigation.js`, `forms.js`, `tool-navigation.js`. Modules: `theme.js`, `animations.js`, plus per-tool history modules (`social-captions-history.js`, `email-campaigns-history.js`, `product-descriptions-history.js`).
- `admin/` — Dashboard, blog editor (Quill.js WYSIWYG). Protected by `authManager.protectAdminRoute()`.
- `user/` — Login, signup, dashboard, checkout. Signup → checkout → Stripe subscription flow.
- `tools/` — Individual AI tool pages. Require active subscription.
- `aiauto-remotion/` — **Separate subproject** (not tracked in git). Remotion-based promotional video generation. Has its own `package.json`, uses React + TypeScript. Run `remotion studio` from that directory.
- `docs/sql/` — SQL migration scripts for Supabase schema changes. Run these in the Supabase SQL editor when setting up or modifying DB schema. Other `docs/` subfolders (`setup/`, `deployment/`, `guides/`) hold setup and deployment guides — see `docs/README.md` for the index.
- `openclaw.html`, `clawmate.html`, `clawlauncher-explained.html` — Standalone explainer/marketing pages for companion products. Self-contained (inline styles, no build step), use the same neobrutalist design tokens.
- `ai-resources.html`, `admin/ai-resources.html` — Public-facing and admin pages for curated AI resource listings. Admin page protected by `authManager.protectAdminRoute()`.

### Authentication Flow

1. Signup (`/user/signup.html`) → Supabase Auth
2. Redirect to `/user/checkout.html` → Stripe subscription
3. Stripe webhook updates subscription in Supabase
4. `userManager.canAccessTools()` gates tool access

Admin access: `is_admin` boolean flag in `profiles` database table. Routes protected by `authManager.protectAdminRoute()`.

Logout accepts optional `redirectUrl` param — defaults to `/user/login.html`. Admin pages should pass `/admin/login.html`. Always use absolute paths for redirects.

### API Endpoints (all POST)

- `/api/checkout` — Create Stripe checkout session
- `/api/check-subscription` — Sync subscription status (DB → Stripe fallback)
- `/api/billing-portal` — Create Stripe billing portal session
- `/api/update-profile` — Update user profile
- `/api/track-avatar-selection` — Track avatar selection
- `/api/tools/generate-blog` — Proxies to n8n webhook
- `/api/tools/generate-captions` — Proxies to n8n webhook
- `/api/tools/generate-email-campaign` — Calls OpenRouter directly
- `/api/tools/generate-product-description` — Calls OpenRouter directly
- `/api/webhooks/stripe` — Stripe webhook handler (1024MB memory, 10s timeout)

All tool endpoints use `use-tool.js` middleware to track usage against subscription limits.

### Key Database Tables

- `profiles` — User profiles with `is_admin` flag
- `blog_posts` — Blog content (stored as HTML)
- `tool_usage` — Per-user tool usage tracking against subscription limits
- `ai_resources` — Curated AI resource listings
- `waitlist` — Email capture/waitlist entries
- `blog_generation_history` — AI-generated blog history
- `webhook_events` — Stripe webhook audit trail

Schema migrations live in `docs/sql/`. Run via Supabase SQL editor.

### Stripe Integration Gotchas

- Webhook body parsing: Vercel parses the body automatically, but Stripe signature verification needs the raw body. The handler converts parsed objects back to strings (see `api/webhooks/stripe.js`).
- Two subscription check methods: `getSubscriptionStatus()` (DB, fast but may be stale) vs `getSubscriptionStatusFromStripe()` (Stripe API, reliable, client-side only).
- `/api/check-subscription` syncs DB ↔ Stripe: checks DB first, falls back to Stripe, updates DB if stale.
- `initialize_tool_usage` RPC is called when subscription activates.
- All API endpoints validate env vars at startup with clear error messages.

### Blog System

- Uses **Quill.js** rich text editor — NOT markdown. Content stored as HTML (`content_type: 'html'`).
- Quill CSS must load in `<head>` before custom CSS.
- Slugs must be unique — enforced server-side, validate on frontend with `blogManager.getPostBySlug()`.
- Images stored in Supabase Storage; deleting posts does NOT delete associated images.

## Design System (Neobrutalist)

- Thick borders, hard shadows, bold colors (blue, gold, coral, lavender, green, pink)
- Serif headers (Playfair Display) + sans-serif body (Inter)
- Dark mode: `data-theme="dark"` on `<html>`, toggle via Ctrl/Cmd+Shift+T, saved to localStorage key `ai-auto-theme`
- CSS variables in `css/base/variables.css`. See `design_system.md` for full token reference.
- **Always use semantic variables** (`--bg-primary`, `--text-main`) not hardcoded colors
- New components: create CSS in `css/components/`, import in `css/main.css`, support dark mode

## Environment Variables (API Functions)

```
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET
SUPABASE_URL, SUPABASE_SERVICE_KEY (service role, server-side only)
VERCEL_URL (auto-set by Vercel)
N8N_BLOG_GENERATOR_WEBHOOK, N8N_SOCIAL_CAPTIONS_WEBHOOK (n8n proxy for blog/captions tools)
OPENROUTER_API_KEY (direct AI calls for email campaign + product description tools)
```

Local dev: `/api/.env.local` (gitignored). Production: Vercel dashboard. Template: `/api/.env.example`.

## Notable Quirks

- `package-lock.json` is gitignored (unusual — `npm install` generates fresh lockfile each time)
- Supabase anon key is hardcoded in `supabase.js` (safe for client-side, but service key must stay server-side only)
- `vercel.json` is intentionally minimal — complex `functions` config breaks static file serving. It sets security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) globally and 1-year immutable cache on `css/`, `js/`, `images/`.
- Stripe webhook events logged to `webhook_events` Supabase table for audit trail
- Blog editor Quill styles need `!important` which conflicts with stylelint rule — disable rule inline for those files
- `.gitignore` has aggressive wildcard patterns (`*secret*`, `*token*`, `*password*`) — new files with these substrings in the name will be silently ignored. Exceptions exist for `user/*password*.html` and `plans/*password*.md`.
- All `*.sql` files are gitignored EXCEPT `docs/sql/*.sql` — a new migration saved anywhere else (e.g. project root) will be silently ignored by git. Always put SQL migrations in `docs/sql/`.
- The `!docs/sql/*.sql` and `!images/stock/*` gitignore negations also re-include macOS AppleDouble junk (`._foo.sql`, `._bar.jpg`) that would otherwise be ignored — don't stage `._*` files.
- `npm run validate` only checks `*.html` in the project root — HTML files in subdirectories (`admin/`, `user/`, `tools/`, `blog/`) are not validated

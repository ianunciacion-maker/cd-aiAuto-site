# PHASE 3: BACKEND API SETUP

## Overview
This phase creates serverless functions for handling Stripe payments, webhooks, and tool usage tracking.

## Files Created

### `/api/checkout.js`
Creates a Stripe Checkout session for new subscriptions.

**Endpoint:** `POST /api/checkout`

**Request Body:**
```json
{
  "user_id": "uuid-here",
  "email": "user@example.com",
  "priceId": "price_XXXXX"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_XXXXX",
  "url": "https://checkout.stripe.com/pay/cs_test_XXXXX"
}
```

**Usage Flow:**
1. User clicks "Get Started" → Signs up with email/password
2. Frontend calls `/api/checkout` with user_id, email
3. Function creates Stripe customer + checkout session
4. User redirected to Stripe's hosted checkout page
5. After successful payment, user redirected to dashboard

---

### `/api/webhooks/stripe.js`
Handles Stripe webhook events to sync subscription status.

**Endpoint:** `POST /api/webhooks/stripe`

**Webhook Events Handled:**
- `customer.subscription.created` - New subscription activated
- `customer.subscription.updated` - Subscription details changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed (marks as past_due)

**Setup in Stripe:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add Endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events above
5. Copy webhook signing secret to `.env`

**Note:** The webhook will automatically:
- Create/update subscription records in database
- Initialize tool usage limits on first payment
- Handle subscription status changes
- Log all events for debugging

---

### `/api/billing-portal.js`
Redirects users to Stripe's billing portal for managing subscriptions.

**Endpoint:** `POST /api/billing-portal`

**Request Body:**
```json
{
  "user_id": "uuid-here"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/XXXXX"
}
```

**Use Case:** "Manage Subscription" button on user dashboard

---

### `/api/tools/use-tool.js`
Validates subscription and increments tool usage counter.

**Endpoint:** `POST /api/tools/use-tool`

**Request Body:**
```json
{
  "user_id": "uuid-here",
  "tool_type": "blog_generator"
}
```

**Response (Success):**
```json
{
  "success": true,
  "usage": {
    "used": 5,
    "limit": 100,
    "remaining": 95
  }
}
```

**Response (Limit Exceeded):**
```json
{
  "success": false,
  "error": "Subscription inactive or usage limit reached",
  "code": "USAGE_LIMIT_EXCEEDED"
}
```

**Valid Tool Types:**
- `blog_generator`
- `social_captions`
- `email_campaigns`
- `product_descriptions`

---

## Installation & Setup

### Step 1: Install Dependencies

Add to your `package.json` in the root:

```json
{
  "dependencies": {
    "stripe": "^13.0.0",
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

Then run:
```bash
npm install
```

### Step 2: Create Environment File

Copy `api/.env.example` to `api/.env.local`:

```bash
cp api/.env.example api/.env.local
```

Fill in your values:
```
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_PRICE_ID=price_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX
SUPABASE_URL=https://qhmjyeohczpjgfzgxdjx.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
```

### Step 3: Update Vercel Configuration

`vercel.json` has been updated to:
- Route `/api/*` requests to serverless functions
- Configure Node.js runtime for API files

### Step 4: Deploy to Vercel

```bash
git add .
git commit -m "Add Stripe backend API endpoints"
vercel deploy
```

Vercel will automatically:
- Detect API functions in `/api`
- Set environment variables from Vercel dashboard
- Deploy as serverless functions

---

## Testing Locally

### Option 1: Using Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output your webhook signing secret
# Copy it to .env as STRIPE_WEBHOOK_SECRET
```

### Option 2: Using Vercel Functions Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run functions locally
vercel dev

# Functions available at:
# POST http://localhost:3000/api/checkout
# POST http://localhost:3000/api/webhooks/stripe
# POST http://localhost:3000/api/billing-portal
# POST http://localhost:3000/api/tools/use-tool
```

---

## Testing Endpoints

### Test Checkout

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "email": "test@example.com",
    "priceId": "price_XXXXX"
  }'
```

### Test Tool Usage

```bash
curl -X POST http://localhost:3000/api/tools/use-tool \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "tool_type": "blog_generator"
  }'
```

---

## Webhook Debugging

### View Webhook Events

In Supabase SQL Editor:
```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;
```

### Common Issues

**"Invalid webhook signature"**
- Webhook secret doesn't match Stripe dashboard
- Check that STRIPE_WEBHOOK_SECRET is copied exactly

**"Subscription not found"**
- Webhook event hasn't been processed yet
- Check `webhook_events` table for `processed` = false

**"Customer not found"**
- Stripe customer creation failed
- Check checkout error in database logs

---

## Next Steps

1. ✅ Phase 1: Database Schema Setup
2. ✅ Phase 2: Stripe Configuration
3. ✅ Phase 3: Backend API
4. 📝 Phase 4: Update supabase.js with UserManager, StripeManager, AdminUserManager
5. 📝 Phase 5: Create user signup/login/dashboard pages
6. 📝 Phase 6: Create 4 tool pages
7. 📝 Phase 7: Add admin user management
8. 📝 Phase 8: Update tools.html CTA buttons
9. 📝 Phase 9: Security & testing
10. 📝 Phase 10: Deploy to production

---

## Additional Resources

- [Stripe Webhook Events](https://stripe.com/docs/api/events)
- [Stripe Checkout Sessions](https://stripe.com/docs/api/checkout/sessions)
- [Stripe Billing Portal](https://stripe.com/docs/billing/billing-portal)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)

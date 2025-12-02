# PHASE 2: STRIPE CONFIGURATION SETUP

## Overview
This guide walks you through setting up Stripe for recurring billing on the AI-Auto platform.

## Prerequisites
- Stripe account (create at https://dashboard.stripe.com if you don't have one)
- Access to your Stripe Dashboard

## Step 1: Create Product in Stripe

1. Go to https://dashboard.stripe.com
2. Navigate to **Products** (left sidebar under Billing)
3. Click **Add Product**
4. Fill in the following details:

   **Product Name:** `AI Content Creation Suite`

   **Description:** `Access to 4 AI-powered content tools: blog generation, social captions, email campaigns, and product descriptions`

   **Pricing Model:** Select **Recurring**

## Step 2: Create Price in Stripe

1. On the product page, scroll down to **Pricing** section
2. Click **Add Price**
3. Configure as follows:

   **Billing Period:** Monthly

   **Amount:** $49.00 USD

   **Recurring:** Enabled (Monthly)

   **Billing Cycle Anchor:** Flexible

4. Click **Save**

## Step 3: Get API Keys

1. Navigate to **Developers** → **API Keys** (left sidebar)
2. You'll see two sets of keys:
   - **Test Mode** (for development)
   - **Live Mode** (for production)

3. For now, work in **Test Mode**:
   - Copy your **Publishable Key** (pk_test_...)
   - Copy your **Secret Key** (sk_test_...)

## Step 4: Configure Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. For testing locally, skip this for now
4. For production, enter: `https://yourdomain.com/api/webhooks/stripe`

## Step 5: Create .env Files

### Create `/api/.env.local` (Development)
```
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PRICE_ID=price_YOUR_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
SUPABASE_URL=https://qhmjyeohczpjgfzgxdjx.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
```

### Create `.env.production` (Production - do NOT commit to git)
```
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PRICE_ID=price_YOUR_LIVE_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
SUPABASE_URL=https://qhmjyeohczpjgfzgxdjx.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
```

## Step 6: Find Your Service Key

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy the **Service Role Key** (this has elevated permissions for server-side operations)

## Step 7: Get Price ID

1. In Stripe Dashboard, go to **Products** → **AI Content Creation Suite**
2. Under **Pricing**, you'll see your price with format: `price_XXXXX`
3. Copy this ID and add to your .env files

## Step 8: Update Vercel Environment Variables

1. Go to your Vercel project settings: https://vercel.com/dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

**⚠️ IMPORTANT:** Set different values for different environments:
- **Development**: Use test mode keys
- **Production**: Use live mode keys

## Testing Stripe in Test Mode

Stripe provides test card numbers for testing:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

## Next Steps

1. Fill in all information above
2. Add keys to your `.env.local` file locally
3. Add keys to Vercel environment variables
4. Commit `.env.local` to git (test keys are safe, never commit production keys)
5. Proceed to **Phase 3: Backend API** to create serverless functions

## Troubleshooting

**"Invalid API Key" error:**
- Verify you copied the correct key (Publishable vs Secret)
- Ensure test mode keys have `pk_test_` or `sk_test_` prefix
- Check that you're using the right environment

**Webhook not working:**
- Wait 5 minutes for webhook configuration to propagate
- Check webhook logs in Stripe Dashboard → Developers → Webhooks

## References

- [Stripe Products & Pricing Docs](https://stripe.com/docs/products-prices)
- [Stripe API Keys Guide](https://stripe.com/docs/keys)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

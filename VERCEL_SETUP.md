# Vercel Environment Variables Setup

## Issue

The checkout page is stuck on "Redirecting to Stripe Checkout..." because the required environment variables are not set in Vercel.

## Solution: Add Environment Variables to Vercel

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Copy your keys:
   - **Publishable key**: starts with `pk_test_`
   - **Secret key**: starts with `sk_test_` (click "Reveal test key token")

### Step 2: Get Your Stripe Price ID

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Find "AI Content Creation Suite – Premium Plan (Test Mode)"
3. Click on the product
4. Under "Pricing" section, you'll see your price
5. Click on the **default price** (`$49.99 USD`)
6. Copy the **Price ID** - it starts with `price_` (e.g., `price_1SZvk1Dz3xUi80YhG1GcElpd`)

### Step 3: Get Your Stripe Webhook Secret

You already have this from your webhook configuration:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook: `https://cd-ai-auto-site.vercel.app/api/webhooks/stripe`
3. Click "Reveal" next to "Signing secret"
4. Copy the secret - it starts with `whsec_`

### Step 4: Get Your Supabase Service Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qhmjyeohczpjgfzgxdjx`
3. Go to Settings → API
4. Scroll down to "Project API keys"
5. Copy the **service_role** key (NOT the anon key)
6. ⚠️ **WARNING**: This is a secret key - never expose it in client-side code!

### Step 5: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `cd-ai-auto-site`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (from Step 1) | Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (from Step 1) | Production, Preview, Development |
| `STRIPE_PRICE_ID` | `price_...` (from Step 2) | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Step 3) | Production, Preview, Development |
| `SUPABASE_URL` | `https://qhmjyeohczpjgfzgxdjx.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | Your service role key (from Step 4) | Production, Preview, Development |

**How to add each variable:**
1. Click "Add New"
2. Enter the **Variable Name** (exactly as shown above)
3. Enter the **Value**
4. Check all three environment checkboxes: Production, Preview, Development
5. Click "Save"
6. Repeat for all 6 variables

### Step 6: Trigger Redeployment

After adding all environment variables:

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment (should be at the top)
3. Click the 3-dot menu (⋮)
4. Click **"Redeploy"**
5. Check **"Use existing build cache"** if shown
6. Click **"Redeploy"**

Wait 1-2 minutes for deployment to complete.

### Step 7: Update Checkout Page with Correct Price ID

The checkout page currently has a hardcoded price ID. We need to update it with your actual Stripe Price ID.

**File to update**: `/user/checkout.html`

Find this line (around line 407):
```javascript
this.priceId = 'price_1SZvk1Dz3xUi80YhG1GcElpd';
```

Replace it with your actual Price ID from Step 2.

### Step 8: Test the Checkout

1. Go to: `https://cd-ai-auto-site.vercel.app/user/signup.html`
2. Sign up with a test email
3. Click through to checkout
4. You should now be redirected to Stripe Checkout page
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Verification Checklist

- [ ] All 6 environment variables added to Vercel
- [ ] Vercel project redeployed
- [ ] Checkout page opens without errors
- [ ] Clicking "Proceed to Payment" redirects to Stripe
- [ ] Stripe checkout page loads successfully
- [ ] Test payment completes
- [ ] User is redirected back to dashboard

## Troubleshooting

### Still seeing "FUNCTION_INVOCATION_FAILED"?
- Check that ALL 6 environment variables are set
- Verify there are no typos in variable names (they're case-sensitive)
- Make sure you redeployed after adding variables

### Stripe checkout page shows "Invalid price ID"?
- Double-check the `STRIPE_PRICE_ID` in Vercel matches your Stripe dashboard
- Update the price ID in `/user/checkout.html` to match

### "User not authenticated" error?
- Make sure you're signed in before accessing checkout
- Try logging out and back in

### Webhook not receiving events?
- Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe dashboard
- Check that webhook URL is: `https://cd-ai-auto-site.vercel.app/api/webhooks/stripe`

## Need Help?

Check the Vercel function logs:
1. Go to Vercel Dashboard → Your Project
2. Click on **Deployments**
3. Click on the latest deployment
4. Click **"Functions"** tab
5. Find `/api/checkout` and click to see logs
6. Look for error messages

---

## Quick Reference

**Your Stripe Webhook URL:**
```
https://cd-ai-auto-site.vercel.app/api/webhooks/stripe
```

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

**Supabase Project:**
```
https://qhmjyeohczpjgfzgxdjx.supabase.co
```

# Vercel Environment Variables Setup Guide

## Problem
You're seeing this error when trying to checkout:
```
FAILED TO START CHECKOUT. UNEXPECTED TOKEN 'A', "A SERVER E"... IS NOT VALID JSON
```

This happens when the backend API returns an error instead of the expected JSON response. The most common cause is **missing environment variables in Vercel**.

## Solution
You need to configure environment variables in your Vercel project settings for the API to work.

### Step 1: Go to Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project: **cd-aiAuto-site** (or your project name)
3. Click on **Settings** tab
4. Navigate to **Environment Variables** in the left sidebar

### Step 2: Add These Environment Variables

Add the following environment variables (you can get these values from `api/.env.local` in your local repository):

#### Stripe Configuration (Test Mode)
Copy these values from `api/.env.local` in your repository:
```
STRIPE_SECRET_KEY = sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

STRIPE_PRICE_ID = price_XXXXXXXXXXXXXXXXXXXX

STRIPE_WEBHOOK_SECRET = whsec_XXXXXXXXXXXXXXXXXXXX
```

#### Supabase Configuration
Copy these values from `api/.env.local` in your repository:
```
SUPABASE_URL = https://XXXXXXXXXXXXXXXXX.supabase.co

SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Set Environment for Production

When adding each variable, make sure to select:
- **Development**: (optional)
- **Preview**: ✓ (checked)
- **Production**: ✓ (checked)

This ensures the variables are available in all deployment environments.

### Step 4: Redeploy

After adding the environment variables:

1. Go to the **Deployments** tab in Vercel
2. Click the three dots (⋯) on your latest deployment
3. Select **Redeploy**

Or simply push a new commit to trigger automatic redeployment:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

### Step 5: Test the Checkout Flow

1. Go to your production URL
2. Sign up with a new account
3. Verify your email
4. Log in
5. You should be redirected to the checkout page
6. Click "Proceed to Payment"
7. You should be redirected to Stripe Checkout (no more JSON error!)

## Troubleshooting

### Still Getting JSON Error?
If you still see the error after setting environment variables:

1. **Clear browser cache**: Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Wait for Vercel deployment**: Check Vercel dashboard to ensure deployment completed
3. **Check Vercel logs**:
   - Go to Vercel project → Deployments → click on the latest deployment
   - Go to Logs → Function logs
   - Look for any error messages about missing variables

### Getting "Server configuration error"?
This means the environment variables are still missing. Double-check:
- Variables are set in **Settings → Environment Variables**
- Variables are selected for **Production** environment
- Vercel deployment completed after adding variables
- Browser cache is cleared

### Getting "User not authenticated"?
This is a different error. It means:
- You need to sign in first before clicking checkout
- Or your Supabase session expired
- Try logging out and logging back in

## Security Note
⚠️ **Never commit `.env.local` to git!** It's already in `.gitignore`
- These secret keys should only be in Vercel project settings
- Keep `api/.env.local` secure on your local machine only
- Never share these keys publicly

## Environment Variables Explained

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `STRIPE_SECRET_KEY` | Stripe API secret for creating checkout sessions | Stripe Dashboard → Developers → API Keys |
| `STRIPE_PRICE_ID` | The product price ID for the $49/month subscription | Stripe Dashboard → Products → Your Product → Pricing |
| `STRIPE_WEBHOOK_SECRET` | Secret for validating Stripe webhook requests | Stripe Dashboard → Developers → Webhooks |
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Service role key for server-side API calls | Supabase Dashboard → Project Settings → API → Service Role |

## Next Steps

Once checkout is working:

1. **Set up Stripe webhook handling** to create subscriptions when payment succeeds
2. **Test subscription status** to verify users can access tools after paying
3. **Configure billing portal** so users can manage subscriptions
4. **Move to production mode** in Stripe when ready (currently in test mode)

## Still Having Issues?

If you've followed all steps and still have errors:

1. Check Vercel deployment logs for specific error messages
2. Verify Supabase credentials are correct in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
3. Make sure Stripe keys match your test account (they should start with `sk_test_` and `pk_test_`)
4. Try with a fresh browser window/incognito mode to bypass any caching


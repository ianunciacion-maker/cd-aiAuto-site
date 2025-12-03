# Verify Your Stripe Setup is Complete

## Your Stripe Keys Are Valid ✅

I've verified your Stripe configuration keys have the correct format:

```
✅ STRIPE_SECRET_KEY: sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (107 characters)
✅ STRIPE_PRICE_ID: price_XXXXXXXXXXXXXXXXXX (valid format)
✅ STRIPE_WEBHOOK_SECRET: whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX (valid format)
```

## The Only Issue: Not in Vercel

The keys are valid, but they're **only on your local machine in `.env.local`**. Vercel can't see them there.

This is why you get `FUNCTION_INVOCATION_FAILED` - the Vercel serverless function tries to use `process.env.STRIPE_SECRET_KEY` and gets `undefined`.

## What You Need to Do Right Now

1. **Go to Vercel Project Settings**
   - https://vercel.com/dashboard
   - Click your project
   - Click "Settings" → "Environment Variables"

2. **Add These 5 Variables:**

   Open your local `api/.env.local` file and copy each value:

   | Name | Description |
   |------|------------|
   | `STRIPE_SECRET_KEY` | Copy the full value from your .env.local (starts with `sk_test_`) |
   | `STRIPE_PRICE_ID` | Copy the full value from your .env.local (starts with `price_`) |
   | `STRIPE_WEBHOOK_SECRET` | Copy the full value from your .env.local (starts with `whsec_`) |
   | `SUPABASE_URL` | Copy the full value from your .env.local (your Supabase domain) |
   | `SUPABASE_SERVICE_KEY` | Copy the full value from your .env.local (long JWT token) |

3. **For each variable:**
   - ✅ Check "Production"
   - ✅ Check "Preview"
   - ☐ Development (optional)
   - Click "Add"

4. **Redeploy** by going to Deployments and clicking the three dots on the latest one, then "Redeploy"

5. **Wait 1-2 minutes** for it to redeploy

## Test It Works

After Vercel finishes deploying, visit:
```
https://YOUR_DOMAIN/api/debug
```

You should see this in the response:
```json
{
  "configuration": {
    "stripe": {
      "hasSecretKey": true,
      "hasPriceId": true,
      "hasWebhookSecret": true
    },
    "supabase": {
      "hasUrl": true,
      "hasServiceKey": true
    }
  },
  "allConfigured": true
}
```

If `allConfigured` is `false`, one or more variables isn't set.

## That's It!

Once all 5 variables are in Vercel and you redeploy:
1. Sign up on your site → verify email → log in
2. Click "Proceed to Payment"
3. You should see Stripe Checkout, not an error

## Reference

**Your Stripe Dashboard:**
- Account ID: `51SZviSDz3xUi80Yh` (from your key)
- This is a TEST account (sk_test_ = test mode)
- Use test card: 4242 4242 4242 4242

**Your Supabase Project:**
- Project ID: `evzitnywfgbxzymddvyl` (from your URL)
- Region: Your Supabase project


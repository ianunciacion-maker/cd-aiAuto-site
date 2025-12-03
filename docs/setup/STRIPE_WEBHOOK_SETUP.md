# Stripe Webhook Setup Guide

## What is a Webhook?

When a user completes payment in Stripe Checkout, Stripe needs to tell your backend so you can:
1. Update the user's subscription status in your database
2. Activate their access to the tools
3. Track billing information

A webhook is Stripe sending an automatic message to your server when events happen (like successful payment).

## Current Status

✅ Your API endpoint for webhooks exists at: `/api/webhooks/stripe`
✅ The code is ready to receive and process webhook events
❌ **BUT**: The webhook is NOT configured in your Stripe account yet

This is why users who paid are still being redirected to checkout after login - the subscription status never gets synced from Stripe to your database.

## Step-by-Step: Add Stripe Webhook

### Step 1: Go to Stripe Dashboard
1. Go to https://dashboard.stripe.com/
2. Sign in with your Stripe account
3. Go to **Developers** → **Webhooks** (left sidebar)

### Step 2: Create New Webhook Endpoint
1. Click **+ Add an endpoint** button
2. In "Endpoint URL" field, enter:
   ```
   https://YOUR_DOMAIN/api/webhooks/stripe
   ```
   Replace `YOUR_DOMAIN` with your Vercel domain (e.g., `https://cd-ai-auto-site.vercel.app`)

3. Click **Select events** dropdown

### Step 3: Select Webhook Events
Check these 5 events (they should be checked by default):
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

Click **Add events** button

### Step 4: Create Endpoint
Click **Add endpoint** button

You should see a success message and the endpoint listed

### Step 5: Get the Signing Secret
1. Click on your newly created endpoint
2. Scroll down to **Signing secret**
3. Click **Reveal** to show the secret
4. Copy the secret (it starts with `whsec_`)

### Step 6: Update Vercel Environment Variable
The signing secret you copied should match your `STRIPE_WEBHOOK_SECRET` environment variable in Vercel.

1. Go to https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Check if `STRIPE_WEBHOOK_SECRET` is already set (it should be)
3. If it's different from what Stripe shows, update it

### Step 7: Redeploy
1. Go to Deployments tab
2. Click ⋯ on latest deployment → **Redeploy**
3. Wait 1-2 minutes

## Testing the Webhook

### Option 1: Manual Test in Stripe Dashboard
1. Go back to the webhook endpoint page
2. Scroll to **Recent Events**
3. Click **Send test event**
4. Select an event type (try `customer.subscription.created`)
5. Click **Send event**
6. Check the response status - should be `200`

### Option 2: Complete a Real Payment
1. Go to your checkout page
2. Enter test card: **4242 4242 4242 4242**
3. Enter any future expiry date and any CVC
4. Complete payment
5. Go back to Stripe Dashboard → Webhooks → Your endpoint
6. You should see real events in **Recent Events**

## After Webhook is Working

Once the webhook is configured and working:

1. Users who complete payment will have their subscription synced to your database
2. When they log in, `getSubscriptionStatus()` will find their active subscription
3. They will be redirected to **dashboard** instead of checkout
4. The `/api/debug` endpoint will show all subscriptions properly synced

## Troubleshooting

### Webhook shows "Failed" status
- Check Vercel deployment was successful
- Check Stripe webhook signing secret matches `STRIPE_WEBHOOK_SECRET` in Vercel
- Check webhook endpoint URL is correct (should be `https://YOUR_DOMAIN/api/webhooks/stripe`)

### Webhook shows "Pending"
- The endpoint might not be responding
- Go to Vercel → Deployments → Latest → Logs to see errors
- Make sure environment variables are all set

### Payment completes but subscription doesn't sync
- The webhook might not be configured yet
- Check Stripe Dashboard → Developers → Webhooks
- Verify the endpoint exists and is active

### Users still redirect to checkout after paying
- Webhook hasn't processed the subscription event yet
- Check Stripe Dashboard → Your endpoint → Recent Events
- Look for `customer.subscription.created` event

## What Happens After Payment

1. **User completes Stripe Checkout**
   ↓
2. **Stripe creates subscription** and sends webhook event
   ↓
3. **Your API receives webhook** at `/api/webhooks/stripe`
   ↓
4. **Subscription record updated** in your database with:
   - `stripe_subscription_id` (from Stripe)
   - `status: 'active'` (from Stripe)
   - `current_period_end` (when subscription renews)
   ↓
5. **User logs in**
   ↓
6. **System checks subscription** via `getSubscriptionStatus()`
   ↓
7. **Finds active subscription** in database
   ↓
8. **Redirects to dashboard** (NOT checkout)

## Important Notes

⚠️ **Test Mode**: Make sure Stripe is in TEST MODE while developing
- You should see "Viewing test data" banner at top of dashboard
- Use test card: `4242 4242 4242 4242`
- Real cards will NOT work in test mode

⚠️ **Webhook URL**: Must be HTTPS (not HTTP)
- Stripe requires secure webhooks
- Your Vercel URL is automatically HTTPS

⚠️ **Signing Secret**: Keep this secret secure!
- Never commit it to git
- Store in Vercel environment variables only
- Don't share publicly

## Next Steps

1. ✅ Go to Stripe Dashboard
2. ✅ Add webhook endpoint to your Vercel domain
3. ✅ Select the 5 events listed above
4. ✅ Copy the signing secret
5. ✅ Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel
6. ✅ Redeploy on Vercel
7. ✅ Test with a real payment
8. ✅ Log in with the paid account - should go to dashboard!


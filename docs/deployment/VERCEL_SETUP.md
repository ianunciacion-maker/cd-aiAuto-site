# Complete Vercel Environment Variables Setup - Step by Step

## Your Current Status

You're getting `FUNCTION_INVOCATION_FAILED` because **Vercel does not have your environment variables configured**. Your local `.env.local` file is on your machine, but Vercel needs them configured in the project settings.

## Critical Action Items

### ✅ What You Must Do (Required for Checkout to Work)

1. Go to Vercel project settings
2. Add 5 environment variables
3. Redeploy
4. Test

This will take about 5 minutes.

---

## Step-by-Step Instructions

### Step 1: Open Vercel Project Settings

1. Go to https://vercel.com/dashboard
2. Click on your project (likely named `cd-aiAuto-site` or `ai-auto`)
3. Click the **Settings** tab at the top

### Step 2: Navigate to Environment Variables

1. In the left sidebar under "Settings", click **Environment Variables**
2. You should see a text box that says "Add Environment Variable"

### Step 3: Add Stripe Configuration Variables

You need to add 3 Stripe variables. Get the values from your local `api/.env.local` file.

#### Variable 1: STRIPE_SECRET_KEY

1. In the "Name" field, enter: `STRIPE_SECRET_KEY`
2. In the "Value" field, copy the value from your `api/.env.local` file:
   - It starts with `sk_test_`
   - Should be the entire long string
3. Make sure these are selected (checkboxes on the right):
   - ☑️ Production
   - ☑️ Preview
   - ☐ Development (optional)
4. Click **Add**

#### Variable 2: STRIPE_PRICE_ID

1. In the "Name" field, enter: `STRIPE_PRICE_ID`
2. In the "Value" field, copy from `api/.env.local`:
   - Should look like: `price_1SZvk1Dz3xUi80YhG1GcElpd`
3. Select:
   - ☑️ Production
   - ☑️ Preview
4. Click **Add**

#### Variable 3: STRIPE_WEBHOOK_SECRET

1. In the "Name" field, enter: `STRIPE_WEBHOOK_SECRET`
2. In the "Value" field, copy from `api/.env.local`:
   - Should look like: `whsec_XXXXXXXXXXXXXXXXXXXXXXXX`
3. Select:
   - ☑️ Production
   - ☑️ Preview
4. Click **Add**

### Step 4: Add Supabase Configuration Variables

#### Variable 4: SUPABASE_URL

1. In the "Name" field, enter: `SUPABASE_URL`
2. In the "Value" field, copy from `api/.env.local`:
   - Should look like: `https://XXXXXXXXXXXXXXXXX.supabase.co`
3. Select:
   - ☑️ Production
   - ☑️ Preview
4. Click **Add**

#### Variable 5: SUPABASE_SERVICE_KEY

1. In the "Name" field, enter: `SUPABASE_SERVICE_KEY`
2. In the "Value" field, copy from `api/.env.local`:
   - This is a long JWT token starting with `eyJ...`
3. Select:
   - ☑️ Production
   - ☑️ Preview
4. Click **Add**

---

## Step 5: Verify All 5 Variables Are Added

After adding them, you should see a list like this:

```
✓ STRIPE_SECRET_KEY        (Production, Preview)
✓ STRIPE_PRICE_ID          (Production, Preview)
✓ STRIPE_WEBHOOK_SECRET    (Production, Preview)
✓ SUPABASE_URL             (Production, Preview)
✓ SUPABASE_SERVICE_KEY     (Production, Preview)
```

---

## Step 6: Trigger a Redeploy

Now Vercel needs to redeploy with these new environment variables:

### Option A: Quick Redeploy (Recommended)

1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Click the three dots (⋯) menu
4. Click **Redeploy**
5. Wait for deployment to complete (should take 1-2 minutes)

### Option B: Force Redeploy with Git

```bash
# In your terminal:
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

Then wait for Vercel to automatically redeploy.

---

## Step 7: Test the Checkout Flow

1. Go to your production URL (e.g., `https://cd-ai-auto-site.vercel.app/`)
2. Sign up with a **new test email** (don't reuse old ones)
3. Verify your email by clicking the link
4. Log in with your test account
5. You should be redirected to the **Checkout page**
6. Click **"Proceed to Payment"**
7. You should be redirected to **Stripe Checkout**

✅ If you see the Stripe payment form, it's working!
❌ If you still get an error, continue to troubleshooting below.

---

## Troubleshooting

### Error: Still Getting "FUNCTION_INVOCATION_FAILED"

1. **Check deployment completed:**
   - Go to Vercel Deployments tab
   - Make sure the latest deployment shows "Ready" (green checkmark)
   - If it says "Failed", click it to see error logs

2. **Hard refresh your browser:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`
   - This clears any cached versions

3. **Check Vercel Function Logs:**
   - Go to Vercel Deployments tab
   - Click on latest deployment
   - Click **Logs** button
   - Click **Function logs** tab
   - Scroll down to see error messages
   - Look for lines starting with "Failed to start checkout" or "FUNCTION_INVOCATION_FAILED"
   - The error will tell you exactly what's wrong (e.g., "Missing STRIPE_SECRET_KEY")

### Error: "Server configuration error: Missing Stripe configuration"

This means `STRIPE_SECRET_KEY` isn't set in Vercel. Go back to Step 3 and make sure you added it correctly.

### Error: "Server configuration error: Missing Supabase configuration"

This means `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` aren't set. Go back to Step 4 and verify both are added.

### Error: Still at checkout after login (not redirected to Stripe)

This could mean:
1. Stripe session creation succeeded but the redirect URL is wrong
2. Check browser console (F12) for any JavaScript errors
3. Check Vercel function logs to see if there's an error in the response

### Error: "Redirect URI mismatch" from Stripe

This happens if the Stripe price ID is wrong or doesn't exist in your Stripe account. Verify:
1. The `STRIPE_PRICE_ID` matches what's in your Stripe dashboard
2. The price belongs to a subscription product (not one-time payment)

---

## How to Verify Variables Were Added

You can test if the variables are correctly configured:

1. Go to your production URL and open browser Developer Tools (F12)
2. Go to **Console** tab
3. Visit `https://YOUR_DOMAIN/api/debug` (e.g., `https://cd-ai-auto-site.vercel.app/api/debug`)
4. You should see a JSON response showing what's configured:
   - `"allConfigured": true` = ✅ Ready to checkout
   - `"allConfigured": false` = ❌ Some variables missing

---

## What These Variables Do

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Authenticates your backend to Stripe API |
| `STRIPE_PRICE_ID` | The $49/month product ID (tells Stripe what to charge) |
| `STRIPE_WEBHOOK_SECRET` | For receiving payment confirmation webhooks |
| `SUPABASE_URL` | Your database location |
| `SUPABASE_SERVICE_KEY` | Authenticates backend to your database |

Without ALL 5 of these, the checkout API can't function.

---

## Common Mistakes

❌ **Don't:**
- Copy the `.env.local` file to Vercel (that's not how it works)
- Manually set these in your code (they'll be exposed)
- Add quotes around the values in Vercel UI
- Forget to set both Production and Preview checkboxes
- Copy only part of the key (the entire string is needed)

✅ **Do:**
- Add each variable individually in Vercel Settings
- Copy the entire value from `api/.env.local`
- Make sure Production is always checked
- Redeploy after adding variables
- Test with a fresh browser window

---

## Next Steps After Checkout Works

Once checkout is working and you can reach Stripe's payment form:

1. **Test payment** (use Stripe test card: 4242 4242 4242 4242)
2. **Set up webhook handling** to create subscriptions on payment success
3. **Configure billing portal** for subscription management
4. **Move to production keys** when you're ready to accept real payments

---

## Still Stuck?

If you've done all steps and it's still not working:

1. **Double-check the values:**
   - Open `api/.env.local` in your editor
   - Make sure there are no extra spaces or quotes
   - Copy the ENTIRE value (including the `sk_test_`, `price_`, etc. prefixes)

2. **Check Vercel logs:**
   - Deployments → Latest → Logs → Function logs
   - Search for "STRIPE_SECRET_KEY" or "STRIPE_PRICE_ID"
   - The error message will tell you exactly which variable is missing

3. **Verify variables are in Vercel:**
   - Settings → Environment Variables
   - Should see all 5 variables listed
   - Check the "Production" checkbox is marked for each

4. **Make sure deployment succeeded:**
   - Deployments tab
   - Latest deployment should show a green checkmark ✓
   - If it shows red ✗, click it to see the error

If you're still having issues after all this, the error logs will give us the exact problem to fix.


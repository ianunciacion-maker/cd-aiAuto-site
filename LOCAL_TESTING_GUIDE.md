# Local Testing Guide - SaaS Platform

## Status: ✅ Ready to Test

All code is implemented. You have Stripe test keys configured. Now let's verify everything works locally.

## Prerequisites Checklist

- [x] Stripe test keys obtained
- [x] Supabase service key obtained
- [x] `/api/.env.local` created with keys
- [ ] Webhook secret obtained from Stripe (IN PROGRESS - waiting for you)
- [ ] Database schema executed in Supabase
- [ ] Dependencies installed

## Step 1: Execute Database Schema

**This is CRITICAL - must be done first!**

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy/paste the entire contents of: `/Users/iananunciacion/aiAuto/PHASE_1_DATABASE_SETUP.sql`
4. Click **Run**
5. You should see `✓` confirmations for:
   - 4 tables created (user_profiles, subscriptions, tool_usage, webhook_events)
   - 4 functions created
   - RLS policies applied

If you get errors, let me know the exact error message.

**Verification Query (paste this after schema is created):**
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

Should return: user_profiles, subscriptions, tool_usage, webhook_events

---

## Step 2: Install Dependencies

```bash
cd /Users/iananunciacion/aiAuto
npm install
```

This installs:
- `stripe@latest`
- `@supabase/supabase-js@latest`

---

## Step 3: Start Local Development

**Terminal 1 - Start Vercel Dev Server:**
```bash
cd /Users/iananunciacion/aiAuto
vercel dev
```

This will:
- Start local dev server on `http://localhost:3000`
- Watch for API changes
- Hot-reload static files

You should see:
```
✓ Ready! Available at http://localhost:3000
```

**Terminal 2 - Listen for Stripe Webhooks (when you get webhook secret):**
```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will output your webhook signing secret (copy and update .env.local when ready).

---

## Step 4: Test the Complete Flow

### Test 1: Signup → Payment → Dashboard

1. **Go to Signup**: http://localhost:3000/user/signup.html
2. **Fill in:**
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. **Click "Create Account"**
4. **You should be redirected to** `/user/checkout.html`

### Test 2: Complete Stripe Payment

1. **On checkout page**, click **"Proceed to Payment"**
2. **Stripe Checkout Modal opens**
3. **Fill in test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Name: `Test User`
4. **Click "Pay"**
5. **You should see success message**

### Test 3: Check Dashboard

1. **You're redirected to** `/user/dashboard.html`
2. **You should see:**
   - ✅ Welcome message with your name
   - ✅ Subscription status: "active"
   - ✅ 4 tool cards (Blog Generator, Social Captions, Email Campaigns, Product Descriptions)
   - ✅ Usage counter: "0 / 100" for each tool

### Test 4: Use a Tool

1. **Click on "Blog Generator"**
2. **You should see:**
   - ✅ Tool form with inputs
   - ✅ Usage counter showing "0/100"
3. **Fill in the form:**
   - Topic: `How to build AI products`
   - Length: `Medium`
   - Tone: `Professional`
   - Keywords: `AI, SaaS, productivity`
4. **Click "Generate Blog Post"**
5. **You should see:**
   - ✅ Output section populated with placeholder content
   - ✅ Usage counter updates to "1/100"
   - ✅ Copy button appears

### Test 5: Check Admin Dashboard

1. **Go to** `http://localhost:3000/admin/login.html`
2. **Use your admin email** `setyourownsalary@gmail.com` (already in whitelist)
3. **Login** (use any password, it's test mode)
4. **Go to** `http://localhost:3000/admin/dashboard.html`
5. **You should see:**
   - ✅ "Users & Subscriptions" section
   - ✅ Your test user listed
   - ✅ Subscription status: "active"
   - ✅ "Cancel" button available

---

## Expected Behavior Checklist

### Signup Flow
- [ ] Can create account with email/password
- [ ] Form validation works (errors for invalid inputs)
- [ ] Auto-redirect to checkout after signup
- [ ] "Remember me" saves email on login page

### Payment Flow
- [ ] Stripe Checkout opens correctly
- [ ] Test card succeeds
- [ ] Failed card shows error
- [ ] Success redirects to dashboard
- [ ] Subscription created in Supabase

### Dashboard
- [ ] Shows correct user name
- [ ] Displays subscription status (active)
- [ ] Shows renewal date
- [ ] All 4 tools available
- [ ] Usage bars display correctly

### Tool Usage
- [ ] Tool pages require authentication
- [ ] Unauthenticated users redirected to login
- [ ] Usage counter increments on use
- [ ] Can use 100 times
- [ ] 101st use shows error: "Monthly limit reached"
- [ ] Copy button works

### Admin Dashboard
- [ ] Only admin email can access
- [ ] Shows all users
- [ ] Shows subscription status with color coding
- [ ] Can cancel subscriptions
- [ ] Stats update in real-time

---

## Webhook Testing (After You Get Secret)

Once you provide the webhook secret, update `/api/.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE
```

Then test webhook in Terminal 2:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is: whsec_test_xxxxx
> Forwarding events to http://localhost:3000/api/webhooks/stripe
```

Then trigger a test event:
```bash
# In another terminal
stripe trigger customer.subscription.created
```

Check Supabase → `webhook_events` table to confirm event was logged.

---

## Troubleshooting

### "Failed to create checkout session"
**Solution:**
1. Check `/api/.env.local` has all 6 variables filled
2. Verify STRIPE_PRICE_ID matches your Stripe dashboard
3. Check Vercel logs: `vercel logs`
4. Make sure database schema is executed in Supabase

### "User can't access tools after payment"
**Solution:**
1. Check Supabase `subscriptions` table has your test user with `status = 'active'`
2. Check `tool_usage` table has 4 rows for your user (100/month each)
3. If missing, database schema wasn't executed correctly

### "Webhook not received"
**Solution:**
1. You haven't provided webhook secret yet
2. Make sure `stripe listen` is running in Terminal 2
3. Check webhook signing secret in `.env.local` matches Stripe

### "SUPABASE_SERVICE_KEY is undefined"
**Solution:**
1. Verify `.env.local` has exactly 6 lines
2. No extra spaces or newlines
3. Service key should start with `eyJ...`

---

## Database Verification Queries

**Check if schema created:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
```

**Check if test user exists:**
```sql
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```

**Check subscription:**
```sql
SELECT * FROM subscriptions WHERE user_id = (
  SELECT id FROM user_profiles WHERE email = 'test@example.com'
);
```

**Check tool usage:**
```sql
SELECT * FROM tool_usage WHERE user_id = (
  SELECT id FROM user_profiles WHERE email = 'test@example.com'
);
```

---

## What You'll Need from Stripe Dashboard

**Once you create the webhook endpoint, get:**
1. Webhook Signing Secret (starts with `whsec_test_...`)
2. Update in `/api/.env.local`
3. Restart `vercel dev`

---

## Testing Checklist - Mark as You Go

- [ ] Database schema executed successfully
- [ ] `npm install` completed
- [ ] `vercel dev` running on localhost:3000
- [ ] Can access signup page
- [ ] Can create account with test email
- [ ] Stripe Checkout opens
- [ ] Test card payment succeeds
- [ ] Redirected to dashboard
- [ ] Dashboard shows active subscription
- [ ] Can access all 4 tools
- [ ] Tool usage increments
- [ ] Admin can see user in dashboard
- [ ] Webhook secret obtained from Stripe
- [ ] Webhook listening and processing events

---

## Next Steps

1. ✅ Execute database schema in Supabase
2. ✅ Provide webhook secret from Stripe
3. ⏳ Run `npm install`
4. ⏳ Start `vercel dev`
5. ⏳ Test the complete flow above
6. ⏳ Report any issues

**I'm ready to help debug any issues - just let me know what happens!**

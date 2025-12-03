# Automated Vercel Environment Setup

I've created scripts to automate adding environment variables to Vercel. You have two options:

## Option 1: Node.js Script (Recommended - Cross-Platform)

### Prerequisites
```bash
# Install Vercel CLI globally
npm install -g vercel

# Log in to Vercel
vercel login
```

### Run the Setup
```bash
# From your project root directory
node setup-vercel-env.js
```

This script will:
1. Read your `api/.env.local` file
2. Add all 5 environment variables to Vercel (Production & Preview)
3. Tell you when to redeploy

### What Happens
```
✅ Found api/.env.local
📝 Adding environment variables to Vercel...
  Setting STRIPE_SECRET_KEY... ✅
  Setting STRIPE_PRICE_ID... ✅
  Setting STRIPE_WEBHOOK_SECRET... ✅
  Setting SUPABASE_URL... ✅
  Setting SUPABASE_SERVICE_KEY... ✅
```

---

## Option 2: Bash Script (Mac/Linux)

### Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel

# Log in
vercel login
```

### Run the Setup
```bash
# From your project root directory
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

---

## After Running the Script

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Click your project
   - Go to Settings → Environment Variables

2. **Verify All 5 Variables Are There**
   ```
   ✓ STRIPE_SECRET_KEY        (Production, Preview)
   ✓ STRIPE_PRICE_ID          (Production, Preview)
   ✓ STRIPE_WEBHOOK_SECRET    (Production, Preview)
   ✓ SUPABASE_URL             (Production, Preview)
   ✓ SUPABASE_SERVICE_KEY     (Production, Preview)
   ```

3. **Redeploy Your Project**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on your latest deployment
   - Click **Redeploy**
   - Wait 1-2 minutes for it to complete

4. **Test the Checkout**
   - Go to your site
   - Sign up → verify email → log in
   - Click "Proceed to Payment"
   - Should see Stripe Checkout (not an error)

---

## If the Script Fails

### Error: "vercel command not found"
```bash
npm install -g vercel
```

### Error: "Not logged in to Vercel"
```bash
vercel login
```

Then run the script again.

### Error: "api/.env.local not found"
Make sure you're running the script from your project root directory:
```bash
cd /path/to/aiAuto
node setup-vercel-env.js
```

### Script Added Variables But It Didn't Work
The script may add variables but the API used might not work perfectly with all Vercel CLI versions. If that happens:

1. Go manually to https://vercel.com/dashboard
2. Click your project → Settings → Environment Variables
3. Verify all 5 variables are there with the correct values
4. If missing any, add them manually (copy from `api/.env.local`)
5. Redeploy

---

## How It Works

The script:
1. Reads your `api/.env.local` file (which you've already configured locally)
2. Authenticates with Vercel CLI (using your `vercel login` credentials)
3. Adds each variable to your Vercel project
4. Sets them for both Production and Preview environments
5. Guides you through the redeploy process

This way, you don't have to manually copy-paste each value!

---

## Alternative: Manual Setup (5 Minutes)

If you prefer to do it manually or the script doesn't work:

1. Open your `api/.env.local` file
2. Go to https://vercel.com/dashboard
3. Click your project → Settings → Environment Variables
4. For each of these 5 variables, click "Add":
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Copy the value from `.env.local` for each
6. Make sure "Production" ✓ and "Preview" ✓ are checked
7. Click "Add"
8. Go to Deployments → Redeploy latest

---

## What Gets Added

The script adds these variables from your `api/.env.local`:

| Variable | What it's for |
|----------|--------------|
| `STRIPE_SECRET_KEY` | Authenticates checkout requests to Stripe |
| `STRIPE_PRICE_ID` | Tells Stripe which product/price to charge |
| `STRIPE_WEBHOOK_SECRET` | Validates payment notifications from Stripe |
| `SUPABASE_URL` | Your database URL |
| `SUPABASE_SERVICE_KEY` | Authenticates backend requests to your database |

Without all 5, checkout won't work.

---

## Security Note

⚠️ These scripts read your `api/.env.local` which contains sensitive credentials.

**This is safe because:**
- `.env.local` is in `.gitignore` (not in git)
- The script only reads it locally (doesn't send anywhere except Vercel)
- Vercel stores values securely in their encrypted vault
- Only you (and your team at Vercel) can see them

**Do NOT:**
- Add `.env.local` to git
- Share `.env.local` publicly
- Put these scripts on public machines

---

## Quick Start (TL;DR)

```bash
npm install -g vercel
vercel login
node setup-vercel-env.js
# Then: Go to Vercel Deployments → Redeploy latest
# Wait 1-2 minutes
# Test checkout at your site
```


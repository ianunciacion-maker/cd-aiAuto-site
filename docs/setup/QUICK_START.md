# Quick Start - 5 Minutes to Testing

## You Have:
✅ Stripe test keys
✅ Supabase service key
✅ Price ID
⏳ Webhook secret (still needed)

## Do This Now (in order):

### 1. Execute Database Schema (5 min)
```
1. Go to: https://app.supabase.com
2. Select your project → SQL Editor
3. Click "New Query"
4. Open: /Users/iananunciacion/aiAuto/PHASE_1_DATABASE_SETUP.sql
5. Copy entire file → paste into SQL Editor
6. Click Run
7. Wait for ✓ confirmation
```

### 2. Install Dependencies (2 min)
```bash
cd /Users/iananunciacion/aiAuto
npm install
```

### 3. Start Dev Server (instant)
```bash
vercel dev
```

You'll see:
```
✓ Ready! Available at http://localhost:3000
```

### 4. Test Signup → Payment → Dashboard (5 min)

**Open:** http://localhost:3000/user/signup.html

Fill in:
- Full Name: `Test User`
- Email: `test@example.com`
- Password: `TestPassword123!`

Click "Create Account" → Redirects to checkout

Click "Proceed to Payment" → Stripe Checkout opens

Enter test card:
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

Click "Pay" → Success! Redirected to dashboard

### 5. Verify Everything Works

On dashboard, you should see:
- ✅ Welcome message
- ✅ Subscription: "active"
- ✅ 4 tool cards
- ✅ Usage: "0/100"

Click a tool → Fill form → Click Generate → Usage increments to "1/100" ✅

---

## THEN: Get Webhook Secret

Go to: https://dashboard.stripe.com

1. Developers → Webhooks
2. Add endpoint
3. URL: `http://localhost:3000/api/webhooks/stripe`
4. Select events: All "subscription" and "invoice" events
5. Create endpoint
6. Copy webhook secret (`whsec_test_...`)
7. Send it to me

---

## When Everything Works:

**You'll have:**
- ✅ Working user signup
- ✅ Stripe payments processing
- ✅ User dashboard with tools
- ✅ Usage tracking
- ✅ Admin can see users

---

## Issues?

Let me know:
1. What you're testing
2. What happened
3. Any error messages

I'll debug it immediately!

---

## Remember at the End:

⚠️ **Switch to LIVE keys before going public!**
- Don't forget to tell me when you're ready


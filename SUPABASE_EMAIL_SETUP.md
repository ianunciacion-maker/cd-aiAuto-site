# Supabase Email Verification & Redirect Configuration

This document outlines the critical Supabase configurations needed for the signup flow to work correctly.

## Current Flow

After signup, users see a verification prompt that says:
- "Verify Your Email"
- Shows their email address
- "We've sent a confirmation link to: [email]"
- "Click the link in the email to verify your account and unlock access to all features"
- Button: "Email Verified – Log In"

## Required Supabase Configuration

### 1. Email Confirmation Setting
**Location:** Supabase Dashboard → Authentication → Providers → Email

There are two modes:

#### Option A: Email Confirmation Enabled (Recommended for Production)
- Toggle **"Confirm email"** = **ON**
- Users MUST click the email link before they can sign in
- They will see the verification prompt
- The verification prompt remains until they click the email link

#### Option B: Email Confirmation Disabled (Current Testing Setup)
- Toggle **"Confirm email"** = **OFF**
- Users can sign in immediately without clicking the email link
- They still see the verification prompt for UX consistency
- The "Email Verified – Log In" button takes them directly to login

**Current Setting:** You mentioned email confirmation is disabled for testing. This is fine - the UI still shows the verification prompt for consistency.

---

### 2. Redirect URLs (CRITICAL)
**Location:** Supabase Dashboard → Authentication → URL Configuration (or Redirect Configuration)

You mentioned setting this to: `https://cd-ai-auto-site.vercel.app/user/login.html`

This tells Supabase where to redirect users when they click the email verification link. This is the **most important setting** for the localhost redirect issue to be fixed.

**Required Redirect URLs:**

For **Production** (Vercel):
```
https://cd-ai-auto-site.vercel.app/user/login.html
https://cd-ai-auto-site.vercel.app/user/signup.html
https://cd-ai-auto-site.vercel.app/user/checkout.html
```

For **Local Development** (if testing locally):
```
http://localhost:3000/user/login.html
http://localhost:3000/user/signup.html
http://localhost:3000/user/checkout.html
```

**Why This Matters:**
- When users click the email verification link, Supabase needs to know where to redirect them
- This must match your production domain exactly
- This is what fixes the "redirecting to localhost" issue you were experiencing

---

### 3. Email Template Customization (Optional)

**Location:** Supabase Dashboard → Authentication → Email Templates

You can customize the email template users receive. The default template includes:
- Subject line
- Confirmation link button
- Link text

The link itself is automatically populated by Supabase using the Redirect URLs configured above.

---

## Current Flow After These Configurations

### Signup Flow:
1. User fills out form (name, email, password)
2. User clicks "Create Account"
3. Supabase creates the account
4. Verification email is sent to user
5. **User sees**: "Verify Your Email" prompt with their email address
6. User receives email → clicks verification link
7. Supabase redirects to: `https://cd-ai-auto-site.vercel.app/user/login.html`
8. **User sees**: Login page
9. User enters email/password and clicks "Sign In"

### After Login:
1. System checks subscription status
2. If **subscribed** → Redirect to dashboard
3. If **not subscribed** → Redirect to checkout page

---

## Troubleshooting

### Issue: Still seeing localhost in email links
**Solution:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Edit the confirmation email template
3. Check that the link contains your production domain
4. Verify Redirect URLs are set correctly (see section 2 above)

### Issue: Email not received
**Solution:**
1. Check spam folder
2. Resend button available on verification prompt (click "send again")
3. Verify email is correct in email provider

### Issue: Stuck on verification prompt
**Solution:**
1. If email confirmation is enabled: User MUST click the email link
2. If email confirmation is disabled: User can click "Email Verified – Log In" immediately
3. For production: Email confirmation should be **ON** for security

---

## Environment Variables

Your API configuration has been updated with the production Vercel URL:

**File:** `api/.env.local`
```
VERCEL_URL=https://ai-auto.vercel.app
```

This is used as fallback for email redirect links if Supabase URLs aren't configured.

---

## Next Steps

1. ✅ Supabase Redirect URLs configured: `https://cd-ai-auto-site.vercel.app/user/login.html`
2. ⚠️ Verify email confirmation setting (ON for production, OFF for testing)
3. ✅ Environment variables updated with production domain
4. ✅ Code updated to show verification prompt consistently

Test the complete flow:
1. Go to signup page
2. Create new account
3. Verify you see the "Verify Your Email" prompt
4. Check email and click link (should redirect to login)
5. Log in with your credentials
6. Should be routed to checkout if no active subscription

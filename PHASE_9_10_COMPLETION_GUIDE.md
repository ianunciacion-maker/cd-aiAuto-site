# Phase 9 & 10: Security, Testing & Deployment

## Phase 9: Security & Testing

### Security Verification Checklist

#### Database Security (RLS - Row Level Security)
- [ ] Verify RLS is enabled on all tables:
  - [ ] user_profiles - users can only view/update own profile
  - [ ] subscriptions - users can only view own subscription
  - [ ] tool_usage - users can only view own usage
  - [ ] webhook_events - not accessible to users (admin only)

**Test in Supabase Console:**
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public';
-- Should show 't' for rowsecurity on all tables

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname='public';
```

#### API Security
- [ ] All `/api` endpoints require authentication (except webhooks)
- [ ] Environment variables are NOT exposed to client
- [ ] Stripe secret key only on server-side
- [ ] Webhook signature verification is enabled
- [ ] CORS headers are configured

**Test API Endpoints:**
```bash
# Test checkout without auth (should fail)
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","email":"test@test.com"}'

# Test with auth (requires session cookie/token)
```

#### Frontend Security
- [ ] No sensitive data in localStorage (only session cookies)
- [ ] Passwords never logged to console
- [ ] HTML entities escaped to prevent XSS
- [ ] CSRF protection for forms (if using cookies)
- [ ] Sensitive endpoints require auth check

#### Authentication Flow Security
- [ ] Signup requires email verification (Supabase does this)
- [ ] Passwords are hashed server-side (Supabase does this)
- [ ] Session tokens have expiration (Supabase default: 1 hour)
- [ ] Logout clears session data
- [ ] Admin pages protected with `authManager.protectAdminRoute()`

### Functional Testing Checklist

#### User Authentication
- [ ] Signup with valid email/password creates account
- [ ] Signup with duplicate email shows error
- [ ] Signup with weak password (< 8 chars) shows error
- [ ] Email verification required (check inbox)
- [ ] Login with correct credentials works
- [ ] Login with wrong password shows error
- [ ] Logout clears session
- [ ] Remember me functionality saves email

#### Payment Flow
- [ ] Checkout page displays $49/month pricing
- [ ] Stripe Checkout opens in new window
- [ ] Test card 4242424242424242 completes payment
- [ ] Failed card 4000000000000002 shows error
- [ ] Webhook is received after successful payment
- [ ] Subscription status changes from "inactive" to "active"
- [ ] Tool usage is initialized (100/month for each tool)
- [ ] User is redirected to dashboard after payment

#### Tool Usage
- [ ] Each tool page requires authentication
- [ ] Unauthenticated users redirected to login
- [ ] Usage counter displays correctly (X/100)
- [ ] First use increments counter to 1/100
- [ ] 100th use succeeds and shows 100/100
- [ ] 101st use shows "limit exceeded" error
- [ ] Non-subscribers see "Upgrade to access" message
- [ ] Subscription page shows correct renewal date

#### Admin Dashboard
- [ ] Only admin email can access admin dashboard
- [ ] Non-admin emails redirected to login
- [ ] Users list shows all registered users
- [ ] Subscription status displayed correctly (active/inactive/past_due)
- [ ] Admin can cancel user subscription
- [ ] Dashboard stats update after cancellation
- [ ] User loses tool access immediately after cancellation
- [ ] Blog post management still works

#### Database Functions
- [ ] `can_use_tool()` returns true only if subscription active + usage < limit
- [ ] `increment_tool_usage()` increments counter and returns false at limit
- [ ] `initialize_tool_usage()` creates 4 tools with 100/month limit
- [ ] Monthly reset logic works (resets on month boundary)
- [ ] `handle_new_user()` auto-creates profile on signup

### Integration Testing

#### Stripe Webhook Flow
1. [ ] Customer creates account → profile created ✓
2. [ ] Customer subscribes → webhook received → subscription record updated
3. [ ] Webhook updates `subscriptions` table with:
   - [ ] stripe_subscription_id
   - [ ] stripe_customer_id
   - [ ] status = "active"
   - [ ] current_period_start
   - [ ] current_period_end
4. [ ] Tool usage initialized via webhook
5. [ ] Dashboard reflects subscription status immediately
6. [ ] Admin can see new user and subscription

**Test locally with Stripe CLI:**
```bash
# Terminal 1: Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Trigger test events
stripe trigger payment_intent.succeeded
```

#### n8n Integration Points (Ready for Your Backend)
All tool pages have hooks ready for n8n:
- [ ] Replace `generatePlaceholderContent()` in each tool page
- [ ] Call your n8n webhook instead
- [ ] Pass: { user_id, tool_type, form_inputs }
- [ ] Receive generated content and display
- [ ] Usage counter already incremented before API call

Example integration:
```javascript
// In /tools/blog-generator.html
async generateContent(topic, length, tone, keywords) {
  // Instead of placeholder, call n8n
  const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      tool_type: 'blog_generator',
      topic, length, tone, keywords
    })
  });

  const { content } = await response.json();
  return content; // Display this instead of placeholder
}
```

---

## Phase 10: Deployment to Vercel

### Pre-Deployment Checklist

#### Environment Setup
- [ ] Stripe live account created
- [ ] Stripe live product created ($49/month)
- [ ] Stripe live API keys obtained
- [ ] Stripe live webhook configured
- [ ] Vercel account created
- [ ] Project connected to GitHub/Git
- [ ] Production domain configured

#### Environment Variables

Create these in Vercel Project Settings → Environment Variables:

**Production:**
```
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PRICE_ID=price_LIVE_ID
STRIPE_WEBHOOK_SECRET=whsec_LIVE_SECRET
SUPABASE_URL=https://qhmjyeohczpjgfzgxdjx.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
VERCEL_URL=https://yourdomain.com
```

**Development/Preview:**
```
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PRICE_ID=price_TEST_ID
STRIPE_WEBHOOK_SECRET=whsec_TEST_SECRET
SUPABASE_URL=https://qhmjyeohczpjgfzgxdjx.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
VERCEL_URL=https://your-project.vercel.app
```

### Deployment Steps

#### Step 1: Configure Stripe for Production

1. Go to https://dashboard.stripe.com
2. Switch from Test mode to Live mode (top right toggle)
3. Go to Products → AI Content Creation Suite
4. Note the LIVE price ID (not test price)
5. Go to Developers → API Keys
6. Copy LIVE publishable and secret keys
7. Go to Developers → Webhooks
8. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
9. Select events: customer.subscription.*, invoice.payment_*
10. Copy webhook signing secret (whsec_live_...)

#### Step 2: Update Vercel Environment

1. Go to https://vercel.com/dashboard
2. Select your Ai-Auto project
3. Settings → Environment Variables
4. Add all production variables
5. Set environment scope:
   - Test keys: Preview + Development
   - Live keys: Production only

#### Step 3: Deploy to Vercel

```bash
# Make sure all changes are committed
git status  # Should be clean

# Deploy to Vercel
vercel --prod

# This will:
# - Build the project
# - Deploy static files
# - Deploy serverless functions (/api)
# - Set environment variables
# - Assign production domain
```

#### Step 4: Verify Deployment

1. **Check Vercel Deployment:**
   - Go to https://vercel.com/dashboard
   - Click your project
   - Should show green checkmark for latest deployment

2. **Test Static Pages:**
   - [ ] https://yourdomain.com (home page loads)
   - [ ] https://yourdomain.com/tools.html (tools page loads)
   - [ ] https://yourdomain.com/blog.html (blog page loads)

3. **Test Authentication:**
   - [ ] https://yourdomain.com/user/signup.html
   - [ ] Create test account with test email
   - [ ] Verify email confirmation
   - [ ] Login works

4. **Test Stripe Payment:**
   - [ ] Go to signup → checkout
   - [ ] Complete test payment with 4242424242424242
   - [ ] Check Stripe dashboard for payment
   - [ ] Check Supabase for subscription record
   - [ ] Verify webhook was received

5. **Test Tools Access:**
   - [ ] Login to user dashboard
   - [ ] All 4 tools should be accessible
   - [ ] Tool usage counter shows 0/100
   - [ ] Use a tool → counter shows 1/100

6. **Test Admin Dashboard:**
   - [ ] Login with admin email (setyourownsalary@gmail.com)
   - [ ] Go to /admin/dashboard.html
   - [ ] Should see new test user in users list
   - [ ] Should show "active" subscription status

7. **Test API Endpoints:**
   ```bash
   # Test checkout endpoint
   curl https://yourdomain.com/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","email":"test@test.com"}'

   # Should return error or sessionId
   ```

### Post-Deployment

#### Monitoring
- [ ] Set up Vercel error tracking
- [ ] Enable Stripe incident notifications
- [ ] Monitor API function logs in Vercel dashboard
- [ ] Check Supabase logs for errors

#### Maintenance
- [ ] Create backup of Supabase database regularly
- [ ] Monitor Stripe for failed payments
- [ ] Review webhook event logs monthly
- [ ] Keep API keys rotated (generate new ones periodically)

#### Updates
- [ ] Document any changes to schema
- [ ] Test updates in preview environment first
- [ ] Use Vercel preview deployments for testing

### Rollback Plan

If something goes wrong:

1. **Revert Code:**
   ```bash
   git revert COMMIT_HASH
   git push
   vercel --prod
   ```

2. **Revert Environment Variables:**
   - Go back to test keys in Vercel
   - Disable Stripe webhooks temporarily
   - Direct users to test environment

3. **Database Recovery:**
   - Supabase has automatic backups (check their dashboard)
   - Can restore from point-in-time if needed

---

## Success Criteria

### Security
- ✅ No sensitive data exposed to client
- ✅ RLS policies protect user data
- ✅ Authentication required for all user endpoints
- ✅ Webhook signatures verified
- ✅ Admin pages protected

### Functionality
- ✅ Complete signup → payment → tools flow
- ✅ Monthly usage limits work correctly
- ✅ Webhook sync keeps data in sync
- ✅ Admin can manage users
- ✅ Tools ready for n8n integration

### Performance
- ✅ Page load time < 3 seconds
- ✅ API endpoints respond < 500ms
- ✅ Database queries optimized with indexes
- ✅ Static assets cached on CDN

### Scalability
- ✅ Vercel serverless functions auto-scale
- ✅ Supabase handles concurrent users
- ✅ Stripe handles payment processing
- ✅ No single points of failure

---

## Quick Reference Commands

```bash
# Local Development
npm install
vercel dev

# Test Stripe locally
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Deploy to Vercel
git add .
git commit -m "message"
git push
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env list
```

---

## Support & Troubleshooting

### Common Issues

**"STRIPE_SECRET_KEY is not defined"**
- Check Vercel environment variables are set
- Make sure they're set for Production environment
- Redeploy after updating variables

**"Webhook signature verification failed"**
- Webhook secret doesn't match in `.env`
- Verify exact match in Vercel (no extra spaces)
- Regenerate if unsure

**"Database connection failed"**
- Check SUPABASE_URL and SUPABASE_SERVICE_KEY
- Verify IP allowlist in Supabase (if using)
- Check database is not paused

**"User can't access tools after payment"**
- Check webhook was received: SELECT * FROM webhook_events
- Verify subscription status in database
- Check RLS policies are correct

### Testing Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Logs](https://vercel.com/docs/monitoring/analytics)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)

---

## Final Checklist

Before launching to real users:

- [ ] All phases 1-8 complete and tested
- [ ] Environment variables configured in Vercel
- [ ] Stripe live keys obtained and verified
- [ ] Production domain configured
- [ ] SSL certificate active (automatic on Vercel)
- [ ] Stripe webhooks receiving events
- [ ] Admin test user can view all users
- [ ] Test payment completes successfully
- [ ] Test user can access tools
- [ ] Database backups configured
- [ ] Error monitoring enabled
- [ ] Terms of service page created
- [ ] Privacy policy page created
- [ ] Refund/cancellation policy documented

**You're ready to launch! 🚀**

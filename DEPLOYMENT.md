# Deployment Guide

This guide covers deploying the Ai-Auto application to Vercel and GitHub.

## Pre-Deployment Checklist

### 1. Environment Variables

Before deploying, ensure you have the following environment variables ready:

#### Required for Vercel Production:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_live_` for production)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_live_` for production)
- `STRIPE_PRICE_ID` - Your Stripe price ID for subscription
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (starts with `whsec_`)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (server-side only, never expose)

#### Optional:
- `VERCEL_URL` - Automatically set by Vercel

### 2. Security Check

Before pushing to GitHub:

- [ ] Verify `.env` and `.env.local` are in `.gitignore`
- [ ] No API keys or secrets are hardcoded in any files
- [ ] The Supabase anon key in `supabase.js` is safe to expose (it is - this is the public-facing key)
- [ ] Service role key is ONLY in environment variables, not in code

### 3. Code Verification

- [ ] All HTML pages load correctly locally
- [ ] CSS paths are relative (e.g., `../css/main.css` for subdirectories)
- [ ] JavaScript imports work correctly
- [ ] Blog editor (Quill.js) loads properly
- [ ] Authentication flow works locally

## GitHub Setup

### Initial Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Ai-Auto application"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Repository Settings

1. **Make Repository Public** (if needed for Vercel free tier)
2. **Add Repository Description**: "AI-powered productivity tools platform"
3. **Add Topics**: `ai`, `automation`, `productivity`, `saas`, `vercel`, `supabase`, `stripe`

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty (static site)
5. Add environment variables (see section below)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Adding Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable:
   - Variable Name: `STRIPE_SECRET_KEY`
   - Value: Your actual secret key
   - Environments: Check "Production", "Preview", "Development" as needed
4. Repeat for all required variables

**Important**: After adding environment variables, you must redeploy for them to take effect.

### Webhook Configuration

After deployment, configure Stripe webhooks:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

## Testing Deployment

### Verify All Pages Load

Test each page on your Vercel domain:

- [ ] `https://your-domain.vercel.app/` - Homepage
- [ ] `https://your-domain.vercel.app/about.html` - About page
- [ ] `https://your-domain.vercel.app/tools.html` - Tools catalog
- [ ] `https://your-domain.vercel.app/blog.html` - Blog listing
- [ ] `https://your-domain.vercel.app/blog/post.html?slug=test` - Blog post
- [ ] `https://your-domain.vercel.app/user/signup.html` - User signup
- [ ] `https://your-domain.vercel.app/user/login.html` - User login
- [ ] `https://your-domain.vercel.app/user/dashboard.html` - User dashboard
- [ ] `https://your-domain.vercel.app/user/checkout.html` - Checkout page
- [ ] `https://your-domain.vercel.app/admin/login.html` - Admin login
- [ ] `https://your-domain.vercel.app/admin/dashboard.html` - Admin dashboard
- [ ] `https://your-domain.vercel.app/admin/create-post.html` - Create post
- [ ] `https://your-domain.vercel.app/admin/edit-post.html?id=xxx` - Edit post

### Verify API Endpoints

Test API endpoints using curl or Postman:

```bash
# Test checkout (requires authentication)
curl -X POST https://your-domain.vercel.app/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","email":"test@example.com","priceId":"price_xxx"}'

# Test webhook (from Stripe)
# Use Stripe CLI for local testing:
stripe listen --forward-to https://your-domain.vercel.app/api/webhooks/stripe
```

### Verify Functionality

- [ ] User signup creates account in Supabase
- [ ] User can log in with credentials
- [ ] Admin can access admin routes
- [ ] Blog posts can be created and published
- [ ] Images upload to Supabase Storage
- [ ] Stripe checkout redirects correctly
- [ ] Subscription updates via webhook
- [ ] Dark mode toggle works
- [ ] Responsive design works on mobile

## Troubleshooting

### Pages Return 404

**Issue**: HTML pages return 404 errors

**Solution**:
- Verify files exist in the repository
- Check file paths are relative, not absolute
- Ensure vercel.json is properly configured
- Redeploy after making changes

### API Functions Fail

**Issue**: API endpoints return 500 errors

**Solution**:
- Check Vercel Function Logs in dashboard
- Verify all environment variables are set
- Ensure `@supabase/supabase-js` and `stripe` packages are in `package.json`
- Check API function syntax for errors

### Supabase Connection Issues

**Issue**: Database operations fail

**Solution**:
- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_KEY` has proper permissions
- Ensure Supabase project is active (not paused)
- Check Supabase dashboard for RLS policies

### Stripe Checkout Fails

**Issue**: Checkout button doesn't redirect

**Solution**:
- Verify Stripe keys are correct (test vs. live)
- Check `STRIPE_PRICE_ID` matches your Stripe product
- Ensure `VERCEL_URL` is set correctly for success/cancel URLs
- Check browser console for errors

### Webhook Not Receiving Events

**Issue**: Stripe webhooks aren't being processed

**Solution**:
- Verify webhook URL in Stripe dashboard is correct
- Check webhook signing secret matches environment variable
- Look at Stripe webhook logs in dashboard
- Test webhook locally with Stripe CLI

## Custom Domain Setup

### Add Custom Domain to Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain (e.g., `ai-auto.com`)
4. Vercel will provide DNS configuration instructions
5. Update your DNS records with your domain provider:
   - **A Record**: Point to Vercel's IP
   - **CNAME**: Point to `cname.vercel-dns.com`
6. Wait for DNS propagation (up to 48 hours)

### Update Stripe Webhooks

After adding custom domain:
1. Update webhook URL in Stripe to use custom domain
2. Generate new webhook signing secret
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel
4. Redeploy

### Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your custom domain to allowed redirect URLs
3. Update site URL to your custom domain

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

To disable auto-deployment:
1. Go to Project Settings → Git
2. Disable "Production Branch" or "Preview Branches"

## Rolling Back Deployment

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click the three dots → "Promote to Production"
4. Confirm rollback

## Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Deployments
2. Click on a deployment
3. Navigate to "Functions" tab to see API logs
4. Navigate to "Build Logs" to see deployment logs

### Set Up Monitoring

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for user analytics

## Security Best Practices

- [ ] Always use HTTPS (Vercel provides this automatically)
- [ ] Keep environment variables in Vercel, never in code
- [ ] Regularly rotate API keys and secrets
- [ ] Use Stripe test mode for development
- [ ] Enable 2FA on Vercel, GitHub, Stripe, and Supabase accounts
- [ ] Review Vercel security headers in `vercel.json`
- [ ] Monitor Vercel audit logs for suspicious activity

## Cost Optimization

### Vercel Free Tier Limits
- 100 GB bandwidth per month
- 100 GB-hours serverless function execution
- 6,000 function invocations per day

### Tips to Stay Within Free Tier
- Optimize images to reduce bandwidth
- Use caching headers (already configured in `vercel.json`)
- Monitor usage in Vercel Dashboard
- Consider upgrading to Pro plan if you exceed limits

## Support

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

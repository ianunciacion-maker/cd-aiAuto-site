# 🚀 Supabase Setup Checklist

Print this checklist or save it for easy reference during setup.

## ✅ Pre-Setup Checklist
- [ ] Have 5-10 minutes available
- [ ] Have a valid email address ready
- [ ] Browser is updated to latest version
- [ ] Have password manager ready (recommended)

## ✅ Supabase Account Setup
- [ ] Go to https://supabase.com
- [ ] Create account (GitHub/Google/Email)
- [ ] Verify email address
- [ ] Log in to dashboard

## ✅ Project Creation
- [ ] Click "New Project"
- [ ] Choose organization
- [ ] Enter project name: `ai-auto-blog`
- [ ] Create and save database password
- [ ] Select nearest region
- [ ] Click "Create new project"
- [ ] Wait for project setup (2-3 minutes)

## ✅ Get Credentials
- [ ] Go to Settings → API
- [ ] Copy Project URL
- [ ] Copy anon public key
- [ ] Keep browser tab open

## ✅ Configure Code
- [ ] Open `supabase.js` file
- [ ] Replace `SUPABASE_URL` with your Project URL
- [ ] Replace `SUPABASE_ANON_KEY` with your anon key
- [ ] Save the file

## ✅ Database Setup
- [ ] Go to SQL Editor in Supabase
- [ ] Click "New query"
- [ ] Copy and paste the SQL code from setup guide
- [ ] Click "Run"
- [ ] Verify "Success" message

## ✅ Admin User Creation
- [ ] Go to Authentication → Users
- [ ] Click "Add user"
- [ ] Enter email: `admin@ai-auto.com`
- [ ] Create secure password
- [ ] Check "Auto-confirm user"
- [ ] Click "Save"
- [ ] Note down email and password

## ✅ Testing
- [ ] Open `index.html` in browser
- [ ] Navigate to `admin/login.html`
- [ ] Enter admin email and password
- [ ] Click "Login"
- [ ] Verify redirect to admin dashboard

## ✅ Final Verification
- [ ] Try creating a blog post
- [ ] Verify post appears on blog listing page
- [ ] Test editing and deleting posts
- [ ] Check mobile responsiveness

## 🚨 Troubleshooting Quick Reference

**If login fails:**
- Check browser console (F12) for errors
- Verify admin user exists in Supabase
- Confirm email/password are correct

**If database errors:**
- Re-run SQL query
- Check table was created
- Verify credentials in supabase.js

**If connection errors:**
- Double-check SUPABASE_URL and SUPABASE_ANON_KEY
- Ensure no typos in credentials
- Try refreshing the page

---

## 📞 Quick Help

**Your Login Credentials:**
- Email: `admin@ai-auto.com` (unless you changed it)
- Password: Whatever you set in Supabase

**Key Files:**
- `supabase.js` - Configuration file
- `admin/login.html` - Login page
- `admin/dashboard.html` - Admin dashboard

**Important URLs:**
- Your website: `file:///path/to/your/project/index.html`
- Supabase dashboard: https://supabase.com/dashboard

---

**✅ All done! Your blog system is ready to use!**
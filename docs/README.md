# Documentation Index

Welcome to the Ai-Auto documentation. This folder contains all setup guides, deployment instructions, database scripts, and reference documentation.

## Quick Links

### 🚀 Getting Started
- **[QUICK_START.md](setup/QUICK_START.md)** - 5-minute setup guide
- **[SETUP_CHECKLIST.md](setup/SETUP_CHECKLIST.md)** - Step-by-step checklist

### 🗄️ Database Setup
- **[PHASE_1_DATABASE_SETUP.sql](sql/PHASE_1_DATABASE_SETUP.sql)** - Create core tables
- **[BLOG_SETUP.md](setup/BLOG_SETUP.md)** - Blog posts table setup
- **[sql/ folder](sql/)** - All database setup scripts

### 🔐 Authentication & Services
- **[AUTOMATED_SETUP.md](setup/AUTOMATED_SETUP.md)** - Automated setup with CLI
- **[SUPABASE_SETUP_GUIDE.md](setup/SUPABASE_SETUP_GUIDE.md)** - Supabase configuration
- **[SUPABASE_EMAIL_SETUP.md](setup/SUPABASE_EMAIL_SETUP.md)** - Email authentication
- **[STRIPE_WEBHOOK_SETUP.md](setup/STRIPE_WEBHOOK_SETUP.md)** - Stripe webhook configuration

### 🚢 Deployment
- **[VERCEL_SETUP.md](deployment/VERCEL_SETUP.md)** - Vercel deployment guide
- **[LOCAL_TESTING_GUIDE.md](deployment/LOCAL_TESTING_GUIDE.md)** - Local development & testing
- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - General deployment process
- **[VERIFY_STRIPE_SETUP.md](deployment/VERIFY_STRIPE_SETUP.md)** - Verify Stripe configuration

### 📚 Reference
- **[guides/](guides/)** - Phase documentation and architecture notes
- **[IMPLEMENTATION_SUMMARY.md](deployment/IMPLEMENTATION_SUMMARY.md)** - Complete implementation overview
- **[specifications.md](specifications.md)** - Technical specifications

## Setup Workflow

### For New Developers
1. Read **[QUICK_START.md](setup/QUICK_START.md)** (5 minutes)
2. Follow **[SETUP_CHECKLIST.md](setup/SETUP_CHECKLIST.md)** for step-by-step tasks
3. Reference specific guides as needed

### For Deployment
1. Read **[VERCEL_SETUP.md](deployment/VERCEL_SETUP.md)**
2. Use **[LOCAL_TESTING_GUIDE.md](deployment/LOCAL_TESTING_GUIDE.md)** to test locally
3. Check **[VERIFY_STRIPE_SETUP.md](deployment/VERIFY_STRIPE_SETUP.md)** before going live

### For Database Setup
1. Run SQL scripts in order from **[sql/](sql/)** folder
2. Each script is documented with its purpose
3. See **[BLOG_SETUP.md](setup/BLOG_SETUP.md)** for blog-specific configuration

## Folder Structure

```
docs/
├── README.md                    # You are here
├── specifications.md            # Technical specifications
├── sql/                         # Database setup scripts
├── setup/                       # Setup and onboarding guides
├── deployment/                  # Deployment and testing guides
└── guides/                      # Phase documentation
```

## Key Root Files

These essential files should stay in root:
- **README.md** - Project overview
- **CLAUDE.md** - Claude Code guidelines
- **design_system.md** - Design tokens
- **package.json** - Dependencies
- **vercel.json** - Vercel config

---

**Last Updated**: December 2024
**Project**: Ai-Auto - Set Your Own Salary with AI

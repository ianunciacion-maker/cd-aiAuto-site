#!/bin/bash

# Vercel Environment Variables Setup Script
# This script automatically adds environment variables to your Vercel project
#
# Usage: ./setup-vercel-env.sh
#
# Prerequisites:
#   1. Vercel CLI installed: npm i -g vercel
#   2. Logged in: vercel login
#   3. .env.local file exists in api/ directory
#
# What it does:
#   - Reads environment variables from api/.env.local
#   - Adds them to your Vercel project (Production and Preview environments)
#   - Triggers a redeploy

set -e

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f "api/.env.local" ]; then
    echo "❌ Error: api/.env.local not found"
    echo "Please make sure you have api/.env.local in your project root"
    exit 1
fi

echo "✅ Found api/.env.local"
echo ""

# Load environment variables from .env.local
set -a
source api/.env.local
set +a

echo "📝 Adding environment variables to Vercel..."
echo ""

# Function to add environment variable
add_env_var() {
    local key=$1
    local value=$2

    echo "Setting $key..."

    # Add to production
    vercel env add "$key" production <<< "$value" 2>/dev/null || true

    # Add to preview
    vercel env add "$key" preview <<< "$value" 2>/dev/null || true

    echo "  ✅ $key added"
}

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel. Opening login..."
    vercel login
fi

# Add Stripe variables
echo ""
echo "📌 Adding Stripe Configuration:"
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_env_var "STRIPE_PRICE_ID" "$STRIPE_PRICE_ID"
add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

# Add Supabase variables
echo ""
echo "📌 Adding Supabase Configuration:"
add_env_var "SUPABASE_URL" "$SUPABASE_URL"
add_env_var "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"

echo ""
echo "✅ All environment variables have been added to Vercel!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Verify all 5 variables are listed"
echo "5. Click Deployments tab"
echo "6. Click the three dots on latest deployment"
echo "7. Click 'Redeploy'"
echo ""
echo "After redeploy completes (1-2 minutes):"
echo "- Test your site checkout flow"
echo "- If it still fails, visit /api/debug to see what's misconfigured"
echo ""

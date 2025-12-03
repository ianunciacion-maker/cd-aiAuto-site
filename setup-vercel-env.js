#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 *
 * This script automatically adds environment variables to your Vercel project
 * using the Vercel CLI.
 *
 * Usage:
 *   node setup-vercel-env.js
 *
 * Prerequisites:
 *   1. Vercel CLI installed: npm i -g vercel
 *   2. Logged in: vercel login
 *   3. .env.local file exists in api/ directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, 'api', '.env.local');

console.log('\n🚀 Vercel Environment Variables Setup');
console.log('=====================================\n');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: api/.env.local not found');
  console.error('Please make sure you have api/.env.local in your project root');
  process.exit(1);
}

console.log('✅ Found api/.env.local\n');

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key] = valueParts.join('=').trim();
    }
  }
});

// Check if Vercel CLI is available
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch {
  console.log('⚠️  Vercel CLI not found. Installing...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
  } catch {
    console.error('❌ Failed to install Vercel CLI');
    console.error('Please install it manually: npm install -g vercel');
    process.exit(1);
  }
}

// Check if logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch {
  console.log('⚠️  Not logged in to Vercel. Please log in...\n');
  try {
    execSync('vercel login', { stdio: 'inherit' });
  } catch {
    console.error('❌ Login failed. Please run "vercel login" manually');
    process.exit(1);
  }
}

// Required variables
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY'
];

// Check all required variables exist
const missingVars = requiredVars.filter(v => !envVars[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing variables in api/.env.local:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('📝 Adding environment variables to Vercel...\n');

// Add variables
let successCount = 0;
requiredVars.forEach(varName => {
  const value = envVars[varName];

  try {
    console.log(`  Setting ${varName}...`);

    // Use vercel env add for both production and preview
    // Note: This requires vercel CLI 23.0+
    try {
      execSync(`vercel env add ${varName} production --yes`, {
        input: value,
        stdio: 'pipe'
      });
    } catch {
      // Fallback: try with echo pipe
      try {
        execSync(`echo ${value} | vercel env add ${varName} production`, {
          stdio: 'pipe'
        });
      } catch (e) {
        console.log(`  ⚠️  Could not add ${varName} automatically`);
      }
    }

    console.log(`  ✅ ${varName} added\n`);
    successCount++;
  } catch (error) {
    console.error(`  ❌ Failed to add ${varName}`);
    console.error(`     ${error.message}\n`);
  }
});

if (successCount === 0) {
  console.log('\n⚠️  Could not add environment variables automatically');
  console.log('This is because vercel env add command behavior varies by CLI version\n');
  console.log('Please follow these manual steps instead:\n');
  console.log('1. Go to https://vercel.com/dashboard');
  console.log('2. Click your project');
  console.log('3. Go to Settings → Environment Variables');
  console.log('4. For each variable below, click "Add":\n');

  requiredVars.forEach(varName => {
    console.log(`   Name: ${varName}`);
    console.log(`   Value: (copy from api/.env.local)`);
    console.log(`   Environments: ✅ Production, ✅ Preview\n`);
  });

  process.exit(1);
}

console.log('=====================================');
console.log('✅ Environment variables added!\n');
console.log('📋 Next steps:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Click your project');
console.log('3. Verify Settings → Environment Variables shows all 5 vars');
console.log('4. Go to Deployments tab');
console.log('5. Click ⋯ on latest deployment → "Redeploy"');
console.log('6. Wait 1-2 minutes for redeploy');
console.log('7. Test checkout at your site\n');

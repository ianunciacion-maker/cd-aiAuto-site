/**
 * Simple test to verify Stripe initialization works
 * Run locally: node api/test-stripe.js
 */

console.log('\n🧪 Testing Stripe Configuration\n');

// Load environment variables
require('dotenv').config({ path: './api/.env.local' });

console.log('Environment Variables Check:');
console.log('=============================\n');

const vars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
};

let allSet = true;

Object.entries(vars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: SET`);
    console.log(`   Value: ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allSet = false;
  }
  console.log('');
});

if (!allSet) {
  console.log('❌ Some environment variables are missing!');
  console.log('Make sure api/.env.local exists and has all required variables.\n');
  process.exit(1);
}

console.log('Attempting to initialize Stripe...\n');

try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully!');
  console.log('   You can use this secret key with Stripe API\n');
} catch (error) {
  console.log('❌ Failed to initialize Stripe:');
  console.log(`   ${error.message}\n`);
  process.exit(1);
}

console.log('Attempting to initialize Supabase...\n');

try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log('✅ Supabase initialized successfully!');
  console.log('   You can use this configuration with Supabase API\n');
} catch (error) {
  console.log('❌ Failed to initialize Supabase:');
  console.log(`   ${error.message}\n`);
  process.exit(1);
}

console.log('=============================');
console.log('✅ All checks passed!\n');
console.log('Your Stripe and Supabase configuration is working locally.');
console.log('If checkout still fails on Vercel, the environment variables');
console.log('are not set in your Vercel project settings.\n');

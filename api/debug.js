/**
 * Debug endpoint to check server configuration
 * GET /api/debug
 *
 * Returns information about environment variables and Stripe setup
 * ONLY for development/debugging - remove before production
 */

module.exports = async (req, res) => {
  // Set CORS headers to allow frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
      },
      configuration: {
        stripe: {
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          secretKeyPrefix: process.env.STRIPE_SECRET_KEY
            ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...'
            : 'NOT SET',
          hasPriceId: !!process.env.STRIPE_PRICE_ID,
          priceId: process.env.STRIPE_PRICE_ID || 'NOT SET',
          hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET
            ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20) + '...'
            : 'NOT SET',
        },
        supabase: {
          hasUrl: !!process.env.SUPABASE_URL,
          url: process.env.SUPABASE_URL || 'NOT SET',
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          serviceKeyPrefix: process.env.SUPABASE_SERVICE_KEY
            ? process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...'
            : 'NOT SET',
        },
        vercel: {
          hasUrl: !!process.env.VERCEL_URL,
          url: process.env.VERCEL_URL || 'NOT SET',
        },
      },
      canInitializeStripe: !!process.env.STRIPE_SECRET_KEY,
      canInitializeSupabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
      allConfigured:
        !!process.env.STRIPE_SECRET_KEY &&
        !!process.env.STRIPE_PRICE_ID &&
        !!process.env.SUPABASE_URL &&
        !!process.env.SUPABASE_SERVICE_KEY,
    };

    // Try to initialize Stripe to check if it's valid
    let stripeStatus = 'NOT TESTED';
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        debug.configuration.stripe.initialized = true;
        debug.configuration.stripe.initError = null;
        stripeStatus = 'SUCCESS';
      } catch (error) {
        debug.configuration.stripe.initialized = false;
        debug.configuration.stripe.initError = error.message;
        stripeStatus = 'FAILED: ' + error.message;
      }
    }

    debug.stripeInitialization = stripeStatus;

    return res.status(200).json(debug);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message,
    });
  }
};

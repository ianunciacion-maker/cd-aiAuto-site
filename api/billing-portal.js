/**
 * Stripe Billing Portal Redirect Endpoint
 * Creates a session for users to manage their subscription
 *
 * POST /api/billing-portal
 * Body: { user_id: string }
 */

const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables FIRST
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error: Missing Stripe configuration' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase configuration' });
  }

  // Initialize Stripe and Supabase AFTER validating environment variables
  const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required field: user_id'
      });
    }

    // Get user's Stripe customer ID from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({
        error: 'Subscription not found for user'
      });
    }

    if (!subscription.stripe_customer_id) {
      return res.status(400).json({
        error: 'User does not have a Stripe customer record'
      });
    }

    // Create portal session
    const portalSession = await stripeInstance.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/user/dashboard.html`
    });

    return res.status(200).json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Billing portal error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to create billing portal session'
    });
  }
};

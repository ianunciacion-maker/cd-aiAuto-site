/**
 * Stripe Checkout Session API Endpoint
 * Creates a Stripe Checkout session for subscription purchase
 *
 * POST /api/checkout
 * Body: { user_id: string, email: string, priceId: string }
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
    const { user_id, email, priceId } = req.body;

    // Validate required fields
    if (!user_id || !email || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, email, priceId'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user_id)
      .neq('status', 'canceled')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = "no rows found" which is expected
      console.error('Error checking subscription:', subError);
    }

    if (existingSubscription && existingSubscription.status !== 'inactive') {
      return res.status(400).json({
        error: 'User already has an active subscription'
      });
    }

    // Create or retrieve Stripe customer
    let customerId;

    // First check if user already has a customer ID in database
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripeInstance.customers.create({
        email: email,
        metadata: {
          supabase_user_id: user_id
        }
      });
      customerId = customer.id;

      // Store customer ID in database (create or update subscription record)
      const { error: updateError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user_id,
          stripe_customer_id: customerId,
          status: 'inactive'
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Error storing customer ID:', updateError);
        return res.status(500).json({
          error: 'Failed to process subscription'
        });
      }
    }

    // Create checkout session
    // Build the base URL - Vercel provides VERCEL_URL without https://
    // Build the base URL - Vercel provides VERCEL_URL without https://
    let baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      client_reference_id: user_id,
      success_url: `${baseUrl}/user/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/user/signup.html`,
      mode: 'subscription',
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Automatically create a subscription after successful payment
      subscription_data: {
        metadata: {
          supabase_user_id: user_id
        }
      }
    });

    // Return session ID to client
    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to create checkout session'
    });
  }
};

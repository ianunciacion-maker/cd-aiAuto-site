/**
 * Check Subscription Status API Endpoint
 * Checks a user's subscription status from both database and Stripe
 *
 * POST /api/check-subscription
 * Body: { user_id: string }
 */

const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Initialize Stripe and Supabase
  const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // First check database
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status, current_period_end')
      .eq('user_id', user_id)
      .single();

    // If we have a recent active subscription in DB, return it
    if (!dbError && subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      // Check if subscription is still valid (not expired)
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      
      if (endDate > now) {
        console.log(`Found valid subscription in database for user: ${user_id}, status: ${subscription.status}`);
        return res.status(200).json({
          data: {
            user_id: user_id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            source: 'database'
          }
        });
      } else {
        console.log(`Subscription expired for user: ${user_id}, end date: ${subscription.current_period_end}`);
      }
    }

    // If no valid subscription in DB or it's expired, check Stripe directly
    if (subscription?.stripe_customer_id) {
      try {
        const subscriptions = await stripeInstance.subscriptions.list({
          customer: subscription.stripe_customer_id,
          limit: 10,
          status: 'all'
        });

        // Find active or trialing subscription
        const activeSubscription = subscriptions.data.find(
          sub => sub.status === 'active' || sub.status === 'trialing'
        );

        if (activeSubscription) {
          console.log(`Found active subscription in Stripe for user: ${user_id}, status: ${activeSubscription.status}`);
          
          // Update database with latest info
          const { error: updateError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user_id,
              stripe_customer_id: activeSubscription.customer,
              stripe_subscription_id: activeSubscription.id,
              stripe_price_id: activeSubscription.items.data[0]?.price.id,
              status: activeSubscription.status,
              current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: activeSubscription.cancel_at_period_end
            }, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('Error updating subscription in database:', updateError);
            // Still return the Stripe data since it's more current
          } else {
            console.log(`Updated database with latest Stripe data for user: ${user_id}`);
          }

          return res.status(200).json({
            data: {
              user_id: user_id,
              stripe_subscription_id: activeSubscription.id,
              stripe_customer_id: activeSubscription.customer,
              status: activeSubscription.status,
              current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
              source: 'stripe'
            }
          });
        } else {
          console.log(`No active subscription found in Stripe for user: ${user_id}`);
        }
      } catch (stripeError) {
        console.error('Error checking Stripe:', stripeError);
      }
    }

    // No active subscription found
    return res.status(200).json({
      data: {
        user_id: user_id,
        status: 'inactive',
        current_period_end: null,
        source: 'none'
      }
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return res.status(500).json({ error: 'Failed to check subscription status' });
  }
};
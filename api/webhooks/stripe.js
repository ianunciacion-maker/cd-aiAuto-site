/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscription status in Supabase
 *
 * POST /api/webhooks/stripe
 * Headers: stripe-signature (Stripe webhook signature)
 */

const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Supported webhook events
const SUPPORTED_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
];

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables FIRST
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe environment variables');
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

  const signature = req.headers['stripe-signature'];

  try {
    // Get the raw body for webhook verification
    // Vercel may provide body as string or buffer, stripe.webhooks.constructEvent expects raw bytes
    let rawBody = req.body;

    // If body is an object (already parsed), convert back to string
    if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
      rawBody = JSON.stringify(rawBody);
    }

    // Verify webhook signature
    const event = stripeInstance.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log all webhook events
    console.log(`Processing webhook event: ${event.type}`);

    // Log event to database for debugging
    const { error: logError } = await supabase
      .from('webhook_events')
      .insert({
        event_type: event.type,
        stripe_event_id: event.id,
        payload: event.data
      });

    if (logError) {
      console.error('Error logging webhook event:', logError);
    }

    // Handle only supported events
    if (!SUPPORTED_EVENTS.includes(event.type)) {
      console.log(`Ignoring unsupported event type: ${event.type}`);
      return res.status(200).json({ received: true });
    }

    // Process the event
    let processed = false;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        processed = await handleSubscriptionChange(event);
        break;

      case 'customer.subscription.deleted':
        processed = await handleSubscriptionCanceled(event);
        break;

      case 'invoice.payment_succeeded':
        processed = await handlePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        processed = await handlePaymentFailed(event);
        break;
    }

    // Update webhook event status
    if (processed) {
      const { error: updateError } = await supabase
        .from('webhook_events')
        .update({ processed: true })
        .eq('stripe_event_id', event.id);

      if (updateError) {
        console.error('Error updating webhook event status:', updateError);
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error.message);

    // Log error to webhook events table
    if (error.message.includes('Timestamp outside the tolerance window')) {
      return res.status(400).json({ error: 'Webhook timestamp verification failed' });
    }

    if (error.message.includes('No matching signing secret')) {
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    return res.status(400).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionChange(event) {
  try {
    const subscription = event.data.object;
    const userId = subscription.metadata?.supabase_user_id;
    const customerId = subscription.customer;

    if (!userId) {
      console.warn('Subscription missing user metadata:', subscription.id);
      return false;
    }

    const subscriptionStatus = mapStripeStatus(subscription.status);

    // Update subscription record
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        status: subscriptionStatus,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
      return false;
    }

    console.log(`Subscription updated for user: ${userId}, status: ${subscriptionStatus}`);

    // Initialize tool usage if subscription is now active
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      await supabase.rpc('initialize_tool_usage', { p_user_id: userId });
    }

    return true;

  } catch (error) {
    console.error('Error handling subscription change:', error);
    return false;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(event) {
  try {
    const subscription = event.data.object;
    const userId = subscription.metadata?.supabase_user_id;

    if (!userId) {
      console.warn('Subscription missing user metadata:', subscription.id);
      return false;
    }

    // Update subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }

    console.log(`Subscription canceled for user: ${userId}`);
    return true;

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    return false;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event) {
  try {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    // Get subscription to update if needed
    const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.supabase_user_id;

    if (!userId) {
      console.warn('Invoice missing user metadata');
      return false;
    }

    console.log(`Payment succeeded for user: ${userId}`);
    return true;

  } catch (error) {
    console.error('Error handling payment success:', error);
    return false;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event) {
  try {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    // Get subscription to update
    const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.supabase_user_id;

    if (!userId) {
      console.warn('Invoice missing user metadata');
      return false;
    }

    // Update subscription status to past_due
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due'
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription to past_due:', error);
      return false;
    }

    console.log(`Payment failed for user: ${userId}, marked as past_due`);
    return true;

  } catch (error) {
    console.error('Error handling payment failure:', error);
    return false;
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'paused': 'paused',
    'canceled': 'canceled'
  };

  return statusMap[stripeStatus] || 'inactive';
}

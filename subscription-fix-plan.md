# Subscription Login Redirect Fix Implementation Plan

## Problem
Existing subscribers are being redirected to checkout page instead of dashboard when logging in.

## Root Cause
The `getSubscriptionStatusFromStripe()` method in supabase.js is trying to use `require('stripe')` on the client-side (line 639), which doesn't work in browser environments. This causes the function to fail and defaults to redirecting to checkout.

## Solution

### 1. Create New API Endpoint: `/api/check-subscription.js`

This endpoint will:
- Accept a POST request with user_id
- First check the database for subscription status (quick check)
- If needed, query Stripe directly for the most up-to-date status
- Return the subscription status with source information

```javascript
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
      // Check if the subscription is still valid (not expired)
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      
      if (endDate > now) {
        return res.status(200).json({
          data: {
            user_id: user_id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            source: 'database'
          }
        });
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
          // Update database with latest info
          await supabase
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
```

### 2. Update Login Flow in `user/login.html`

Replace the current subscription check (lines 375-387) with a call to the new API endpoint:

```javascript
// Check subscription status from API
const response = await fetch(`${window.location.origin}/api/check-subscription`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: data.user.id
  })
});

const result = await response.json();

if (result.error) {
  console.error('Error checking subscription:', result.error);
  // Default to checkout on error
  window.location.href = './checkout.html';
  return;
}

// Only redirect to dashboard if user has an ACTIVE subscription
if (result.data && (result.data.status === 'active' || result.data.status === 'trialing')) {
  // User has active subscription - redirect to dashboard
  console.log('User has active subscription, redirecting to dashboard');
  window.location.href = './dashboard.html';
} else {
  // No active subscription - redirect to checkout
  console.log('User has no active subscription, redirecting to checkout');
  window.location.href = './checkout.html';
}
```

### 3. Remove/Update Client-Side Stripe Check

Remove or update the `getSubscriptionStatusFromStripe()` method in `supabase.js` since it's not needed anymore (or keep it as a fallback with clear documentation that it's server-side only).

### 4. Update Webhook Handler

Ensure the webhook handler in `api/webhooks/stripe.js` properly updates the database when Stripe events occur. The current implementation looks correct, but we should add more logging for debugging.

### 5. Add Error Handling

Add proper error handling for edge cases:
- Network failures when calling the API
- Invalid user IDs
- Stripe API errors
- Database connection issues

## Testing Plan

1. Test with an existing active subscriber
2. Test with a user who has expired subscription
3. Test with a new user who has never subscribed
4. Test with a user whose subscription is in trial period
5. Test network error scenarios

## Benefits of This Approach

1. Moves Stripe operations to server-side where they belong
2. Provides reliable subscription status checking
3. Maintains database synchronization
4. Includes proper error handling
5. Adds logging for debugging
6. Preserves the existing user experience
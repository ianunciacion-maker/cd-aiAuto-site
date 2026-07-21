-- ============================================
-- PHASE 1: DATABASE SCHEMA SETUP
-- ============================================
-- Execute this entire script in Supabase SQL Editor
-- Copy all content and paste into https://app.supabase.com/project/[YOUR_PROJECT]/sql/new
-- ============================================

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (
    status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing', 'incomplete')
  ),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================
-- 3. TOOL USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (
    tool_type IN ('blog_generator', 'social_captions', 'email_campaigns', 'product_descriptions')
  ),
  generation_count INTEGER DEFAULT 0 NOT NULL,
  monthly_limit INTEGER DEFAULT 100 NOT NULL,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tool_type)
);

-- Enable RLS
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can view own usage
CREATE POLICY "Users can view own usage"
  ON tool_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_reset_date ON tool_usage(reset_date);

-- ============================================
-- 4. WEBHOOK EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- ============================================
-- 5. AUTO-UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (to avoid duplicate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. TRIGGERS: Update timestamps
-- ============================================
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tool_usage_updated_at ON tool_usage;
CREATE TRIGGER update_tool_usage_updated_at
  BEFORE UPDATE ON tool_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. FUNCTION: Initialize tool usage for new users
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_tool_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tool_usage (user_id, tool_type, generation_count, monthly_limit)
  VALUES
    (p_user_id, 'blog_generator', 0, 100),
    (p_user_id, 'social_captions', 0, 100),
    (p_user_id, 'email_campaigns', 0, 100),
    (p_user_id, 'product_descriptions', 0, 100)
  ON CONFLICT (user_id, tool_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNCTION: Check if user can use a tool
-- ============================================
CREATE OR REPLACE FUNCTION public.can_use_tool(
  p_user_id UUID,
  p_tool_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_active BOOLEAN;
  v_usage_available BOOLEAN;
BEGIN
  -- Check if subscription is active
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
  ) INTO v_subscription_active;

  IF NOT v_subscription_active THEN
    RETURN FALSE;
  END IF;

  -- Check if usage is available
  SELECT (generation_count < monthly_limit) INTO v_usage_available
  FROM tool_usage
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  RETURN COALESCE(v_usage_available, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. FUNCTION: Increment tool usage
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_tool_usage(
  p_user_id UUID,
  p_tool_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_use BOOLEAN;
BEGIN
  -- Check if user can use tool
  SELECT can_use_tool(p_user_id, p_tool_type) INTO v_can_use;

  IF NOT v_can_use THEN
    RETURN FALSE;
  END IF;

  -- Reset if period expired
  UPDATE tool_usage
  SET generation_count = 0,
      reset_date = date_trunc('month', NOW()) + INTERVAL '1 month'
  WHERE user_id = p_user_id
    AND tool_type = p_tool_type
    AND reset_date <= NOW();

  -- Increment usage
  UPDATE tool_usage
  SET generation_count = generation_count + 1,
      last_used_at = NOW()
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. ADMIN RLS POLICIES
-- ============================================
-- Note: Replace 'setyourownsalary@gmail.com' with your admin email

-- Admin can view all user profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can update subscriptions
CREATE POLICY "Admins can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can view all tool usage
CREATE POLICY "Admins can view all usage"
  ON tool_usage FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can update tool usage
CREATE POLICY "Admins can update usage"
  ON tool_usage FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- 12. VERIFICATION QUERIES
-- ============================================
-- Run these after executing the above to verify everything is set up:

-- Check tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check user_profiles table
-- SELECT * FROM user_profiles LIMIT 1;

-- Check subscriptions table
-- SELECT * FROM subscriptions LIMIT 1;

-- Check tool_usage table
-- SELECT * FROM tool_usage LIMIT 1;

-- Check webhook_events table
-- SELECT * FROM webhook_events LIMIT 1;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Database schema is ready for Phase 2 (Stripe Configuration)
-- Next steps:
-- 1. Go to Stripe Dashboard (https://dashboard.stripe.com)
-- 2. Create Product: "AI Content Creation Suite"
-- 3. Create Price: $49 USD, recurring monthly
-- 4. Get API keys and webhook secret
-- 5. Create /api/.env file with configuration

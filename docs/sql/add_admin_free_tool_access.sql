-- ================================================================
-- ADMIN-GRANTED FREE ACCESS TO THE 4 AI TOOLS
-- Run in Supabase SQL editor. Safe to run multiple times (IF NOT EXISTS).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Extend user_profiles with free-access columns
-- ----------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS has_free_tools_access BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS free_access_granted_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS free_access_granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS free_access_note TEXT;

COMMENT ON COLUMN public.user_profiles.has_free_tools_access
  IS 'When TRUE, user can access the 4 AI tools without an active Stripe subscription. Granted by an admin.';


-- ----------------------------------------------------------------
-- 2. tool_access_invites — pending invites for users not signed up yet
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tool_access_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  CONSTRAINT tool_access_invites_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS tool_access_invites_email_idx
  ON public.tool_access_invites (lower(email));

CREATE INDEX IF NOT EXISTS tool_access_invites_redeemed_idx
  ON public.tool_access_invites (redeemed_at);

COMMENT ON TABLE public.tool_access_invites
  IS 'Pending email invites to grant free tool access. When a matching user signs up, a trigger flips their profile flag and marks the invite redeemed.';


-- ----------------------------------------------------------------
-- 3. can_use_tool() — teach the gate to honor has_free_tools_access
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_use_tool(
  p_user_id UUID,
  p_tool_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_active BOOLEAN;
  v_has_free_access BOOLEAN;
  v_usage_available BOOLEAN;
BEGIN
  -- Subscription path (existing)
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
  ) INTO v_subscription_active;

  -- Free access path (new)
  SELECT COALESCE(has_free_tools_access, FALSE)
    INTO v_has_free_access
    FROM user_profiles
   WHERE id = p_user_id;

  IF NOT v_subscription_active AND NOT v_has_free_access THEN
    RETURN FALSE;
  END IF;

  -- Usage quota still applies to free-access users
  SELECT (generation_count < monthly_limit) INTO v_usage_available
    FROM tool_usage
   WHERE user_id = p_user_id AND tool_type = p_tool_type;

  RETURN COALESCE(v_usage_available, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------
-- 4. Trigger: when a new user profile is created, auto-redeem any
--    pending invite for their email.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_tool_access_invite_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_id UUID;
  v_invited_by UUID;
  v_note TEXT;
BEGIN
  -- Look up an unredeemed invite for this email (case-insensitive).
  SELECT id, invited_by, note
    INTO v_invite_id, v_invited_by, v_note
    FROM public.tool_access_invites
   WHERE lower(email) = lower(NEW.email)
     AND redeemed_at IS NULL
   LIMIT 1;

  IF v_invite_id IS NOT NULL THEN
    NEW.has_free_tools_access := TRUE;
    NEW.free_access_granted_at := NOW();
    NEW.free_access_granted_by := v_invited_by;
    NEW.free_access_note := v_note;

    UPDATE public.tool_access_invites
       SET redeemed_at = NOW(),
           redeemed_by = NEW.id
     WHERE id = v_invite_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS redeem_tool_access_invite_on_signup_trg ON public.user_profiles;
CREATE TRIGGER redeem_tool_access_invite_on_signup_trg
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.redeem_tool_access_invite_on_signup();


-- ----------------------------------------------------------------
-- 5. Ensure tool_usage row exists for free-access users too.
--    initialize_tool_usage() is already idempotent; call it when a
--    profile gains free access so their usage counters exist.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_tool_usage_on_free_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.has_free_tools_access IS TRUE
     AND (OLD.has_free_tools_access IS DISTINCT FROM TRUE) THEN
    PERFORM public.initialize_tool_usage(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_tool_usage_on_free_access_trg ON public.user_profiles;
CREATE TRIGGER ensure_tool_usage_on_free_access_trg
  AFTER UPDATE OF has_free_tools_access ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tool_usage_on_free_access();

-- Also initialize tool_usage immediately after a profile is inserted with
-- free access already on (e.g., via invite redemption).
CREATE OR REPLACE FUNCTION public.ensure_tool_usage_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.has_free_tools_access IS TRUE THEN
    PERFORM public.initialize_tool_usage(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_tool_usage_on_profile_insert_trg ON public.user_profiles;
CREATE TRIGGER ensure_tool_usage_on_profile_insert_trg
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tool_usage_on_profile_insert();


-- ----------------------------------------------------------------
-- 6. RLS on tool_access_invites — admins only
-- ----------------------------------------------------------------
ALTER TABLE public.tool_access_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage tool_access_invites" ON public.tool_access_invites;
CREATE POLICY "Admins manage tool_access_invites"
  ON public.tool_access_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow service_role (used by server-side admin functions) full access.
-- (service_role bypasses RLS by default; this is defensive.)


-- ----------------------------------------------------------------
-- 7. RLS updates for user_profiles — admins can UPDATE free-access columns
-- ----------------------------------------------------------------
-- Existing policies allow admins to view; make sure they can update too.
DROP POLICY IF EXISTS "Admins can update profiles free access" ON public.user_profiles;
CREATE POLICY "Admins can update profiles free access"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

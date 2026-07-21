-- ============================================
-- RESET TOOL USAGE ON PAYMENT SUCCESS
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- This function resets all tool usage when a billing cycle renews
-- ============================================

CREATE OR REPLACE FUNCTION public.reset_all_tool_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tool_usage
  SET generation_count = 0,
      reset_date = NOW() + INTERVAL '1 month',
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the reset for debugging
  RAISE NOTICE 'Tool usage reset for user: %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for RPC calls)
GRANT EXECUTE ON FUNCTION public.reset_all_tool_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_all_tool_usage(UUID) TO service_role;

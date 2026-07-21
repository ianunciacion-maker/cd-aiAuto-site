-- ============================================
-- WAITLIST RLS POLICY FIX
-- ============================================
-- Run this in Supabase SQL Editor to fix the admin access
-- The original policy used a subquery that Supabase RLS doesn't handle well
-- This script drops the old policies and creates new ones using is_admin column
-- ============================================

-- Drop the existing policies if they exist
DROP POLICY IF EXISTS "Admins can view waitlist" ON waitlist;
DROP POLICY IF EXISTS "Admins can delete waitlist" ON waitlist;

-- Create new policy using is_admin from user_profiles
-- This matches the pattern used for other admin tables in the project
CREATE POLICY "Admins can view waitlist"
  ON waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete waitlist"
  ON waitlist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ============================================
-- VERIFY YOUR ADMIN STATUS
-- ============================================
-- Run this to check if your account has is_admin = true:
-- SELECT id, email, is_admin FROM user_profiles WHERE email = 'setyourownsalary@gmail.com';

-- If is_admin is NULL or false, run this to fix it:
-- UPDATE user_profiles SET is_admin = true WHERE email = 'setyourownsalary@gmail.com';

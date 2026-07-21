-- ============================================
-- DIAGNOSTIC QUERIES (Run these first to check)
-- ============================================

-- 1. Check if admin user exists
SELECT id, email, confirmed_at, created_at
FROM auth.users
WHERE email = 'setyourownsalary@gmail.com';

-- 2. Check RLS policies on all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test if current user can read user_profiles (run while logged in as admin)
SELECT * FROM user_profiles LIMIT 1;

-- 4. Test if current user can read blog_posts (run while logged in as admin)
SELECT * FROM blog_posts LIMIT 1;

-- ============================================
-- IF ABOVE SHOWS PERMISSION ERRORS, RUN BELOW
-- FIX ADMIN RLS POLICIES
-- ============================================
-- This script drops and recreates admin policies with better logic
-- Run in Supabase SQL Editor

-- ============================================
-- USER_PROFILES TABLE
-- ============================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Recreate with proper admin check
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;

-- Recreate
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- TOOL_USAGE TABLE
-- ============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all usage" ON tool_usage;
DROP POLICY IF EXISTS "Admins can update usage" ON tool_usage;

-- Recreate
CREATE POLICY "Admins can view all usage"
  ON tool_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

CREATE POLICY "Admins can update usage"
  ON tool_usage FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- BLOG_POSTS TABLE
-- ============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON blog_posts;

-- Recreate with EXISTS pattern
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- After running above, verify all policies exist:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'subscriptions', 'tool_usage', 'blog_posts')
ORDER BY tablename, policyname;

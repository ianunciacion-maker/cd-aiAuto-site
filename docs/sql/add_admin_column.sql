-- ============================================
-- ADD is_admin COLUMN TO user_profiles
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- Go to: https://evzitnywfgbxzymddvyl.supabase.co → SQL Editor → New Query

-- ============================================
-- STEP 1: ADD is_admin COLUMN
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================
-- STEP 2: SET YOUR ACCOUNT AS ADMIN
-- ============================================
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'setyourownsalary@gmail.com';

-- ============================================
-- STEP 3: UPDATE ai_resources RLS POLICIES
-- ============================================
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can create ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can update ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can delete ai_resources" ON ai_resources;

-- Recreate policies using is_admin column
CREATE POLICY "Admins can view all ai_resources"
  ON ai_resources FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  );

CREATE POLICY "Admins can create ai_resources"
  ON ai_resources FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  );

CREATE POLICY "Admins can update ai_resources"
  ON ai_resources FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

CREATE POLICY "Admins can delete ai_resources"
  ON ai_resources FOR DELETE
  USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

-- ============================================
-- STEP 4: UPDATE blog_posts RLS POLICIES (if they exist)
-- ============================================
-- Drop existing admin policies for blog_posts
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON blog_posts;

-- Recreate blog_posts policies using is_admin column
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    status = 'published' OR 
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  );

CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  );

CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

-- ============================================
-- STEP 5: UPDATE user_profiles RLS POLICIES
-- ============================================
-- Ensure admins can view all user profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id OR 
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup worked:

-- Check if is_admin column exists and your account is admin
SELECT id, email, is_admin, created_at FROM user_profiles WHERE email = 'setyourownsalary@gmail.com';

-- Count admins
SELECT COUNT(*) as admin_count FROM user_profiles WHERE is_admin = true;

-- List all policies on ai_resources
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'ai_resources';

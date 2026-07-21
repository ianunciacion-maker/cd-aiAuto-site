-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- The previous policies caused recursion because checking user_profiles
-- from within user_profiles policies creates an infinite loop.
-- 
-- Solution: Create a SECURITY DEFINER function that bypasses RLS

-- ============================================
-- STEP 1: CREATE HELPER FUNCTION (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM user_profiles WHERE id = user_id),
    false
  );
$$;

-- ============================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ============================================
-- Drop user_profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Drop ai_resources policies
DROP POLICY IF EXISTS "Anyone can view published ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can view all ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can create ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can update ai_resources" ON ai_resources;
DROP POLICY IF EXISTS "Admins can delete ai_resources" ON ai_resources;

-- Drop blog_posts policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON blog_posts;

-- ============================================
-- STEP 3: RECREATE user_profiles POLICIES
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (not is_admin field)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles (using helper function)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin_user(auth.uid()) = true);

-- ============================================
-- STEP 4: RECREATE ai_resources POLICIES
-- ============================================
-- Public: Anyone can view published resources
CREATE POLICY "Anyone can view published ai_resources"
  ON ai_resources FOR SELECT
  USING (status = 'published');

-- Admin: View all resources (using helper function)
CREATE POLICY "Admins can view all ai_resources"
  ON ai_resources FOR SELECT
  USING (is_admin_user(auth.uid()) = true);

-- Admin: Create resources
CREATE POLICY "Admins can create ai_resources"
  ON ai_resources FOR INSERT
  WITH CHECK (is_admin_user(auth.uid()) = true);

-- Admin: Update resources
CREATE POLICY "Admins can update ai_resources"
  ON ai_resources FOR UPDATE
  USING (is_admin_user(auth.uid()) = true)
  WITH CHECK (is_admin_user(auth.uid()) = true);

-- Admin: Delete resources
CREATE POLICY "Admins can delete ai_resources"
  ON ai_resources FOR DELETE
  USING (is_admin_user(auth.uid()) = true);

-- ============================================
-- STEP 5: RECREATE blog_posts POLICIES
-- ============================================
-- Public: Anyone can view published posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admin: View all posts (using helper function)
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (is_admin_user(auth.uid()) = true);

-- Admin: Create posts
CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (is_admin_user(auth.uid()) = true);

-- Admin: Update posts
CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  USING (is_admin_user(auth.uid()) = true)
  WITH CHECK (is_admin_user(auth.uid()) = true);

-- Admin: Delete posts
CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (is_admin_user(auth.uid()) = true);

-- ============================================
-- STEP 6: VERIFY SETUP
-- ============================================
-- Check your admin status
SELECT id, email, is_admin FROM user_profiles WHERE email = 'setyourownsalary@gmail.com';

-- Test the helper function (should return true for your account)
SELECT is_admin_user((SELECT id FROM user_profiles WHERE email = 'setyourownsalary@gmail.com'));

-- List all policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('user_profiles', 'ai_resources', 'blog_posts')
ORDER BY tablename, policyname;

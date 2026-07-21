-- ============================================
-- BLOG POSTS RLS POLICIES
-- ============================================
-- This file adds Row Level Security to blog_posts table
-- Run this in Supabase SQL Editor

-- Enable RLS on blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC ACCESS POLICIES
-- ============================================

-- Allow anyone to read published posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- ============================================
-- ADMIN POLICIES
-- ============================================

-- Admin can view all posts (including drafts)
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can create posts
CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can update posts
CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admin can delete posts
CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify RLS is working:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'blog_posts' AND schemaname = 'public';
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'blog_posts';

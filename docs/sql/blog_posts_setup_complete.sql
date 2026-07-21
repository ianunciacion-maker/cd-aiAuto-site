-- ============================================
-- COMPLETE BLOG POSTS SETUP
-- ============================================
-- This file creates the blog_posts table AND adds Row Level Security
-- Run this entire script in Supabase SQL Editor
-- Go to: https://evzitnywfgbxzymddvyl.supabase.co → SQL Editor → New Query
-- Copy and paste entire contents, then click RUN

-- ============================================
-- STEP 1: CREATE BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'html',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- ============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================

-- PUBLIC: Anyone can view published posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- ADMIN: Can view all posts (including drafts)
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ADMIN: Can create posts
CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ADMIN: Can update posts
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

-- ADMIN: Can delete posts
CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- STEP 4: VERIFICATION QUERIES (run these to verify)
-- ============================================
-- Check that table was created
-- SELECT tablename FROM pg_tables WHERE tablename = 'blog_posts' AND schemaname = 'public';

-- Check that RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'blog_posts' AND schemaname = 'public';

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'blog_posts';

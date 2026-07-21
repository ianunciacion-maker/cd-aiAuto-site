-- ============================================
-- BLOG IMAGES STORAGE BUCKET SETUP
-- ============================================
-- This file sets up the storage bucket for blog images
-- Run this in Supabase SQL Editor
-- Go to: https://evzitnywfgbxzymddvyl.supabase.co → SQL Editor → New Query

-- ============================================
-- STEP 1: CREATE STORAGE BUCKET
-- ============================================
-- Note: This must be done in Supabase Dashboard UI, not SQL
-- 1. Go to Storage section
-- 2. Click "New bucket"
-- 3. Name it: blog-images
-- 4. UNCHECK "Private bucket" (make it public)
-- 5. Click Create

-- ============================================
-- STEP 2: ENABLE RLS ON STORAGE OBJECTS
-- ============================================
-- This only works if bucket already exists via UI
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: ALLOW PUBLIC TO VIEW IMAGES
-- ============================================
CREATE POLICY "Public can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

-- ============================================
-- STEP 4: ALLOW ADMIN TO UPLOAD IMAGES
-- ============================================
CREATE POLICY "Admin can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND (auth.jwt()->>'email') = 'setyourownsalary@gmail.com'
  );

-- ============================================
-- STEP 5: ALLOW ADMIN TO DELETE IMAGES
-- ============================================
CREATE POLICY "Admin can delete blog images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blog-images'
    AND (auth.jwt()->>'email') = 'setyourownsalary@gmail.com'
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify setup:
-- List all storage policies
-- SELECT policyname, cmd, definition FROM pg_policies WHERE schemaname = 'storage';

-- Check bucket exists
-- SELECT id, name, public FROM storage.buckets WHERE name = 'blog-images';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- WAITLIST TABLE SETUP
-- ============================================
-- Execute this script in Supabase SQL Editor
-- https://app.supabase.com/project/[YOUR_PROJECT]/sql/new
-- ============================================

-- 1. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'marketing_engine',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anonymous inserts (public form submissions)
CREATE POLICY "Anyone can insert waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist"
  ON waitlist FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- 5. Policy: Only admins can delete waitlist entries
CREATE POLICY "Admins can delete waitlist"
  ON waitlist FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after executing the above to verify setup:

-- Check table exists
-- SELECT * FROM waitlist LIMIT 1;

-- Check RLS policies
-- SELECT policyname FROM pg_policies WHERE tablename = 'waitlist';

-- ============================================
-- SETUP COMPLETE
-- ============================================

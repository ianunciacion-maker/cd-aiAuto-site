-- ============================================
-- BLOG GENERATION HISTORY TABLE SETUP
-- ============================================
-- This migration adds history tracking for the blog generator tool
-- Execute in Supabase SQL Editor: https://app.supabase.com/project/evzitnywfgbxzymddvyl/sql/new
-- ============================================

-- 1. Create blog_generation_history table
CREATE TABLE IF NOT EXISTS blog_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Original input parameters
  topic TEXT NOT NULL,
  length TEXT NOT NULL CHECK (length IN ('short', 'medium', 'long')),
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'friendly', 'expert')),
  keywords TEXT,

  -- Generated output
  generated_title TEXT,
  generated_content TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_gen_history_user_id ON blog_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_gen_history_created_at ON blog_generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_gen_history_user_created ON blog_generation_history(user_id, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE blog_generation_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Users can only access their own history
CREATE POLICY "Users can view own generation history"
  ON blog_generation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation history"
  ON blog_generation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generation history"
  ON blog_generation_history FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Admin policies: Admins can view all history
CREATE POLICY "Admins can view all generation history"
  ON blog_generation_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- 6. Verification queries (comment out after setup)
-- SELECT * FROM blog_generation_history LIMIT 5;
-- SELECT COUNT(*) FROM blog_generation_history;

-- ============================================
-- SETUP COMPLETE
-- Next steps:
-- 1. Copy this SQL and run it in Supabase SQL Editor
-- 2. Verify table creation: SELECT * FROM blog_generation_history LIMIT 1;
-- 3. Check RLS policies in Supabase Dashboard -> Authentication -> Policies
-- ============================================

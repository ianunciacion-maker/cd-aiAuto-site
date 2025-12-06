-- ============================================
-- Social Captions History Table Setup
-- ============================================

-- Create social_captions_history table
CREATE TABLE IF NOT EXISTS social_captions_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  tone TEXT NOT NULL,
  hashtags TEXT,
  length TEXT NOT NULL,
  image_url TEXT,
  generated_captions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_social_captions_user_created_at ON social_captions_history(user_id, created_at);

-- Create index for topic search
CREATE INDEX IF NOT EXISTS idx_social_captions_topic ON social_captions_history USING gin(to_tsvector('topic'));

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_social_captions_user_id ON social_captions_history(user_id);

-- RLS (Row Level Security) Policies
-- Enable RLS for users to only access their own history
ALTER TABLE social_captions_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY social_captions_history_select_own ON social_captions_history
  FOR SELECT
  USING (authentication.uid() = user_id)
  WITH CHECK (true)
  -- Policy allows users to read their own social captions history
  -- Only returns rows where the user ID matches the current user ID
  -- The WITH CHECK (true) clause ensures the policy is applied correctly
;

-- Create RLS policy for inserts
CREATE POLICY social_captions_history_insert_own ON social_captions_history
  FOR INSERT
  WITH CHECK (authentication.uid() = user_id)
  -- Policy allows users to insert their own social captions history
  -- Ensures users can only add history entries for themselves
;

-- Create RLS policy for updates
CREATE POLICY social_captions_history_update_own ON social_captions_history
  FOR UPDATE
  USING (authentication.uid() = user_id)
  -- Policy allows users to update their own social captions history
  -- Ensures users can only modify history entries for themselves
;

-- Create RLS policy for deletes
CREATE POLICY social_captions_history_delete_own ON social_captions_history
  FOR DELETE
  USING (authentication.uid() = user_id)
  -- Policy allows users to delete their own social captions history
  -- Ensures users can only remove history entries for themselves
;

-- Grant permissions to authenticated users
GRANT ALL ON social_captions_history TO authenticated;

-- Comments for documentation
COMMENT ON TABLE social_captions_history IS 'Stores social media caption generation history with user ownership and RLS policies';
COMMENT ON COLUMN social_captions_history.id IS 'Primary key using UUID for unique identification';
COMMENT ON COLUMN social_captions_history.user_id IS 'Foreign key referencing auth.users table with cascade delete';
COMMENT ON COLUMN social_captions_history.topic IS 'The topic/content used for caption generation';
COMMENT ON COLUMN social_captions_history.platforms IS 'Array of social media platforms selected';
COMMENT ON COLUMN social_captions_history.tone IS 'The tone/style used for caption generation';
COMMENT ON COLUMN social_captions_history.hashtags IS 'Comma-separated hashtags used';
COMMENT ON COLUMN social_captions_history.length IS 'The caption length preference';
COMMENT ON COLUMN social_captions_history.image_url IS 'URL to uploaded image if any';
COMMENT ON COLUMN social_captions_history.generated_captions IS 'JSON object containing generated captions for each platform';
COMMENT ON COLUMN social_captions_history.created_at IS 'Timestamp when the captions were generated';
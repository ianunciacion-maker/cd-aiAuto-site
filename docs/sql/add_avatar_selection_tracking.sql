-- ============================================
-- Avatar Selection Tracking Table
-- ============================================
-- Creates a table to track user avatar selection history
-- This helps with analytics and user experience improvements

-- Create avatar_selection_history table
CREATE TABLE IF NOT EXISTS avatar_selection_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_emoji TEXT NOT NULL,
  avatar_name TEXT NOT NULL,
  category TEXT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_selection_history_user_id ON avatar_selection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_selection_history_selected_at ON avatar_selection_history(selected_at);

-- Add RLS policy for avatar selection history
CREATE POLICY "Users can view their own avatar selection history" ON avatar_selection_history
FOR SELECT USING (auth.uid() = id)
WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS
ALTER TABLE avatar_selection_history ENABLE ROW LEVEL SECURITY;
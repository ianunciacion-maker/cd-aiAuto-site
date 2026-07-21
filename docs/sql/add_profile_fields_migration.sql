-- Add Target Market and Business Industry fields to user_profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS target_market TEXT,
ADD COLUMN IF NOT EXISTS business_industry TEXT;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

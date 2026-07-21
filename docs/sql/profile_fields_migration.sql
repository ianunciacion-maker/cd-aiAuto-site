-- ============================================
-- Profile Fields Migration Script
-- Adds missing columns to user_profiles table
-- ============================================

-- Add missing profile fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS business_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- Add RLS policies for new columns
CREATE POLICY "Users can update own profile company info" ON user_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_name ON user_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_phone ON user_profiles(business_phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url ON user_profiles(avatar_url);
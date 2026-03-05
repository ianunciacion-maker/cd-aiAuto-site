-- Add name column to waitlist table
-- Run in Supabase SQL Editor

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS name TEXT;

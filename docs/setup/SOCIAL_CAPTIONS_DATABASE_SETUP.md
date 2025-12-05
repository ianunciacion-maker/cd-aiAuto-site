# Social Captions Database Setup Guide

## Overview
This guide explains how to create the `social_captions_history` table in your Supabase database to support the Social Captions Tool history functionality.

## Prerequisites
- Access to your Supabase project dashboard
- Admin permissions to create tables
- SQL execution permissions in Supabase

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** from the left sidebar

### Step 2: Execute SQL
1. Copy the SQL from `create_social_captions_history.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the table creation

### SQL to Execute:
```sql
CREATE TABLE social_captions_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  tone TEXT NOT NULL,
  hashtags TEXT,
  length TEXT NOT NULL,
  image_url TEXT,
  generated_captions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Method 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Create migration file
supabase migration new create_social_captions_history

# Add the SQL to the migration file
# Then push to remote
supabase db push
```

## Method 3: Direct API Execution

You can also execute the SQL via Supabase client libraries:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(YOUR_URL, YOUR_ANON_KEY);

const { error } = await supabase.rpc('exec_sql', {
  sql: `
    CREATE TABLE social_captions_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      platforms TEXT[] NOT NULL,
      tone TEXT NOT NULL,
      hashtags TEXT,
      length TEXT NOT NULL,
      image_url TEXT,
      generated_captions JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
});

if (error) {
  console.error('Table creation failed:', error);
} else {
  console.log('Table created successfully');
}
```

## Verification

After creating the table, verify it exists:

### 1. Check Table List
In Supabase Dashboard → Table Editor, you should see `social_captions_history`

### 2. Test Table Structure
Run this query to verify the table structure:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'social_captions_history' 
ORDER BY ordinal_position;
```

### 3. Test Insert
Run a test insert to verify everything works:
```sql
INSERT INTO social_captions_history (
  user_id, 
  topic, 
  platforms, 
  tone, 
  hashtags, 
  length, 
  generated_captions
) VALUES (
  'test-user-id',
  'Test Topic',
  ARRAY['instagram', 'facebook'],
  'casual',
  '#test #hashtags',
  'medium',
  '{"instagram": "Test Instagram caption", "facebook": "Test Facebook caption"}'
);
```

## Row Level Security (RLS)

For production, enable Row Level Security:

```sql
-- Enable RLS
ALTER TABLE social_captions_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view their own social captions history" ON social_captions_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social captions history" ON social_captions_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social captions history" ON social_captions_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social captions history" ON social_captions_history
  FOR DELETE USING (auth.uid() = user_id);
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure you have admin permissions
2. **Foreign Key Error**: Verify `user_profiles` table exists
3. **Array Type Error**: Some databases don't support `TEXT[]` - use `TEXT` with JSON array instead

### Alternative Schema (if arrays not supported):
```sql
CREATE TABLE social_captions_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platforms JSONB NOT NULL,  -- Changed from TEXT[] to JSONB
  tone TEXT NOT NULL,
  hashtags TEXT,
  length TEXT NOT NULL,
  image_url TEXT,
  generated_captions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Next Steps

1. Execute the table creation using your preferred method
2. Enable Row Level Security for production
3. Test the Social Captions Tool functionality
4. Verify history saving and retrieval works correctly

## Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify your SQL syntax
3. Ensure you're using the correct project
4. Contact support if needed

The table structure is designed to work seamlessly with the Social Captions History Manager in the application.
-- ============================================
-- AI RESOURCES TABLE SETUP
-- ============================================
-- This file creates the ai_resources table for managing
-- AI News and AI for Entrepreneurs articles
-- Run this entire script in Supabase SQL Editor
-- Go to: https://evzitnywfgbxzymddvyl.supabase.co → SQL Editor → New Query
-- Copy and paste entire contents, then click RUN

-- ============================================
-- STEP 1: CREATE AI RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('ai_news', 'ai_entrepreneurs')),
  headline TEXT NOT NULL,
  preview TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  image_alt TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_date DATE DEFAULT CURRENT_DATE,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_resources_category ON ai_resources(category);
CREATE INDEX IF NOT EXISTS idx_ai_resources_status ON ai_resources(status);
CREATE INDEX IF NOT EXISTS idx_ai_resources_sort_order ON ai_resources(sort_order);
CREATE INDEX IF NOT EXISTS idx_ai_resources_category_status ON ai_resources(category, status);

-- ============================================
-- STEP 2: CREATE UPDATED_AT TRIGGER
-- ============================================
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on row updates
DROP TRIGGER IF EXISTS ai_resources_updated_at_trigger ON ai_resources;
CREATE TRIGGER ai_resources_updated_at_trigger
  BEFORE UPDATE ON ai_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_resources_updated_at();

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE ai_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- PUBLIC: Anyone can view published resources
CREATE POLICY "Anyone can view published ai_resources"
  ON ai_resources FOR SELECT
  USING (status = 'published');

-- ADMIN: Can view all resources (including drafts)
CREATE POLICY "Admins can view all ai_resources"
  ON ai_resources FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ADMIN: Can create resources
CREATE POLICY "Admins can create ai_resources"
  ON ai_resources FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ADMIN: Can update resources
CREATE POLICY "Admins can update ai_resources"
  ON ai_resources FOR UPDATE
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

-- ADMIN: Can delete resources
CREATE POLICY "Admins can delete ai_resources"
  ON ai_resources FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- ============================================
-- STEP 5: INSERT SAMPLE DATA (Optional)
-- ============================================
-- Uncomment and run this section to add sample articles

/*
-- AI News Sample Articles
INSERT INTO ai_resources (category, headline, preview, image_url, image_alt, source_name, source_url, published_date, sort_order, status) VALUES
('ai_news', 'OpenAI Launches GPT-5 with Breakthrough Reasoning Capabilities', 'The latest iteration of GPT brings unprecedented reasoning and multimodal capabilities to the table.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=130&fit=crop', 'AI neural network visualization', 'TechCrunch', 'https://techcrunch.com', '2025-01-15', 1, 'published'),
('ai_news', 'Google DeepMind Achieves Major Breakthrough in Protein Folding', 'AlphaFold 3 can now predict protein interactions with 95% accuracy, revolutionizing drug discovery.', 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=200&h=130&fit=crop', 'Scientific research laboratory', 'Wired', 'https://wired.com', '2025-01-12', 2, 'published'),
('ai_news', 'Anthropic Introduces New Safety Measures for Claude AI', 'New constitutional AI techniques aim to make large language models more helpful and harmless.', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=130&fit=crop', 'AI robot concept', 'The Verge', 'https://theverge.com', '2025-01-10', 3, 'published'),
('ai_news', 'EU Passes Comprehensive AI Regulation Framework', 'New regulations require AI systems to meet strict transparency and safety requirements.', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=130&fit=crop', 'European Parliament building', 'Reuters', 'https://reuters.com', '2025-01-08', 4, 'published'),
('ai_news', 'Midjourney V7 Sets New Standard for AI Image Generation', 'Latest update brings photorealistic quality and improved understanding of complex prompts.', 'https://images.unsplash.com/photo-1547954575-855750c57bd3?w=200&h=130&fit=crop', 'Digital art creation', 'Ars Technica', 'https://arstechnica.com', '2025-01-05', 5, 'published');

-- AI for Entrepreneurs Sample Articles
INSERT INTO ai_resources (category, headline, preview, image_url, image_alt, source_name, source_url, published_date, sort_order, status) VALUES
('ai_entrepreneurs', 'How to Use AI to Automate 80% of Your Customer Support', 'Step-by-step guide to implementing AI chatbots that actually work for small businesses.', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=130&fit=crop', 'Customer support team', 'Entrepreneur', 'https://entrepreneur.com', '2025-01-14', 1, 'published'),
('ai_entrepreneurs', '10 AI Tools Every Solopreneur Should Be Using in 2025', 'From content creation to financial planning, these tools can run your business while you sleep.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=130&fit=crop', 'Business dashboard analytics', 'Forbes', 'https://forbes.com', '2025-01-11', 2, 'published'),
('ai_entrepreneurs', 'Building Your First AI-Powered SaaS: A Founder''s Guide', 'Real founders share their experiences building and scaling AI products from zero to revenue.', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=130&fit=crop', 'Team working on startup', 'Indie Hackers', 'https://indiehackers.com', '2025-01-09', 3, 'published'),
('ai_entrepreneurs', 'The Real Cost of AI: What Entrepreneurs Need to Know', 'Understanding API costs, compute requirements, and hidden expenses before you build.', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=130&fit=crop', 'Financial calculations', 'Harvard Business Review', 'https://hbr.org', '2025-01-06', 4, 'published'),
('ai_entrepreneurs', 'AI Marketing Strategies That Generated $1M in Revenue', 'Case studies from founders who used AI to scale their marketing without hiring a team.', 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=200&h=130&fit=crop', 'Marketing growth chart', 'Growth Hackers', 'https://growthhackers.com', '2025-01-03', 5, 'published');
*/

-- ============================================
-- STEP 6: VERIFICATION QUERIES (run these to verify)
-- ============================================
-- Check that table was created
-- SELECT tablename FROM pg_tables WHERE tablename = 'ai_resources' AND schemaname = 'public';

-- Check that RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'ai_resources' AND schemaname = 'public';

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'ai_resources';

-- Count articles by category
-- SELECT category, COUNT(*) FROM ai_resources GROUP BY category;

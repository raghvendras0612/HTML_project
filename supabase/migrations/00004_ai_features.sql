-- ============================================================================
-- CURIA MIGRATION 00004: AI Cache and Moderation Verdicts
-- ============================================================================

-- 1. AI Cache table for caching expensive Gemini generation results
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash text UNIQUE NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for instant content hash lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON public.ai_cache (content_hash);

-- Enable Row Level Security
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anonymous users to read cached AI summaries
DROP POLICY IF EXISTS "ai_cache_select_all" ON public.ai_cache;
CREATE POLICY "ai_cache_select_all" ON public.ai_cache
  FOR SELECT USING (true);

-- Allow service role and server routes to insert and manage cache
DROP POLICY IF EXISTS "ai_cache_insert_all" ON public.ai_cache;
CREATE POLICY "ai_cache_insert_all" ON public.ai_cache
  FOR INSERT WITH CHECK (true);

-- 2. Add moderation_verdict column to posts and comments
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS moderation_verdict text DEFAULT 'allow';

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS moderation_verdict text DEFAULT 'allow';

-- Index for moderation filtering
CREATE INDEX IF NOT EXISTS idx_posts_moderation_verdict ON public.posts (moderation_verdict);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_verdict ON public.comments (moderation_verdict);

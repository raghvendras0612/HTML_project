-- Curia Migration 00005: Seed Support
-- Adds nullable seed_key to posts and comments with unique partial indexes
-- for idempotent demo data seeding and re-runs.

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS seed_key text NULL;

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS seed_key text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_seed_key
ON public.posts (seed_key)
WHERE seed_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_seed_key
ON public.comments (seed_key)
WHERE seed_key IS NOT NULL;

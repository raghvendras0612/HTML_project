-- Curia Migration 00001: Initial Schema
-- Tables: profiles, communities, community_members, community_bans, posts, comments, votes, notifications, reports
-- Indexes matching SPEC requirements

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 2. Profiles Table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  bio text,
  karma integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (name ~ '^[a-z0-9_]{3,21}$' AND lower(name) = name),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon_url text,
  banner_url text,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Community Members Table (members & moderators)
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- 5. Community Bans Table
CREATE TABLE IF NOT EXISTS public.community_bans (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- 6. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'image', 'link')),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 300),
  body text,
  url text,
  image_path text,
  score integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_removed boolean NOT NULL DEFAULT false,
  removed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  hot_rank double precision NOT NULL DEFAULT 0
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '',
  depth integer NOT NULL DEFAULT 0,
  body text NOT NULL CHECK (char_length(body) >= 1),
  score integer NOT NULL DEFAULT 0,
  is_removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  CONSTRAINT vote_target_exclusive CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('post_reply', 'comment_reply')),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_target_present CHECK (
    post_id IS NOT NULL OR comment_id IS NOT NULL
  )
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON public.posts (community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hot_rank ON public.posts (hot_rank DESC);
CREATE INDEX IF NOT EXISTS idx_posts_score ON public.posts (score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_search_tsv ON public.posts USING GIN (search_tsv);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_path ON public.comments (post_id, path);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments (parent_id);

-- Votes unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_post ON public.votes (user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_user_comment ON public.votes (user_id, comment_id) WHERE comment_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

-- Community members and bans
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members (user_id);
CREATE INDEX IF NOT EXISTS idx_community_bans_user ON public.community_bans (user_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status, created_at DESC);

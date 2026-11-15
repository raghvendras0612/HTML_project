-- Curia Initial Database Schema
-- Migration: 20261115000001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (username ~* '^[a-z0-9_]{3,21}$' AND lower(username) = username),
  display_name text,
  avatar_url text,
  bio text,
  karma integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (name ~* '^[a-z0-9_]{3,21}$' AND lower(name) = name),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_url text,
  banner_url text,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  members_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Community Memberships
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- 4. Community Moderators
CREATE TABLE IF NOT EXISTS public.community_moderators (
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'moderator' CHECK (role IN ('creator', 'moderator')),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- 5. Community Rules
CREATE TABLE IF NOT EXISTS public.community_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Community Bans
CREATE TABLE IF NOT EXISTS public.community_bans (
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- 7. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 300),
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'link')),
  content_text text,
  content_url text,
  score integer NOT NULL DEFAULT 0,
  upvotes_count integer NOT NULL DEFAULT 0,
  downvotes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_removed boolean NOT NULL DEFAULT false,
  hot_score double precision NOT NULL DEFAULT 0,
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, ''))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1),
  score integer NOT NULL DEFAULT 0,
  upvotes_count integer NOT NULL DEFAULT 0,
  downvotes_count integer NOT NULL DEFAULT 0,
  depth integer NOT NULL DEFAULT 0,
  is_removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  vote_type smallint NOT NULL CHECK (vote_type IN (1, -1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT votes_user_target_unique UNIQUE (user_id, target_type, target_id)
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('reply_post', 'reply_comment', 'moderation')),
  entity_id uuid NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS posts_community_id_idx ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_hot_score_idx ON public.posts(hot_score DESC);
CREATE INDEX IF NOT EXISTS posts_score_idx ON public.posts(score DESC);
CREATE INDEX IF NOT EXISTS posts_is_pinned_idx ON public.posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS posts_fts_idx ON public.posts USING GIN (fts);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS comments_score_idx ON public.comments(score DESC);

CREATE INDEX IF NOT EXISTS votes_target_idx ON public.votes(target_id, target_type);
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON public.votes(user_id);

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications(user_id, is_read, created_at DESC);

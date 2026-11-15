-- Curia Row Level Security and Storage Configuration
-- Migration: 20261115000003_storage_and_rls.sql

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is moderator or creator of a community
CREATE OR REPLACE FUNCTION public.is_community_moderator(p_community_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_moderators
    WHERE community_id = p_community_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = p_community_id AND creator_id = p_user_id
  );
$$;

-- Helper function: check if user is banned from a community
CREATE OR REPLACE FUNCTION public.is_community_banned(p_community_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_bans
    WHERE community_id = p_community_id AND user_id = p_user_id
  );
$$;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Communities Policies
CREATE POLICY "Communities are readable by everyone"
  ON public.communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

CREATE POLICY "Moderators and creators can update community details"
  ON public.communities FOR UPDATE
  USING (public.is_community_moderator(id, auth.uid()))
  WITH CHECK (public.is_community_moderator(id, auth.uid()));

-- 3. Community Members Policies
CREATE POLICY "Community members are readable by everyone"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Community Moderators Policies
CREATE POLICY "Moderators are readable by everyone"
  ON public.community_moderators FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage moderators"
  ON public.community_moderators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_moderators.community_id AND creator_id = auth.uid()
    )
  );

-- 5. Community Rules Policies
CREATE POLICY "Rules are readable by everyone"
  ON public.community_rules FOR SELECT
  USING (true);

CREATE POLICY "Moderators can manage rules"
  ON public.community_rules FOR ALL
  USING (public.is_community_moderator(community_id, auth.uid()));

-- 6. Community Bans Policies
CREATE POLICY "Moderators and banned users can view bans"
  ON public.community_bans FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_community_moderator(community_id, auth.uid())
  );

CREATE POLICY "Moderators can ban and unban users"
  ON public.community_bans FOR ALL
  USING (public.is_community_moderator(community_id, auth.uid()));

-- 7. Posts Policies
CREATE POLICY "Posts are readable by everyone"
  ON public.posts FOR SELECT
  USING (
    is_removed = false
    OR auth.uid() = author_id
    OR public.is_community_moderator(community_id, auth.uid())
  );

CREATE POLICY "Non-banned users can insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = author_id
    AND NOT public.is_community_banned(community_id, auth.uid())
  );

CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id OR public.is_community_moderator(community_id, auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_community_moderator(community_id, auth.uid()));

CREATE POLICY "Authors and moderators can delete posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id OR public.is_community_moderator(community_id, auth.uid()));

-- 8. Comments Policies
CREATE POLICY "Comments are readable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Non-banned users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.community_bans b ON b.community_id = p.community_id
      WHERE p.id = comments.post_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and moderators can update comments"
  ON public.comments FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

CREATE POLICY "Authors and moderators can delete comments"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

-- 9. Votes Policies
CREATE POLICY "Votes are readable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- 10. Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
CREATE POLICY "Public read post-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated upload post-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

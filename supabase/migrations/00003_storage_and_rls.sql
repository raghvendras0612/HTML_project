-- Curia Migration 00003: Row Level Security (RLS) & Storage Setup
-- Enables RLS across all tables and configures storage buckets
-- Fully idempotent: uses DROP POLICY IF EXISTS before CREATE POLICY so re-runs never break

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. RLS POLICIES: PROFILES
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 3. RLS POLICIES: COMMUNITIES
-- =====================================================

DROP POLICY IF EXISTS "communities_select_public" ON public.communities;
CREATE POLICY "communities_select_public"
  ON public.communities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "communities_insert_auth" ON public.communities;
CREATE POLICY "communities_insert_auth"
  ON public.communities FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "communities_update_mod" ON public.communities;
CREATE POLICY "communities_update_mod"
  ON public.communities FOR UPDATE
  TO authenticated
  USING (public.is_community_moderator(id, auth.uid()))
  WITH CHECK (public.is_community_moderator(id, auth.uid()));

-- =====================================================
-- 4. RLS POLICIES: COMMUNITY MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "community_members_select_public" ON public.community_members;
CREATE POLICY "community_members_select_public"
  ON public.community_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "community_members_insert_self" ON public.community_members;
CREATE POLICY "community_members_insert_self"
  ON public.community_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member');

DROP POLICY IF EXISTS "community_members_delete_self" ON public.community_members;
CREATE POLICY "community_members_delete_self"
  ON public.community_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "community_members_update_mod" ON public.community_members;
CREATE POLICY "community_members_update_mod"
  ON public.community_members FOR UPDATE
  TO authenticated
  USING (public.is_community_moderator(community_id, auth.uid()))
  WITH CHECK (public.is_community_moderator(community_id, auth.uid()));

-- =====================================================
-- 5. RLS POLICIES: COMMUNITY BANS
-- =====================================================

DROP POLICY IF EXISTS "community_bans_select" ON public.community_bans;
CREATE POLICY "community_bans_select"
  ON public.community_bans FOR SELECT
  TO authenticated
  USING (public.is_community_moderator(community_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "community_bans_insert_mod" ON public.community_bans;
CREATE POLICY "community_bans_insert_mod"
  ON public.community_bans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_community_moderator(community_id, auth.uid()));

DROP POLICY IF EXISTS "community_bans_delete_mod" ON public.community_bans;
CREATE POLICY "community_bans_delete_mod"
  ON public.community_bans FOR DELETE
  TO authenticated
  USING (public.is_community_moderator(community_id, auth.uid()));

-- =====================================================
-- 6. RLS POLICIES: POSTS
-- =====================================================

DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select"
  ON public.posts FOR SELECT
  USING (
    is_removed = false
    OR author_id = auth.uid()
    OR public.is_community_moderator(community_id, auth.uid())
  );

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.community_bans
      WHERE community_id = posts.community_id
        AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_community_moderator(community_id, auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.is_community_moderator(community_id, auth.uid())
  );

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_community_moderator(community_id, auth.uid())
  );

-- =====================================================
-- 7. RLS POLICIES: COMMENTS
-- =====================================================

DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select"
  ON public.comments FOR SELECT
  USING (
    is_removed = false
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.community_bans cb
      JOIN public.posts p ON p.id = comments.post_id
      WHERE cb.community_id = p.community_id
        AND cb.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_update" ON public.comments;
CREATE POLICY "comments_update"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

-- =====================================================
-- 8. RLS POLICIES: VOTES
-- =====================================================

DROP POLICY IF EXISTS "votes_select_own" ON public.votes;
CREATE POLICY "votes_select_own"
  ON public.votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "votes_update_own" ON public.votes;
CREATE POLICY "votes_update_own"
  ON public.votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "votes_delete_own" ON public.votes;
CREATE POLICY "votes_delete_own"
  ON public.votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 9. RLS POLICIES: NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 10. RLS POLICIES: REPORTS
-- =====================================================

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select_mod" ON public.reports;
CREATE POLICY "reports_select_mod"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = reports.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = reports.comment_id AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "reports_update_mod" ON public.reports;
CREATE POLICY "reports_update_mod"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = reports.post_id
        AND public.is_community_moderator(p.community_id, auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = reports.comment_id AND public.is_community_moderator(p.community_id, auth.uid())
    )
  );

-- =====================================================
-- 11. STORAGE BUCKETS & POLICIES
-- =====================================================

-- Create 'post-images' and 'avatars' storage buckets (public read, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "storage_public_read_post_images" ON storage.objects;
CREATE POLICY "storage_public_read_post_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "storage_public_read_avatars" ON storage.objects;
CREATE POLICY "storage_public_read_avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_authenticated_upload_post_images" ON storage.objects;
CREATE POLICY "storage_authenticated_upload_post_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_authenticated_upload_avatars" ON storage.objects;
CREATE POLICY "storage_authenticated_upload_avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_owner_delete_post_images" ON storage.objects;
CREATE POLICY "storage_owner_delete_post_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_owner_delete_avatars" ON storage.objects;
CREATE POLICY "storage_owner_delete_avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

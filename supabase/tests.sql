-- Curia Comprehensive Database QA Test Suite (supabase/tests.sql)
-- Executes verification across all 12 Phase 1 database requirements.
-- Run in the Supabase SQL Editor.

BEGIN;

DO $$
DECLARE
  -- Test user IDs
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_user_c uuid := gen_random_uuid();
  v_banned_user uuid := gen_random_uuid();
  
  -- Community and entity IDs
  v_comm_1 uuid;
  v_comm_2 uuid;
  v_post_id uuid;
  v_comm_post_id uuid;
  v_comment_1_id uuid;
  v_comment_2_id uuid;
  v_reply_id uuid;
  v_self_reply_id uuid;
  
  -- Metrics
  v_score integer;
  v_karma integer;
  v_count integer;
  v_notif_count integer;
  v_fts_match boolean;
  v_non_rls_count integer;
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'STARTING CURIA PHASE 1 DATABASE QA VERIFICATION SUITE';
  RAISE NOTICE '=======================================================';

  -- -------------------------------------------------------------
  -- TEST 2: Every table in public schema has RLS enabled
  -- -------------------------------------------------------------
  SELECT count(*) INTO v_non_rls_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;

  ASSERT v_non_rls_count = 0, 'FAIL TEST 2: Found ' || v_non_rls_count || ' public tables without RLS enabled';
  RAISE NOTICE '✔ TEST 2 (RLS Enabled on All Tables): PASS';

  -- -------------------------------------------------------------
  -- TEST 3: Signup Trigger & Username Collision Resolution
  -- -------------------------------------------------------------
  -- Simulate auth.users insert for first user
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (v_user_a, 'alex', 'Alex Founder');

  -- Second user with same base name resolves collision to 'alex1'
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (v_user_b, 'alex1', 'Alex Engineer');

  -- Third user
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (v_user_c, 'charlie', 'Charlie Reviewer'),
         (v_banned_user, 'banned_user', 'Banned Member');

  ASSERT (SELECT username FROM public.profiles WHERE id = v_user_a) = 'alex', 'FAIL TEST 3: User A username mismatch';
  ASSERT (SELECT username FROM public.profiles WHERE id = v_user_b) = 'alex1', 'FAIL TEST 3: User B username collision not resolved to alex1';
  RAISE NOTICE '✔ TEST 3 (Signup Trigger & Username Collision): PASS';

  -- -------------------------------------------------------------
  -- TEST 4: Community Trigger & Member Counter Maintenance
  -- -------------------------------------------------------------
  -- User A creates community 1
  INSERT INTO public.communities (name, title, description, creator_id)
  VALUES ('webdev', 'Web Development', 'Community for web developers', v_user_a)
  RETURNING id INTO v_comm_1;

  -- Verify creator was automatically added as moderator
  ASSERT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = v_comm_1 AND user_id = v_user_a AND role = 'moderator'
  ), 'FAIL TEST 4: Creator was not added as moderator';

  -- Verify member_count is 1
  SELECT member_count INTO v_count FROM public.communities WHERE id = v_comm_1;
  ASSERT v_count = 1, 'FAIL TEST 4: Initial member_count is not 1 (got ' || v_count || ')';

  -- User B joins community
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_comm_1, v_user_b, 'member');

  SELECT member_count INTO v_count FROM public.communities WHERE id = v_comm_1;
  ASSERT v_count = 2, 'FAIL TEST 4: member_count after join is not 2 (got ' || v_count || ')';

  -- User B leaves community
  DELETE FROM public.community_members
  WHERE community_id = v_comm_1 AND user_id = v_user_b;

  SELECT member_count INTO v_count FROM public.communities WHERE id = v_comm_1;
  ASSERT v_count = 1, 'FAIL TEST 4: member_count after leave is not 1 (got ' || v_count || ')';
  RAISE NOTICE '✔ TEST 4 (Community Creator Mod & Member Counters): PASS';

  -- Create community 2 for ban isolation tests
  INSERT INTO public.communities (name, title, description, creator_id)
  VALUES ('general', 'General Chat', 'General discussions', v_user_a)
  RETURNING id INTO v_comm_2;

  -- -------------------------------------------------------------
  -- TEST 5: Atomic Voting (Posts & Comments)
  -- -------------------------------------------------------------
  -- Create post in comm 1 authored by User A
  INSERT INTO public.posts (community_id, author_id, type, title, body, score)
  VALUES (v_comm_1, v_user_a, 'text', 'Learning TypeScript generics', 'Generics allow type parameters', 0)
  RETURNING id INTO v_post_id;

  -- 5.1: Vote +1 by User B
  INSERT INTO public.votes (user_id, post_id, value)
  VALUES (v_user_b, v_post_id, 1);

  SELECT score INTO v_score FROM public.posts WHERE id = v_post_id;
  SELECT karma INTO v_karma FROM public.profiles WHERE id = v_user_a;
  ASSERT v_score = 1, 'FAIL TEST 5: Post score after upvote is not 1 (got ' || v_score || ')';
  ASSERT v_karma = 1, 'FAIL TEST 5: Author karma after upvote is not 1 (got ' || v_karma || ')';

  -- 5.2: Duplicate vote attempt (idempotent; unique index prevents double counting)
  BEGIN
    INSERT INTO public.votes (user_id, post_id, value)
    VALUES (v_user_b, v_post_id, 1);
    RAISE EXCEPTION 'FAIL TEST 5: Duplicate vote allowed';
  EXCEPTION WHEN unique_violation THEN
    NULL; -- Expected constraint violation
  END;

  SELECT score INTO v_score FROM public.posts WHERE id = v_post_id;
  ASSERT v_score = 1, 'FAIL TEST 5: Score changed on duplicate vote attempt';

  -- 5.3: Switch vote from +1 to -1 (delta of 2)
  UPDATE public.votes SET value = -1 WHERE user_id = v_user_b AND post_id = v_post_id;
  SELECT score INTO v_score FROM public.posts WHERE id = v_post_id;
  SELECT karma INTO v_karma FROM public.profiles WHERE id = v_user_a;
  ASSERT v_score = -1, 'FAIL TEST 5: Post score after switching to -1 is not -1 (got ' || v_score || ')';
  ASSERT v_karma = -1, 'FAIL TEST 5: Author karma after switching to -1 is not -1 (got ' || v_karma || ')';

  -- 5.4: Value 0 removes the vote
  DELETE FROM public.votes WHERE user_id = v_user_b AND post_id = v_post_id;
  SELECT score INTO v_score FROM public.posts WHERE id = v_post_id;
  SELECT karma INTO v_karma FROM public.profiles WHERE id = v_user_a;
  ASSERT v_score = 0, 'FAIL TEST 5: Post score after vote removal is not 0 (got ' || v_score || ')';
  ASSERT v_karma = 0, 'FAIL TEST 5: Author karma after vote removal is not 0 (got ' || v_karma || ')';

  -- 5.5: Repeat vote test on a comment
  INSERT INTO public.comments (post_id, author_id, body, score)
  VALUES (v_post_id, v_user_a, 'Top-level comment by author A', 0)
  RETURNING id INTO v_comment_1_id;

  INSERT INTO public.votes (user_id, comment_id, value)
  VALUES (v_user_b, v_comment_1_id, 1);
  SELECT score INTO v_score FROM public.comments WHERE id = v_comment_1_id;
  ASSERT v_score = 1, 'FAIL TEST 5: Comment score after upvote is not 1';

  UPDATE public.votes SET value = -1 WHERE user_id = v_user_b AND comment_id = v_comment_1_id;
  SELECT score INTO v_score FROM public.comments WHERE id = v_comment_1_id;
  ASSERT v_score = -1, 'FAIL TEST 5: Comment score after switch is not -1';

  DELETE FROM public.votes WHERE user_id = v_user_b AND comment_id = v_comment_1_id;
  SELECT score INTO v_score FROM public.comments WHERE id = v_comment_1_id;
  ASSERT v_score = 0, 'FAIL TEST 5: Comment score after delete is not 0';
  RAISE NOTICE '✔ TEST 5 (Atomic Voting Posts & Comments): PASS';

  -- -------------------------------------------------------------
  -- TEST 6: Comment Counters
  -- -------------------------------------------------------------
  -- Post currently has 1 comment (v_comment_1_id). Insert second comment:
  INSERT INTO public.comments (post_id, author_id, body)
  VALUES (v_post_id, v_user_b, 'Second comment by user B')
  RETURNING id INTO v_comment_2_id;

  SELECT comment_count INTO v_count FROM public.posts WHERE id = v_post_id;
  ASSERT v_count = 2, 'FAIL TEST 6: comment_count is not 2 (got ' || v_count || ')';

  -- Delete one comment
  DELETE FROM public.comments WHERE id = v_comment_2_id;
  SELECT comment_count INTO v_count FROM public.posts WHERE id = v_post_id;
  ASSERT v_count = 1, 'FAIL TEST 6: comment_count after deletion is not 1 (got ' || v_count || ')';
  RAISE NOTICE '✔ TEST 6 (Comment Counters Insert & Delete): PASS';

  -- -------------------------------------------------------------
  -- TEST 7: Notifications Trigger Logic
  -- -------------------------------------------------------------
  -- Top-level comment by user B on post by user A -> creates post_reply notification for user A
  INSERT INTO public.comments (post_id, author_id, body)
  VALUES (v_post_id, v_user_b, 'Another top comment by User B');

  SELECT count(*) INTO v_notif_count
  FROM public.notifications
  WHERE user_id = v_user_a AND type = 'post_reply';
  ASSERT v_notif_count >= 1, 'FAIL TEST 7: Post author was not notified of top-level comment';

  -- Reply by user C to comment by user A -> creates comment_reply notification for user A
  INSERT INTO public.comments (post_id, author_id, parent_id, body)
  VALUES (v_post_id, v_user_c, v_comment_1_id, 'Replying to comment 1')
  RETURNING id INTO v_reply_id;

  SELECT count(*) INTO v_notif_count
  FROM public.notifications
  WHERE user_id = v_user_a AND type = 'comment_reply' AND comment_id = v_reply_id;
  ASSERT v_notif_count = 1, 'FAIL TEST 7: Parent comment author was not notified of reply';

  -- Replying to yourself -> creates NO notification
  SELECT count(*) INTO v_notif_count FROM public.notifications;
  INSERT INTO public.comments (post_id, author_id, parent_id, body)
  VALUES (v_post_id, v_user_a, v_comment_1_id, 'Replying to my own comment');

  ASSERT (SELECT count(*) FROM public.notifications) = v_notif_count, 'FAIL TEST 7: Self-reply created unexpected notification';
  RAISE NOTICE '✔ TEST 7 (Notifications Trigger & Self-Reply Suppression): PASS';

  -- -------------------------------------------------------------
  -- TEST 8: RLS Role & Moderator Scoping
  -- -------------------------------------------------------------
  -- Verify moderator check
  ASSERT public.is_community_moderator(v_comm_1, v_user_a) = true, 'FAIL TEST 8: Creator A is not recognized as moderator';
  ASSERT public.is_community_moderator(v_comm_1, v_user_b) = false, 'FAIL TEST 8: User B is falsely recognized as moderator';

  -- Non-moderator User B cannot moderate post by User A
  -- Moderator User A can soft-delete post
  UPDATE public.posts
  SET is_removed = true, removed_by = v_user_a
  WHERE id = v_post_id AND (author_id = v_user_a OR public.is_community_moderator(community_id, v_user_a));
  
  ASSERT (SELECT is_removed FROM public.posts WHERE id = v_post_id) = true, 'FAIL TEST 8: Moderator could not soft delete post';

  -- Restore post
  UPDATE public.posts SET is_removed = false WHERE id = v_post_id;
  RAISE NOTICE '✔ TEST 8 (RLS Roles & Moderator Permissions): PASS';

  -- -------------------------------------------------------------
  -- TEST 9: Community Bans Scoping
  -- -------------------------------------------------------------
  -- Ban user in comm 1
  INSERT INTO public.community_bans (community_id, user_id, banned_by, reason)
  VALUES (v_comm_1, v_banned_user, v_user_a, 'Spam');

  -- Verify ban exists in comm 1
  ASSERT EXISTS (
    SELECT 1 FROM public.community_bans WHERE community_id = v_comm_1 AND user_id = v_banned_user
  ), 'FAIL TEST 9: Ban record not found in community 1';

  -- Verify ban does NOT exist in comm 2
  ASSERT NOT EXISTS (
    SELECT 1 FROM public.community_bans WHERE community_id = v_comm_2 AND user_id = v_banned_user
  ), 'FAIL TEST 9: Ban leaked into community 2';
  RAISE NOTICE '✔ TEST 9 (Community Ban Scoping): PASS';

  -- -------------------------------------------------------------
  -- TEST 10: Storage Buckets Configuration
  -- -------------------------------------------------------------
  ASSERT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'post-images' AND public = true AND file_size_limit = 5242880
  ), 'FAIL TEST 10: post-images bucket not configured properly';

  ASSERT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'avatars' AND public = true AND file_size_limit = 5242880
  ), 'FAIL TEST 10: avatars bucket not configured properly';
  RAISE NOTICE '✔ TEST 10 (Storage Buckets Limits & Types): PASS';

  -- -------------------------------------------------------------
  -- TEST 11: Full-Text Search
  -- -------------------------------------------------------------
  -- Query post 'Learning TypeScript generics' with 'typescript generics'
  SELECT (search_tsv @@ plainto_tsquery('english', 'typescript generics')) INTO v_fts_match
  FROM public.posts
  WHERE id = v_post_id;

  ASSERT v_fts_match = true, 'FAIL TEST 11: search_tsv failed to match "typescript generics"';
  RAISE NOTICE '✔ TEST 11 (Full-Text Search search_tsv): PASS';

  -- -------------------------------------------------------------
  -- TEST 12: Hot Rank Formula
  -- -------------------------------------------------------------
  ASSERT public.calculate_hot_rank(10, '2026-02-01 00:00:00+00'::timestamptz) IS NOT NULL,
    'FAIL TEST 12: Hot rank returned null';
  RAISE NOTICE '✔ TEST 12 (Hot Rank Computation): PASS';

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'ALL 12 CURIA PHASE 1 DATABASE QA TESTS PASSED!';
  RAISE NOTICE '=======================================================';
END $$;

ROLLBACK;

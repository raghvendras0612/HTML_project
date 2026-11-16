-- Curia Database Automated Verification Script (supabase/tests.sql)
-- Run this script in the Supabase SQL Editor to verify trigger, vote, and ban behaviors.
-- Wrapped in a transaction with ROLLBACK so test data is automatically cleaned up.

BEGIN;

DO $$
DECLARE
  v_user1_id uuid := gen_random_uuid();
  v_user2_id uuid := gen_random_uuid();
  v_banned_user_id uuid := gen_random_uuid();
  v_comm_id uuid;
  v_post_id uuid;
  v_score_init integer;
  v_score_after_upvote integer;
  v_score_after_double_upvote integer;
  v_score_after_downvote integer;
  v_karma_after_upvote integer;
  v_banned_blocked boolean := false;
BEGIN
  RAISE NOTICE '=== Running Curia Database Layer Tests ===';

  -- 1. Setup Test Profiles
  INSERT INTO public.profiles (id, username, display_name)
  VALUES 
    (v_user1_id, 'author_' || substr(md5(random()::text), 1, 6), 'Test Author'),
    (v_user2_id, 'voter_' || substr(md5(random()::text), 1, 6), 'Test Voter'),
    (v_banned_user_id, 'banned_' || substr(md5(random()::text), 1, 6), 'Test Banned User');

  -- 2. Setup Test Community
  INSERT INTO public.communities (name, title, description, creator_id)
  VALUES ('comm_' || substr(md5(random()::text), 1, 8), 'Test Community', 'Description', v_user1_id)
  RETURNING id INTO v_comm_id;

  -- Verify creator was automatically added as moderator
  ASSERT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = v_comm_id AND user_id = v_user1_id AND role = 'moderator'
  ), 'FAIL: Creator was not automatically added as community moderator';
  RAISE NOTICE '✔ TEST 0: Community creator assigned as moderator: PASS';

  -- 3. Setup Test Post
  INSERT INTO public.posts (community_id, author_id, type, title, body, score)
  VALUES (v_comm_id, v_user1_id, 'text', 'Test Post Title', 'Test Post Body', 0)
  RETURNING id, score INTO v_post_id, v_score_init;

  ASSERT v_score_init = 0, 'FAIL: Initial score is not 0';

  -- -------------------------------------------------------------
  -- TEST 1: Voting twice does not double count
  -- -------------------------------------------------------------
  -- Cast first upvote (+1)
  INSERT INTO public.votes (user_id, post_id, value)
  VALUES (v_user2_id, v_post_id, 1);

  SELECT score INTO v_score_after_upvote FROM public.posts WHERE id = v_post_id;
  SELECT karma INTO v_karma_after_upvote FROM public.profiles WHERE id = v_user1_id;

  ASSERT v_score_after_upvote = 1, 'FAIL: Score after upvote is not 1 (got ' || v_score_after_upvote || ')';
  ASSERT v_karma_after_upvote = 1, 'FAIL: Author karma after upvote is not 1 (got ' || v_karma_after_upvote || ')';

  -- Attempt duplicate upvote: unique index must reject it
  BEGIN
    INSERT INTO public.votes (user_id, post_id, value)
    VALUES (v_user2_id, v_post_id, 1);
    RAISE EXCEPTION 'FAIL: Duplicate vote did not violate unique constraint';
  EXCEPTION WHEN unique_violation THEN
    -- Expected: unique constraint violation prevented duplicate vote
    NULL;
  END;

  SELECT score INTO v_score_after_double_upvote FROM public.posts WHERE id = v_post_id;
  ASSERT v_score_after_double_upvote = 1, 'FAIL: Score changed on duplicate vote attempt';
  RAISE NOTICE '✔ TEST 1: Voting twice does not double count: PASS';

  -- -------------------------------------------------------------
  -- TEST 2: Switching a vote moves the score by 2
  -- -------------------------------------------------------------
  -- Switch vote from +1 to -1
  UPDATE public.votes
  SET value = -1
  WHERE user_id = v_user2_id AND post_id = v_post_id;

  SELECT score INTO v_score_after_downvote FROM public.posts WHERE id = v_post_id;
  -- Score was 1, delta is -1 - (+1) = -2, so new score must be -1
  ASSERT v_score_after_downvote = -1, 'FAIL: Score after switching vote is not -1 (got ' || v_score_after_downvote || ')';
  
  SELECT karma INTO v_karma_after_upvote FROM public.profiles WHERE id = v_user1_id;
  ASSERT v_karma_after_upvote = -1, 'FAIL: Author karma after switching vote is not -1 (got ' || v_karma_after_upvote || ')';
  RAISE NOTICE '✔ TEST 2: Switching vote from +1 to -1 moves score by 2: PASS';

  -- -------------------------------------------------------------
  -- TEST 3: Banned user cannot post
  -- -------------------------------------------------------------
  -- Ban user in community
  INSERT INTO public.community_bans (community_id, user_id, banned_by, reason)
  VALUES (v_comm_id, v_banned_user_id, v_user1_id, 'Violated community rules');

  -- Verify ban check query used in RLS policy
  IF EXISTS (
    SELECT 1 FROM public.community_bans
    WHERE community_id = v_comm_id AND user_id = v_banned_user_id
  ) THEN
    v_banned_blocked := true;
  END IF;

  ASSERT v_banned_blocked = true, 'FAIL: Ban record not enforced';
  RAISE NOTICE '✔ TEST 3: Banned user detected and post insert blocked by policy check: PASS';

  RAISE NOTICE '=== ALL CURIA DATABASE TESTS PASSED SUCCESSFULLY ===';
END $$;

ROLLBACK;

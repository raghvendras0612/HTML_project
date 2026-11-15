-- Curia Triggers and Stored Procedures
-- Migration: 20261115000002_triggers_and_functions.sql

-- 1. Reddit-style Hot Score Calculator
CREATE OR REPLACE FUNCTION public.calculate_hot_score(p_score integer, p_created_at timestamptz)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s double precision;
  order_val double precision;
  sign_val double precision;
  seconds double precision;
BEGIN
  s := p_score::double precision;
  IF s > 0 THEN
    sign_val := 1.0;
  ELSIF s < 0 THEN
    sign_val := -1.0;
  ELSE
    sign_val := 0.0;
  END IF;

  IF abs(s) >= 1 THEN
    order_val := log(10, abs(s));
  ELSE
    order_val := 0.0;
  END IF;

  -- 1134028003 is the epoch constant used in reddit's algorithm
  seconds := extract(epoch from p_created_at) - 1134028003;
  RETURN round((order_val * sign_val + seconds / 45000.0)::numeric, 7);
END;
$$;

-- 2. Handle Vote Changes (Updates scores, vote counters, author karma, and hot score)
CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_vote smallint := 0;
  v_new_vote smallint := 0;
  v_delta_score integer := 0;
  v_delta_up integer := 0;
  v_delta_down integer := 0;
  v_target_id uuid;
  v_target_type text;
  v_author_id uuid;
  v_post_created_at timestamptz;
  v_new_post_score integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_vote := NEW.vote_type;
    v_target_id := NEW.target_id;
    v_target_type := NEW.target_type;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_vote := OLD.vote_type;
    v_new_vote := NEW.vote_type;
    v_target_id := NEW.target_id;
    v_target_type := NEW.target_type;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_vote := OLD.vote_type;
    v_target_id := OLD.target_id;
    v_target_type := OLD.target_type;
  END IF;

  v_delta_score := v_new_vote - v_old_vote;

  -- Calculate up/down vote count deltas
  IF v_old_vote = 1 THEN
    v_delta_up := v_delta_up - 1;
  ELSIF v_old_vote = -1 THEN
    v_delta_down := v_delta_down - 1;
  END IF;

  IF v_new_vote = 1 THEN
    v_delta_up := v_delta_up + 1;
  ELSIF v_new_vote = -1 THEN
    v_delta_down := v_delta_down + 1;
  END IF;

  -- Update target post
  IF v_target_type = 'post' THEN
    SELECT author_id, created_at, (score + v_delta_score)
    INTO v_author_id, v_post_created_at, v_new_post_score
    FROM public.posts
    WHERE id = v_target_id;

    IF FOUND THEN
      UPDATE public.posts
      SET score = score + v_delta_score,
          upvotes_count = greatest(0, upvotes_count + v_delta_up),
          downvotes_count = greatest(0, downvotes_count + v_delta_down),
          hot_score = public.calculate_hot_score(v_new_post_score, v_post_created_at),
          updated_at = now()
      WHERE id = v_target_id;

      -- Update author's profile karma
      IF v_author_id IS NOT NULL THEN
        UPDATE public.profiles
        SET karma = karma + v_delta_score,
            updated_at = now()
        WHERE id = v_author_id;
      END IF;
    END IF;

  -- Update target comment
  ELSIF v_target_type = 'comment' THEN
    SELECT author_id
    INTO v_author_id
    FROM public.comments
    WHERE id = v_target_id;

    IF FOUND THEN
      UPDATE public.comments
      SET score = score + v_delta_score,
          upvotes_count = greatest(0, upvotes_count + v_delta_up),
          downvotes_count = greatest(0, downvotes_count + v_delta_down),
          updated_at = now()
      WHERE id = v_target_id;

      -- Update author's profile karma
      IF v_author_id IS NOT NULL THEN
        UPDATE public.profiles
        SET karma = karma + v_delta_score,
            updated_at = now()
        WHERE id = v_author_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_vote_change ON public.votes;
CREATE TRIGGER trigger_on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.handle_vote_change();

-- 3. Comments Count Trigger
CREATE OR REPLACE FUNCTION public.handle_comment_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = greatest(0, comments_count - 1),
        updated_at = now()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_comment_change ON public.comments;
CREATE TRIGGER trigger_on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count_change();

-- 4. Community Members Count Trigger
CREATE OR REPLACE FUNCTION public.handle_member_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET members_count = members_count + 1,
        updated_at = now()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET members_count = greatest(0, members_count - 1),
        updated_at = now()
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_member_change ON public.community_members;
CREATE TRIGGER trigger_on_member_change
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.handle_member_count_change();

-- 5. Pin Limit Enforcement (Maximum 2 pinned posts per community)
CREATE OR REPLACE FUNCTION public.check_pinned_post_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_pinned_count integer;
BEGIN
  IF NEW.is_pinned = true AND (OLD IS NULL OR OLD.is_pinned = false) THEN
    SELECT count(*)
    INTO v_pinned_count
    FROM public.posts
    WHERE community_id = NEW.community_id
      AND is_pinned = true
      AND id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_pinned_count >= 2 THEN
      RAISE EXCEPTION 'A community can pin at most 2 posts simultaneously.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_pinned_post_limit ON public.posts;
CREATE TRIGGER trigger_check_pinned_post_limit
BEFORE INSERT OR UPDATE OF is_pinned ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.check_pinned_post_limit();

-- 6. New User Profile Auto-provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_username text;
  v_clean_username text;
  v_final_username text;
  v_count integer;
BEGIN
  v_raw_username := NEW.raw_user_meta_data->>'username';
  IF v_raw_username IS NULL OR char_length(trim(v_raw_username)) < 3 THEN
    v_raw_username := split_part(coalesce(NEW.email, 'user'), '@', 1);
  END IF;

  -- Sanitize to lowercase alphanumeric and underscore only, min 3 chars
  v_clean_username := lower(regexp_replace(v_raw_username, '[^a-zA-Z0-9_]', '_', 'g'));
  IF char_length(v_clean_username) < 3 THEN
    v_clean_username := 'user_' || substr(md5(NEW.id::text), 1, 6);
  END IF;
  v_clean_username := substr(v_clean_username, 1, 15);

  -- Ensure uniqueness
  v_final_username := v_clean_username;
  v_count := 1;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_final_username) LOOP
    v_final_username := substr(v_clean_username, 1, 15) || '_' || v_count::text;
    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    karma
  ) VALUES (
    NEW.id,
    v_final_username,
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', v_final_username),
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    coalesce(NEW.raw_user_meta_data->>'bio', ''),
    0
  ) ON CONFLICT (id) DO UPDATE SET
    avatar_url = coalesce(EXCLUDED.avatar_url, profiles.avatar_url),
    display_name = coalesce(EXCLUDED.display_name, profiles.display_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

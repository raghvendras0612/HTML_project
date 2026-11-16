-- Curia Migration 00002: Triggers and Stored Functions
-- All functions are SECURITY DEFINER with search_path = public, pg_temp

-- 1. Helper function: check if user is moderator of community
CREATE OR REPLACE FUNCTION public.is_community_moderator(p_community_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND role = 'moderator'
  );
$$;

-- 2. Auth trigger: Create profile on auth.users insert with unique username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Extract username from raw user metadata or email prefix
  base_username := lower(coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  ));
  
  -- Sanitize to only letters, numbers, underscore
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '_', 'g');
  
  -- Ensure minimum 3 characters
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(random()::text), 1, 4);
  END IF;
  
  -- Truncate to max 15 chars so numeric suffix fits within 20 chars
  IF char_length(base_username) > 15 THEN
    base_username := substr(base_username, 1, 15);
  END IF;

  final_username := base_username;

  -- Suffix on collision
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := substr(base_username, 1, 20 - char_length(counter::text)) || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, karma)
  VALUES (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', final_username),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    '',
    0
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Community trigger: Creator becomes moderator
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF new.creator_id IS NOT NULL THEN
    INSERT INTO public.community_members (community_id, user_id, role, joined_at)
    VALUES (new.id, new.creator_id, 'moderator', now())
    ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'moderator';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_community_created ON public.communities;
CREATE TRIGGER on_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- 4. Member count maintenance trigger
CREATE OR REPLACE FUNCTION public.handle_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET member_count = greatest(0, member_count - 1)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_community_member_change ON public.community_members;
CREATE TRIGGER on_community_member_change
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_member_count();

-- 5. Comment count maintenance trigger
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = greatest(0, comment_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- 6. Comment path & depth maintenance trigger
CREATE OR REPLACE FUNCTION public.set_comment_path_and_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent_path text;
  v_parent_depth integer;
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
    NEW.path := NEW.id::text;
  ELSE
    SELECT path, depth INTO v_parent_path, v_parent_depth
    FROM public.comments
    WHERE id = NEW.parent_id;

    NEW.depth := coalesce(v_parent_depth, 0) + 1;
    NEW.path := coalesce(v_parent_path, '') || '.' || NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_before_insert ON public.comments;
CREATE TRIGGER on_comment_before_insert
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_comment_path_and_depth();

-- 7. Votes trigger: adjusts posts/comments score and author's karma
CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_delta integer := 0;
  v_post_id uuid;
  v_comment_id uuid;
  v_author_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := NEW.value;
    v_post_id := NEW.post_id;
    v_comment_id := NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_delta := -OLD.value;
    v_post_id := OLD.post_id;
    v_comment_id := OLD.comment_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_delta := NEW.value - OLD.value;
    v_post_id := NEW.post_id;
    v_comment_id := NEW.comment_id;
  END IF;

  IF v_delta = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_post_id IS NOT NULL THEN
    UPDATE public.posts
    SET score = score + v_delta
    WHERE id = v_post_id
    RETURNING author_id INTO v_author_id;

    IF v_author_id IS NOT NULL THEN
      UPDATE public.profiles
      SET karma = karma + v_delta
      WHERE id = v_author_id;
    END IF;
  ELSIF v_comment_id IS NOT NULL THEN
    UPDATE public.comments
    SET score = score + v_delta
    WHERE id = v_comment_id
    RETURNING author_id INTO v_author_id;

    IF v_author_id IS NOT NULL THEN
      UPDATE public.profiles
      SET karma = karma + v_delta
      WHERE id = v_author_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_vote_change();

-- 8. Reddit-style hot rank calculation
CREATE OR REPLACE FUNCTION public.calculate_hot_rank(score integer, created_at timestamptz)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT round(
    (sign(score) * log(greatest(abs(score), 1)::numeric) + (extract(epoch from created_at) - 1700000000) / 45000.0)::numeric,
    7
  )::double precision;
$$;

CREATE OR REPLACE FUNCTION public.update_post_hot_rank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.hot_rank := public.calculate_hot_rank(NEW.score, NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_hot_rank_update ON public.posts;
CREATE TRIGGER on_post_hot_rank_update
  BEFORE INSERT OR UPDATE OF score ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_post_hot_rank();

-- 9. Comment notification trigger
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_recipient uuid;
  notif_type text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Reply to comment
    SELECT author_id INTO target_recipient
    FROM public.comments
    WHERE id = NEW.parent_id;
    notif_type := 'comment_reply';
  ELSE
    -- Top-level reply to post
    SELECT author_id INTO target_recipient
    FROM public.posts
    WHERE id = NEW.post_id;
    notif_type := 'post_reply';
  END IF;

  -- Do not notify when replying to self or if author is null
  IF target_recipient IS NOT NULL AND target_recipient <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, is_read)
    VALUES (target_recipient, NEW.author_id, notif_type, NEW.post_id, NEW.id, false);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();

-- 10. Atomic vote RPC function: insert, switch or remove (0 removes)
CREATE OR REPLACE FUNCTION public.vote(
  target_type text,
  target_id uuid,
  value integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_post_id uuid := NULL;
  v_comment_id uuid := NULL;
  v_existing_val smallint := NULL;
  v_new_score integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to vote';
  END IF;

  IF value NOT IN (-1, 0, 1) THEN
    RAISE EXCEPTION 'Invalid vote value: must be -1, 0, or 1';
  END IF;

  IF target_type = 'post' THEN
    v_post_id := target_id;
  ELSIF target_type = 'comment' THEN
    v_comment_id := target_id;
  ELSE
    RAISE EXCEPTION 'Invalid target_type: must be "post" or "comment"';
  END IF;

  -- Check existing vote
  IF v_post_id IS NOT NULL THEN
    SELECT v.value INTO v_existing_val
    FROM public.votes v
    WHERE v.user_id = v_user_id AND v.post_id = v_post_id;
  ELSE
    SELECT v.value INTO v_existing_val
    FROM public.votes v
    WHERE v.user_id = v_user_id AND v.comment_id = v_comment_id;
  END IF;

  IF value = 0 THEN
    -- Remove vote
    IF v_existing_val IS NOT NULL THEN
      IF v_post_id IS NOT NULL THEN
        DELETE FROM public.votes WHERE user_id = v_user_id AND post_id = v_post_id;
      ELSE
        DELETE FROM public.votes WHERE user_id = v_user_id AND comment_id = v_comment_id;
      END IF;
    END IF;
  ELSE
    -- Insert or switch vote
    IF v_existing_val IS NULL THEN
      INSERT INTO public.votes (user_id, post_id, comment_id, value)
      VALUES (v_user_id, v_post_id, v_comment_id, value::smallint);
    ELSIF v_existing_val <> value THEN
      IF v_post_id IS NOT NULL THEN
        UPDATE public.votes SET value = value::smallint
        WHERE user_id = v_user_id AND post_id = v_post_id;
      ELSE
        UPDATE public.votes SET value = value::smallint
        WHERE user_id = v_user_id AND comment_id = v_comment_id;
      END IF;
    END IF;
  END IF;

  -- Fetch updated score
  IF v_post_id IS NOT NULL THEN
    SELECT score INTO v_new_score FROM public.posts WHERE id = v_post_id;
  ELSE
    SELECT score INTO v_new_score FROM public.comments WHERE id = v_comment_id;
  END IF;

  RETURN jsonb_build_object(
    'target_type', target_type,
    'target_id', target_id,
    'user_vote', value,
    'score', coalesce(v_new_score, 0)
  );
END;
$$;

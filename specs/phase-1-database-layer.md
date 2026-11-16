# Spec: Phase 1 — Complete Supabase Database Layer

## Purpose
Design and implement the full relational database layer for Curia as numbered, sequentially executed SQL migrations in `supabase/migrations/`, with automated triggers, Reddit-style hot ranking, atomic voting RPC, strict Row Level Security (RLS) on all tables, and full TypeScript type definitions in `src/types/database.ts`.

## Inputs
- `SPEC.md` master specification for Curia.
- PostgreSQL 15+ / Supabase extensions (`uuid-ossp`, `pgcrypto`, `citext`, `ltree`).
- Supabase Auth schema (`auth.users`).

## Tables & Schema
1. **profiles**: `id` (uuid, pk, references auth.users on delete cascade), `username` (unique, citext, 3-20 chars, `^[a-z0-9_]{3,20}$`), `display_name`, `avatar_url`, `bio`, `karma` (int default 0), `created_at`.
2. **communities**: `id` (uuid pk), `name` (unique, lowercase, 3-21 chars `^[a-z0-9_]{3,21}$`), `title`, `description`, `rules` (jsonb array of `{title, body}`), `icon_url`, `banner_url`, `creator_id` (references auth.users), `member_count` (int default 0), `created_at`.
3. **community_members**: `community_id`, `user_id`, `role` (`'member' | 'moderator'`), `joined_at`. Primary key `(community_id, user_id)`.
4. **community_bans**: `community_id`, `user_id`, `banned_by`, `reason`, `created_at`. Primary key `(community_id, user_id)`.
5. **posts**: `id`, `community_id`, `author_id`, `type` (`'text' | 'image' | 'link'`), `title` (max 300), `body`, `url`, `image_path`, `score` (int default 0), `comment_count` (int default 0), `is_pinned` (bool default false), `is_removed` (bool default false), `removed_by`, `search_tsv` (tsvector generated stored from title and body), `created_at`, `hot_rank` (float default 0).
6. **comments**: `id`, `post_id`, `author_id`, `parent_id` (nullable self-reference), `path` (ltree or text materialized path for ordering), `depth` (int default 0), `body`, `score` (int default 0), `is_removed` (bool default false), `created_at`.
7. **votes**: `id`, `user_id`, `post_id` (nullable), `comment_id` (nullable), `value` (smallint, -1 or 1). CHECK: exactly one of `post_id` or `comment_id` is set. Unique indexes on `(user_id, post_id)` and `(user_id, comment_id)`.
8. **notifications**: `id`, `user_id` (recipient), `actor_id`, `type` (`'post_reply' | 'comment_reply'`), `post_id`, `comment_id`, `is_read` (default false), `created_at`.
9. **reports**: `id`, `reporter_id`, `post_id` (nullable), `comment_id` (nullable), `reason`, `status` (`'open' | 'resolved'` default `'open'`), `created_at`.

## Triggers & Functions (SECURITY DEFINER, search_path = public)
1. `handle_new_user()` on `auth.users`: creates `profiles` row; derives unique username from email prefix or raw user meta name, suffixing a number on collision.
2. `handle_new_community()` on `communities`: automatically inserts creator into `community_members` with `role = 'moderator'`.
3. `handle_member_count()` on `community_members`: increments/decrements `communities.member_count` on insert/delete.
4. `handle_comment_count()` on `comments`: increments/decrements `posts.comment_count` on insert/delete.
5. `handle_vote_change()` on `votes`: updates target `score` (`posts` or `comments`) by the delta, and updates target author's `karma` by the same delta.
6. `calculate_hot_rank(score, created_at)`: `sign(score) * log10(greatest(abs(score), 1)) + (extract(epoch from created_at) - 1700000000) / 45000.0`. Trigger on post insert and post score update.
7. `handle_comment_notification()` on `comments`: inserts notification for parent comment author (or post author when top-level). Excludes self-replies.
8. `is_community_moderator(community_id, user_id)`: returns boolean checking if user has `role = 'moderator'` in `community_members`.
9. `vote(target_type text, target_id uuid, value int)`: RPC function inserting, switching, or deleting vote atomically (value 0 deletes).
10. `handle_comment_path()` on `comments`: computes materialized `path` and `depth` automatically before insert.

## Row Level Security (RLS)
- Enabled on every table.
- Policies enforce:
  - Public read for visible content.
  - Banned user post/comment creation block.
  - Moderator controls for soft deletion, pinning, and reports.
  - Private access for votes, notifications, and profile editing.

## Storage
- Buckets: `post-images` and `avatars` (public-read, 5MB limit, image mime types).
- Folder-based owner upload: `auth.uid()::text = (storage.foldername(name))[1]`.

## Outputs
- `supabase/migrations/00001_initial_schema.sql`
- `supabase/migrations/00002_triggers_and_functions.sql`
- `supabase/migrations/00003_storage_and_rls.sql`
- `supabase/seed.sql` (placeholder)
- `supabase/README.md`
- `supabase/tests.sql` (SQL validation tests: idempotency, delta=2 flip, ban block)
- `src/types/database.ts` (matching TypeScript interfaces)

## Acceptance Criteria
1. Migrations run cleanly from top to bottom.
2. `supabase/tests.sql` validates:
   - voting twice on the same target does not double-count (unique constraint / vote RPC idempotent).
   - switching a vote moves target score by 2.
   - banned users are blocked by RLS from posting.
3. `npm run build` and `npm run lint` pass with 0 errors.

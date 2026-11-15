# Spec: Task 2 - Database Schema & Security (Supabase Migrations)

## Purpose
Design and implement the production Supabase PostgreSQL schema, relational tables, constraints, indexes, Row Level Security (RLS) policies, storage buckets, and trigger functions for automatic karma calculation, vote counters, and Reddit-style `hot_score` decay.

## Inputs
- Complete entity definitions:
  - `profiles`: user metadata and aggregate karma
  - `communities`: subreddit-equivalent discussion spaces with unique lowercase names (3-21 chars)
  - `community_members`: member subscriptions and counts
  - `community_moderators`: creator and added moderators with role hierarchy
  - `community_rules`: numbered community-specific rules
  - `community_bans`: banned users prevented from posting/commenting
  - `posts`: text, image, and link posts with hot/new/top sorting metrics, pin limits, and soft deletes
  - `comments`: recursive parent-child threads with depth tracking
  - `votes`: atomic upvotes (+1) and downvotes (-1) on posts and comments
  - `notifications`: reply and moderation alerts
  - `storage.buckets`: `post-media` and `avatars`
- Security Rules: Row Level Security on every table; strict ownership and moderator controls.

## Outputs
- `supabase/migrations/20261115000001_initial_schema.sql`: Core relational tables, foreign keys, unique constraints, and search indexes.
- `supabase/migrations/20261115000002_triggers_and_functions.sql`:
  - `handle_new_user()` trigger on `auth.users`
  - `handle_vote_change()` trigger on `votes` updating scores, up/down counts, target author karma, and `hot_score`
  - `handle_comment_count_change()` trigger on `comments` updating post `comments_count`
  - `handle_member_count_change()` trigger on `community_members` updating community `members_count`
  - `check_pinned_post_limit()` trigger enforcing maximum 2 pinned posts per community
- `supabase/migrations/20261115000003_storage_and_rls.sql`: Full RLS policies for all tables and Supabase Storage bucket security.
- `src/types/database.types.ts`: Exhaustive TypeScript types reflecting all tables, rows, inserts, updates, and enum types.

## Edge Cases
- **Vote Flipping**: When a user switches from upvote (+1) to downvote (-1), the delta is -2 on score and author karma. When unvoting, delta reverses.
- **Soft Deletion Integrity**: Removing a post or comment keeps its ID and subtree intact while masking title/content/author as `[deleted]`.
- **Pin Cap**: Communities can only pin up to 2 active posts at any given time.
- **Banned User Enforcement**: Banned users are rejected at the RLS database level when attempting to post or comment in that community.
- **Full-Text Search Indexing**: Posts table includes a generated `tsvector` column (`fts`) over `title` and `content_text` with GIN indexing for high-speed search queries.

## Acceptance Criteria
1. Migrations execute cleanly in standard PostgreSQL syntax.
2. Full RLS enabled on all 10 tables with zero bypass paths.
3. TypeScript database definitions export all entity types without `any`.
4. `npm run build` and `npm run lint` pass with zero errors.

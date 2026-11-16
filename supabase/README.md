# Curia Supabase Database Layer

This directory contains the PostgreSQL migrations, database functions, triggers, Row Level Security (RLS) policies, and test scripts for **Curia**.

---

## 📁 Migration Structure

The migrations in `supabase/migrations/` are numbered and must be executed in sequential order:

1. **`00001_initial_schema.sql`**:
   - Enables PostgreSQL extensions (`uuid-ossp`, `pgcrypto`, `citext`, `ltree`).
   - Creates the 9 core relational tables: `profiles`, `communities`, `community_members`, `community_bans`, `posts`, `comments`, `votes`, `notifications`, `reports`.
   - Creates performance indexes including compound indexes and GIN full-text search index on `posts.search_tsv`.

2. **`00002_triggers_and_functions.sql`**:
   - `handle_new_user()`: Automatically provisions `profiles` on `auth.users` insert, deriving a unique username with collision resolution.
   - `handle_new_community()`: Assigns the community creator as `moderator` in `community_members`.
   - `handle_member_count()`: Increments/decrements `communities.member_count` on membership change.
   - `handle_comment_count()`: Increments/decrements `posts.comment_count` on comment change.
   - `set_comment_path_and_depth()`: Computes materialized tree path and depth for recursive threaded comments.
   - `handle_vote_change()`: Adjusts `posts.score`, `comments.score`, and author `profiles.karma` based on vote deltas.
   - `calculate_hot_rank()`: Reddit-style logarithmic decay algorithm with temporal epoch offset.
   - `handle_comment_notification()`: Generates notifications for parent comment or post authors (skipping self-replies).
   - `is_community_moderator()`: Security helper for RLS policies.
   - `vote()`: Atomic RPC function to insert, switch, or remove votes (`value: 0` cancels vote).

3. **`00003_storage_and_rls.sql`**:
   - Enables Row Level Security (RLS) on all tables with explicit read/insert/update/delete policies.
   - Configures storage buckets `post-images` and `avatars` (public-read, 5MB limit, image mime-types) with folder-based owner upload policies (`<uid>/<filename>`).

---

## 🚀 How to Run Migrations

### Option A: Via Supabase Web Dashboard (Recommended for Free Tier)
1. Navigate to your project on [database.new](https://database.new) or [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the left sidebar.
3. Open and run each migration in order:
   - Paste and run `00001_initial_schema.sql`
   - Paste and run `00002_triggers_and_functions.sql`
   - Paste and run `00003_storage_and_rls.sql`
4. Run `supabase/tests.sql` to verify database integrity.

### Option B: Via Supabase CLI
```bash
# Link your project
supabase link --project-ref <your-project-id>

# Apply pending migrations
supabase db push

# Or for local development
supabase start
supabase db reset
```

---

## 🧪 Testing the Database Layer

Execute `supabase/tests.sql` in the Supabase SQL Editor. It validates:
1. Voting idempotency (voting twice does not double-count).
2. Voting delta flip (switching an upvote to a downvote moves the score by 2).
3. RLS ban enforcement (banned users are blocked from inserting posts in that community).

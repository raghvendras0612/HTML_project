# Curia Deployment Guide — 100% Free-Tier Architecture

This guide covers deploying **Curia** to production using **Vercel** (Frontend / SSR) and **Supabase** (Database, Auth, Storage, Realtime), paired with **Google AI Studio** for Gemini features. Curia operates strictly within standard free tiers with zero ongoing cost.

---

## 📋 Overview of Free Tiers

| Service | Component | Free Tier Capacity |
| :--- | :--- | :--- |
| **Vercel** | Next.js 15 App Router | 100 GB Bandwidth/mo, Unlimited Serverless Functions |
| **Supabase** | Postgres Database | 500 MB database, 50,000 monthly active auth users |
| **Supabase Storage** | Image uploads (`post-media`) | 1 GB file storage, 2 GB egress/mo |
| **Google AI Studio** | Gemini Flash API (`gemini-2.5-flash`) | 15 RPM (Requests Per Minute), 1M TPM, 1,500 RPD free |

---

## 🚀 Part 1: Supabase Setup (Database, Storage & Auth)

### 1. Create a Free Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **"New Project"**.
3. Choose an organization, enter a name (e.g., `curia-forum`), set a strong database password, and pick a region close to your primary users.
4. Select the **Free Tier**.

### 2. Run Database Migrations in SQL Editor
Navigate to the **SQL Editor** tab in your Supabase dashboard and execute the migration files located in `supabase/migrations/` in sequential order:

#### Step 2.1: Initial Schema (`supabase/migrations/20261115000001_initial_schema.sql`)
Creates the 10 relational tables (`profiles`, `communities`, `community_members`, `community_moderators`, `community_rules`, `community_bans`, `posts`, `comments`, `votes`, `notifications`), indexes, and generated `fts` full-text search tsvector.

#### Step 2.2: Triggers and Business Logic (`supabase/migrations/20261115000002_triggers_and_functions.sql`)
Creates the automated triggers:
- `calculate_hot_score()` (Reddit logarithmic decay algorithm)
- `handle_vote_change()` (Atomic post/comment score & karma calculation)
- `handle_comment_count_change()`
- `handle_member_count_change()`
- `check_pinned_post_limit()` (Enforces max 2 pinned posts per community)
- `handle_new_user()` (Auto-provisions profile row upon Supabase Auth signup)

#### Step 2.3: Storage and Row Level Security (`supabase/migrations/20261115000003_storage_and_rls.sql`)
- Enables Row Level Security (RLS) across all tables with explicit SELECT/INSERT/UPDATE/DELETE policies.
- Creates public storage buckets `post-media` and `avatars` with file size (5MB) and mime-type constraints (JPEG, PNG, WEBP, GIF).

#### Step 2.4: Seed Dataset (Optional but Recommended) (`supabase/seed.sql`)
To populate your production demo with rich initial developer communities (`c/webdev`, `c/ai_engineers`, `c/startups`, `c/design_systems`, `c/typescript`), multi-level nested discussions, and votes, run `supabase/seed.sql`.

### 3. Retrieve Supabase API Credentials
Navigate to **Project Settings** → **API**:
1. Copy **Project URL** (e.g. `https://xyzcompany.supabase.co`).
2. Copy the **anon public** key (`eyJ...`).
> ⚠️ **Never expose the `service_role` secret key!** Curia enforces Row Level Security and uses only the public anon key with `@supabase/ssr` cookies.

---

## 🤖 Part 2: Google Gemini AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **"Get API Key"** and create a new key.
3. Keep the key handy for Vercel configuration.
4. Curia defaults to `gemini-2.5-flash` (or `gemini-1.5-flash`), which falls well within the free-tier rate limits.

---

## ⚡ Part 3: Deploy to Vercel

### 1. Push Repository to Git
Ensure your repository is pushed to GitHub, GitLab, or Bitbucket:
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### 2. Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New"** → **"Project"**.
3. Select your Curia repository.
4. Framework Preset: **Next.js** (auto-detected).
5. Root Directory: `./` (default).

### 3. Configure Environment Variables
Under the **Environment Variables** section, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-id>.supabase.co` | From Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase Project Settings |
| `GEMINI_API_KEY` | `AIzaSy...` | From Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Default Gemini model (optional) |

### 4. Deploy
Click **"Deploy"**. Vercel will build the Next.js 15 App Router application with static generation, Route Handlers, and Edge middleware.

---

## 🔐 Part 4: Configure Supabase Auth Callback URLs

Once your Vercel deployment completes:
1. In Supabase, go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel production domain:
   `https://<your-app-name>.vercel.app`
3. Under **Redirect URLs**, add:
   - `https://<your-app-name>.vercel.app/**`
   - `http://localhost:3000/**` (for local development)
4. (Optional) If enabling Google OAuth:
   - Go to **Authentication** → **Providers** → **Google**.
   - Enable Google, supply your Google Cloud Client ID and Secret, and copy the Supabase callback URL into Google Cloud Console.

---

## ✅ Part 5: Post-Deployment Smoke Test Checklist

Test the following user flows on your live deployment:

- [ ] **Home Feed**: Verify posts render with hot sorting and karma scores.
- [ ] **Authentication**: Open the Sign In modal; create a test account; verify profile provisioning.
- [ ] **Community Page**: Visit `c/webdev`; verify member count, rules, and scoped feed.
- [ ] **Create Community**: Click "+ Create Community"; enter name (e.g., `opensource`); verify lowercase validation.
- [ ] **Create Post**:
  - Text post with markdown.
  - Image post with file upload preview.
  - Link post with domain parsing.
- [ ] **Threaded Comments**:
  - Post a root comment.
  - Post nested replies; test collapsing guide lines.
  - Test nesting beyond depth 6 to verify the "Continue thread" link.
- [ ] **Voting**:
  - Upvote and downvote posts and comments; verify immediate optimistic count changes.
- [ ] **Gemini AI Features**:
  - Open a discussion; click **"Summarize with Gemini AI"** to see TL;DR and debate perspectives.
  - On the post submission page, observe smart community suggestions.
  - Test pre-publish quality check on draft submission.
- [ ] **Moderation**:
  - Visit `/moderation` with a community creator account; pin a post (verify 2 pin maximum); test soft-deletion.
- [ ] **Search**:
  - Press `/` or click search bar; search for keywords (e.g. `Next.js`); verify full-text search results across posts, communities, and users.
- [ ] **Mobile Responsiveness & Dark Mode**:
  - Toggle light/dark mode using top bar icon.
  - Resize viewport to mobile screen width; verify bottom navigation and slide-out drawer.

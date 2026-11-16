# Curia Production Deployment Guide

This guide walks you through deploying **Curia** to production using 100% free-tier services on **Vercel** (frontend & edge compute) and **Supabase** (PostgreSQL, Auth, Storage, and Realtime).

---

## 1. Prerequisites

Before starting, ensure you have:
1. A **GitHub** account.
2. A **Vercel** account ([vercel.com](https://vercel.com)).
3. A **Supabase** account ([supabase.com](https://supabase.com)).
4. A **Google AI Studio** API key ([aistudio.google.com](https://aistudio.google.com)).

---

## 2. Step 1: Push Code to GitHub

Initialize your git repository if not already done, commit all project files, and push to a new GitHub repository:

```bash
git init
git add .
git commit -m "feat: complete Curia discussion platform ready for production"
git branch -M main
git remote add origin https://github.com/<your-username>/curia.git
git push -u origin main
```

---

## 3. Step 2: Set Up Supabase Backend

1. Go to your **Supabase Dashboard** and create a new project (e.g. `curia-prod`). Choose a strong database password and your preferred AWS region.
2. Open the **SQL Editor** in the left sidebar.
3. Execute the SQL migrations in sequential order from `supabase/migrations/`:
   - Paste and run `00001_initial_schema.sql` (Creates core tables, foreign keys, and indexes).
   - Paste and run `00002_triggers_and_functions.sql` (Provisions automated triggers, karma scoring, and voting RPC).
   - Paste and run `00003_storage_and_rls.sql` (Enables Row Level Security on all tables and creates storage buckets `post-images` and `avatars`).
   - Paste and run `00004_ai_features.sql` (Creates `ai_cache` table and moderation columns).
4. Verify database integrity by running `supabase/tests.sql`. All test assertions should pass cleanly.

---

## 4. Step 3: Configure Supabase Auth & Google OAuth

### Site URL & Redirects
1. In your Supabase project, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your production Vercel domain:
   ```
   https://<your-curia-app>.vercel.app
   ```
3. In **Redirect URLs**, add the following wildcards:
   ```
   https://<your-curia-app>.vercel.app/**
   https://<your-curia-app>.vercel.app/auth/callback
   http://localhost:3000/**
   ```

### Google OAuth (Optional / Production Auth)
1. Go to the [Google Cloud Console](https://console.cloud.google.com) and create an **OAuth 2.0 Client ID** (Web application).
2. Under **Authorized redirect URIs**, enter your Supabase Auth callback URL:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
3. Copy the **Client ID** and **Client Secret** into your Supabase Dashboard under **Authentication** -> **Providers** -> **Google**, and toggle **Enable Provider**.

---

## 5. Step 4: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your `curia` repository from GitHub and click **Import**.
3. Keep the default settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Expand **Environment Variables** and configure the following 5 variables:

| Environment Variable | Description | Example / Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anonymous API key | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Google Gemini API Studio key | `AIzaSy...` |
| `GEMINI_MODEL` | Target Gemini multimodal model | `gemini-2.5-flash` |
| `NEXT_PUBLIC_SITE_URL` | Canonical production site URL | `https://<your-app>.vercel.app` |

> 🔒 **SECURITY NOTE ON SERVICE ROLE KEY**:
> The `SUPABASE_SERVICE_ROLE_KEY` is **NOT** needed in Vercel. Curia's runtime application code uses cookie-based user sessions (`@supabase/ssr`) and Row Level Security (RLS) enforcement. The service role key is reserved strictly for administrative seeding (`scripts/seed.ts`).

5. Click **Deploy**. Vercel will build and deploy Curia across its global Edge Network.

---

## 6. Step 5: Seed the Production Database

Once your Vercel deployment is active, run the idempotent seeding engine from your local machine to populate the demo communities, users, posts, and comments:

```bash
# Ensure your local .env.local points to your production Supabase project
npm run seed
```

This creates:
- 12 realistic demo engineers with bios and avatars (`demo1@curia.test` .. `demo12@curia.test`).
- 8 communities (`c/webdev`, `c/ai_tools`, `c/startups`, `c/design`, `c/gaming`, `c/books`, `c/fitness`, `c/askcuria`).
- 40 realistic posts (markdown, links, and images) with varied timestamps.
- 150 threaded comments with multiple depths and 12+ comment threads for AI summarization.
- Authentic vote distributions.

---

## 7. Step 6: Post-Deployment Verification

Verify your live production deployment:
1. Visit `https://<your-app>.vercel.app`:
   - Confirmed dark obsidian theme loaded by default.
   - Home feed populated with posts across Hot, New, and Top.
   - 8 communities listed in the sidebar.
2. Sign up or log in:
   - Email signup functions and creates a profile row in Supabase.
   - User menu displays username, karma, and theme toggle.
3. Test a post with 12+ comments:
   - Click `TL;DR with AI` to verify Gemini summarization and caching.
4. Test Content Safety:
   - Attempting to submit spam or threats triggers automated content advisory / inline block.
5. Mobile Responsiveness:
   - Verify hamburger drawer, bottom nav, and zero horizontal scrollbar on mobile viewports.

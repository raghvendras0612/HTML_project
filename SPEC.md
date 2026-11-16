# Curia Master Specification (SPEC.md)

## 1. Project Overview
Curia is a portfolio-grade, dark-first technical discussion forum inspired by Reddit. Built for maximum speed, reactivity, and aesthetic polish, Curia runs 100% on free-tier infrastructure (Vercel + Supabase + Google AI Studio).

---

## 2. Technology Stack
- **Framework**: Next.js 15 (App Router) + TypeScript in strict mode (`tsconfig.json`).
- **Styling**: Tailwind CSS + shadcn/ui primitives + Lucide React icons.
- **Backend & Database**: Supabase:
  - PostgreSQL with Row Level Security (RLS) on all tables.
  - Auth: Cookie-based email/password + Google OAuth session management via `@supabase/ssr`.
  - Storage: Public buckets (`post-media`, `avatars`) with size and mime-type restrictions.
  - Realtime: Postgres change streams for notifications and live score updates.
- **AI Integration**: Google Gemini API via official `@google/genai` SDK, invoked strictly from server Route Handlers. The model name is configurable via `GEMINI_MODEL` (defaulting to `gemini-2.5-flash`).
- **State Management & Data Fetching**: TanStack Query (React Query v5) for infinite feeds and optimistic updates.
- **Validation & Forms**: Zod for runtime schema validation on both client and server, React Hook Form with `@hookform/resolvers/zod`.
- **Deployment**: Vercel (frontend) + Supabase (backend). 100% free-tier compatible.

---

## 3. Product Features & Scope

### Communities
- Creator creates community; unique lowercase name, 3-21 chars (`^[a-z0-9_]{3,21}$`).
- Join / leave community toggle with instant optimistic member count update.
- Community rules and per-community scoped feeds (`/c/[community]`).

### Posts
- Three post types:
  - **Text**: Markdown formatted.
  - **Image**: Direct upload to Supabase Storage `post-media` bucket (5MB limit, JPEG/PNG/WEBP/GIF).
  - **Link**: Clean domain extraction and URL preview card.
- Title required (3-300 characters).

### Threaded Comments
- Unlimited recursive nesting depth in PostgreSQL.
- Indentation guide lines that highlight on hover and collapse whole subtrees on click.
- Automatic **"Continue thread →"** link rendered when comment nesting reaches depth 6 or deeper.
- Comment sorting: **Best**, **New**, **Old**, **Top**.

### Voting & Karma
- Atomic $\pm 1$ and $\pm 2$ upvote/downvote operations on posts and comments.
- 1 vote per user per item; toggling and flipping supported.
- Optimistic UI updates with rollback on network failure.
- User Karma counter automatically computed from votes received across posts and comments.

### Feeds & Sorting
- **Hot**: Decayed ranking via Reddit logarithmic decay (`hot_score`).
- **New**: Chronological ordering.
- **Top**: Filtered across multiple time horizons (**Today**, **This Week**, **This Month**, **This Year**, **All Time**).
- Cursor-based infinite scrolling with Intersection Observer sentinels.

### Google Gemini AI Integrations (Server-Only Route Handlers)
1. **Thread Summarizer** (`/api/gemini/summarize-thread`): Synthesizes long discussions into TL;DR, key technical takeaways, and debate perspectives.
2. **Quality & Toxicity Pre-Check** (`/api/gemini/check-content`): Pre-publish quality, spam, and tone screen.
3. **Smart Community Matchmaker** (`/api/gemini/suggest-communities`): Recommends relevant communities and tags based on draft title and content.

### Moderation & Discovery
- Creator / moderator dashboard (`/moderation`).
- Pin up to 2 announcements per community (`check_pinned_post_limit`).
- Soft-delete posts and comments (`is_removed`).
- Community user bans.
- GIN full-text search over posts (`fts` tsvector), communities, and users (`/search?q=...`), with global `/` shortcut.
- Notifications drawer for replies to posts/comments.

### Out of Scope (v1)
- Awards, coins, paid premium tiers, direct messages/chat, video posts, native mobile apps.

---

## 4. Design System & Tokens
- **Theme**: Dark-first by default with persisted light theme toggle (`next-themes`).
- **Color Tokens**:
  - `background`: `#0B0D12` (deep obsidian)
  - `surface`: `#12151C` (cards)
  - `surface-raised`: `#181C25` (elevated menus, toolbars, buttons)
  - `border`: `#232834` (crisp container boundaries)
  - `text`: `#E6E9F0` (primary body text)
  - `text-muted`: `#8B93A7` (metadata, timestamps)
  - `accent`: `#7C5CFF` (violet)
  - `accent-glow`: `#22D3EE` (cyan)
  - `upvote`: `#FF6B3D` (flame orange)
  - `downvote`: `#5B8CFF` (electric blue)
  - `danger`: `#F0506E` (errors, deletion)
  - `success`: `#2DD4A0` (confirmations)
- **Typography**: Inter for UI and JetBrains Mono for metadata, numbers, timestamps, and community handles.
- **Layout**: Sticky top bar (logo, search, create post, notifications, user menu), left sidebar (feeds, communities), central feed, and right sidebar (contextual info). Collapses into bottom nav and slide-out sheet on mobile.

---

## 5. Engineering & Security Rules
- Row Level Security (RLS) on all 10 tables. Never expose the service role key to the browser.
- Validate all user inputs on both client and server with Zod schemas.
- Fetch data in Server Components where possible; use Client Components only for interactivity.
- Implement cursor-based pagination with infinite scroll.
- Directory Structure:
  - `src/app`: Routes, layouts, and API Route Handlers.
  - `src/components`: UI primitives and feature components.
  - `src/lib/supabase`: `browser.ts`, `server.ts`, `middleware.ts`.
  - `src/lib/gemini`: Server Gemini client.
  - `src/hooks`: Custom React hooks.
  - `src/types`: TypeScript definitions.
  - `supabase/migrations`: SQL migrations and triggers.

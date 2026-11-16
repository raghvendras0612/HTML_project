# Curia — Modern Discussion Platform

Curia is a portfolio-grade, dark-first technical discussion forum inspired by Reddit. Built with the **Next.js 15 App Router**, **Supabase (Postgres, Auth, Storage, Realtime)**, **Tailwind CSS**, and **Google Gemini AI**, Curia is designed to run 100% on free-tier infrastructure while delivering a high-signal, reactive user experience.

---

## 🚀 Key Highlights & Architectural Features

### 1. Communities & Dynamic Feeds
- **Unique Community Names**: Lowercase, 3-21 chars, `^[a-z0-9_]+$`.
- **Feed Algorithms**:
  - **Hot**: Reddit-style logarithmic decay algorithm with temporal epoch scoring (`hot_score`).
  - **New**: Pure chronological ordering.
  - **Top**: Filtered across multiple time horizons (**Today**, **This Week**, **This Month**, **This Year**, **All Time**).
- **Cursor-Based Infinite Scrolling**: Powered by `@tanstack/react-query` and browser Intersection Observer sentinels.

### 2. Multi-Format Posts & Supabase Storage
- **Text Posts**: Markdown-supported formatting.
- **Image Posts**: Uploaded directly to the Supabase Storage `post-media` bucket with client-side drag-and-drop and instant previews.
- **Link Posts**: Domain parsing with verified external previews.

### 3. Unlimited-Depth Threaded Comments
- Recursive discussion hierarchy with **unlimited data depth** in PostgreSQL.
- Visual indentation guide lines that highlight on hover and collapse subtrees on click.
- Automatic **"Continue thread →" threshold UI** when nesting reaches depth 6 or greater to prevent horizontal compression on smaller screens.
- Comment sorting: **Best** (Wilson score / net upvote ratio), **New**, **Old**, and **Top**.

### 4. Atomic Voting & Optimistic UI
- Upvoting (`#FF6B3D`) and Downvoting (`#5B8CFF`) on both posts and comments.
- 1 vote per user per target: toggle off on re-click, smooth flip from up to down (applying dynamic $\pm 2$ deltas).
- Instant optimistic feedback with automatic rollback on network failure.
- User **Karma counter** automatically aggregated across all votes received.

### 5. Google Gemini AI Integrations (Server-Only Route Handlers)
All Gemini API interactions are powered by the official `@google/genai` SDK and invoked strictly from server route handlers (`process.env.GEMINI_MODEL`, defaulting to `gemini-2.5-flash`):
1. **Thread Summarizer** (`/api/gemini/summarize-thread`): Synthesizes long discussions into an executive TL;DR, bulleted technical takeaways, and divergent debate angles.
2. **Quality & Toxicity Pre-Check** (`/api/gemini/check-content`): Real-time pre-publish screen assessing tone constructiveness, spam signals, and toxicity scores.
3. **Smart Community Matchmaker** (`/api/gemini/suggest-communities`): Recommends relevant communities and tags with confidence ratings based on draft title and content.

### 6. Security & Row Level Security (RLS)
- **Zero-Bypass RLS**: Enabled on all 10 tables (`profiles`, `communities`, `community_members`, `community_moderators`, `community_rules`, `community_bans`, `posts`, `comments`, `votes`, `notifications`).
- Server actions and route handlers strictly enforce Zod validation schemas.
- The service role key is never exposed to client-side code.

### 7. Administrative Moderation & Discovery
- **Moderator Dashboard** (`/moderation`): Creator/moderators can soft-delete content, ban users, and pin up to 2 announcements per community.
- **Postgres Full-Text Search** (`/search?q=...`): GIN-indexed full-text search across posts (`fts` tsvector), communities, and user profiles.
- **Notification Drawer**: Interactive alerts bell with unread counter tracking replies and moderation notices.

---

## 🎨 Design System & Color Tokens

Curia is designed dark-first with an obsidian tech aesthetic, high WCAG AA contrast, and subtle violet/cyan glowing accents:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Background** | `#0B0D12` | Deep obsidian backdrop |
| **Surface** | `#12151C` | Card and component surfaces |
| **Surface-Raised** | `#181C25` | Elevated menus, toolbars, buttons |
| **Border** | `#232834` | Crisp 1px container boundary |
| **Text Primary** | `#E6E9F0` | High-contrast body text |
| **Text Muted** | `#8B93A7` | Timestamps, metadata, counts |
| **Accent (Violet)** | `#7C5CFF` | Primary actions and glows |
| **Accent-Glow (Cyan)**| `#22D3EE` | Secondary highlights and badges |
| **Upvote** | `#FF6B3D` | Flame orange vote highlight |
| **Downvote** | `#5B8CFF` | Electric blue downvote highlight |
| **Danger** | `#F0506E` | Warnings, delete actions, errors |
| **Success** | `#2DD4A0` | Confirmations, approvals |

**Typography**: Inter for UI text and JetBrains Mono for metadata, timestamps, community handles, and numerical vote counts.

---

## 🛠️ Stack & Architecture

- **Frontend**: Next.js 15 (App Router, React 19, Strict TypeScript)
- **Styling**: Tailwind CSS + Radix UI Primitives + Lucide Icons + `next-themes`
- **State & Caching**: TanStack Query (React Query v5) for infinite feeds and optimistic updates
- **Backend & Auth**: Supabase Postgres + `@supabase/ssr` for cookie-based session management
- **AI**: `@google/genai` (Gemini 2.5 Flash / Gemini 1.5 Flash via server route handlers)
- **Validation**: Zod + React Hook Form

---

## 📦 Project Structure

```
├── specs/                   # Compartmentalized task specifications
├── src/
│   ├── app/
│   │   ├── api/             # Server route handlers (feed, posts, votes, comments, gemini, search)
│   │   ├── c/[community]/   # Community feeds and thread views
│   │   ├── moderation/      # Moderator dashboard
│   │   ├── search/          # Full-text search page
│   │   ├── submit/          # Post creation flow
│   │   ├── globals.css      # Custom design tokens, scrollbars, and glows
│   │   └── layout.tsx       # Root layout with ThemeProvider, QueryProvider, AuthProvider
│   ├── components/
│   │   ├── auth/            # AuthModal and UserMenu
│   │   ├── comment/         # Recursive CommentItem, CommentTree, CommentForm
│   │   ├── community/       # CreateCommunityModal
│   │   ├── feed/            # FeedList, PostCard, SortTabs
│   │   ├── gemini/          # ThreadSummarizer
│   │   ├── layout/          # AppShell, TopBar, LeftSidebar, RightSidebar, MobileNav
│   │   ├── notifications/   # NotificationsDrawer
│   │   └── ui/              # Button, Card, Dialog, Tabs, Input, Badge, Skeleton
│   ├── context/             # AuthContext with live & mock support
│   ├── lib/
│   │   ├── gemini/          # Google Gen AI server client
│   │   ├── supabase/        # SSR browser, server, and middleware clients
│   │   ├── mock-data.ts     # Rich seed discussions and profile mocks
│   │   └── utils.ts         # Formatting and styling helpers
│   └── types/               # Database definitions and view models
└── supabase/
    ├── migrations/          # Schema, Triggers, RLS, and Storage policies
    └── seed.sql             # SQL seed dataset
```

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd HTML_project
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-2.5-flash
```

> **Note**: Curia features zero-config mock fallback mode. If `.env.local` is not configured, Curia automatically runs with interactive in-memory mock discussions (`MOCK_POSTS`, `MOCK_COMMUNITIES`) allowing full UI verification without credentials.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view Curia in your browser.

### 4. Build & Type Check
```bash
npx tsc --noEmit
npm run lint
npm run build
```

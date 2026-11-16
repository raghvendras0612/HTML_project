# Spec: Phase 3 — Communities and Posts

## Purpose
Build the full community lifecycle (creation with live uniqueness check and rules editor, `/c/[name]` community hub, explore page `/communities`), post creation engine with markdown preview and Supabase Storage uploads (`/submit`), interactive post cards with optimistic voting and pinned badges, full post detail page `/c/[name]/post/[id]` with moderator controls, and cursor-paginated infinite feeds (Home, Popular, All) with Hot/New/Top sorting and membership join-gates.

## Inputs
- `SPEC.md` and Database migrations 00001–00003 (`communities`, `community_members`, `community_bans`, `posts`, `votes`).
- Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`).
- Packages: `react-markdown`, `remark-gfm`, `zod`, `react-hook-form`, `@tanstack/react-query`, `lucide-react`, `date-fns`, `sonner`.

## Component & Route Breakdown

### 1. Communities
- **Validation Schema**:
  - `name`: 3-21 chars, lowercase alphanumeric + underscore `^[a-z0-9_]{3,21}$`.
  - `title`: 1-100 chars.
  - `description`: max 500 chars.
  - `rules`: jsonb array of up to 10 `{ title: string; body: string }` objects.
- **Routes & Components**:
  - `src/app/(main)/communities/create/page.tsx`: Dedicated community creation page (and modal integration) with live debounced uniqueness check against `/api/communities/check-name`.
  - `src/app/(main)/communities/page.tsx`: Explore communities directory with search input and responsive grid of community cards.
  - `src/app/(main)/c/[community]/page.tsx`: Scoped community page with banner, icon, title, member count, optimistic Join/Leave button, description, rules list, and community feed with sort tabs.
  - Sidebar integration: Left sidebar lists joined communities; Right sidebar lists top 5 trending communities by `member_count`.

### 2. Posts & Feeds
- **Validation Schema**:
  - `community_id`: valid UUID, user must be a non-banned member.
  - `title`: required, 1-300 characters.
  - `type`: `'text' | 'image' | 'link'`.
  - `body`: markdown text (for text posts).
  - `image_path`: storage path in `post-images` bucket (for image posts).
  - `url`: valid URL string (for link posts).
- **Routes & Components**:
  - `src/app/(main)/submit/page.tsx`: Post creation page with community selector, tabs for Text (Write/Preview toggle), Image (drag-and-drop upload to `post-images/<uid>/...`), and Link (URL validation + domain preview).
  - `src/app/(main)/c/[community]/submit/page.tsx`: Preselected community post creation route.
  - `src/app/(main)/c/[community]/post/[id]/page.tsx`: Full post detail page with markdown renderer, vote column, delete/edit for author, and remove/pin/unpin for moderators.
  - `src/components/feed/post-card.tsx`: Feed card with atomic optimistic voting, pinned badge, relative timestamp, comment count, and share link.
  - `src/components/feed/feed-list.tsx`: Cursor-paginated infinite scroll feed using `@tanstack/react-query` and Intersection Observer.
  - `src/components/feed/sort-tabs.tsx`: Hot, New, Top (day, week, month, year, all).

### 3. Join-Gate & Ban Enforcement
- Posting to `/submit` verifies the user is a joined member and not banned. If not a member, displays "Join this community to post" prompt. If banned, displays clear error message.

## Acceptance Criteria
1. Can create a community with rules and optional icon, becoming moderator and member.
2. `/c/[name]` displays community header, rules in right sidebar card, and scoped feed.
3. `/communities` lists all communities with search filtering.
4. Can publish Text (markdown rendered), Image (uploaded to `post-images`), and Link posts.
5. Post card displays vote controls, author/community in monospace font, and pinned badge.
6. Pinned posts sit on top of community feed.
7. Post detail page `/c/[name]/post/[id]` allows author deletion/edit and moderator pin/remove.
8. Infinite scroll feeds support Home, Popular, All with Hot/New/Top sorting.
9. `npm run build` and `npm run lint` pass with 0 errors.

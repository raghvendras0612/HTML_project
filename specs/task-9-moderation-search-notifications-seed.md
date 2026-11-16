# Spec: Task 9 - Moderation, Search, Notifications & Seed Data

## Purpose
Build discovery, administrative moderation, notification workflows, and rich seed data:
1. **Full-Text Search Engine** (`/search?q=...`): Postgres `tsvector` queries across posts, fuzzy matching on communities, and user lookup.
2. **Community Moderation System** (`/moderation` and inline moderator tools):
   - Pin / unpin posts (enforcing maximum 2 pinned posts per community)
   - Soft-delete posts / comments (`is_removed = true`)
   - Ban / unban abusive users from specific communities
3. **Interactive Notifications System** (`/api/notifications`):
   - Notification bell in header with unread badge counter
   - Drawer slide-out listing replies and moderation alerts
   - Instant "Mark as read" interaction
4. **Comprehensive Seed Data** (`supabase/seed.sql`):
   - Production SQL seed populating realistic Developer & AI ecosystems (`c/webdev`, `c/ai_engineers`, `c/startups`, `c/design_systems`, `c/typescript`) with rich multi-level threaded discussions so the platform is never empty.

## Inputs
- Search query string `q`
- Moderator action payload:
  - `action`: `'pin' | 'unpin' | 'remove_post' | 'remove_comment' | 'ban_user' | 'unban_user'`
  - `community_id`: UUID
  - `target_id`: UUID
- Notification IDs to mark as read

## Outputs
- `src/app/search/page.tsx`: Search results interface with Posts, Communities, and Users tabs.
- `src/app/api/search/route.ts`: Server route executing Postgres FTS on `posts.fts` and ILIKE matches on communities and profiles.
- `src/app/moderation/page.tsx`: Moderator dashboard displaying community health, pending queue, pinned posts, and ban roster.
- `src/app/api/moderation/route.ts`: Server route enforcing moderator privileges before executing moderation actions.
- `src/components/notifications/notifications-drawer.tsx`: Accessible sliding notification drawer.
- `src/app/api/notifications/route.ts`: Route handler for notification retrieval and read status updates.
- `supabase/seed.sql`: Complete SQL seed dataset.

## Edge Cases
- **Pin Cap Rejection**: Attempting to pin a 3rd post returns 400 Bad Request with "A community can pin at most 2 posts simultaneously."
- **Authorization Verification**: Server-side check verifies caller is creator or moderator before allowing any moderation action.
- **Search Sanitization**: Queries with special characters (`&`, `|`, `!`, `:`) are sanitized to prevent Postgres syntax exceptions.
- **Unread Count Sync**: Marking notifications as read immediately updates the badge in `TopBar`.

## Acceptance Criteria
1. Full-text search returns matches against title and body with ranking.
2. Pinning is capped at 2 posts per community.
3. Notification drawer lists recent replies and allows marking read.
4. `supabase/seed.sql` contains valid PostgreSQL statements for instant staging.
5. `npm run build` and `npm run lint` succeed with zero errors.

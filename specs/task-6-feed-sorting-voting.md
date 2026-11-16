# Spec: Task 6 - Feeds, Sorting & Voting with Optimistic UI

## Purpose
Build high-performance, cursor-paginated discussion feeds with infinite scroll, sorting controls (Hot, New, Top with time filters: day, week, month, year, all), rich Post Cards (handling Text, Image, and Link previews), and atomic optimistic voting with instant visual state switching.

## Inputs
- Feed query parameters:
  - `sort`: `'hot' | 'new' | 'top'`
  - `time`: `'day' | 'week' | 'month' | 'year' | 'all'` (for Top sort)
  - `community`: optional community name filter
  - `cursor`: pagination cursor (hot_score or ISO timestamp)
  - `limit`: default 10 posts per page
- Vote mutation:
  - `target_id`: UUID
  - `target_type`: `'post' | 'comment'`
  - `vote_type`: `1` (upvote) or `-1` (downvote)

## Outputs
- `src/components/feed/sort-tabs.tsx`: Interactive bar switching between Hot (Flame), New (Clock/Sparkle), and Top (Trophy + Time filter dropdown: Today, This Week, This Month, This Year, All Time).
- `src/components/feed/post-card.tsx`:
  - Upvote `#FF6B3D` and Downvote `#5B8CFF` buttons with active states and instant score delta.
  - Community pill, author link, relative timestamp (`formatTimeAgo`), and pinned indicator.
  - Multi-content renderers for Text, Image (with click-to-expand), and Link (with external domain pill).
  - Footer actions: Comment count link, Share to clipboard with toast/status feedback.
- `src/components/feed/feed-list.tsx`: Infinite scroll container powered by `@tanstack/react-query` and browser Intersection Observer.
- `src/app/api/feed/route.ts`: Cursor-based feed API with SQL sorting for Hot (logarithmic hot_score), New (created_at DESC), and Top (score DESC filtered by date range).
- `src/app/api/votes/route.ts`: Atomic vote toggle and upsert route handler updating Postgres votes table.

## Edge Cases
- **Vote Flipping**: Upvote (+1) to Downvote (-1) applies -2 score delta; reversing applies +2; clicking same vote cancels and applies -1 or +1.
- **Optimistic Rollback**: If network or server call fails, vote state and score revert to previous snapshot seamlessly.
- **Top Filter Scoping**: Selecting 'Today' filters posts within last 24 hours; 'This Week' within 7 days; 'All Time' unbounded.
- **Demo Mode**: When live Supabase is unconfigured, feed serves `MOCK_POSTS` with local in-memory vote toggle and sorting.

## Acceptance Criteria
1. Clicking upvote increments score by 1 and colors button orange `#FF6B3D`.
2. Clicking downvote decrements score by 1 and colors button blue `#5B8CFF`.
3. Selecting Hot sorts by `hot_score DESC`; New sorts by `created_at DESC`; Top sorts by `score DESC`.
4. Infinite scroll loads additional pages smoothly when sentinel enters viewport.
5. `npm run build` and `npm run lint` succeed with zero errors.

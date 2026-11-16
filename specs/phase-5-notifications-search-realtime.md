# Phase 5 Specification: Notifications, Search, Realtime Updates & User Hover Cards

## 1. Overview & Purpose
Phase 5 completes Curia's live communication, discovery, and social loop by introducing:
1. **Live Notifications**: Unread count badge (capped at 9+), dropdown preview, scroll-to-comment deep linking, and full `/notifications` page.
2. **Supabase Realtime Streams**: Live notification toasts, post comment streams with non-disruptive "N new comments" pills, and live post score updates on feeds.
3. **Multi-Domain Full-Text Search**: Top bar 250ms debounced search popover, comprehensive `/search?q=...` page powered by Postgres GIN `search_tsv` and `websearch_to_tsquery`, and keyboard-driven Cmd/Ctrl+K command palette.
4. **User Reputation & Hover Cards**: Consistent karma displays and interactive hover cards with bio, join date, and reputation stats.

---

## 2. Decomposed Tasks & Scope

### Task 1: Notifications Backend & Full Page (`/api/notifications` & `/notifications`)
- **Purpose**: Enable users to view, paginate, and bulk-mark notifications.
- **Inputs**: User session JWT, query parameters (`limit`, `offset`, `unread_only`).
- **Outputs**: Enriched notification list with sender profiles and target post/comment links.
- **Edge Cases**: Unread count when 0; deleted parent posts/comments; malicious user attempting to read another user's notifications (blocked by RLS & API).
- **Acceptance Criteria**:
  - `/api/notifications` returns 200 with enriched records.
  - `/notifications` renders infinite scroll list with "Mark all as read" button.

### Task 2: Top Bar Notifications Bell & Dropdown (`TopBar`, `NotificationsDropdown`)
- **Purpose**: Provide glanceable awareness of replies directly in the app shell.
- **Inputs**: User unread notifications stream.
- **Outputs**:
  - Unread badge capped at `9+` (hidden if 0).
  - Dropdown showing latest 10 notifications with snippet, relative time, and sender avatar.
  - Link to `/notifications`.
- **Edge Cases**: Long snippets truncated cleanly; click marks notification read and navigates to exact comment with highlight animation.
- **Acceptance Criteria**:
  - Badge updates immediately on read.
  - Target comment scrolls into viewport and glows with accent border for 2.5 seconds.

### Task 3: Reusable Realtime Hook (`useRealtimeChannel`) & Live Notifications
- **Purpose**: Manage Supabase WebSocket subscriptions safely with automatic cleanup and reconnects.
- **Inputs**: Table name, filter clause, event type (`INSERT`, `UPDATE`, `*`), and callback handler.
- **Outputs**: Subscription status, active channel handle, unsubscribe method.
- **Edge Cases**: Component unmount before socket open; reconnect on network drop; RLS boundary enforcement.
- **Acceptance Criteria**:
  - New reply triggers toast: *"u/name replied to your comment in c/testlab"*.
  - Unread count badge increments in real time without page reload.

### Task 4: Post Detail Realtime Comments & "N new comments" Pill
- **Purpose**: Deliver incoming comments on the post detail page without disrupting reader scroll position or collapse states.
- **Inputs**: `postgres_changes` `INSERT` on `comments` where `post_id = eq.[id]`.
- **Outputs**: Floating pill at top of comment tree: *"N new comments"*.
- **Edge Cases**: Author's own comments (avoid duplicate addition); clicking pill merges comments and recalculates tree while preserving collapsed branches.
- **Acceptance Criteria**:
  - Pill appears within seconds when another window posts a reply.
  - Clicking pill updates the tree seamlessly.

### Task 5: Feed Realtime Post Score Updates
- **Purpose**: Keep post scores synchronized live as users vote across the platform.
- **Inputs**: `postgres_changes` `UPDATE` on `posts` matching visible IDs.
- **Outputs**: Score counters animate and update without shifting list order or reloading images.
- **Edge Cases**: Feeds with 20+ posts; rapid score fluctuations.
- **Acceptance Criteria**:
  - Voting in window A immediately reflects in window B's post score.

### Task 6: High-Performance Full-Text Search Backend (`/api/search`)
- **Purpose**: Provide fast, multi-domain search across Posts, Communities, and Users.
- **Inputs**: Query string `q`, tab filter (`posts`, `communities`, `users`), sort (`relevance`, `new`, `top`), limit, offset.
- **Outputs**:
  - Posts: Matched on `search_tsv` via `websearch_to_tsquery('english', q)` with matched title headline.
  - Communities: Matched on name, title, description.
  - Users: Matched on username and display name.
- **Edge Cases**: Special punctuation in queries; empty query; zero results.
- **Acceptance Criteria**:
  - Searches for words in title and body match expected posts.
  - Response time under 100ms.

### Task 7: Search UI: Debounced Popover, Command Palette & `/search`
- **Purpose**: Seamless discovery via typing or keyboard shortcuts.
- **Inputs**: Search input value, debounced by 250ms; keyboard Cmd/Ctrl+K.
- **Outputs**: Instant results dropdown; full `/search?q=...` results view with tab switching and sort.
- **Edge Cases**: Rapid typing cancels pending requests; mobile viewport adaptability.
- **Acceptance Criteria**:
  - Typing in top bar opens popover with categorized results.
  - Pressing Enter opens `/search?q=...`.
  - Cmd/Ctrl+K opens command palette with quick navigation links.

### Task 8: User Karma Hover Card Component (`UserHoverCard`)
- **Purpose**: Display user reputation, bio, and join date on hover over any username.
- **Inputs**: Username, initial profile cache.
- **Outputs**: Radix HoverCard containing avatar, karma badge, join date, and bio snippet.
- **Edge Cases**: Anonymous/deleted comments (do not show card); hover trigger delay/dismiss timing.
- **Acceptance Criteria**:
  - Hovering username shows card after 200ms delay.
  - Shows accurate karma and join date.

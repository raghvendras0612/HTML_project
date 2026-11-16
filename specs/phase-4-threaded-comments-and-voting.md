# Spec: Phase 4 — Threaded Comments and Voting

## Purpose
Build a high-performance, resilient discussion system featuring reusable optimistic voting across posts and comments, deep recursive threaded comments (with indentation collapse, inline replies, and depth 6+ focused thread links), community moderation tools (comment removal, user banning, and reports dashboard at `/c/[community]/mod/reports`), and user activity tabs on `/u/[username]`.

---

## Inputs
- `SPEC.md` specification for voting, threaded comments, moderation, and profile views.
- PostgreSQL schema: `posts`, `comments`, `votes`, `community_bans`, `reports`, `profiles`.
- TanStack Query v5 for optimistic cache updates and rollback.
- Components: `src/components/ui/` (buttons, dialogs, dropdowns, badges, textareas, avatars).

---

## Outputs & Deliverables
1. `src/components/common/vote-buttons.tsx`: Reusable TanStack Query-powered voting buttons component.
2. `src/components/comment/comment-form.tsx`: Markdown composer with Write/Preview tabs, 10,000 char counter, and ban-gate message.
3. `src/components/comment/comment-item.tsx` & `src/components/comment/comment-tree.tsx`: Recursive comment rendering with clickable collapse rails, `[+] N replies`, inline replies, and soft-delete/moderator-remove placeholder states.
4. `src/app/(main)/c/[community]/post/[id]/comment/[commentId]/page.tsx`: Deep thread continuation view for comments nested at depth 6+.
5. `src/components/post/report-dialog.tsx`: Report dialog for reporting posts and comments.
6. `src/app/(main)/c/[community]/mod/page.tsx` & `src/app/(main)/c/[community]/mod/reports/page.tsx`: Moderator management and reports triage center.
7. `src/app/(main)/u/[username]/page.tsx`: Profile page updated with Posts and Comments tabs.
8. API endpoints:
   - `POST /api/votes`: Atomic voting with toggle off, post/comment score update, author karma sync.
   - `GET /api/comments`, `POST /api/comments`, `PATCH /api/comments/[id]`, `DELETE /api/comments/[id]`.
   - `POST /api/reports`, `GET /api/reports`, `PATCH /api/reports/[id]`.
   - `POST /api/communities/[name]/bans`, `GET /api/communities/[name]/bans`.

---

## Edge Cases & Acceptance Criteria

### 1. Voting Edge Cases
- **Self-toggling:** Clicking upvote when already upvoted removes vote (score delta $-1$, vote value $0$).
- **Flipping:** Clicking downvote when upvoted switches vote (score delta $-2$, vote value $-1$).
- **Anonymous user:** Clicking vote arrow does not mutate server; immediately triggers auth modal (`openAuthModal("signin")`).
- **Concurrent votes:** Server handles atomic score recalculation and author karma updates; scores are never computed as truth on the client.

### 2. Comments Edge Cases
- **Ban restriction:** Banned users in a community cannot create top-level comments or reply to existing comments (API returns `403 Forbidden`; UI displays persistent disabled state).
- **Deleted comments with replies:** A deleted comment that has child replies preserves its tree node and displays `[deleted]` without revealing original author or text. A deleted comment without replies is pruned.
- **Removed comments:** Moderator-removed comments display `[removed by moderators]`.
- **Deep nesting (Depth > 6):** Comments nested 6 levels deep display "Continue this thread →", opening the focused subtree view.
- **Tree building:** All comments for a post load in one query; hierarchy is assembled client-side into root comments and nested replies.

### 3. Moderation & Reports Edge Cases
- **Access control:** `/c/[community]/mod` and `/c/[community]/mod/reports` reject non-moderators with `403` or redirect to community home.
- **Report resolution:** Resolving a report updates `status: 'resolved'`; removing reported content marks `is_removed: true`.

---

## Decomposed Task Breakdown

1. **Task 4.1: Reusable `VoteButtons` Component & Batch Vote Querying**
   - Implement `src/components/common/vote-buttons.tsx` with optimistic TanStack Query mutation and rollback.
   - Replace legacy voting state in `PostCard`, `PostDetailView`, and `CommentItem` with `VoteButtons`.
   - Ensure `/api/votes` atomically updates target score and author karma.

2. **Task 4.2: Comment Composer & Ban-Gate Protection**
   - Enhance `CommentForm` with Write/Preview markdown tabs, 10,000 char counter, and disabled ban indicator.
   - Update `POST /api/comments` to check `community_bans` and reject banned users with `403`.

3. **Task 4.3: Threaded Comment Tree & Interactive Collapse Rails**
   - Refactor `CommentTree` and `CommentItem` to build tree hierarchy from path-ordered comments.
   - Clickable vertical indent guide lines with hover highlighting and thread collapse toggle displaying `[+] N replies`.
   - Inline reply box with immediate optimistic injection.

4. **Task 4.4: Deep Nesting Threshold & Focused Thread Page**
   - Render "Continue this thread →" at depth $\ge 6$.
   - Create route `/c/[community]/post/[id]/comment/[commentId]` rendering the selected comment and its sub-tree.

5. **Task 4.5: Comment Sorting & Deletion Lifecycle**
   - Implement comment sorting: Best (recency-weighted score), New, Old, Top with URL query sync (`?sort=`).
   - Implement `PATCH /api/comments/[id]` (body edit) and `DELETE /api/comments/[id]` (author delete / mod remove).
   - Display `[deleted]` for comments with active replies; display `[removed by moderators]` for removed comments.

6. **Task 4.6: Report System & Moderator Hub (`/c/[community]/mod`)**
   - Create `ReportDialog` for reporting posts and comments into `reports` table.
   - Create `/c/[community]/mod` (bans & mod list) and `/c/[community]/mod/reports` (open reports with Resolve / Remove).
   - Add "Ban user from community" and "Remove comment" actions in moderator dropdown menu.

7. **Task 4.7: User Profile Activity Tabs (`/u/[username]`)**
   - Update `/u/[username]` page to fetch user's posts and comments into dedicated tabs with links to their context.

8. **Task 4.8: Verification & Quality Gates**
   - Verify all tests: voting $\pm 1$/$\pm 2$/toggle, deep 7-level nesting, ban-gate enforcement, reports triage.
   - Verify `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with exit code 0.

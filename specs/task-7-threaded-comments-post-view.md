# Spec: Task 7 - Threaded Comments & Post Detail Page

## Purpose
Implement the full discussion post view (`/c/[community]/comments/[id]`), threaded recursive comment trees with unlimited database depth, collapsible branch guide lines, automatic "Continue thread" boundary UI for depth >= 6, inline comment reply boxes, comment voting (up/down), and comment sorting (Best, New, Old, Top).

## Inputs
- Route parameters:
  - `community`: community name slug
  - `id`: post UUID
- Comment Submission:
  - `post_id`: post UUID
  - `parent_id`: parent comment UUID or null
  - `content`: required string (min 1 char)
- Comment Sorting:
  - `'best'` (Wilson score / net upvotes)
  - `'new'` (chronological descending)
  - `'old'` (chronological ascending)
  - `'top'` (score descending)

## Outputs
- `src/app/c/[community]/comments/[id]/page.tsx`: Dedicated post detail view rendering the hero `PostCard`, top-level comment form, comment sorting tabs, and `CommentTree`.
- `src/components/comment/comment-form.tsx`: Form component with auto-expanding textarea, character validation, and inline reply support.
- `src/components/comment/comment-item.tsx`:
  - Visual vertical guide line with hover highlighting.
  - Click-to-collapse subtree toggle showing `[+ N replies collapsed]`.
  - Upvote and downvote buttons with optimistic score counters.
  - Reply button that toggles nested `CommentForm`.
  - "Continue this thread →" threshold indicator when `depth >= 6`.
- `src/components/comment/comment-tree.tsx`: Tree builder taking flat list of comments and constructing a hierarchical nested tree.
- `src/app/api/comments/route.ts`:
  - `GET`: fetches all comments for `post_id` with author profiles and user vote status.
  - `POST`: publishes comment, increments post comment count, and triggers reply notification.

## Edge Cases
- **Deep Nesting UI Overflow**: Comments past depth 6 switch to a compact "Continue thread →" view to prevent horizontal squishing on mobile screens.
- **Soft Deletion Tree Preservation**: A removed comment with active replies masks author and text (`[deleted]`) without deleting descendants.
- **Collapse Persistence**: Collapsing a parent hides all child comments and updates the toggle button label.
- **Demo Fallback**: When Supabase is unconfigured, renders `MOCK_COMMENTS` with local state management for adding replies and voting.

## Acceptance Criteria
1. Deeply nested comment threads (7+ levels) render correctly with vertical guide lines.
2. Clicking a guide line collapses the entire subtree.
3. Replying to a comment inserts the reply directly under the parent.
4. Comment voting increments/decrements scores optimistically.
5. `npm run build` and `npm run lint` succeed with zero errors.

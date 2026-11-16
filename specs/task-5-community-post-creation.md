# Spec: Task 5 - Communities & Post Creation Engine

## Purpose
Build the community creation dialog, dedicated community pages (`/c/[community]`), and the multi-tab post submission flow (`/submit` and `/c/[community]/submit`) supporting Text, Image (with Supabase Storage upload and instant preview), and Link posts with strict Zod validation on both client and server.

## Inputs
- Community Form:
  - `name`: 3-21 characters, lowercase alphanumeric and underscore (`/^[a-z0-9_]{3,21}$/`)
  - `title`: required, 3-100 characters
  - `description`: optional, up to 500 characters
- Post Form:
  - `community_id`: valid UUID
  - `title`: required, 1-300 characters
  - `content_type`: `'text' | 'image' | 'link'`
  - `content_text`: optional for image/link, markdown-compatible
  - `image_file`: JPEG, PNG, WEBP, GIF up to 5MB
  - `content_url`: valid HTTP/HTTPS URL

## Outputs
- `src/components/community/create-community-modal.tsx`: Accessible dialog with live name validation, format checks, and error handling.
- `src/app/c/[community]/page.tsx`: Dedicated community feed route with banner, header, description, rules, and feed selector.
- `src/app/submit/page.tsx`: Global and community-scoped post creation interface with 3 tabs (Text, Image, Link), image dropzone preview, and community picker.
- Server Route Handlers:
  - `src/app/api/communities/route.ts`: POST to create community with uniqueness check.
  - `src/app/api/posts/route.ts`: POST to publish posts with server-side Zod validation.
  - `src/app/api/upload/route.ts`: POST to upload post media to Supabase Storage bucket `post-media`.

## Edge Cases
- Invalid Community Name: Live feedback prevents uppercase, spaces, or illegal punctuation.
- Image Payload Verification: Enforces max 5MB size limit and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
- Banned User Guard: Validates against `community_bans` before allowing post creation.
- Supabase Unconfigured State: In local demo mode, posts and communities are saved to client state and mock store so the user can test the full flow without credentials.

## Acceptance Criteria
1. Community creation validates against `^[a-z0-9_]{3,21}$`.
2. Post creation form switches between Text, Image, and Link tabs.
3. Image tab renders client-side thumbnail preview on file selection.
4. `npm run build` and `npm run lint` succeed with zero errors.

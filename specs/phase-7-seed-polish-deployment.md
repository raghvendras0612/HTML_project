# Spec: Phase 7 — Database Seeding, Product Polish & Production Deployment

## Purpose
Complete the Curia platform by generating an idempotent, realistic multi-user demo dataset (12 users, 8 communities, 40 posts, 150 comments, votes, pins, and deep threads), applying comprehensive production polish (error/loading boundaries, styled 404, empty states, dynamic OG image generator, accessibility, performance optimization, about & guidelines pages, and creation rate limiting), and preparing complete deployment artifacts (DEPLOY.md, GitHub Actions CI, and security/RLS audit).

---

## 1. Scope & Modules

### Module A: Idempotent Database Seeding (`scripts/seed.ts`)
- **Inputs**: `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- **Outputs**:
  - `scripts/seed.ts`: Executable via `npm run seed` (`tsx scripts/seed.ts`).
  - `npm run seed:reset`: Cleanly removes demo users, posts, comments, communities, and votes.
  - **12 Demo Users**: Created via Supabase Admin Auth API (`demo1@curia.test` to `demo12@curia.test`) with usernames (`alex_dev`, `elena_ai`, `marcus_ux`, `sarah_sys`, `chen_code`, `olivia_data`, `david_ops`, `maya_sec`, `sam_frontend`, `nina_ml`, `lucas_rust`, `priya_cloud`), avatars, and technical bios.
  - **8 Communities**: `c/webdev`, `c/ai_tools`, `c/startups`, `c/design`, `c/gaming`, `c/books`, `c/fitness`, `c/askcuria` with descriptions, icons, and 3 explicit community rules each.
  - **40 Realistic Posts**: Varied post types (Text with markdown, Link with external domains, Image with picsum.photos), spread over the past 30 days. Pinned posts in at least two communities.
  - **150 Hierarchical Comments**: Recursive tree structures with depth up to 5+, including at least 2 threads with 12+ comments to showcase the AI Thread Summarizer.
  - **Realistic Voting & Karma**: Distributed upvotes and downvotes creating authentic post scores and author karma.

### Module B: Product Polish, Error Handling & Empty States
- **Loading & Error Boundaries**:
  - `src/app/loading.tsx`: Global skeleton loader matching Curia's 3-column obsidian layout.
  - `src/app/error.tsx`: User-friendly recovery interface with "Try again" button and navigation.
  - `src/app/not-found.tsx`: Custom styled 404 page in obsidian dark styling with search/home navigation.
- **Empty States**: Render informative `EmptyState` cards with icon, message, and call-to-action on every feed or list when items are absent.
- **Informational Pages**:
  - `/about`: Project mission, architectural overview, tech stack highlights, and open-source credits.
  - `/guidelines`: Community rules, civil discourse standards, and automated content moderation policies.
- **Rate Limiting**: Server-side enforcement restricting accounts to max 10 posts/hour and 60 comments/hour to prevent spam.

### Module C: SEO, Open Graph & Dynamic Card Generation
- **Dynamic OG Image**: `src/app/c/[community]/post/[id]/opengraph-image.tsx` using `next/og` (`ImageResponse`) rendering the post title, community badge, author username, and Curia wordmark in obsidian/violet styling.
- **Static SEO Files**:
  - `src/app/sitemap.ts`: Dynamic sitemap resolving all communities and top posts.
  - `src/app/robots.ts`: Crawl policies and sitemap reference.
- **Metadata**: Route-specific titles and Open Graph metadata templates for `/`, `/c/[community]`, `/c/[community]/post/[id]`, `/search`, `/notifications`, `/about`, `/guidelines`.

### Module D: Accessibility & Performance
- **Accessibility (WCAG AA)**:
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-accent`).
  - Meaningful `aria-label` attributes on icon-only buttons (theme toggle, vote arrows, bell, search).
  - Keyboard navigation for voting, comment collapsing, and modals.
  - Support for `prefers-reduced-motion`.
- **Performance**:
  - Dynamic code-splitting with `next/dynamic` for heavy client components (Command Palette, Markdown preview).
  - Next.js Image optimization (`next/image`) with remote patterns.

### Module E: Production Deployment & Verification
- **DEPLOY.md**: Step-by-step production setup guide for Vercel + Supabase free tiers.
- **GitHub Actions**: `.github/workflows/ci.yml` running lint, type-check, and build on push.
- **Security Audit**:
  - Validation that `SUPABASE_SERVICE_ROLE_KEY` is never exposed in client bundles or referenced in application runtime code.
  - Row Level Security (RLS) status confirmation on all database tables.
  - Final bundle size report and repository cleanliness.

---

## 2. Acceptance Criteria
1. `npm run seed` executes cleanly and idempotently, populating all 12 users, 8 communities, 40 posts, 150 comments, and distributed votes.
2. Home page (`/`) displays active, populated feeds across Hot, New, and Top filters.
3. Thread Summarizer is immediately functional on threads with 12+ comments.
4. Error boundary, styled 404, `/about`, and `/guidelines` pages render without console errors.
5. `npm run lint` and `npm run build` pass with zero warnings or errors.
6. `DEPLOY.md` and CI workflow provide a complete, verified deployment path.

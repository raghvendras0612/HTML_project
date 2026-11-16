# Spec: Task 10 - Production Hardening, Quality Gates & Verification

## Purpose
Execute final verification passes across the full Curia stack:
1. Strict TypeScript type check (`npx tsc --noEmit`).
2. Code style and ESLint validation (`npm run lint`).
3. Production compilation and bundle verification (`npm run build`).
4. End-to-end prototype integrity check (confirm all routes respond correctly, no uncaught exceptions).
5. Comprehensive documentation for reviewers and deployers (`README.md` and `DEPLOYMENT.md`).

## Inputs
- Next.js 15 App Router source code
- Supabase migrations and seed scripts
- Gemini AI server route handlers

## Outputs
- `README.md`: Architectural portfolio showcase, feature breakdown, design system tokens, and interactive testing guide.
- `DEPLOYMENT.md`: 100% free-tier deployment manual for Vercel + Supabase with environment variable matrix.
- Verification Report in conversation artifacts.

## Acceptance Criteria
1. `npx tsc --noEmit` exits with 0 errors.
2. `npm run lint` exits with 0 warnings/errors.
3. `npm run build` generates all static and dynamic endpoints with 0 errors.
4. Clean `git status` verifying repository hygiene.

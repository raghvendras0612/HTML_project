# Spec: Task 1 - Project Scaffolding & Design System Tokens

## Purpose
Initialize the Curia Next.js (App Router) codebase with strict TypeScript, install all essential dependencies, configure the dark-first custom design system tokens, typography (Inter + JetBrains Mono), theme provider, and establish foundational UI primitives.

## Inputs
- Next.js 15 App Router configuration
- Curia Design System Palette:
  - Background: `#0B0D12`
  - Surface: `#12151C`
  - Surface-Raised: `#181C25`
  - Border: `#232834`
  - Text: `#E6E9F0`
  - Text-Muted: `#8B93A7`
  - Accent: `#7C5CFF` (Curia violet)
  - Accent-Glow: `#22D3EE` (cyan)
  - Upvote: `#FF6B3D` (flame orange)
  - Downvote: `#5B8CFF` (electric blue)
  - Danger: `#F0506E` (crimson)
  - Success: `#2DD4A0` (emerald)
- Typography: Inter (UI text) + JetBrains Mono (counts, metadata, usernames, badges)

## Outputs
- Clean Next.js project scaffold with strict mode enabled in `tsconfig.json`.
- Secure `.gitignore` locking out all `.env*` files, node_modules, and cache.
- Configured CSS variables and Tailwind utilities in `src/app/globals.css`.
- Persistent `ThemeProvider` (`next-themes`) defaulting to `dark`.
- Core reusable UI components in `src/components/ui/`:
  - `Button` (variants: default/accent, outline, ghost, danger, upvote, downvote)
  - `Input` & `Textarea` (dark-first styles with violet/cyan focus rings)
  - `Badge` (metadata badges, community badges)
  - `Card` (surface, surface-raised, 1px border `#232834`, soft glow on hover)
  - `Skeleton` (dark placeholder loading pulse)
  - `Dialog` / Modal primitive (accessible dialog backdrop and container)
  - `DropdownMenu` (floating menu for user actions and filters)
  - `Avatar` (fallback initials and image handling)

## Edge Cases
- Hydration mismatch on initial HTML render for dark theme -> Mitigated via `suppressHydrationWarning` on `<html>` and NextThemes client provider.
- Node.js v26 compatibility -> Ensure packages installed are latest stable releases compatible with Node 20+.
- CSS variable inheritance and contrast in both dark and light modes -> Defined semantic variables mapped to exact hex codes.

## Acceptance Criteria
1. Project builds cleanly via `npm run build` with zero errors.
2. Lint check passes via `npm run lint` with zero errors.
3. Strict TypeScript type check passes (`npx tsc --noEmit`) with zero errors.
4. Repository hygiene verified with `git status` (no tracked secrets, `.env` files, or build artifacts).
5. All design tokens are accessible as CSS variables and Tailwind utility classes.

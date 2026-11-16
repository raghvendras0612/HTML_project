# Spec: Phase 2 — Design System, App Shell, and Authentication

## Purpose
Establish the Curia design system (tokens, typography, theme toggling, base components), responsive app shell (sticky glass top bar, command palette on Cmd+K, left & right sidebars, mobile drawer sheet, bottom navigation), and end-to-end authentication flow (Supabase Auth email/password + Google OAuth, route groups, onboarding username modal, profile page `/u/[username]` with avatar upload, and protected action hooks).

## Inputs
- `SPEC.md` design tokens & layout guidelines.
- Supabase Auth and `@supabase/ssr` client helpers.
- Next.js 15 App Router route groups: `(main)` and `(auth)`.
- Packages: `next-themes`, `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`.

## Component & Architecture Breakdown

### 1. Design System & Tokens
- **Theme Variables in `globals.css`**:
  - Dark default:
    - background: `#0B0D12`
    - surface: `#12151C`
    - surface-raised: `#181C25`
    - border: `#232834`
    - text: `#E6E9F0`
    - text-muted: `#8B93A7`
    - accent: `#7C5CFF` (violet)
    - accent-glow: `#22D3EE` (cyan)
    - upvote: `#FF6B3D`
    - downvote: `#5B8CFF`
    - danger: `#F0506E`
    - success: `#2DD4A0`
  - Light variant:
    - background: `#F8FAFC`
    - surface: `#FFFFFF`
    - surface-raised: `#F1F5F9`
    - border: `#E2E8F0`
    - text: `#0F172A`
    - text-muted: `#64748B`
    - accent: `#6D28D9`
    - accent-glow: `#0EA5E9`
- **Typography**: Inter (UI) and JetBrains Mono (metadata) loaded via `next/font/google`.
- **Reusable Primitives**:
  - `Logo`: Text wordmark 'curia' with glowing violet dot.
  - `Card`: Curia styled container with 1px border and hover effects.
  - `EmptyState`: Centered icon, title, description, and action button.
  - `PageSkeleton`: Shimmering placeholder layout.
  - `Spinner`: Smooth rotating SVG indicator.
  - `Avatar`: Image with initials fallback.

### 2. App Shell & Navigation
- **Route Groups**:
  - `src/app/(main)/layout.tsx`: App shell layout (top bar, 3-column desktop layout, mobile drawer + bottom nav).
  - `src/app/(auth)/layout.tsx`: Centered auth container layout with dark card styling.
- **TopBar**:
  - Logo.
  - Centered search input placeholder opening Command palette on `Cmd+K` / `Ctrl+K`.
  - Create Post button (prompts login if unauthenticated).
  - Notifications bell with unread badge placeholder.
  - UserMenu with avatar, username, karma, Theme Toggle (dark/light/system), Profile link, and Sign Out.
  - If unauthenticated: "Log in" and "Sign up" buttons.
- **Left Sidebar**:
  - Feeds: Home, Popular, All.
  - "Your communities" section with empty state and join/create hints.
- **Right Sidebar**:
  - Trending communities card placeholder.
  - Footer with About, Rules, Terms, and Privacy links.
- **Mobile Responsive Layout**:
  - Sidebars collapse into a `Sheet` drawer opened via hamburger menu in header.
  - Fixed bottom navigation: Home, Search (triggers Cmd+K palette), Create Post, Notifications, Profile/Login.

### 3. Authentication & User Management
- **Auth Pages**:
  - `src/app/(auth)/login/page.tsx`: Email + password form with Zod validation + Google OAuth button.
  - `src/app/(auth)/signup/page.tsx`: Email + password form (min 8 chars) + Google OAuth button + "check your email" toast/message.
- **OAuth Callback**:
  - `src/app/auth/callback/route.ts`: Exchanges code for session via `supabase.auth.exchangeCodeForSession()`, redirects to next/origin.
- **User Hooks & Server Helpers**:
  - `src/hooks/use-user.tsx` (`useUser`): React context & hook returning `user`, `profile`, `isLoading`, `signOut()`, and `requireAuth(actionCallback)`.
  - `src/lib/auth/get-user.ts` (`getUser`): Server-side helper using `supabase/server.ts` to get authenticated user and profile row.
- **Onboarding Modal**:
  - If a user logs in and their username starts with `user_` (auto-generated), prompt with `OnboardingModal` to set their permanent username and display name with real-time uniqueness validation.
- **Profile Page**:
  - `src/app/(main)/u/[username]/page.tsx`: User header (avatar, display name, `@username`, bio, karma badge, joined date), Posts & Comments tabs with EmptyStates.
  - Edit Profile dialog: update display name, bio, and upload avatar to Supabase Storage `avatars` bucket.

## Acceptance Criteria
1. Can sign up with email and password (validation enforced: valid email, password min 8).
2. Can initiate Google OAuth login.
3. Sign out cleans session and updates UI state instantly.
4. Auto-generated usernames prompt onboarding modal to set custom username.
5. Theme toggle switches between dark, light, and system without flash of unstyled content.
6. Responsive test passes at 375px (mobile), 768px (tablet), and 1440px (desktop).
7. `npm run build` and `npm run lint` pass with 0 errors.

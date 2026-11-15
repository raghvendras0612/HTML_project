# Spec: Task 3 - Auth & Supabase SSR Client Setup

## Purpose
Configure production cookie-based authentication with `@supabase/ssr` across Server Components, Route Handlers, Client Components, and Next.js Middleware. Build the authentication modal (Sign In / Sign Up with Email/Password and Google OAuth), user context hook (`useAuth`), header user menu with Karma counter, and seamless mock fallback support when live credentials are not yet populated.

## Inputs
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- User auth credentials:
  - Sign in: email + password
  - Sign up: username (3-21 chars `[a-z0-9_]`), email, password (min 6 chars)
- Google OAuth provider trigger

## Outputs
- `src/lib/supabase/client.ts`: Client-side browser Supabase factory via `@supabase/ssr`.
- `src/lib/supabase/server.ts`: Server-side Supabase client using Next.js 15 `cookies()` API.
- `src/lib/supabase/middleware.ts`: Token refresh handler updating request/response cookies.
- `src/middleware.ts`: Next.js root middleware attaching session cookies.
- `src/context/auth-context.tsx` & `src/hooks/use-auth.ts`: Authentication provider managing user state, profile, karma, login, signup, and logout.
- `src/components/auth/auth-modal.tsx`: Accessible dialog with Sign In / Sign Up tabs, Zod validation, error handling, and Google OAuth action.
- `src/components/auth/user-menu.tsx`: Header component displaying user avatar, username, current karma points, and sign-out option.
- `src/lib/mock-data.ts`: Mock profile and session data fallback allowing zero-config visual verification when live Supabase keys are pending.

## Edge Cases
- Missing Environment Variables: Checks if `NEXT_PUBLIC_SUPABASE_URL` is set; if unset or placeholder, operates in fallback mode without crashing the app or build.
- Cookie Chunks: Large session cookies handled via `@supabase/ssr` chunking protocol.
- Stale Session: Middleware proactively refreshes tokens before Server Components execute.
- Username Conflict on Registration: Trapped and communicated clearly to the user with actionable feedback.

## Acceptance Criteria
1. Next.js App Router middleware executes on appropriate paths without breaking static asset loading.
2. Auth modal renders with dark-first styling, focus trap, and WCAG AA contrast.
3. Sign In and Sign Up forms validate inputs via Zod schema before dispatching.
4. `npm run build` and `npm run lint` succeed with zero errors.

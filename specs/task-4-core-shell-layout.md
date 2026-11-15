# Spec: Task 4 - Core Shell & Responsive Layout

## Purpose
Construct the responsive three-column application layout and navigation systems:
1. Sticky top bar with subtle glassmorphism (`glass-header`), Curia logo, global search bar, Create Post button, Notifications bell with unread badge, Theme Toggle, and User Profile Menu.
2. Collapsible Left Sidebar for navigation across Feeds (Home, Popular) and Community directories.
3. Dynamic Right Sidebar displaying either Community Info & Rules (in community view) or Trending Communities & Forum Guidelines (in home view).
4. Mobile Navigation: Bottom tab bar for one-thumb mobile access plus a slide-over mobile drawer for community exploration.

## Inputs
- Current route context (`usePathname`)
- Authenticated user state (`useAuth`)
- Communities directory list (`MOCK_COMMUNITIES` / Supabase)
- Unread notification count

## Outputs
- `src/components/layout/theme-toggle.tsx`: Smooth sun/moon icon toggle persisted via `next-themes`.
- `src/components/layout/top-bar.tsx`: Sticky glassmorphic header with search bar, shortcuts, notification bell, and user menu.
- `src/components/layout/left-sidebar.tsx`: Left navigation menu with Feeds, Joined Communities, and Create Community modal trigger.
- `src/components/layout/right-sidebar.tsx`: Contextual right sidebar with dynamic Community card or Trending highlights.
- `src/components/layout/mobile-nav.tsx`: Fixed bottom tab bar and accessible slide-out mobile drawer for screens under 768px.
- `src/components/layout/app-shell.tsx`: Master layout orchestrator providing 3-column grid on desktop, 2-column on tablet, and single-column feed with bottom nav on mobile.

## Edge Cases
- Mobile Viewports (< 768px): Desktop sidebars hidden to prevent layout squishing; bottom nav bar anchored with padding bottom compensation on main scroll container.
- Keyboard Shortcut: Global `/` key focuses the search input.
- High Density Displays & Contrast: WCAG AA verified color pairings on `#0B0D12` dark and `#F8FAFC` light backgrounds.
- Search Input Responsiveness: Expanding search bar on mobile or dialog popup.

## Acceptance Criteria
1. Responsive layout adapts cleanly across 375px (mobile), 768px (tablet), 1280px (desktop), and 1536px (wide).
2. Theme toggle switches dark and light modes with zero flash.
3. Left and right sidebars stay statically positioned or sticky without overlapping feed content.
4. `npm run build` and `npm run lint` pass with zero errors.

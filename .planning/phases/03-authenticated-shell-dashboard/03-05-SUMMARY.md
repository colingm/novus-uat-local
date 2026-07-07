---
phase: 03-authenticated-shell-dashboard
plan: 05
subsystem: ui
tags: [react, mantine, applayout, appshell, router, navigation, pendo]

# Dependency graph
requires:
  - phase: 03-authenticated-shell-dashboard/03-02
    provides: NavLink primitive with pendoId:PendoId contract
  - phase: 03-authenticated-shell-dashboard/03-03
    provides: seedIfNeeded export from src/tasks/index.ts
  - phase: 03-authenticated-shell-dashboard/03-04
    provides: PENDO_IDS nav.* and topbar.* namespaces, 5 placeholder pages
  - phase: 03-authenticated-shell-dashboard/03-06
    provides: Dashboard component at src/dashboard/Dashboard.tsx
provides:
  - Mantine AppShell chrome (240px navbar + 56px header + Outlet) at src/routes/app/AppLayout.tsx
  - Full /app/* router tree: Dashboard (index) + lists/reports/team/settings/help named children
  - Top bar with Halo wordmark + workspace name + user menu (Profile/Settings/Sign out)
  - 6-item side nav with active-route detection (strict-equality for /app, startsWith for others)
  - Sign-out flow: useAuthStore.getState().signOut() then navigate('/', { replace: true })
  - seedIfNeeded(workspace.id) called via useEffect on first authenticated mount
affects:
  - Phase 04 (lists CRUD, settings, reports — all mount under this AppLayout)
  - Phase 05 (team, help — same)
  - Phase 06 (Pendo runtime — PendoRouteBridge slot reserved in AppLayout comment)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isNavActive helper: strict-equality for /app index; startsWith for all other routes (Phase 4 forward-compat)"
    - "useAuthStore.getState().signOut() direct call (not selector subscription) for one-shot sign-out"
    - "useEffect keyed on workspace?.id for seedIfNeeded — deliberate exception to module-init pattern"

key-files:
  created: []
  modified:
    - src/routes/app/AppLayout.tsx
    - src/router.tsx
  deleted:
    - src/routes/app/AppPlaceholder.tsx

key-decisions:
  - "03-05-D1: isNavActive uses strict-equality for /app and startsWith for all sub-routes — forward-compatible with Phase 4 detail routes like /app/lists/:id"
  - "03-05-D2: data-pendo-id on UnstyledButton (the actual clickable element), not on Menu.Target — per D-15"
  - "03-05-D3: No Burger component — desktop-only demo surface per D-11"
  - "03-05-D4: AppPlaceholder.tsx deleted via git rm — no dead code remains"

patterns-established:
  - "Active-nav pattern: isNavActive(pathname, target) helper — exact match for index, prefix match for all others"
  - "Shell sign-out: useAuthStore.getState().signOut() then navigate('/', { replace: true })"

requirements-completed:
  - SHELL-01
  - SHELL-03
  - SHELL-04

# Metrics
duration: 3min
completed: 2026-05-14
---

# Phase 3 Plan 05: Final Integration Summary

**Mantine AppShell with 240px navbar + 56px top bar wired to Dashboard index + 5 named children, with user menu (Profile/Settings/Sign out) and seedIfNeeded on first authenticated mount**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-14T~21:56:30Z
- **Completed:** 2026-05-14T~21:59:12Z
- **Tasks:** 2
- **Files modified:** 2 modified + 1 deleted

## Accomplishments

- Replaced Phase 1 placeholder AppLayout with a full Mantine AppShell (SHELL-01)
- Wired user menu with Profile/Settings/Sign out including auth-store sign-out flow (SHELL-03)
- /app route tree now has Dashboard as index + lists/reports/team/settings/help as named children
- isNavActive helper: strict-equality for /app dashboard, startsWith for all other routes (Phase 4 forward-compat)
- seedIfNeeded(workspace.id) runs via useEffect on first authenticated mount per workspace
- 12 data-pendo-id values all sourced from PENDO_IDS registry — zero hand-typed strings (PEN-07)
- AppPlaceholder.tsx deleted — no dead code

## Task Commits

1. **Task 1: Rewrite AppLayout as Mantine AppShell** - `56e72ab` (feat)
2. **Task 2: Update router.tsx + delete AppPlaceholder** - `8e60feb` (feat)

## data-pendo-id Placements (12 total)

| Element | PENDO_IDS leaf | Location |
|---------|---------------|----------|
| Halo wordmark Title | `topbar.logo` | AppShell.Header |
| Workspace name Text | `topbar.workspaceName` | AppShell.Header |
| User menu trigger UnstyledButton | `topbar.userMenu.button` | AppShell.Header |
| Profile menu item | `topbar.userMenu.profile` | Menu.Dropdown |
| Settings menu item | `topbar.userMenu.settings` | Menu.Dropdown |
| Sign out menu item | `topbar.userMenu.signout` | Menu.Dropdown |
| Dashboard NavLink | `nav.dashboard` | AppShell.Navbar |
| Lists NavLink | `nav.lists` | AppShell.Navbar |
| Reports NavLink | `nav.reports` | AppShell.Navbar |
| Team NavLink | `nav.team` | AppShell.Navbar |
| Settings NavLink | `nav.settings` | AppShell.Navbar |
| Help NavLink | `nav.help` | AppShell.Navbar |

## router.tsx Children Diff

**Before (Phase 1/2):**
```ts
children: [
  {
    Component: AppLayout,
    children: [
      { index: true, Component: AppPlaceholder },
    ],
  },
],
```

**After (Phase 3):**
```ts
children: [
  {
    Component: AppLayout,
    children: [
      { index: true,      Component: Dashboard },
      { path: 'lists',    Component: ListsPage },
      { path: 'reports',  Component: ReportsPage },
      { path: 'team',     Component: TeamPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'help',     Component: HelpPage },
    ],
  },
],
```

## Files Created/Modified

- `src/routes/app/AppLayout.tsx` - Full Mantine AppShell with 240px navbar, 56px header, 6 NavLinks, user menu, seedIfNeeded
- `src/router.tsx` - /app children updated: Dashboard index + 5 named placeholder pages; AppPlaceholder import removed
- `src/routes/app/AppPlaceholder.tsx` - **Deleted** (superseded by Dashboard.tsx)

## Decisions Made

- **isNavActive split (D-12 per plan):** Strict equality for `/app` (index route, no path suffix); `startsWith` for all others (`/app/lists`, `/app/reports`, etc.) — Phase 4 adds `/app/lists/:id` detail routes; "Lists" stays highlighted. Rationale documented inline in code comment.
- **No Burger (D-11 per plan):** Desktop-only demo surface. AppShell will collapse at `breakpoint: 'sm'` via Mantine built-in behavior; no hamburger toggle added.
- **data-pendo-id on UnstyledButton (D-15 per plan):** The clickable element is the `UnstyledButton`, not the `Menu.Target` wrapper. ID lands there directly as a DOM attribute.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Both `npm run typecheck` and `npm run build` exit 0 after completion. The chunk size warning from Vite is expected (recharts + @faker-js/faker bundled together) and is not an error.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 3 chrome is complete. Every `/app/*` route renders inside the Mantine AppShell with persistent nav + top bar.
- Phase 4 (Lists CRUD, Settings, Reports) can replace placeholder page bodies in place — `router.tsx` is NOT edited at that boundary.
- Phase 5 (Team, Help) follows the same pattern.
- Phase 6 mounts `<PendoRouteBridge />` in AppLayout — the slot is reserved in the comment.
- SHELL-01, SHELL-03, SHELL-04 requirements are satisfied.

---
*Phase: 03-authenticated-shell-dashboard*
*Completed: 2026-05-14*

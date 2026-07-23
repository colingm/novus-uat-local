---
phase: 01-foundation-cross-cutting-contracts
plan: "05"
subsystem: ui
tags: [react-router, routing, spa, demo-banner, history-api]

# Dependency graph
requires:
  - phase: 01-04
    provides: Provider stack with PendoBridge slot — App.tsx provider order and placeholder body
provides:
  - react-router@^7.15.0 installed (History API routing, no hash routing)
  - src/router.tsx — createBrowserRouter with two top-level routes (/ and /app)
  - src/routes/public/PublicLayout.tsx — DemoBanner + Outlet; Phase 6 PendoRouteBridge slot commented
  - src/routes/public/Landing.tsx — Halo title heading + sign-in/sign-up placeholder anchors
  - src/routes/app/AppLayout.tsx — Phase 1 placeholder shell with Outlet
  - src/routes/app/AppPlaceholder.tsx — Authenticated area placeholder for Phase 3
  - src/ui/DemoBanner.tsx — Mantine Alert with literal FND-06 required text
  - src/App.tsx final Phase 1 form — RouterProvider as sole child of PendoBridge
affects:
  - 01-06 (sandbox route registers under PublicLayout children in src/router.tsx)
  - phase-2 (adds /signup*, /signin as PublicLayout children; wraps /app/* in RequireAuth)
  - phase-6 (mounts PendoRouteBridge inside PublicLayout and AppLayout)

# Tech tracking
tech-stack:
  added:
    - react-router@^7.15.0 (unified package — not react-router-dom; History API routing)
  patterns:
    - "Two-layout split: / uses PublicLayout (DemoBanner + Outlet), /app uses AppLayout (Outlet only)"
    - "createBrowserRouter with nested index routes — deep-linking works out of the box with Vite dev server SPA fallback"
    - "Phase 6 PendoRouteBridge slot reserved via TODO comments in PublicLayout and AppLayout — no runtime leak"

key-files:
  created:
    - src/router.tsx
    - src/routes/public/PublicLayout.tsx
    - src/routes/public/Landing.tsx
    - src/routes/app/AppLayout.tsx
    - src/routes/app/AppPlaceholder.tsx
    - src/ui/DemoBanner.tsx
  modified:
    - src/App.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Used unified react-router (not react-router-dom) per v7 recommended import target"
  - "DemoBanner uses Mantine Alert with color=orange and IconAlertTriangle from @tabler/icons-react — reads as system notice, not marketing"
  - "DemoBanner is mounted only in PublicLayout, not AppLayout — authenticated shell has no demo banner (confirmed by FND-06 scope)"
  - "No PendoRouteBridge created — Phase 6 owns it; slot is reserved via TODO comments only"

patterns-established:
  - "Route components import from 'react-router' (not 'react-router-dom') — v7 unified package convention"
  - "Phase-N TODO comments in layout files signal exactly where future phases extend — PublicLayout has Phase 6 slot comment, AppLayout has Phase 2 + Phase 3 + Phase 6 comments"

requirements-completed:
  - FND-03
  - FND-06

# Metrics
duration: ~15min
completed: 2026-05-14
---

# Phase 01 Plan 05: React Router 7 + Public/App Route Split + DemoBanner Summary

**React Router 7 wired via createBrowserRouter into two History-API layouts — PublicLayout (DemoBanner + Outlet) for / and AppLayout (Outlet) for /app — with RouterProvider mounted as the sole child of PendoBridge in App.tsx**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-14T09:34:00Z
- **Completed:** 2026-05-14T09:50:00Z
- **Tasks:** 3 (including 1 human-verify checkpoint)
- **Files modified:** 9

## Accomplishments

- Installed react-router@^7.15.0 (History API routing; no hash routing per FND-03)
- Built two-layout route split: PublicLayout (DemoBanner + Outlet) and AppLayout (Outlet) with index children Landing and AppPlaceholder
- Replaced the Plan 04 placeholder body in App.tsx with `<RouterProvider router={router} />` — App.tsx is now in its final Phase 1 form; no further App.tsx edits needed for Phases 2–5
- Deep-link verified: refreshing /app stays on /app (Vite dev server SPA fallback works with no custom config)
- DemoBanner shows on / only; /app has no banner; console clean on both routes

## Task Commits

1. **Task 1: Install React Router 7 and build route components/layouts/DemoBanner** - `626a7b8` (feat)
2. **Task 2: Wire RouterProvider into App.tsx as child of PendoBridge** - `e8478cf` (feat)
3. **Task 3: Human verification (checkpoint)** - approved by user; no file changes

## Files Created/Modified

- `src/router.tsx` — createBrowserRouter config with two top-level routes (/ and /app); Phase 1 route-map JSDoc header
- `src/routes/public/PublicLayout.tsx` — DemoBanner + Container + Outlet; Phase 6 PendoRouteBridge slot noted in comment
- `src/routes/public/Landing.tsx` — Halo Title + descriptive Text + two placeholder Anchor links for /signin and /signup
- `src/routes/app/AppLayout.tsx` — Phase 1 placeholder shell with Container + Title + Outlet; Phase 2/3/6 handoff comments
- `src/routes/app/AppPlaceholder.tsx` — Authenticated area placeholder noting Phase 3 will build the Dashboard
- `src/ui/DemoBanner.tsx` — Mantine Alert (color=orange, IconAlertTriangle icon) with exact FND-06 required text
- `src/App.tsx` — RouterProvider as only child of PendoBridge; unused Mantine layout imports removed
- `package.json` — react-router@^7.15.0 added to dependencies
- `package-lock.json` — lockfile updated

## Decisions Made

- Used the unified `react-router` package (not `react-router-dom`) per React Router v7 recommendation
- DemoBanner uses `color="orange"` Mantine Alert with a triangle icon — visually distinct from page content so it reads as a system-level notice, not marketing copy
- DemoBanner mounted only in PublicLayout — the authenticated shell (/app) intentionally has no banner (FND-06 scopes it to public layout)
- No PendoRouteBridge created — Phase 6 owns it; only TODO comments mark the slot in PublicLayout and AppLayout

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — Vite's default dev server SPA fallback handled /app deep-linking without any vite.config.ts changes. TypeScript build and production build both passed on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 01-06 (UI primitives + sandbox):** Can extend `src/router.tsx` directly to add a `/sandbox` child route under PublicLayout. The `router` export is the extension point.
- **Phase 2 (Auth):** Can add `/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`, `/signin` as children of PublicLayout and wrap `/app/*` in RequireAuth — no `src/App.tsx` edits needed.
- **Phase 6 (Pendo Wiring):** Can drop `<PendoRouteBridge />` into PublicLayout and AppLayout bodies only — slots are marked with TODO comments.

---
*Phase: 01-foundation-cross-cutting-contracts*
*Completed: 2026-05-14*

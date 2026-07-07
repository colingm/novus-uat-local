---
status: complete
phase: quick-260518-f3f
plan: "01"
subsystem: branding/ui
tags: [logo, dark-mode, branding, mantine, pendo, AppLayout, Landing]
dependency_graph:
  requires: [quick-260518-eta]
  provides: [dark-mode-logo-swap]
  affects: [src/routes/app/AppLayout.tsx, src/routes/public/Landing.tsx, public/halo-logo-dark.png]
tech_stack:
  added: []
  patterns: [useComputedColorScheme for resolved color-scheme state]
key_files:
  created:
    - public/halo-logo-dark.png
  modified:
    - src/routes/app/AppLayout.tsx
    - src/routes/public/Landing.tsx
decisions:
  - "useComputedColorScheme('light') chosen over useMantineColorScheme().colorScheme — former returns 'light' | 'dark' always; latter returns 'auto' when user has not explicitly toggled, which is not a paintable value for an image src."
  - "Ternary on colorScheme === 'dark' drives both AppLayout (h=32 header) and Landing (h=56 hero) Image src; same pattern as Phase 04-05 ReportsChart color swap."
  - "data-pendo-id={PENDO_IDS.topbar.logo} preserved verbatim on AppLayout Image — Pendo [data-pendo-id='topbar.logo'] selector resolves in both light and dark modes."
metrics:
  duration: "74s (~1m)"
  completed: "2026-05-18"
  tasks_completed: 2
  files_changed: 3
---

# Phase quick-260518-f3f Plan 01: Add Dark-Mode Header Logo Variant Summary

**One-liner:** Dark-mode PNG asset added to public/ and both AppLayout header (h=32) and Landing hero (h=56) swap between light/dark variants via Mantine's `useComputedColorScheme('light')` hook.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Copy dark-mode PNG into public/ and remove source | 251f03c | public/halo-logo-dark.png |
| 2 | Wire useComputedColorScheme logo swap in AppLayout and Landing | c3d8c9a | src/routes/app/AppLayout.tsx, src/routes/public/Landing.tsx |

## What Was Built

### Asset: public/halo-logo-dark.png
Copied from `full-logo-dark-mode.png` (113 KB, white wordmark on transparent background) into `public/halo-logo-dark.png`. Source file at repo root removed after copy.

### AppLayout.tsx (header logo, h=32)
- Added `useComputedColorScheme` to the existing `@mantine/core` named import (single import statement — no duplicate import introduced)
- Added `const colorScheme = useComputedColorScheme('light')` in the component body alongside other hook calls
- Changed `Image src` from literal `"/halo-logo.png"` to ternary `colorScheme === 'dark' ? '/halo-logo-dark.png' : '/halo-logo.png'`
- `data-pendo-id={PENDO_IDS.topbar.logo}` preserved — Pendo selector `[data-pendo-id="topbar.logo"]` resolves in both modes

### Landing.tsx (hero logo, h=56)
- Added `useComputedColorScheme` to the existing `@mantine/core` named import
- Added `const colorScheme = useComputedColorScheme('light')` before the `return`
- Changed `Image src` to the same ternary pattern
- No `data-pendo-id` added (Landing logo has none; out of scope per plan)

## Hook Choice Rationale

`useComputedColorScheme('light')` was the correct hook per the plan constraints:

- Returns `'light' | 'dark'` — **never `'auto'`** — by resolving the MantineProvider color-scheme state against OS `prefers-color-scheme`. The `'light'` default arg is the conventional SSR-safe fallback (applied before the inline `ColorSchemeScript` runs); for this client-only SPA it is essentially a no-op but documents intent.
- `useMantineColorScheme().colorScheme` was explicitly NOT used — it returns `'light' | 'dark' | 'auto'` and `'auto'` is not a valid image src path.
- The Phase 4 Settings color-scheme toggle (`setColorScheme`) drives Mantine's state, so `useComputedColorScheme` follows that toggle correctly — no separate `prefers-color-scheme` CSS path needed.

## Pendo Selector Preservation

`AppLayout.tsx` header `Image`:
```tsx
<Image
  src={colorScheme === 'dark' ? '/halo-logo-dark.png' : '/halo-logo.png'}
  alt="Halo"
  h={32}
  w="auto"
  fit="contain"
  data-pendo-id={PENDO_IDS.topbar.logo}
/>
```

The `data-pendo-id` attribute value (`"topbar.logo"`) is stable across both color schemes. Pendo guide targeting on `[data-pendo-id="topbar.logo"]` resolves to the `<img>` element in both light and dark modes.

## Verification Results

- `public/halo-logo-dark.png` exists (113 KB)
- `public/halo-logo.png` still exists (unchanged)
- Repo root has no lingering `full-logo-dark-mode.png`
- Both files import and call `useComputedColorScheme('light')`
- Both files use the ternary for `Image src`
- `data-pendo-id={PENDO_IDS.topbar.logo}` intact in AppLayout
- Neither file uses `useMantineColorScheme` for src selection
- `npx tsc --noEmit` exits 0

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both logo src ternaries are fully wired to real assets.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Static asset swap only.

## Self-Check: PASSED

- [x] public/halo-logo-dark.png exists at commit 251f03c
- [x] src/routes/app/AppLayout.tsx modified at commit c3d8c9a
- [x] src/routes/public/Landing.tsx modified at commit c3d8c9a
- [x] TypeScript compiles clean
- [x] data-pendo-id={PENDO_IDS.topbar.logo} preserved

---
phase: 03-authenticated-shell-dashboard
plan: "04"
subsystem: pendo-ids, ui-primitives, placeholder-routes
tags: [pendo, navigation, placeholder-routes, registry, phase-3]
dependency_graph:
  requires:
    - 03-01  # K.tasks key builder
    - 03-02  # tasksRepo barrel (already in repo)
  provides:
    - PENDO_IDS nav/topbar/dashboard/comingSoon namespaces
    - src/ui/primitives/NavLink.tsx primitive wrapper
    - src/ui/ComingSoonCard.tsx shared placeholder card
    - Five per-route placeholder page components
  affects:
    - 03-05  # AppShell imports NavLink + all nav.* topbar.* leaves
    - 03-06  # Dashboard imports dashboard.* leaves
tech_stack:
  added: []
  patterns:
    - pendoId-typed Mantine wrapper (NavLink mirrors Select.tsx pattern)
    - ComingSoonCard baked-in data-pendo-id (DemoBanner analog)
    - Per-route placeholder file per own directory (D-01 stable contract)
key_files:
  created:
    - src/ui/primitives/NavLink.tsx
    - src/ui/ComingSoonCard.tsx
    - src/routes/app/lists/ListsPage.tsx
    - src/routes/app/reports/ReportsPage.tsx
    - src/routes/app/team/TeamPage.tsx
    - src/routes/app/settings/SettingsPage.tsx
    - src/routes/app/help/HelpPage.tsx
  modified:
    - src/pendo/PENDO_IDS.ts
    - src/ui/primitives/index.ts
decisions:
  - "Retired layout.appPlaceholder leaf from PENDO_IDS; AppPlaceholder.tsx (Phase 1) has no reference to it — typecheck passes clean"
  - "ComingSoonCard bakes in data-pendo-id from PENDO_IDS.comingSoon.card (not a prop) per DemoBanner analog and D-02"
  - "NavLink wrapper follows Select.tsx 4-line pattern exactly; no extra prop merging needed"
metrics:
  duration: 8min
  completed: "2026-05-14"
---

# Phase 3 Plan 04: Pendo IDs Registry Extension + Nav Primitives + Placeholder Routes Summary

**One-liner:** PENDO_IDS extended with 4 namespaces (26 new leaf IDs), NavLink primitive wrapper added, ComingSoonCard shared component created, and 5 per-route placeholder pages scaffolded with verbatim UI-SPEC copy.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend PENDO_IDS + add NavLink primitive wrapper | 4b99481 | src/pendo/PENDO_IDS.ts, src/ui/primitives/NavLink.tsx, src/ui/primitives/index.ts |
| 2 | Create ComingSoonCard + five per-route placeholder pages | 2b4d512 | src/ui/ComingSoonCard.tsx, 5x routes/app/*/Page.tsx |

## Namespace Tree Added to PENDO_IDS

```ts
nav: {
  dashboard: 'nav.dashboard',
  lists:     'nav.lists',
  reports:   'nav.reports',
  team:      'nav.team',
  settings:  'nav.settings',
  help:      'nav.help',
},

topbar: {
  logo:          'topbar.logo',
  workspaceName: 'topbar.workspace-name',
  userMenu: {
    button:   'topbar.user-menu.button',
    profile:  'topbar.user-menu.profile',
    settings: 'topbar.user-menu.settings',
    signout:  'topbar.user-menu.sign-out',
  },
},

dashboard: {
  timeRange: 'dashboard.time-range',
  kpi: {
    active:           'dashboard.kpi.active',
    completedInRange: 'dashboard.kpi.completed-in-range',
    overdue:          'dashboard.kpi.overdue',
    completionRate:   'dashboard.kpi.completion-rate',
    avgCycleTime:     'dashboard.kpi.avg-cycle-time',
  },
  chart: {
    completedPerDay: 'dashboard.chart.completed-per-day',
    byStatus:        'dashboard.chart.by-status',
  },
  activity: {
    container: 'dashboard.activity.container',
    item:      'dashboard.activity.item',
  },
  emptyState: {
    container: 'dashboard.empty-state.container',
    cta:       'dashboard.empty-state.cta',
  },
},

comingSoon: {
  card: 'coming-soon.card',
},
```

**Retired:** `layout.appPlaceholder: 'layout.app.placeholder'` — removed from the registry. No other files reference `PENDO_IDS.layout.appPlaceholder` (grep confirms); typecheck passes clean without the transitional breakage noted in the plan spec.

## NavLink Wrapper vs Select.tsx Diff

NavLink.tsx mirrors Select.tsx line-for-line with these substitutions:
- `Select as MantineSelect` → `NavLink as MantineNavLink`
- `SelectProps as MantineSelectProps` → `NavLinkProps as MantineNavLinkProps`
- `export type SelectProps = MantineSelectProps & { pendoId: PendoId }` → same pattern with `NavLinkProps`
- `<MantineSelect data-pendo-id={pendoId} {...rest} />` → `<MantineNavLink data-pendo-id={pendoId} {...rest} />`
- Added Phase 3 caller note in docblock: "src/routes/app/AppLayout.tsx renders six instances inside <AppShell.Navbar>"

## Five Placeholder Route Files

| File | featureName | phase | Icon | Description |
|------|-------------|-------|------|-------------|
| src/routes/app/lists/ListsPage.tsx | Lists | 4 | IconChecklist | Create and manage tasks for your workspace. |
| src/routes/app/reports/ReportsPage.tsx | Reports | 4 | IconChartBar | Filter task data and export reports. |
| src/routes/app/team/TeamPage.tsx | Team | 5 | IconUsers | Invite teammates and manage roles. |
| src/routes/app/settings/SettingsPage.tsx | Settings | 4 | IconSettings | Update your profile, workspace, and preferences. |
| src/routes/app/help/HelpPage.tsx | Help | 5 | IconHelpCircle | Search articles and find answers. |

All five use `size={48} color="var(--mantine-color-gray-4)"` on the icon prop per D-02.

## Deviations from Plan

None — plan executed exactly as written.

The plan spec noted that typecheck might fail if `AppPlaceholder.tsx` still referenced `PENDO_IDS.layout.appPlaceholder`. Verified via grep that `AppPlaceholder.tsx` never imported or used that leaf — it had no PENDO_IDS import at all. Typecheck exits 0 clean.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All new files are:
- Static display components (ComingSoonCard, 5 placeholder pages)
- A typed DOM attribute forwarder (NavLink)
- A `as const` registry extension (PENDO_IDS)

`data-pendo-id` attributes are intentionally public-DOM per the threat register entry T-03-04-01 (accepted disposition: these are Pendo targeting markers, not sensitive data).

## Self-Check: PASSED

- FOUND: src/pendo/PENDO_IDS.ts
- FOUND: src/ui/primitives/NavLink.tsx
- FOUND: src/ui/ComingSoonCard.tsx
- FOUND: src/routes/app/lists/ListsPage.tsx
- FOUND: src/routes/app/reports/ReportsPage.tsx
- FOUND: src/routes/app/team/TeamPage.tsx
- FOUND: src/routes/app/settings/SettingsPage.tsx
- FOUND: src/routes/app/help/HelpPage.tsx
- Commit 4b99481: FOUND
- Commit 2b4d512: FOUND
- `npm run typecheck`: exit 0
- `npm run build`: exit 0

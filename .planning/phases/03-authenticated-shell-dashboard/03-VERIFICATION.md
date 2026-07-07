---
phase: 03-authenticated-shell-dashboard
verified: 2026-05-15T00:00:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "Clicking 'Sign out' in the user menu calls useAuthStore.getState().signOut() and navigates to / with replace=true — CR-01 fix: navigate('/', {replace:true}) now called BEFORE await signOut(), confirmed in commit 4438d52"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Manually trigger sign-out from the user menu and confirm landing page"
    expected: "After clicking Sign out, user lands directly on the public landing page (/) with no visible flash through /signin"
    why_human: "Even with the correct call order (navigate first, then signOut), timing-dependent React flush scheduling means the fix must be confirmed in a live browser. Static analysis confirms the code ordering is now correct."
  - test: "Visit /app with seeded tasks and verify charts render as SVG with no canvas elements"
    expected: "DevTools Elements panel shows SVG elements (<svg>, <path>, <rect>) for both charts; document.querySelectorAll('canvas').length === 0"
    why_human: "Recharts SVG rendering must be confirmed in a live browser; static analysis cannot verify DOM output."
  - test: "Change SegmentedControl from 30d to 7d and verify KPI/chart re-filtering"
    expected: "Completed in range, Completion rate, Avg cycle time, and the area chart all change. Active tasks, Overdue count, and donut chart remain unchanged."
    why_human: "Filter re-computation behavior is state-driven and requires live interaction."
  - test: "Sign in with a new workspace, confirm dashboard shows empty state before seeder runs, then reload to confirm seeded state"
    expected: "Empty state (IconClipboardCheck + 'No tasks yet' + 'Go to Lists' button) visible before/during first mount; after seedIfNeeded runs, the KPI cards and charts appear."
    why_human: "Seeder timing and empty-state transition require live browser observation."
---

# Phase 3: Authenticated Shell & Dashboard Verification Report

**Phase Goal:** Deliver an authenticated SaaS shell with persistent side nav + topbar, a Dashboard with Recharts SVG charts/KPIs/timeline, 5 placeholder routes for future phases, and a tasks data layer (schema-first repo + idempotent seeder).
**Verified:** 2026-05-15T00:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (commit 4438d52 fixes CR-01)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Mantine AppShell with persistent side nav (6 links) and top bar renders on authenticated routes | ✓ VERIFIED | `AppLayout.tsx` exports `AppLayout()` rendering `<AppShell navbar={{ width: 240, breakpoint: 'sm' }} header={{ height: 56 }} padding="md">` with `<AppShell.Navbar>`, `<AppShell.Header>`, `<AppShell.Main><Outlet /></AppShell.Main>` |
| 2 | Side nav has Dashboard, Lists, Reports, Team, Settings, Help links with active-state indication | ✓ VERIFIED | All 6 `<NavLink>` components present with `PENDO_IDS.nav.*` leaves and `isNavActive()` helper (7 occurrences: 1 declaration + 6 usages) |
| 3 | Top bar shows workspace name and user menu (Profile, Settings, Sign out) | ✓ VERIFIED | Header Group contains `{workspace.companyName}` text and `<Menu>` with 3 items plus `<Menu.Divider>` |
| 4 | Clicking 'Sign out' navigates to / with replace=true | ✓ VERIFIED | CR-01 RESOLVED: `handleSignOut` at lines 92-97 now calls `navigate('/', { replace: true })` FIRST, then `await useAuthStore.getState().signOut()`. Race condition eliminated — RequireAuth cannot observe `isAuthenticated=false` while still mounted under /app. Confirmed in commit 4438d52. |
| 5 | Dashboard at /app shows 5 KPI cards, AreaChart, PieChart, 8-item timeline, SegmentedControl defaulted to 30d | ✓ VERIFIED | `Dashboard.tsx` renders `KpiCard` for active/completedInRange/overdue/completionRate/avgCycleTime; `AreaChart` + `PieChart` from recharts; `Timeline` with 8-item slice; `useState<Range>('30')` default |
| 6 | Time-range SegmentedControl re-filters Completed-in-range, Completion rate, Avg cycle time, and area chart; Active/Overdue/donut remain unaffected | ✓ VERIFIED | `computeKpis` and `computeDayBuckets` depend on `[tasks, nowRef, range]`; `computeStatusSlices` depends only on `[tasks]` (no range) |
| 7 | Empty state renders when tasks.length === 0 with guide-anchor surface | ✓ VERIFIED | `if (tasks.length === 0) return <EmptyState />` at line 310; `EmptyState` renders `data-pendo-id={PENDO_IDS.dashboard.emptyState.container}` and `<Button pendoId={PENDO_IDS.dashboard.emptyState.cta}>Go to Lists</Button>` |
| 8 | Every chart is Recharts SVG (no canvas) with data-pendo-id on outer Paper wrapper | ✓ VERIFIED | Both `<AreaChart>` and `<PieChart>` wrapped in `<Paper data-pendo-id={PENDO_IDS.dashboard.chart.*}>`. `grep canvas Dashboard.tsx` = 0. No chart.js or highcharts imports. |
| 9 | 5 placeholder routes exist at /app/lists, /app/reports, /app/team, /app/settings, /app/help each rendering ComingSoonCard | ✓ VERIFIED | All 5 files exist with correct Tabler icons, verbatim descriptions, and correct phase numbers (4 or 5) |
| 10 | Tasks data layer: schema-first repo (listTasks/getTaskById/createTask/updateTask/deleteTask) + idempotent seeder (seedIfNeeded) gated on meta.seededAt | ✓ VERIFIED | All 5 repo methods present; zero `localStorage.*` calls in tasksRepo.ts or tasksSeed.ts; `meta.seededAt !== null` gate present; `TasksArraySchema.safeParse()` defensive validation on seed |

**Score:** 10/10 truths verified (CR-01 RESOLVED in commit 4438d52)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | recharts + @faker-js/faker in dependencies (not devDependencies) | ✓ VERIFIED | recharts@^3.8.1, @faker-js/faker@^10.4.0 both in `dependencies` |
| `src/storage/keys.ts` | K.tasks(workspaceId) returning halo:v1:tasks:{workspaceId} | ✓ VERIFIED | `tasks: (workspaceId: string): string => \`halo:v${SCHEMA_VERSION}:tasks:${workspaceId}\`` at line 50; SCHEMA_VERSION = 1 |
| `src/tasks/schemas.ts` | TaskSchema, TasksArraySchema, TaskStatusEnum, TaskPriorityEnum, AssigneeSchema | ✓ VERIFIED | All 5 exports present; `z.iso.datetime()` used (Zod 4 idiom, not `z.string().datetime()`); `as const` not broken |
| `src/tasks/types.ts` | z.infer-derived types | ✓ VERIFIED | All 4 types via `z.infer<typeof ...>`; all imports use `import type` |
| `src/tasks/tasksRepo.ts` | listTasks/getTaskById/createTask/updateTask/deleteTask; every read through readWithSchema | ✓ VERIFIED | All 5 functions present; 0 localStorage calls; `from '../storage'` import present |
| `src/tasks/labels.ts` | TASK_STATUS_LABELS + TASK_PRIORITY_LABELS as Record<TaskStatus, string> | ✓ VERIFIED | Both exports with exhaustive Record annotations |
| `src/tasks/index.ts` | 4 export * + named seedIfNeeded | ✓ VERIFIED | 4 `export *` lines + `export { seedIfNeeded } from './tasksSeed'` |
| `src/tasks/tasksSeed.ts` | seedIfNeeded(workspaceId) idempotent seeder | ✓ VERIFIED | Gates on `meta.seededAt !== null`; 0 localStorage calls; stamps meta after write |
| `src/pendo/PENDO_IDS.ts` | nav, topbar, dashboard, comingSoon namespaces; appPlaceholder retired | ✓ VERIFIED | All 4 namespaces present; `appPlaceholder` count = 0 |
| `src/ui/primitives/NavLink.tsx` | Mantine NavLink wrapper with pendoId: PendoId | ✓ VERIFIED | `pendoId: PendoId` required prop; `data-pendo-id={pendoId}` forwarded |
| `src/ui/primitives/index.ts` | NavLink + NavLinkProps barrel exported | ✓ VERIFIED | Lines 33-34 export NavLink and NavLinkProps |
| `src/ui/ComingSoonCard.tsx` | Shared placeholder card; data-pendo-id={PENDO_IDS.comingSoon.card} baked in | ✓ VERIFIED | `data-pendo-id={PENDO_IDS.comingSoon.card}` on Paper; no 'coming-soon.card' hand-typed |
| `src/routes/app/lists/ListsPage.tsx` | Placeholder at /app/lists | ✓ VERIFIED | ComingSoonCard with IconChecklist, phase=4, correct description |
| `src/routes/app/reports/ReportsPage.tsx` | Placeholder at /app/reports | ✓ VERIFIED | ComingSoonCard with IconChartBar, phase=4, correct description |
| `src/routes/app/team/TeamPage.tsx` | Placeholder at /app/team | ✓ VERIFIED | ComingSoonCard with IconUsers, phase=5, correct description |
| `src/routes/app/settings/SettingsPage.tsx` | Placeholder at /app/settings | ✓ VERIFIED | ComingSoonCard with IconSettings, phase=4, correct description |
| `src/routes/app/help/HelpPage.tsx` | Placeholder at /app/help | ✓ VERIFIED | ComingSoonCard with IconHelpCircle, phase=5, correct description |
| `src/routes/app/AppLayout.tsx` | Full Mantine AppShell + seedIfNeeded call on mount | ✓ VERIFIED | AppShell present; seedIfNeeded called in useEffect([workspace?.id]) |
| `src/router.tsx` | /app children: Dashboard (index) + 5 named routes | ✓ VERIFIED | All 6 children present; AppPlaceholder.tsx deleted |
| `src/routes/app/AppPlaceholder.tsx` | Must not exist (deleted) | ✓ VERIFIED | File not found |
| `src/dashboard/Dashboard.tsx` | Dashboard page — KPIs + charts + timeline + empty state | ✓ VERIFIED | All required elements present; 0 hand-typed data-pendo-id strings |
| `src/dashboard/relative-time.ts` | formatRelative helper — 4 buckets, no imports, no throws | ✓ VERIFIED | 5 buckets (Just now/m ago/h ago/Yesterday/d ago); 0 imports; NaN returns '—' |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/storage/keys.ts` → `package.json` | typecheck passes with new K.tasks method | typecheck exit 0 | ✓ WIRED | `npm run typecheck` exits 0 (re-verified post-fix) |
| `src/tasks/tasksRepo.ts` → `src/storage` | `import { K, readWithSchema, writeJSON } from '../storage'` | pattern: `from '../storage'` | ✓ WIRED | Import present; 0 localStorage calls |
| `src/tasks/types.ts` → `src/tasks/schemas.ts` | `z.infer<typeof TaskSchema>` | pattern: `z.infer<typeof ` | ✓ WIRED | All 4 types are z.infer-derived |
| `src/tasks/tasksSeed.ts` → `src/storage (MetaSchema + K.meta())` | `import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'` | pattern: `MetaSchema` | ✓ WIRED | Import and MetaSchema gating present |
| `src/tasks/tasksSeed.ts` → `src/tasks/schemas.ts` | `import { TasksArraySchema } from './schemas'` | pattern: `TasksArraySchema` | ✓ WIRED | Defensive safeParse on generated tasks |
| `src/tasks/index.ts` → `src/tasks/tasksSeed.ts` | `export { seedIfNeeded } from './tasksSeed'` | pattern: `seedIfNeeded` | ✓ WIRED | Named export present |
| `src/ui/primitives/NavLink.tsx` → `src/pendo/PENDO_IDS.ts` | `import type { PendoId } from '../../pendo/PENDO_IDS'` | pattern: `PendoId` | ✓ WIRED | pendoId: PendoId prop enforces compile-time check |
| `src/ui/ComingSoonCard.tsx` → `src/pendo/PENDO_IDS.ts` | `data-pendo-id={PENDO_IDS.comingSoon.card}` | pattern: `comingSoon.card` | ✓ WIRED | Registry reference present; no hand-typed string |
| Placeholder route files → `src/ui/ComingSoonCard.tsx` | `<ComingSoonCard featureName phase icon description />` | pattern: `ComingSoonCard` | ✓ WIRED | All 5 files import and render ComingSoonCard |
| `src/routes/app/AppLayout.tsx` → `useAuthStore` | `useAuthStore((s) => s.currentVisitor/currentWorkspace)` + `getState().signOut()` | pattern: `useAuthStore` | ✓ WIRED | Both selectors and getState().signOut() present |
| `src/routes/app/AppLayout.tsx` → `src/tasks (seedIfNeeded)` | `import { seedIfNeeded } from '../../tasks'`; `useEffect on workspace.id` | pattern: `seedIfNeeded` | ✓ WIRED | Import and useEffect call present at line 81 |
| `src/router.tsx` → Dashboard + 5 placeholder pages | Component imports + children array entries | pattern: `ListsPage\|ReportsPage\|...` | ✓ WIRED | All 6 components imported and used as route children |
| `src/dashboard/Dashboard.tsx` → `src/tasks (listTasks)` | `listTasks(workspaceId)` inside useMemo | pattern: `listTasks` | ✓ WIRED | Import from '../tasks' and useMemo([workspaceId]) call present |
| `src/dashboard/Dashboard.tsx` → recharts | `AreaChart, Area, PieChart, Pie, Cell, ...` from 'recharts' | pattern: `from 'recharts'` | ✓ WIRED | Import present; build exits 0 |
| `src/dashboard/Dashboard.tsx` → `src/pendo/PENDO_IDS.ts` | `data-pendo-id={PENDO_IDS.dashboard.*}` | pattern: `PENDO_IDS.dashboard` | ✓ WIRED | All 12 dashboard.* leaves referenced; 0 hand-typed strings |
| `src/dashboard/Dashboard.tsx` → `src/dashboard/relative-time.ts` | `import { formatRelative } from './relative-time'` | pattern: `formatRelative` | ✓ WIRED | Import and usage in timeline render present |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `src/dashboard/Dashboard.tsx` | `tasks` | `listTasks(workspaceId)` → `readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])` → localStorage | Yes — reads from seeded localStorage via Zod-validated codec | ✓ FLOWING |
| `src/dashboard/Dashboard.tsx` | `kpis` | `computeKpis(tasks, nowRef, range)` — pure function over `tasks` | Yes — derived from real tasks array | ✓ FLOWING |
| `src/dashboard/Dashboard.tsx` | `dayBuckets` | `computeDayBuckets(tasks, nowRef, range)` | Yes — derived from real tasks. WR-01: UTC label/bucket edge mismatch may cause off-by-one-day display errors (cosmetic) | ⚠ FLOWING (with cosmetic bug WR-01) |
| `src/routes/app/AppLayout.tsx` | `workspace.companyName` | `useAuthStore((s) => s.currentWorkspace)` | Yes — hydrated from localStorage session at module-init | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run typecheck` exits 0 | `npm run typecheck` | Exit 0, no errors | ✓ PASS |
| `npm run build` exits 0 | `npm run build` | Exit 0, built in 849ms | ✓ PASS |
| recharts and @faker-js/faker in dependencies | `node -e "const p=require('./package.json')..."` | recharts: ^3.8.1, faker: ^10.4.0 in deps | ✓ PASS |
| AppPlaceholder.tsx deleted | `test ! -f src/routes/app/AppPlaceholder.tsx` | File not found | ✓ PASS |
| No hand-typed data-pendo-id strings in AppLayout | `grep 'data-pendo-id="' AppLayout.tsx` | 0 results | ✓ PASS |
| No hand-typed data-pendo-id strings in Dashboard | `grep 'data-pendo-id="' Dashboard.tsx` | 0 results | ✓ PASS |
| No canvas imports in Dashboard | `grep -c canvas Dashboard.tsx` | 0 | ✓ PASS |
| 0 direct localStorage calls in tasksRepo | `grep -c "localStorage\." tasksRepo.ts` | 0 | ✓ PASS |
| 0 direct localStorage calls in tasksSeed | `grep -c "localStorage\." tasksSeed.ts` | 0 | ✓ PASS |
| SCHEMA_VERSION still 1 | `grep SCHEMA_VERSION keys.ts` | SCHEMA_VERSION = 1 | ✓ PASS |
| appPlaceholder retired from PENDO_IDS | `grep -c appPlaceholder PENDO_IDS.ts` | 0 | ✓ PASS |
| handleSignOut: navigate called before signOut | `sed -n '92,97p' src/routes/app/AppLayout.tsx` | Line 95: navigate('/', { replace: true }); Line 96: await useAuthStore.getState().signOut() | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no probe scripts declared in any plan for this phase; no `scripts/*/tests/probe-*.sh` files found.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SHELL-01 | 03-05 | Mantine AppShell with persistent left side nav and top bar | ✓ SATISFIED | AppLayout.tsx renders AppShell with Navbar + Header + Main |
| SHELL-02 | 03-04 | Side nav links Dashboard/Lists/Reports/Team/Settings/Help; active route indicated | ✓ SATISFIED | 6 NavLink components with PENDO_IDS.nav.* and isNavActive() |
| SHELL-03 | 03-05 | Top bar shows workspace name + user menu with Profile/Settings/Sign Out | ✓ SATISFIED | workspace.companyName displayed; Menu with 3 items + divider present |
| SHELL-04 | 03-05 | Deep-linking works — refresh on any /app/* route lands on that route | ✓ SATISFIED | createBrowserRouter + Vite SPA fallback (Phase 1 lock) preserved |
| DASH-01 | 03-06 | Dashboard route at /app is post-sign-in landing | ✓ SATISFIED | router.tsx: `{ index: true, Component: Dashboard }` |
| DASH-02 | 03-06 | 4-6 KPI stat cards computed from seeded task data | ✓ SATISFIED | 5 KpiCard instances (active, completedInRange, overdue, completionRate, avgCycleTime) |
| DASH-03 | 03-06 | At least one bar/area chart and one pie/donut chart, both Recharts SVG | ✓ SATISFIED | AreaChart ('Completed per day') + PieChart donut ('Tasks by status'); 0 canvas elements |
| DASH-04 | 03-06 | Time-range selector 7/30/90 days re-filters charts and stats | ✓ SATISFIED | SegmentedControl default '30'; computeKpis + computeDayBuckets depend on range; donut + active + overdue are range-independent |
| DASH-05 | 03-06 | Recent-activity feed (most-recent task changes) | ✓ SATISFIED | computeRecentEvents returns 8 items sorted desc; Timeline with data-pendo-task-id |
| DASH-06 | 03-06 | Friendly empty state when no tasks exist | ✓ SATISFIED | EmptyState renders when tasks.length === 0 with PENDO_IDS.dashboard.emptyState.* |
| DASH-03 (plan 01) | 03-01 | recharts dependency as runtime dep | ✓ SATISFIED | recharts@^3.8.1 in dependencies |

**Note on recharts version:** Plans specify recharts 2.x but installed version is 3.x (^3.8.1). The Recharts 3.x API is backward-compatible for all components used (`AreaChart`, `PieChart`, `Pie`, `Cell`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `Label`, `ResponsiveContainer`). Build exits 0. No functional impact.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/dashboard/Dashboard.tsx` | 61 | `let maxMs = 0` in computeNowRef | WARNING | If all task dates are corrupt/missing, returns 1970-01-01 instead of new Date() — affects all time windows and formatRelative calls (WR-02). In practice prevented by Zod schema validation in listTasks. |
| `src/tasks/tasksSeed.ts` | 103-107 | Non-past-due dueDate path uses createdAt + offset, not now + offset | WARNING | Active tasks with old createdAt get dueDates that land in the past, inflating Overdue KPI above the documented ~15% target (WR-03) |
| `src/routes/app/AppLayout.tsx` | 80-82 | `useEffect(() => {...}, [workspace?.id])` closes over `workspace` | INFO | react-hooks/exhaustive-deps lint flag; correct behavior but reduces lint diagnostic value (WR-05) |
| `src/routes/app/AppLayout.tsx` | 54 | `pathname.startsWith(target)` without trailing-slash boundary | INFO | Future route like `/app/listsX` would activate Lists nav item (WR-06) |
| `src/dashboard/Dashboard.tsx` | 307 | `if (!workspaceId) return <></>` dead code | INFO | Empty fragment is less informative than Navigate or assertion (IN-01) |
| `src/dashboard/Dashboard.tsx` | 325 | `onChange={(v) => setRange(v as Range)}` unchecked cast | INFO | Safe today but TypeScript loses ability to catch future drift in data array (IN-02) |
| `src/dashboard/Dashboard.tsx` | 242 | `KpiCardProps.pendoId: string` instead of `PendoId` | INFO | Weaker type than the PEN-07 contract warrants (IN-03) |

Note: The CR-01 BLOCKER (sign-out race) that appeared in the previous anti-patterns table has been resolved by commit 4438d52.

### Human Verification Required

#### 1. Sign-Out Landing Destination

**Test:** Sign in, then click Sign out in the user menu.
**Expected:** User lands directly on the public landing page (`/`). No visible flash through `/signin`.
**Why human:** Even with the correct call order (navigate first, then signOut), the fix must be confirmed in a live browser. React flush scheduling is environment-dependent. Static analysis confirms the code ordering is correct — this item is downgraded from BLOCKER to a human smoke-test.

#### 2. SVG-Only Charts Confirmed in Browser

**Test:** Sign in (with seeded tasks), visit `/app`, open DevTools Elements.
**Expected:** `document.querySelectorAll('canvas').length === 0`; chart elements are `<svg>` with `<rect>` and `<path>` children. `data-pendo-id="dashboard.chart.completed-per-day"` appears on the outer `<div>` (Paper), NOT inside the `<svg>`.
**Why human:** Recharts version 3.x rendering must be confirmed live; static analysis cannot verify DOM output.

#### 3. SegmentedControl Re-filters KPIs

**Test:** On the Dashboard with seeded tasks, switch between 7d / 30d / 90d.
**Expected:** "Completed in range", "Completion rate", "Avg cycle time", and the area chart update. "Active tasks", "Overdue", and the donut chart do NOT change.
**Why human:** State-driven re-computation requires live browser interaction to observe.

#### 4. Empty State Then Seeded State

**Test:** Create a new account, observe the dashboard before and after first mount.
**Expected:** Empty state (`IconClipboardCheck` + "No tasks yet" + "Go to Lists" button) visible on very first mount; after `seedIfNeeded` runs, the KPI/chart/timeline view loads.
**Why human:** Seeder timing and the empty-to-populated transition require live browser observation.

### Gaps Summary

No automated gaps remain. The single BLOCKER from the initial verification (CR-01: sign-out race condition in `handleSignOut`) has been resolved in commit 4438d52.

**Resolution confirmed:**
- `handleSignOut` at lines 92-97 of `src/routes/app/AppLayout.tsx` now calls `navigate('/', { replace: true })` first, then `await useAuthStore.getState().signOut()`
- `npm run typecheck` exits 0 (no regressions)
- `npm run build` exits 0 (built in 849ms, no regressions)

**4 human verification items remain** — these are not blocking gaps but browser smoke tests that cannot be asserted statically. Phase is ready for human sign-off.

**2 WARNING-level data correctness issues** (WR-02, WR-03) affect dashboard accuracy but not structural goal achievement — the dashboard renders and data flows correctly from localStorage through the Zod-validated repo.

**4 INFO-level items** are cosmetic TypeScript discipline improvements from the code review (WR-05, WR-06, IN-01, IN-02, IN-03) — not blocking.

---

_Verified: 2026-05-15T00:00:00Z_
_Verifier: Claude (gsd-verifier)_

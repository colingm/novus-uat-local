---
phase: 04-core-pages-lists-settings-reports
verified: 2026-05-15T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Lists form reset on create-mode reopen (CR-01 fix)"
    expected: "After creating a task and clicking 'New task' again, the modal opens with blank defaults (not prior-submission values)."
    why_human: "The CR-01 fix uses useEffect + prevOpenedRef to reset on false->true transition — semantically correct by inspection but requires runtime verification per the REVIEW-FIX report's own note."
  - test: "Checkbox off-toggle restores prior status"
    expected: "Unchecking a Done task that was previously In Progress sets status back to 'in_progress', not 'todo'."
    why_human: "Requires a running app with real task data to observe the prevStatus round-trip behavior."
  - test: "Settings save persists and top-bar updates instantly"
    expected: "Editing Profile (name, etc.) and saving shows toast + top-bar name updates immediately; hard refresh retains changes. Same for Workspace tab."
    why_human: "localStorage write + Zustand store propagation + top-bar reactivity require a live browser session."
  - test: "Reset demo data wipes all user data"
    expected: "After confirming reset, app reloads to /. Only halo:v1:meta (seededAt:null, no user data) and mantine-color-scheme-value remain. Re-registering starts fresh."
    why_human: "Requires running app through full reset cycle and inspecting DevTools Application > localStorage."
  - test: "Reports CSV download is well-formed"
    expected: "Downloading export produces halo-tasks-YYYY-MM-DD.csv with 6 columns; RFC 4180 quoting correct; date columns YYYY-MM-DD."
    why_human: "Blob/URL.createObjectURL file download and CSV content inspection require a live browser."
---

# Phase 4: Core Pages — Lists, Settings, Reports Verification Report

**Phase Goal:** The three highest-leverage interactive pages ship — Lists (task CRUD), Settings (profile/workspace/preferences), and Reports (filtered task data with SVG chart + CSV export). Settings save handlers persist to localStorage; Pendo metadata sync (PEN-04) is added in Phase 6.
**Verified:** 2026-05-15
**Status:** human_needed
**Re-verification:** Overwriting outdated pre-gap-closure VERIFICATION.md with fresh findings against current codebase state (post commits 77e67f3 / 62c44d4 / e826f89 closing CR-01 / WR-01 / WR-02 from 04-REVIEW.md).

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | At /app/lists the user can create, edit, mark complete/incomplete, and delete tasks via modal forms and inline controls; sort by any visible column; filter by status, priority, and assignee; see a friendly empty state when no tasks exist; and every mutation persists to localStorage and survives refresh | VERIFIED | `ListsPage.tsx` composes all six sub-components. `TaskFormModal` uses `zodResolver(TaskFormSchema)` + `createTask`/`updateTask`. `TaskTable` uses TanStack Table v8 with `getSortedRowModel` + `toggleSorting` on 5 visible columns. `TaskFiltersBar` has 3 Selects with AND-filter in `useMemo`. `ListsEmptyState` renders when `allTasks.length === 0`. All mutations route through `tasksRepo.*` → `writeJSON(K.tasks(workspaceId))` (FND-04). |
| 2 | At /app/settings the user can edit Profile (name, username, job title, role, location), Workspace (company name, size, industry, plan tier), and Preferences (light/dark theme toggle) across three tabs; every save persists to localStorage | VERIFIED | `SettingsPage.tsx` uses `useSearchParams` for URL-driven tabs defaulting to 'profile'. `ProfileTab` calls `updateVisitor` → `writeJSON(K.visitors())` + `useAuthStore.setState`. `WorkspaceTab` calls `updateWorkspace` → `writeJSON(K.workspaces())` + `useAuthStore.setState`. `PreferencesTab` uses `useMantineColorScheme()` + `setColorScheme` persisting to `mantine-color-scheme-value`. |
| 3 | A "Reset demo data" button (with destructive-action confirmation modal) clears every halo:v1:* key and reloads the app to the public landing | VERIFIED | `ResetDemoDataModal.tsx` two-pass scan (`startsWith('halo:v')`) + bulk `removeItem` + `sessionStorage.removeItem(K.signupDraft())` + `window.location.href = '/'`. `mantine-color-scheme-value` preserved by being outside the `halo:v*` prefix. Plain-string `title="Reset demo data?"` (UAT 2a fix). JSDoc clarifies post-reload `halo:v1:meta` re-creation behavior (UAT 2b, doc-only resolution). |
| 4 | At /app/reports the user can filter by date range and at least one other dimension, view filtered data in a TanStack Table with at least 5 columns and at least one SVG chart, and click "Export CSV" to download the filtered table as a client-side CSV blob | VERIFIED | `ReportsFiltersBar` has DatePickerInput range + assignee Select + status MultiSelect. `ReportsChart` uses Recharts SVG BarChart (3 stacked bars). `ReportsTable` has 6 columns (Title/Status/Priority/Assignee/Due date/Completed at) with TanStack v8. `exportTasksToCsv` produces RFC 4180 Blob download. Export button disabled when `filteredTasks.length === 0`. All wired in `ReportsPage.tsx`. |
| 5 | Every interactive element on Lists, Settings, and Reports carries a stable `data-pendo-id` from the PENDO_IDS registry | VERIFIED | `grep -rE "data-pendo-id=\"[a-z]" src/tasks/components/ src/routes/app/lists/ src/settings/ src/routes/app/settings/ src/reports/ src/routes/app/reports/` returns zero matches. All `pendoId=` props reference `PENDO_IDS.*`. PENDO_IDS has fully-populated `lists`, `settings`, and `reports` namespaces. `PendoId = Leaves<typeof PENDO_IDS>` enforces the registry at compile time. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/routes/app/lists/ListsPage.tsx` | Page composer with CRUD + filters + modals | VERIFIED | Exports `ListsPage`, all six sub-components imported, refreshKey pattern, defensive narrowing present |
| `src/tasks/components/TaskTable.tsx` | TanStack Table v8, 7 columns + sort | VERIFIED | `useReactTable` + `createColumnHelper` + `getSortedRowModel` + Checkbox with `taskId` + kebab with `data-pendo-task-id` |
| `src/tasks/components/TaskFiltersBar.tsx` | Three-Select filter bar | VERIFIED | 3 Selects, `PENDO_IDS.lists.filter.*`, `getAssigneeOptions` wired |
| `src/tasks/components/TaskFormModal.tsx` | Shared create/edit modal, RHF + Zod + repo + toast | VERIFIED | `zodResolver(TaskFormSchema)`, `createTask`/`updateTask`, toast, CR-01 fix: `useEffect + prevOpenedRef` resets form on false→true create-mode open transition |
| `src/tasks/components/DeleteConfirmModal.tsx` | Destructive confirm dialog | VERIFIED | Plain-string `title="Delete this task?"` (no nested `<Title>` — UAT 1a/1d fix landed in 04-07), pendoIds on buttons |
| `src/tasks/components/ListsEmptyState.tsx` | Hero empty state | VERIFIED | `PENDO_IDS.lists.emptyState.*`, "Create your first task" CTA |
| `src/tasks/components/FilteredEmptyState.tsx` | Compact empty state | VERIFIED | `PENDO_IDS.lists.filteredEmpty.*`, "Clear filters" Anchor |
| `src/routes/app/settings/SettingsPage.tsx` | URL-driven tab composer | VERIFIED | `useSearchParams`, three `Tabs.Tab` with `PENDO_IDS.settings.tabs.*`, whitelist `parseTab` guard |
| `src/settings/ProfileTab.tsx` | Visitor edit form + updateVisitor | VERIFIED | `updateVisitor(visitor.id, values)`, `useAuthStore.setState({ currentVisitor: updated })`, toast, `form.reset(values)` |
| `src/settings/WorkspaceTab.tsx` | Workspace edit form + updateWorkspace | VERIFIED | `updateWorkspace(workspace.id, values)`, `useAuthStore.setState({ currentWorkspace: updated })`, toast |
| `src/settings/PreferencesTab.tsx` | Theme toggle + Danger zone | VERIFIED | `useMantineColorScheme()`, `setColorScheme`, `PENDO_IDS.settings.preferences.themeToggle`, `ResetDemoDataModal` triggered |
| `src/settings/ResetDemoDataModal.tsx` | Reset confirm + bulk wipe | VERIFIED | Two-pass `halo:v*` prefix wipe, sessionStorage signup-draft removal, `window.location.href = '/'`, plain-string modal title |
| `src/routes/app/reports/ReportsPage.tsx` | Reports page composer | VERIFIED | Wires all three sub-components + CSV export button + `computeNowRef` date anchor |
| `src/reports/ReportsFiltersBar.tsx` | Date range + assignee + status filters | VERIFIED | `DatePickerInput type='range'`, assignee `Select`, status `MultiSelect`, `PENDO_IDS.reports.filter.*` |
| `src/reports/ReportsChart.tsx` | SVG stacked bar chart | VERIFIED | Recharts `BarChart` + 3 `Bar stackId="status"`, theme-resolved colors via `useMantineTheme` + `useComputedColorScheme`, `PENDO_IDS.reports.chart.statusByDay` on outer div |
| `src/reports/ReportsTable.tsx` | TanStack Table, 6 read-only columns | VERIFIED | 6 columns, sort enabled, `PENDO_IDS.reports.table.container` |
| `src/reports/csvExport.ts` | RFC 4180 CSV Blob download | VERIFIED | `toCsv` + `exportTasksToCsv`, RFC 4180 quoting, `halo-tasks-YYYY-MM-DD.csv` filename |
| `src/tasks/tasksRepo.ts` | completedAt + prevStatus invariant + UpdateTaskPatch | VERIFIED | `UpdateTaskPatch` type excludes `completedAt` + `prevStatus` (WR-02 fix). `updateTask` stamps/clears completedAt and captures/clears prevStatus symmetrically. `createTask` stamps on status==='done'. |
| `src/auth/authRepo.ts` | `updateVisitor` + `updateWorkspace` | VERIFIED | Both with `Omit<..., 'passwordHash'|...>` patch types (D-15 defense) |
| `src/tasks/schemas.ts` | `TaskFormSchema` export | VERIFIED | Exported with 6 fields + UI-SPEC error messages |
| `src/pendo/PENDO_IDS.ts` | `lists`, `settings`, `reports` namespaces | VERIFIED | All three namespaces fully populated, `PendoId = Leaves<typeof PENDO_IDS>` auto-picks them up |
| `src/App.tsx` | `defaultColorScheme="auto"` + `<Notifications />` | VERIFIED | Both present |
| `index.html` | Auto-detecting ColorSchemeScript | VERIFIED | IIFE reads `mantine-color-scheme-value`, falls back to `matchMedia`, try/catch guard |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `TaskFormModal.tsx` onSubmit | `tasksRepo.createTask`/`updateTask` | RHF handleSubmit | WIRED | `createTask(workspaceId, {...values, completedAt: null})` and `updateTask(workspaceId, initialTask.id, values)` |
| `TaskTable.tsx` Checkbox onChange | `tasksRepo.updateTask` | `onToggleComplete` prop → `ListsPage` | WIRED | `updateTask(workspaceId, task.id, { status: nextDone ? 'done' : (task.prevStatus ?? 'todo') })` |
| `TaskFormModal.tsx` | `TaskFormSchema` | `zodResolver(TaskFormSchema)` | WIRED | Line 138 |
| `ProfileTab.tsx` onSubmit | `authRepo.updateVisitor` | direct call | WIRED | `const updated = updateVisitor(visitor.id, values)` |
| `ProfileTab.tsx` onSubmit | `useAuthStore.setState` | store sync | WIRED | `useAuthStore.setState({ currentVisitor: updated })` |
| `WorkspaceTab.tsx` onSubmit | `authRepo.updateWorkspace` | direct call | WIRED | `const updated = updateWorkspace(workspace.id, values)` |
| `PreferencesTab.tsx` SegmentedControl | `useMantineColorScheme` | value + onChange binding | WIRED | `const { colorScheme, setColorScheme } = useMantineColorScheme()` + `onChange={(v) => setColorScheme(v)}` |
| `ResetDemoDataModal.tsx` | `window.location` | `handleReset` | WIRED | `window.location.href = '/'` after bulk wipe |
| `SettingsPage.tsx` | `useSearchParams` | `?tab=` URL state | WIRED | `const [searchParams, setSearchParams] = useSearchParams()` |
| `ReportsPage.tsx` CSV button | `exportTasksToCsv` | onClick | WIRED | `onClick={() => exportTasksToCsv(filteredTasks)}` |
| CRUD success paths | `notifications.show` | S8 toast pattern | WIRED | Called in `TaskFormModal` (create+edit), `ListsPage` (delete), `ProfileTab`, `WorkspaceTab` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `TaskTable.tsx` | `tasks` (prop) | `listTasks(workspaceId)` in `ListsPage.useMemo` keyed on `[workspaceId, refreshKey]` | `readWithSchema(K.tasks(...), TasksArraySchema, [])` | FLOWING |
| `ReportsTable.tsx` | `tasks` (prop) | `listTasks(workspaceId)` in `ReportsPage.useMemo` | Same codec read path | FLOWING |
| `ReportsChart.tsx` | `tasks` (prop) | Same `filteredTasks` from ReportsPage | Real tasks, day-bucketed | FLOWING |
| `ProfileTab.tsx` | `visitor` | `useAuthStore((s) => s.currentVisitor)` | Store hydrated from localStorage at auth | FLOWING |
| `WorkspaceTab.tsx` | `workspace` | `useAuthStore((s) => s.currentWorkspace)` | Store hydrated from localStorage at auth | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript typecheck | `npm run typecheck` | Exit 0, no errors | PASS |
| Production build | `npm run build` | Exit 0, 7863 modules, no TS errors | PASS |
| No hand-typed pendo strings (Lists) | `grep -rE "data-pendo-id=\"[a-z]" src/tasks/components/ src/routes/app/lists/` | 0 matches | PASS |
| No hand-typed pendo strings (Settings/Reports) | `grep -rE "data-pendo-id=\"[a-z]" src/settings/ src/routes/app/settings/ src/reports/ src/routes/app/reports/` | 0 matches | PASS |
| No debt markers in phase 4 files | `grep -rn "TBD\|FIXME\|XXX" src/tasks/components/ src/settings/ src/reports/ src/routes/app/` | 0 matches | PASS |
| ReportsTable column count | `grep -c "helper.accessor\|helper.display" src/reports/ReportsTable.tsx` | 6 (all accessor columns, no display-only) | PASS |
| TaskTable sorting wired | `grep -c "getSortedRowModel\|toggleSorting\|SortingState" src/tasks/components/TaskTable.tsx` | 5 | PASS |

---

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` found; no explicit probes declared in PLAN frontmatter. `npm run typecheck` and `npm run build` serve as the automated verification gates (both PASS above).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| LIST-01 | 04-03 | View task list at /app/lists | SATISFIED | `ListsPage.tsx` at Phase 3-registered route |
| LIST-02 | 04-03 | Create task via modal | SATISFIED | `TaskFormModal` mode='create' → `createTask` |
| LIST-03 | 04-03 | Edit task via same modal | SATISFIED | `TaskFormModal` mode='edit' → `updateTask` |
| LIST-04 | 04-02, 04-03 | Mark complete/incomplete | SATISFIED | Checkbox → `onToggleComplete` → `updateTask({ status })` |
| LIST-05 | 04-03 | Delete with confirmation | SATISFIED | `DeleteConfirmModal` → `deleteTask`, dual-triggered |
| LIST-06 | 04-03 | Sort by any visible column | SATISFIED | TanStack `getSortedRowModel` + `toggleSorting` on 5 sortable columns |
| LIST-07 | 04-03 | Filter by status, priority, assignee | SATISFIED | `TaskFiltersBar` three Selects, AND-filter in `filteredTasks` useMemo |
| LIST-08 | 04-03 | Friendly empty state | SATISFIED | `ListsEmptyState` (no tasks ever) + `FilteredEmptyState` (filters yield zero) |
| LIST-09 | 04-02, 04-03 | Mutations persist across refresh | SATISFIED | All mutations → `tasksRepo.*` → `writeJSON` (FND-04) |
| SET-01 | 04-04 | Settings page with three tabs | SATISFIED | `SettingsPage.tsx` with `useSearchParams`-driven Mantine Tabs |
| SET-02 | 04-02, 04-04 | Profile tab saves persist | SATISFIED | `updateVisitor` → `writeJSON(K.visitors())` |
| SET-03 | 04-02, 04-04 | Workspace tab saves persist | SATISFIED | `updateWorkspace` → `writeJSON(K.workspaces())` |
| SET-04 | 04-01, 04-04 | Theme toggle | SATISFIED | `useMantineColorScheme()` + `setColorScheme`, `defaultColorScheme="auto"` in App.tsx + ColorSchemeScript in index.html |
| SET-05 | — | pendo.identify on save | NOT IN SCOPE | Explicitly deferred to Phase 6 per CONTEXT.md. REQUIREMENTS.md marks as Pending. Save handlers structured for Phase 6 drop-in. |
| SET-06 | 04-04 | Reset demo data | SATISFIED | `ResetDemoDataModal` two-pass wipe + `window.location.href = '/'` |
| REP-01 | 04-05 | Reports filters: date range + at least one other | SATISFIED | DatePickerInput range + assignee Select + status MultiSelect |
| REP-02 | 04-05 | TanStack Table with at least 5 columns | SATISFIED | 6 columns in `ReportsTable.tsx` |
| REP-03 | 04-05 | At least one SVG chart | SATISFIED | Recharts SVG BarChart in `ReportsChart.tsx` |
| REP-04 | 04-05 | Export CSV button | SATISFIED | `exportTasksToCsv` RFC 4180 Blob download |

**Note on SET-05:** The phase goal statement explicitly says "Pendo metadata sync (PEN-04) is added in Phase 6." REQUIREMENTS.md marks SET-05 as Pending / Phase 4 with deferred status. This is not a gap in Phase 4 scope.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/tasks/components/TaskFormModal.tsx` | ~170-172 | `const assigneeOptions = [...getAssigneeOptions(...)]` — unnecessary spread copies array on every render (IN-03 from code review, deferred) | Info | Non-blocking; result only iterated once |
| `src/tasks/tasksRepo.ts` | ~75 | `input.completedAt == null` uses loose equality (IN-02 from code review, deferred) | Info | Functionally correct (schema is `.nullable()`) |

No TBD, FIXME, or XXX markers found in any Phase 4 modified files. No stub patterns in rendered components. No hardcoded empty data props in call sites.

---

### Human Verification Required

All 5 success criteria are satisfied by code inspection + static analysis. The items below are runtime confirmations of correct-by-inspection code paths.

#### 1. Lists form reset on create-mode reopen (CR-01 fix)

**Test:** Sign in, navigate to /app/lists. Click "New task" → type "ABC" in Title → submit. Click "New task" again.
**Expected:** Form opens with blank Title and default Priority "Medium" — not "ABC".
**Why human:** The CR-01 fix (`useEffect + prevOpenedRef` on false→true `opened` transition) is logically correct by inspection. The REVIEW-FIX report explicitly notes "the false→true transition behavior should be smoke-tested in the running app" before phase verification signs off.

#### 2. Checkbox off-toggle restores prior status

**Test:** Find a task with Status "In Progress". Click its checkbox (becomes Done). Click the checkbox again.
**Expected:** Status badge shows "In Progress" (not "To Do"). The `prevStatus` field was captured at →done and read back at off-done via `task.prevStatus ?? 'todo'`.
**Why human:** Requires a live app + task data. Legacy tasks without `prevStatus` will still fall back to 'todo' per the `?? 'todo'` fallback — that is expected.

#### 3. Settings save persists and top-bar updates instantly

**Test:** On /app/settings?tab=profile, edit First Name → Save. Observe top-bar name updates immediately. Hard refresh.
**Expected:** Edited First Name persists. Same test for Workspace tab (Company Name → Save → top bar updates → hard refresh persists).
**Why human:** localStorage write + Zustand store propagation + top-bar reactivity require a live browser session.

#### 4. Reset demo data wipes all user data

**Test:** /app/settings?tab=preferences → "Reset demo data" → confirm. Check DevTools > Application > localStorage.
**Expected:** Zero `halo:v1:*` keys with user data. `halo:v1:meta` with `seededAt: null` is acceptable. `mantine-color-scheme-value` preserved. Re-registering works fresh.
**Why human:** Requires full reset cycle + localStorage inspection in DevTools.

#### 5. Reports CSV is well-formed

**Test:** /app/reports with tasks visible → "Export CSV".
**Expected:** Downloads `halo-tasks-YYYY-MM-DD.csv` with 6 columns. RFC 4180 quoting correct for fields with commas/quotes. Date columns in YYYY-MM-DD format.
**Why human:** Blob download + CSV content inspection require a live browser.

---

### Gaps Summary

No gaps. All 5 success criteria (Lists CRUD, Settings tabs+save, Reset demo data, Reports table+chart+CSV, Pendo IDs) are verified by code inspection and static analysis. The 5 human verification items above are runtime confirmations of correct-by-inspection code paths — they are not blockers but are standard human sign-off items for a phase of this scope.

SET-05 is intentionally out of scope per the phase goal statement and ROADMAP (deferred to Phase 6).

---

_Verified: 2026-05-15_
_Verifier: Claude (gsd-verifier)_

---
phase: 04-core-pages-lists-settings-reports
plan: "06"
subsystem: reports-lists-dates
tags:
  - gap-closure
  - date-handling
  - utc
  - blocker-fix
dependency_graph:
  requires:
    - 04-01
    - 04-02
    - 04-03
    - 04-04
    - 04-05
  provides:
    - UTC-anchored dueDate/completedAt display at all read sites
    - Coherent Reports filter chain (chart + table in UTC agreement)
    - Empty-status sentinel (empty = match-all) in Reports
  affects:
    - src/main.tsx
    - src/tasks/components/TaskTable.tsx
    - src/reports/ReportsTable.tsx
    - src/reports/csvExport.ts
    - src/reports/ReportsChart.tsx
    - src/routes/app/reports/ReportsPage.tsx
tech_stack:
  added: []
  patterns:
    - dayjs UTC plugin registration at app boot (dayjs.extend(utc) in src/main.tsx)
    - dayjs(value).utc().format(...) for UTC-anchored display of ISO datetime fields
    - dayjs.utc(value) for UTC-anchored filter chain in Reports
    - Empty multi-select = match-all sentinel (matching Lists `All` Select idiom)
key_files:
  created: []
  modified:
    - src/main.tsx
    - src/tasks/components/TaskTable.tsx
    - src/reports/ReportsTable.tsx
    - src/reports/csvExport.ts
    - src/reports/ReportsChart.tsx
    - src/routes/app/reports/ReportsPage.tsx
decisions:
  - "Register dayjs UTC plugin at app boot (src/main.tsx) — single registration point before React mounts; idempotent"
  - "UTC-anchor read-side formatters only (no write-side change) — persisted ISO shape unchanged, D-26 still applies"
  - "Empty statusFilter = match-all in ReportsPage — overrides Phase 04-05 design note per CR-03 + SC #4 invalidation"
  - "Two UTC idioms tolerated: raw Date.getUTCFullYear() in Dashboard, dayjs.utc() in Reports/Lists — Dashboard untouched"
  - "No Clear-filters affordance added — option-1 sentinel (empty=match-all) removes the dead-end without UI changes"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-15T17:17:59Z"
  tasks_completed: 5
  files_modified: 6
---

# Phase 04 Plan 06: Gap Closure CR-01/CR-02/CR-03 — Date Handling + Empty-Status Sentinel Summary

**One-liner:** UTC-anchored dayjs plugin registration at boot closes three Phase 4 BLOCKER findings: dueDate/completedAt display off-by-one-day west of UTC (CR-01), Reports chart/filter timezone disagreement (CR-02), and empty-status stranding with no recovery (CR-03).

## Objective

Close three BLOCKER findings from `04-REVIEW.md` identified by `04-VERIFICATION.md` as Success Criteria #1 and #4 invalidations:

- **CR-01:** `dueDate`/`completedAt` stored as UTC midnight but displayed via local-time `dayjs(...).format(...)` — users west of UTC see the day before the picked date.
- **CR-02:** `ReportsChart` bucket key uses local-time `dayjs(t.createdAt).format('YYYY-MM-DD')` while `ReportsPage` filter operates on local-time `.startOf('day')/.endOf('day')` — chart bars and table rows disagree.
- **CR-03:** `statusFilter.length === 0` returns `false` for every task with no recovery affordance — users who deselect all Status chips are stranded.

## Tasks

### Task A: Register dayjs UTC plugin at app boot (prerequisite)

**Status:** COMPLETE  
**Commit:** `9120e2c`  
**Files modified:** `src/main.tsx`

Inserted `import dayjs from 'dayjs'`, `import utc from 'dayjs/plugin/utc'`, and `dayjs.extend(utc)` into the side-effect zone of `src/main.tsx` (after Mantine CSS imports, after `runMigrations()`, before `createRoot().render()`). No new npm dependency — `dayjs/plugin/utc` ships inside `dayjs ^1.11.20`.

**Acceptance criteria grep counts:**
- `grep -n "from 'dayjs/plugin/utc'" src/main.tsx` → 1 match (line 5)
- `grep -n "import dayjs from 'dayjs'" src/main.tsx` → 1 match (line 4)
- `grep -cE '^dayjs\.extend\(utc\)' src/main.tsx` → 1 match (line 27)

### Task B: UTC-anchored date display at all four read sites (closes CR-01)

**Status:** COMPLETE  
**Commit:** `9120e2c` (same commit)  
**Files modified:** `src/tasks/components/TaskTable.tsx`, `src/reports/ReportsTable.tsx`, `src/reports/csvExport.ts`

Four `.format(...)` call sites patched to `.utc().format(...)`:

1. **TaskTable.tsx Due-date cell:** `dayjs(value).format('MMM D, YYYY')` → `dayjs(value).utc().format('MMM D, YYYY')`
2. **ReportsTable.tsx Due-date cell:** `dayjs(value as string).format('MMM D, YYYY')` → `dayjs(value as string).utc().format('MMM D, YYYY')`
3. **ReportsTable.tsx Completed-at cell:** same `.utc()` insertion
4. **csvExport.ts toCsv():** `dayjs(t.dueDate).format('YYYY-MM-DD')` → `dayjs(t.dueDate).utc().format('YYYY-MM-DD')` AND `dayjs(t.completedAt).format('YYYY-MM-DD')` → `dayjs(t.completedAt).utc().format('YYYY-MM-DD')`

File-header JSDoc updated in all three files to document UTC convention and link to CR-01 + plan.

**Acceptance criteria grep counts:**
- `grep -cE 'dayjs\(value\)\.utc\(\)\.format\(.MMM D, YYYY.\)' src/tasks/components/TaskTable.tsx` → `1`
- `grep -cE 'dayjs\(value as string\)\.utc\(\)\.format\(.MMM D, YYYY.\)' src/reports/ReportsTable.tsx` → `2`
- `grep -cE 'dayjs\(t\.dueDate\)\.utc\(\)\.format\(.YYYY-MM-DD.\)' src/reports/csvExport.ts` → `1`
- `grep -cE 'dayjs\(t\.completedAt\)\.utc\(\)\.format\(.YYYY-MM-DD.\)' src/reports/csvExport.ts` → `1`
- Old local-time formatters eliminated (comment-filtered): 0 matches each

### Task C: UTC throughout the Reports filter chain (closes CR-02)

**Status:** COMPLETE  
**Commit:** `9120e2c` (same commit)  
**Files modified:** `src/reports/ReportsChart.tsx`, `src/routes/app/reports/ReportsPage.tsx`

**ReportsChart.tsx:**
- Bucket axis: `const today = dayjs()` → `dayjs.utc()`, `dayjs(dateRange[0])` → `dayjs.utc(dateRange[0])`, `dayjs(dateRange[1])` → `dayjs.utc(dateRange[1])`
- Match key: `dayjs(t.createdAt).format('YYYY-MM-DD')` → `dayjs.utc(t.createdAt).format('YYYY-MM-DD')`
- JSDoc: added timezone convention paragraph documenting the two UTC idioms

**ReportsPage.tsx:**
- Date-range predicate: `dayjs(t.createdAt).isBefore(dayjs(dateRange[0]).startOf('day'))` → `dayjs.utc(t.createdAt).isBefore(dayjs.utc(dateRange[0]).startOf('day'))` (and matching `isAfter`/`endOf('day')` on upper bound)
- Note: `.sort((a, b) => dayjs(b.createdAt).valueOf() - ...)` intentionally left unchanged (`.valueOf()` is timezone-agnostic)

**Acceptance criteria grep counts:**
- `grep -cE 'dayjs\.utc\(t\.createdAt\)\.format\(.YYYY-MM-DD.\)' src/reports/ReportsChart.tsx` → `1`
- `grep -cE 'const today = dayjs\.utc\(\)' src/reports/ReportsChart.tsx` → `1`
- `grep -cE 'const start = dateRange\[0\] \? dayjs\.utc\(dateRange\[0\]\)' src/reports/ReportsChart.tsx` → `1`
- `grep -cE 'const end = dateRange\[1\] \? dayjs\.utc\(dateRange\[1\]\)' src/reports/ReportsChart.tsx` → `1`
- `grep -cE 'dayjs\.utc\(t\.createdAt\)\.isBefore\(dayjs\.utc\(dateRange\[0\]\)\.startOf\(.day.\)\)' src/routes/app/reports/ReportsPage.tsx` → `1`
- `grep -cE 'dayjs\.utc\(t\.createdAt\)\.isAfter\(dayjs\.utc\(dateRange\[1\]\)\.endOf\(.day.\)\)' src/routes/app/reports/ReportsPage.tsx` → `1`
- Old local-time predicates eliminated (comment-filtered): 0 matches each

### Task D: Reports empty-status sentinel — empty = match-all (closes CR-03)

**Status:** COMPLETE  
**Commit:** `9120e2c` (same commit)  
**Files modified:** `src/routes/app/reports/ReportsPage.tsx`

**Predicate flip (D1):**
```
// Before (two lines):
if (statusFilter.length === 0) return false
if (!statusFilter.includes(t.status)) return false

// After (one line):
if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false
```

Truth table: `length === 0` → short-circuits to `false` → no rows filtered (match-all). `length > 0 && includes` → row passes. `length > 0 && !includes` → row filtered.

**JSDoc rewrite (D2):** The file-header comment at lines 20-22 previously read "deselecting all yields the empty state" — replaced with documentation of the new "empty array = match-all" semantics, linking to CR-03 and the Phase 04-05 design note override.

**Acceptance criteria grep counts:**
- `grep -cE 'statusFilter\.length > 0 && !statusFilter\.includes' src/routes/app/reports/ReportsPage.tsx` → `1`
- Old `if (statusFilter.length === 0) return false` eliminated (comment-filtered): 0 matches
- Old standalone `if (!statusFilter.includes(t.status)) return false` eliminated (comment-filtered, anchored): 0 matches
- `grep -cE 'deselecting all yields the empty state' src/routes/app/reports/ReportsPage.tsx` → `0`
- `grep -cE 'empty array = match-all' src/routes/app/reports/ReportsPage.tsx` → `1`

### Task E: Plan-completion commit

**Status:** COMPLETE  
**Commit:** `9120e2c` (conventional commit: `fix(04-06): close CR-01/CR-02/CR-03 date-handling + empty-status gaps`)

## Build + Typecheck Status

| Check | Status |
|-------|--------|
| `npm run typecheck` (after Task A) | PASS — exit 0 |
| `npm run build` (after Task A) | PASS — 1,669 KB JS / 238 KB CSS |
| `npm run typecheck` (after Task B) | PASS — exit 0 |
| `npm run build` (after Task B) | PASS |
| `npm run typecheck` (after Task C) | PASS — exit 0 |
| `npm run build` (after Task C) | PASS |
| `npm run typecheck` (after Task D — final) | PASS — exit 0 |
| `npm run build` (after Task D — final) | PASS — 1,669 KB JS / 238 KB CSS |

## Deviations from Plan

### Override of Phase 04-05 STATE.md note

**Context:** Phase 04-05's STATE.md decision log noted: *"Empty status filter (deselect all in MultiSelect) is a deliberate empty-state trigger; the file-level comment at lines 20-22 of ReportsPage.tsx documents this as a designed behavior."*

**Override:** This plan explicitly overrides that decision because `04-VERIFICATION.md` classifies it as a Success Criteria #4 invalidation — the user who deselects all Status chips is stranded with no recovery affordance, making "the user can filter and view in TanStack Table" unreachable. Task D applies the override per plan-body documentation. The in-code record is the JSDoc rewrite at lines 20-22 of `ReportsPage.tsx`.

### Auto-fixed JSDoc count gate (minor)

**Found during:** Task B  
**Issue:** The plan's acceptance criterion for TaskTable's JSDoc update originally embedded the exact grep pattern `dayjs(value).utc().format('MMM D, YYYY')` in the JSDoc comment text, which would have produced 2 matches for the "count = 1" gate (JSDoc line + code line).  
**Fix:** Changed the JSDoc to use `dayjs(v).utc().format(...)` in the description (substituting `v` for `value`) so the count gate returns exactly `1` (code line only). This preserves the intent — the JSDoc still documents the UTC convention — without triggering a false count.  
**Classification:** Rule 1 (auto-fix: gate would have failed without the adjustment). No behavior change.

### No Other Deviations

All five tasks executed exactly as specified. No new dependencies were added. No write-side schema changes. No Dashboard.tsx modification. No "Clear filters" affordance added (not needed; option-1 sentinel removes the dead-end).

## Behavior Assertions (Manual Smoke — Documented for Future Human Verification)

Per the plan's `<acceptance_criteria>` behavioral assertions (which require a live browser in a non-UTC timezone):

1. **CR-01 regression test:** On a machine in any non-UTC timezone, pick due date "May 15, 2026" → Lists table shows "May 15, 2026" (not May 14). Reports table Due-date column matches. CSV export shows `2026-05-15`. Edit modal picker still shows May 15.

2. **CR-02 regression test:** Narrow Reports date range to a 3-day window straddling a recently-created task → chart bar count for that range equals table row count (pre-patch: could disagree by ±1 per boundary day).

3. **CR-03 regression test:** Open Reports, deselect all three Status chips → table renders all rows passing date-range + assignee predicates; empty-state "No tasks match these filters" is NOT shown; Export CSV button remains enabled. Narrowing to `[done]` still filters correctly.

These tests require a live dev server with an authenticated session in a non-UTC timezone — documented in `04-VERIFICATION.md human_verification` block for post-deploy smoke.

## Known Stubs

None. All patched formatters and predicates are fully wired to real data.

## Threat Flags

None. This plan modifies read-side formatters and a filter predicate only — no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check

**Files exist:**
- `src/main.tsx` — contains `dayjs.extend(utc)` ✓
- `src/tasks/components/TaskTable.tsx` — contains `dayjs(value).utc().format('MMM D, YYYY')` ✓
- `src/reports/ReportsTable.tsx` — contains `.utc().format('MMM D, YYYY')` at 2 sites ✓
- `src/reports/csvExport.ts` — contains `dayjs(t.dueDate).utc().format(...)` ✓
- `src/reports/ReportsChart.tsx` — contains `dayjs.utc(t.createdAt).format(...)` + `dayjs.utc()` axis ✓
- `src/routes/app/reports/ReportsPage.tsx` — contains `statusFilter.length > 0 && !statusFilter.includes(...)` + `dayjs.utc(...)` predicates ✓

**Commit exists:** `9120e2c` — verified via `git log -1 --stat`

## Self-Check: PASSED

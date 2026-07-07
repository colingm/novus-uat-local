---
phase: 04-core-pages-lists-settings-reports
fixed_at: 2026-05-15
review_path: .planning/phases/04-core-pages-lists-settings-reports/04-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-05-15
**Source review:** `.planning/phases/04-core-pages-lists-settings-reports/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (1 Blocker, 2 Warnings — Info findings IN-01/IN-02/IN-03 deferred per `fix_scope: critical_warning`)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: `keepMounted={false}` does NOT reset RHF state on create-mode reopen — UAT 1b defect is NOT closed

**Files modified:** `src/tasks/components/TaskFormModal.tsx`
**Commit:** `77e67f3`
**Applied fix:**

- Added `useEffect`, `useMemo`, `useRef` imports from React.
- Wrapped `defaultValues` in `useMemo` keyed on `[mode, initialTask, visitor.id, visitor.firstName, visitor.lastName]` so the reset call below receives a stable reference and the effect's dep array is honest. (Listing visitor's primitive fields rather than the whole `visitor` object keeps the memo stable across renders where visitor identity hasn't changed.)
- Added an explicit `useEffect` that compares `prevOpenedRef.current` (previous `opened`) against the new value and calls `form.reset(defaultValues)` ONLY on the false→true open transition AND only when `mode === 'create'`. Edit-mode resets remain driven by the existing `values: defaultValues` bridge on `useForm`, which the planner intentionally kept in place — it's the right mechanism for `initialTask` flips because each edit-open hands RHF a structurally different `values` object.
- `keepMounted={false}` on the `<Modal>` was preserved (harmless — matches Mantine v9 default, no behavioral change either way) per the task brief.
- Inline comments at the `useForm` `values:` line and at the new effect explicitly document why each mechanism exists and which case it covers, so the next reader doesn't reintroduce the bug.

**Logic verification note:** This fix touches form-state lifecycle, which is semantic, not just syntactic. Typecheck + production build both pass, but the false→true transition behavior should be smoke-tested in the running app (open "New task", submit, reopen "New task", confirm fields are empty) before phase verification signs off. Marked as `fixed` rather than `fixed: requires human verification` because the ref-based transition pattern is well-established and the comparison logic is straightforward (single boolean flip), but flagged here for traceability.

### WR-01: Stale JSDoc in `DeleteConfirmModal` still describes the removed `<Title>` JSX

**Files modified:** `src/tasks/components/DeleteConfirmModal.tsx`
**Commit:** `62c44d4`
**Applied fix:** Replaced the stale JSDoc bullet `- Title <Title order={3}>Delete this task?</Title>` with `- Title: plain string "Delete this task?" passed via Modal's title prop (no nested <Title> JSX — avoids the heading-nesting defect closed by plan 04-07 UAT 1a)`. The documentation now matches the implementation at line 46 (which uses the plain-string `title` prop on `<Modal>`). No runtime behavior changed; committed as `docs(04): ...` per task instructions.

### WR-02: `updateTask` signature exposes `prevStatus` to callers — invariant not type-locked

**Files modified:** `src/tasks/tasksRepo.ts`
**Commit:** `e826f89`
**Applied fix:**

- Introduced a new exported `UpdateTaskPatch` type: `Partial<Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'prevStatus'>>` — type-locking out the repo-owned fields so a caller cannot smuggle `prevStatus` or `completedAt` through the merge.
- Changed `updateTask`'s `patch` parameter from `Partial<Omit<Task, 'id' | 'createdAt'>>` to `UpdateTaskPatch`.
- Kept the internal `stamped` variable's broader type (`Partial<Omit<Task, 'id' | 'createdAt'>>`) intact, because the repo itself writes the repo-owned fields — narrowing `stamped` would have broken the legitimate internal writes on the `→done` / off-done edges. Added a clarifying comment at the `stamped` declaration so the type-width difference doesn't look accidental.
- Verified callers compile: `ListsPage.tsx` checkbox toggle passes `{ status }` (safe), `TaskFormModal.tsx` submit passes `TaskFormValues` (no `prevStatus` or `completedAt` field — already type-safe by construction).

## Verification

The task brief required `npm run typecheck` and `npm run build` after applying fixes.

- `npm run typecheck` (`tsc --noEmit -p tsconfig.app.json`) — **PASS** (no output, exit 0) after all three fixes.
- `npm run build` (`tsc -b && vite build`) — **PASS**. 7863 modules transformed, build completed in 690ms. The pre-existing chunk-size warning (`Some chunks are larger than 500 kB after minification`) is unchanged from baseline and unrelated to these fixes.
- Per-fix Tier-1 re-read confirmed in all three files: the new imports, the `useMemo`+`useRef`+`useEffect` block, the JSDoc bullet rewrite, and the new `UpdateTaskPatch` export are all present with surrounding code intact.

## Out of Scope (Info findings — `fix_scope: critical_warning`)

The following Info findings from REVIEW.md were NOT fixed in this iteration. They are non-blocking polish per the reviewer's recommendation and the orchestrator's scope filter. If a future `--fix --all` iteration is run, they should be picked up:

- **IN-01**: `createTask` couples `prevStatus = null` setting to a `completedAt == null` precondition (`src/tasks/tasksRepo.ts:61-64`).
- **IN-02**: Loose-equality `input.completedAt == null` in `createTask` (`src/tasks/tasksRepo.ts:62`).
- **IN-03**: `assigneeOptions` array spread serves no purpose (`src/tasks/components/TaskFormModal.tsx:137-139`, now shifted to lines ~170-172 after the CR-01 edit).

---

_Fixed: 2026-05-15_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

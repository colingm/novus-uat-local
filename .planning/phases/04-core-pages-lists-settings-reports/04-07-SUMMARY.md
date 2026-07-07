---
phase: 04-core-pages-lists-settings-reports
plan: "07"
subsystem: tasks-lists-settings
tags: [gap-closure, uat-fixes, modal, rhf, schema, repo-invariant]
dependency_graph:
  requires: [04-03, 04-04, 04-06]
  provides: [UAT-1a, UAT-1b, UAT-1c, UAT-1d, UAT-2a, UAT-2b]
  affects: [TaskFormModal, DeleteConfirmModal, ResetDemoDataModal, TaskSchema, tasksRepo, ListsPage]
tech_stack:
  added: []
  patterns:
    - Modal title as plain string (not JSX) for Mantine v9 heading nesting compliance
    - keepMounted={false} for RHF state cleanup on Modal close
    - prevStatus optional+nullable field on Task record (symmetric to D-09 completedAt invariant)
    - prevTaskStatus local variable rename to avoid schema field shadowing
key_files:
  created: []
  modified:
    - src/tasks/components/TaskFormModal.tsx
    - src/tasks/components/DeleteConfirmModal.tsx
    - src/settings/ResetDemoDataModal.tsx
    - src/tasks/schemas.ts
    - src/tasks/tasksRepo.ts
    - src/routes/app/lists/ListsPage.tsx
decisions:
  - "Task B: keepMounted={false} chosen over form.reset() useEffect — one-line, no timing risk, unmounts form on close so RHF cleanup is implicit"
  - "Task C: prevStatus: TaskStatusEnum.optional().nullable() — .optional() last so inferred type is TaskStatus | null | undefined; no SCHEMA_VERSION bump (D-26)"
  - "Task D: doc-only fix chosen per UAT.md severity reclassification; no behavior change to runMigrations() or handleReset"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-05-15"
  tasks_completed: 4
  files_modified: 6
---

# Phase 4 Plan 07: UAT Gap-Closure (Modal Heading Nesting, Form Reset, prevStatus, JSDoc) Summary

Closed all six UAT sub-issues reported after Phase 4 human UAT (1a, 1b, 1c, 1d, 2a, 2b) across four tasks. Plan executed atomically with zero architectural deviations.

## Tasks Completed

### Task A: Drop nested `<Title order={3}>` from all three Modal `title` props (UAT 1a / 1d / 2a)
**Commit:** 42e18bf

Mantine v9 Modal renders its `title` prop inside its own `<h2>` element. All three Modals were passing `<Title order={3}>` (renders as `<h3>`) to the `title` prop, producing `<h2><h3>...</h3></h2>` — invalid HTML and a React hydration warning that spammed the console on every modal open.

**Diff shape:**
- `TaskFormModal.tsx`: `title={<Title order={3}>{mode === 'create' ? 'New task' : 'Edit task'}</Title>}` → `title={mode === 'create' ? 'New task' : 'Edit task'}`
- `DeleteConfirmModal.tsx`: `title={<Title order={3}>Delete this task?</Title>}` → `title="Delete this task?"`
- `ResetDemoDataModal.tsx`: `title={<Title order={3}>Reset demo data?</Title>}` → `title="Reset demo data?"`
- Removed now-unused `Title` import from `@mantine/core` in all three files.

Visual appearance is identical — Mantine v9's title slot renders at heading-equivalent typography by default.

### Task B: Reset TaskFormModal create-mode form state on close→open transition (UAT 1b)
**Commit:** 7263c51

**Fix chosen: `keepMounted={false}` (primary path).** Added `keepMounted={false}` to the `<Modal>` JSX props in `TaskFormModal.tsx`. This makes Mantine unmount the modal body on close so RHF state resets naturally on remount. Rationale: one-line fix, no useEffect timing risk, no extra ref tracking needed, and Mantine v9.2.0 supports the prop natively.

The fallback (`form.reset(defaultValues)` in a `useEffect` on the false→true open transition) was not needed and not implemented.

**Preserved:** The existing `values: defaultValues` prop on `useForm` remains untouched — it is the bridge for edit-mode `initialTask` flips (changing which task is being edited still re-defaults the form cleanly via RHF's controlled `values` contract).

**Edit-mode correctness confirmed:** `keepMounted={false}` applies to both create and edit mode opens of the same `TaskFormModal` component. Edit mode is unaffected — the controlled `values` prop re-applies fresh defaults from `initialTask` on every remount.

### Task C: Add `prevStatus` field to Task schema/types/repo and consume from ListsPage checkbox toggle (UAT 1c)
**Commit:** 67a4695

**Schema change (`src/tasks/schemas.ts`):**
Added `prevStatus: TaskStatusEnum.optional().nullable()` to `TaskSchema` after `completedAt`. Modifier ordering: `.optional().nullable()` — `.optional()` placed last so the inferred TypeScript type is `TaskStatus | null | undefined`. The field is additive and backwards-compatible: existing seeded tasks in localStorage (which lack the `prevStatus` key) parse cleanly via `readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])` because Zod's `.optional()` accepts missing keys. No SCHEMA_VERSION bump (D-26 preserved). The `Task` and related types in `src/tasks/types.ts` derive from `TaskSchema` via `z.infer` — the new field flows through automatically without any edit to `types.ts`.

**Repo change (`src/tasks/tasksRepo.ts`):**
- Renamed local variable `const prevStatus = existing[idx].status` (line 102) to `const prevTaskStatus` to avoid shadowing the new `Task.prevStatus` field name. Updated both uses in the conditional block.
- Added `prevStatus` stamping block after the existing `completedAt` block:
  - `→done` transition (`stamped.status === 'done' && prevTaskStatus !== 'done'`): `stamped.prevStatus = prevTaskStatus` (captures prior status)
  - off-done transition (`stamped.status !== 'done' && prevTaskStatus === 'done'`): `stamped.prevStatus = null` (clears prior-status memory)
- Extended `createTask`: when `input.status === 'done'` and `input.completedAt == null`, the stamped object now also includes `prevStatus: null` (no prior status to recall for a newly-created done task).

**ListsPage change (`src/routes/app/lists/ListsPage.tsx`):**
Changed the off-toggle predicate from the lossy `status: nextDone ? 'done' : 'todo'` to:
```ts
status: nextDone ? 'done' : (task.prevStatus ?? 'todo')
```
The `??` fallback handles legacy tasks (no `prevStatus` key) and tasks created directly in `done` state — both fall back to `'todo'`, matching pre-fix behavior for those records.

**D-09 `completedAt` invariant preserved verbatim.** The new `prevStatus` invariant is layered alongside, not in place of, the existing `completedAt` stamping.

### Task D: Clarify halo:v1:meta post-reload re-creation in ResetDemoDataModal JSDoc (UAT 2b)
**Commit:** 91a181f

**Doc-only fix per UAT.md severity reclassification (minor, contract-clarification, not a behavior bug).**

Added a new JSDoc paragraph to the top-of-file block in `ResetDemoDataModal.tsx`:
1. Documents that the two-pass collect-then-remove loop is the **correct** pattern for iterating over `localStorage` while removing keys (not a live-mutation bug — the planning_context's "live-mutation iteration bug" framing was a misread; the code was already correct).
2. Documents the UAT 2b contract: at reset-confirm time, EVERY `halo:v*` key including `halo:v1:meta` is deleted. Zero `halo:v1:*` keys remain at that exact moment.
3. Documents the expected post-reload re-creation: `runMigrations()` detects `peekRaw(K.meta()) === null` and writes `DEFAULT_META = { schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }` — the storage envelope's boot record, not surviving user data.
4. Provides a test criterion for future UAT runners: if `halo:v1:meta` value is `{ schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }` with no embedded tasks/visitors/workspaces after reset, the wipe contract is honored.

Added a brief inline comment inside `handleReset` after the bulk-remove step pointing to the top-of-file JSDoc.

No changes to `handleReset` runtime behavior. `src/storage/migrations.ts` not modified.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None introduced in this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema trust-boundary changes.

## Manual UAT Re-Walkthrough

Deferred to the next user verification cycle per plan scope. Static + typecheck + build verification all pass:

- `npm run typecheck` exits 0 after each task.
- `npm run build` exits 0 after the final task.
- No `title={<Title` patterns remaining anywhere in `src/` (verified by grep).
- `PENDO_IDS` registry references preserved across all six modified files.
- `src/storage/migrations.ts`, `src/main.tsx`, `src/tasks/types.ts`, `src/tasks/tasksSeed.ts`, `src/pendo/PENDO_IDS.ts`, `src/router.tsx`, `src/App.tsx` not modified.

## Self-Check

Files exist:
- src/tasks/components/TaskFormModal.tsx: modified
- src/tasks/components/DeleteConfirmModal.tsx: modified
- src/settings/ResetDemoDataModal.tsx: modified
- src/tasks/schemas.ts: modified
- src/tasks/tasksRepo.ts: modified
- src/routes/app/lists/ListsPage.tsx: modified

Commits exist:
- 42e18bf: fix(04-07): drop nested <Title order={3}> from all three Modal title props
- 7263c51: fix(04-07): TaskFormModal create-mode reopen no longer carries prior values
- 67a4695: feat(04-07): add prevStatus field to Task schema/repo and restore off-toggle status
- 91a181f: docs(04-07): clarify halo:v1:meta post-reload re-creation in ResetDemoDataModal

## Self-Check: PASSED

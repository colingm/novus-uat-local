---
phase: "04"
plan: "02"
subsystem: data/ui-foundation
tags: [repo-extension, completedAt-invariant, task-form-schema, badge-colors, primitives, now-ref-extraction, assignee-options]
dependency_graph:
  requires:
    - phase: "04"
      plan: "01"
      provides: ["@mantine/dates@9.2.1", "PENDO_IDS.lists/settings/reports namespaces"]
    - phase: "03"
      provides: ["tasksRepo.updateTask base shape", "computeNowRef inlined in Dashboard.tsx", "TaskSchema/TASK_STATUS_LABELS"]
    - phase: "02"
      provides: ["authRepo create patterns", "VisitorSchema/WorkspaceSchema", "Mantine primitive wrapper contract (TextInput.tsx)"]
  provides:
    - "tasksRepo.updateTask completedAt invariant (status→done stamps; off-done clears)"
    - "tasksRepo.createTask completedAt symmetry for status==='done' inputs"
    - "authRepo.updateVisitor(id, patch) with structural Omit<passwordHash>"
    - "authRepo.updateWorkspace(id, patch) with structural Omit<ownerVisitorId>"
    - "TaskFormSchema + TaskFormValues (6 user-editable task fields)"
    - "TASK_STATUS_BADGE_COLOR + TASK_PRIORITY_BADGE_COLOR maps"
    - "computeNowRef shared module at src/tasks/now-ref.ts"
    - "getAssigneeOptions helper at src/tasks/assigneeOptions.ts"
    - "Checkbox / Textarea / DatePickerInput primitive wrappers"
  affects: ["04-03", "04-04", "04-05"]
tech_stack:
  added: []
  patterns:
    - "Repo-owned invariant: completedAt is stamped/cleared by tasksRepo.updateTask based on status transitions — UI code never thinks about the timestamp (D-09)"
    - "Structural-Omit defense (D-15): authRepo update patch types exclude immutable / secret fields so TypeScript flags any UI plumbing that would expose them (T-04-02-01 mitigation)"
    - "Form schema co-location: TaskFormSchema lives alongside TaskSchema in src/tasks/schemas.ts (mirrors src/auth/schemas.ts step1..step4 co-located with VisitorSchema)"
    - "Multi-prop primitive wrapper: Checkbox forwards both pendoId (required) and taskId (optional) — implements CLAUDE.md dynamic-list parameterization (data-pendo-id static + data-pendo-task-id dynamic per row)"
    - "Pure-helper module extraction: computeNowRef moves from Dashboard.tsx to src/tasks/now-ref.ts; Dashboard imports directly (no behavior change) — same shape as src/dashboard/relative-time.ts"
key_files:
  created:
    - src/tasks/now-ref.ts
    - src/tasks/assigneeOptions.ts
    - src/ui/primitives/Checkbox.tsx
    - src/ui/primitives/Textarea.tsx
    - src/ui/primitives/DatePickerInput.tsx
  modified:
    - src/tasks/tasksRepo.ts
    - src/tasks/schemas.ts
    - src/tasks/types.ts
    - src/tasks/labels.ts
    - src/tasks/index.ts
    - src/auth/authRepo.ts
    - src/ui/primitives/index.ts
    - src/dashboard/Dashboard.tsx
decisions:
  - "Phase 04-02: completedAt invariant is repo-owned and one-directional — patch.status === 'done' && prevStatus !== 'done' stamps; patch.status !== 'done' && prevStatus === 'done' clears; same-status no-ops. UI code MUST NOT touch completedAt."
  - "Phase 04-02: createTask symmetry uses input.completedAt == null (loose-equality null check) so an explicit `completedAt: null` from a caller still triggers the stamp — matches the 'caller did not supply a timestamp' intent."
  - "Phase 04-02: TaskFormSchema uses raw z.enum([...], { message: '...' }) at the form level instead of reusing TaskStatusEnum / TaskPriorityEnum from the persistence schemas — the persistence enums are deliberately message-less so corrupt-storage Zod errors don't surface user-facing copy. Both enum literal lists kept in lockstep (3 status values, 4 priority values)."
  - "Phase 04-02: authRepo.updateVisitor / updateWorkspace do NOT stamp an updatedAt field because VisitorSchema and WorkspaceSchema have no updatedAt — unlike Task. The Zod schemas remain the single source of truth; no schema edits were made."
  - "Phase 04-02: Dashboard.tsx imports computeNowRef directly from '../tasks/now-ref' (not via the '../tasks' barrel) — mirrors how Dashboard already imports formatRelative directly from './relative-time'. Both barrels also re-export the function so other Phase 4 consumers can pick either form."
  - "Phase 04-02: Checkbox wrapper documents that Mantine v9 forwards data-* attributes to the root container element (not the inner <input>) — Pendo can target either; both placements are guide-targetable. CLAUDE.md dynamic-list rule satisfied because data-pendo-id is the static class and data-pendo-task-id is the dynamic per-row attribute."
  - "Phase 04-02: SCHEMA_VERSION NOT bumped (D-26 lock) — Visitor / Workspace / Task stored shapes are unchanged. The new updateVisitor / updateWorkspace and the completedAt invariant are pure code additions over the same v1 schema."
metrics:
  duration: "4min 49sec"
  started: "2026-05-15T14:48:14Z"
  completed: "2026-05-15T14:53:03Z"
  tasks_completed: 2
  files_modified: 8
  files_created: 5
---

# Phase 4 Plan 02: Repo Extensions + Form Schema + Primitive Wrappers + computeNowRef Extraction Summary

**Repo behavior extended (`completedAt` invariant in `tasksRepo`; `updateVisitor` + `updateWorkspace` in `authRepo`), `TaskFormSchema` + badge-color maps shipped, three new primitive wrappers (`Checkbox`, `Textarea`, `DatePickerInput`) added with the existing `pendoId` contract, `computeNowRef` extracted from `Dashboard.tsx` into a shared `src/tasks/now-ref.ts` module, and `getAssigneeOptions` helper created — all four downstream Phase 4 page plans (04-03 Lists, 04-04 Settings, 04-05 Reports) now have every shared dependency they need.**

## Performance

- **Duration:** 4min 49sec
- **Started:** 2026-05-15T14:48:14Z
- **Completed:** 2026-05-15T14:53:03Z
- **Tasks:** 2 of 2
- **Files modified:** 8
- **Files created:** 5

## Accomplishments

- `tasksRepo.updateTask` is now the single owner of `completedAt`. Plan 04-03 Lists checkbox toggle can call `updateTask(workspaceId, taskId, { status: 'done' })` and trust the timestamp is stamped automatically; toggling back off `done` clears it.
- `tasksRepo.createTask` gained symmetric behavior: when `input.status === 'done'` and the caller did not supply a `completedAt`, the repo stamps it with `now`. Useful for seeded data and for any future flow that creates a task already complete.
- `authRepo.updateVisitor` and `authRepo.updateWorkspace` added with structurally-immutable patch types — `Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>` for visitor, `Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>` for workspace. TypeScript flags any caller (including future plan 04-04 Settings tabs) that would try to write `passwordHash` or `ownerVisitorId` — T-04-02-01 mitigation lives in the type system per Phase 2's `T-02-42` precedent.
- `TaskFormSchema` co-located alongside `TaskSchema` with the 6 user-editable fields (`title`, `description`, `status`, `priority`, `assignee`, `dueDate`). Error copy verbatim from 04-UI-SPEC §"Inline Validation Errors": `Enter a task title.` / `Pick a status.` / `Pick a priority.` / `Enter a valid date.`
- `TaskFormValues` type derived in `src/tasks/types.ts` via `z.infer<typeof TaskFormSchema>` — keeps the schemas-as-source-of-truth discipline.
- `TASK_STATUS_BADGE_COLOR` (indigo.3 / indigo.6 / gray.5) and `TASK_PRIORITY_BADGE_COLOR` (gray.5 / yellow.5 / orange.5 / red.6) maps added to `src/tasks/labels.ts` with `Record<TaskStatus, string>` / `Record<TaskPriority, string>` exhaustiveness annotations — TypeScript will catch any future status/priority addition that forgets to add a color.
- `computeNowRef` extracted verbatim (zero functional change) from `Dashboard.tsx` lines 58-75 into `src/tasks/now-ref.ts`. Dashboard now imports directly from there; the new ReportsPage in plan 04-05 will too. Shared demo-non-staleness anchor across the Phase 3 dashboard and the Phase 4 reports surface (D-22 lock).
- `getAssigneeOptions(workspaceId, visitor)` helper created at `src/tasks/assigneeOptions.ts` — sorts deduped assignees by name asc, always includes the current visitor, ready for the Lists/Reports filter Selects and the Task modal Assignee Select.
- Three new primitive wrappers (`Checkbox`, `Textarea`, `DatePickerInput`) added with the existing `pendoId: PendoId` required-prop contract. `Checkbox` additionally accepts `taskId?: string` forwarded as `data-pendo-task-id` — implements CLAUDE.md's dynamic-list parameterization rule for the Lists row complete-toggle.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Repo extensions (`tasksRepo` completedAt invariant + `authRepo.updateVisitor`/`updateWorkspace`) + `TaskFormSchema` + badge color maps | `07c33e2` | src/tasks/tasksRepo.ts, src/tasks/schemas.ts, src/tasks/types.ts, src/tasks/labels.ts, src/auth/authRepo.ts |
| 2 | New primitive wrappers (`Checkbox`, `Textarea`, `DatePickerInput`) + helper modules (`now-ref`, `assigneeOptions`) + Dashboard import refactor | `79ef55f` | src/ui/primitives/Checkbox.tsx, src/ui/primitives/Textarea.tsx, src/ui/primitives/DatePickerInput.tsx, src/ui/primitives/index.ts, src/tasks/now-ref.ts, src/tasks/assigneeOptions.ts, src/tasks/index.ts, src/dashboard/Dashboard.tsx |

## completedAt Invariant — Behavior Smoke

Walked through the logic by inspection against the new code in `src/tasks/tasksRepo.ts`:

| Starting status | Patch `status` | Patch `completedAt` (input) | Resulting `completedAt` |
|-----------------|----------------|-----------------------------|--------------------------|
| `'todo'` | `'done'` | _(absent)_ | `new Date().toISOString()` — stamped by repo |
| `'todo'` | `'done'` | `null` (caller mistake) | `new Date().toISOString()` — repo overrides per invariant |
| `'done'` | `'todo'` | _(absent)_ | `null` — cleared by repo |
| `'done'` | `'in_progress'` | `'2026-05-01T...'` (caller mistake) | `null` — repo overrides per invariant |
| `'in_progress'` | `'in_progress'` | _(absent)_ | unchanged (same-status, no-op) |
| `'todo'` | _(absent — only title patch)_ | _(absent)_ | unchanged (no status transition) |
| `'todo'` | `'in_progress'` | _(absent)_ | unchanged (neither moves into nor out of `'done'`) |

The patch object is cloned before stamping (`const stamped: Partial<Omit<Task, 'id' | 'createdAt'>> = { ...patch }`) so the caller's reference is never mutated — defensive against any caller that re-uses a patch object.

`createTask` symmetric case verified: `createTask(workspaceId, { ...rest, status: 'done', completedAt: null })` stores the new task with `completedAt: <now-ISO>` because `input.completedAt == null` is loose-equality true. A caller that explicitly supplies a real `completedAt` value passes through untouched.

## File-line shifts in Dashboard.tsx (computeNowRef extraction)

Before: lines 53-75 contained the section header comment ("Pure helper functions") and the inlined `function computeNowRef(tasks: Task[]): Date { ... }` (18 lines of body).

After: lines 53-58 collapse to the section header comment plus a 3-line breadcrumb pointing at the new module:

```typescript
// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

// `computeNowRef` was extracted to `src/tasks/now-ref.ts` in plan 04-02 (D-22).
// It is now shared between this Dashboard and the new Reports page; import via
// the tasks barrel — no behavior change for the Dashboard.

/**
 * Computes the start of the selected time window.
 */
function rangeStartFor(...
```

The `rangeStartFor`, `computeKpis`, `computeDayBuckets`, `computeStatusSlices`, `computeRecentEvents`, and `EmptyState` definitions all shift up by ~18 lines but their content is byte-identical. All call sites of `computeNowRef(tasks)` inside `Dashboard()` remain unchanged — they now resolve to the imported function. A new `import { computeNowRef } from '../tasks/now-ref'` line was added at the top of the file (line 38), directly after the existing `import { listTasks, TASK_STATUS_LABELS } from '../tasks'` line.

## Final Exported Surface (Phase 4 plan-02 deltas)

### `src/tasks/index.ts` barrel additions

- `computeNowRef` (re-export from `./now-ref`)
- `getAssigneeOptions` (re-export from `./assigneeOptions`)
- `TaskFormSchema` (already covered by `export * from './schemas'`)
- `TaskFormValues` (already covered by `export * from './types'`)
- `TASK_STATUS_BADGE_COLOR` + `TASK_PRIORITY_BADGE_COLOR` (already covered by `export * from './labels'`)

### `src/auth/authRepo.ts` new exports

- `updateVisitor(id: string, patch: Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>): Visitor | undefined`
- `updateWorkspace(id: string, patch: Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>): Workspace | undefined`

### `src/ui/primitives/index.ts` barrel additions

- `Checkbox` + `CheckboxProps` (`MantineCheckboxProps & { pendoId: PendoId; taskId?: string }`)
- `Textarea` + `TextareaProps` (`MantineTextareaProps & { pendoId: PendoId }`)
- `DatePickerInput` + `DatePickerInputProps` (`MantineDatePickerInputProps & { pendoId: PendoId }`)

## D-15 Compile-Time Defense Verification

Confirmed by inspection of the `Omit<>` patch types:

- `updateVisitor`'s patch parameter is typed `Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>`. A caller writing `updateVisitor(id, { passwordHash: '...' })` would receive TypeScript error `TS2353: Object literal may only specify known properties, and 'passwordHash' does not exist in type 'Partial<...>'`.
- `updateWorkspace`'s patch parameter is typed `Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>`. A caller writing `updateWorkspace(id, { ownerVisitorId: 'x' })` would receive the equivalent error.

T-04-02-01 mitigation is in the type system, not in a runtime check — the same discipline Phase 2 used for `T-02-42` (literal-union typed `submitError` state preventing leaked error strings).

## Verification Results

| Check | Status |
|-------|--------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run build` | PASS (exit 0; 1.49MB JS bundle / 481KB gzipped — same pre-existing chunk-size warning as plan 04-01, not introduced here) |
| `grep -rn 'localStorage\.' src/auth/authRepo.ts src/tasks/tasksRepo.ts` | 0 matches (FND-04 lock preserved — all storage I/O routes through `readWithSchema` / `writeJSON`) |
| `grep -c "completedAt.*new Date" src/tasks/tasksRepo.ts` | 4 matches (1 in `createTask`, 1 in `updateTask`, 2 in JSDoc) — invariant present in both write paths |
| `grep -c "completedAt[[:space:]]*=[[:space:]]*null" src/tasks/tasksRepo.ts` | 1 match — off-done clear branch present |
| `grep -c "^export function updateVisitor" src/auth/authRepo.ts` | 1 |
| `grep -c "^export function updateWorkspace" src/auth/authRepo.ts` | 1 |
| `grep -c "Omit<Visitor, 'id' \| 'passwordHash' \| 'createdAt'>" src/auth/authRepo.ts` | 1 |
| `grep -c "Omit<Workspace, 'id' \| 'ownerVisitorId' \| 'createdAt'>" src/auth/authRepo.ts` | 1 |
| `grep -c "^export const TaskFormSchema" src/tasks/schemas.ts` | 1 |
| TaskFormSchema field count (title/description/status/priority/assignee/dueDate) | 6 keys present |
| `grep -c "export type TaskFormValues" src/tasks/types.ts` | 1 |
| `grep -c "^export const TASK_STATUS_BADGE_COLOR" src/tasks/labels.ts` | 1 |
| `grep -c "^export const TASK_PRIORITY_BADGE_COLOR" src/tasks/labels.ts` | 1 |
| Badge color values (`indigo.3`, `indigo.6`, `gray.5`, `yellow.5`, `orange.5`, `red.6`) | All present per D-02 |
| 3 new primitive files exist | PASS |
| Checkbox forwards `data-pendo-id` + `data-pendo-task-id` | PASS |
| DatePickerInput imports from `@mantine/dates` | PASS |
| 3 new barrel exports in `src/ui/primitives/index.ts` | PASS |
| `src/tasks/now-ref.ts` exports `computeNowRef` | PASS |
| `src/tasks/assigneeOptions.ts` exports `getAssigneeOptions` | PASS |
| `src/dashboard/Dashboard.tsx` imports `from '../tasks/now-ref'` | 1 match |
| Inlined `function computeNowRef` removed from `Dashboard.tsx` | 0 matches (correctly removed) |
| `src/tasks/index.ts` re-exports `computeNowRef` + `getAssigneeOptions` | PASS |

## Deviations from Plan

**None — plan executed exactly as written.**

The plan was very precise on every contract (exact Omit type literals, exact error-copy strings, exact color tokens, exact module-shape templates). No auto-fixes (Rule 1/2/3) were triggered, and no architectural decisions (Rule 4) arose. Both `npm run typecheck` and `npm run build` passed on first run after each task.

One minor implementation detail worth noting (not a deviation, just a small choice within plan discretion): The plan's Task 2 acceptance criteria literally specified that Dashboard.tsx import `computeNowRef` directly from `'../tasks/now-ref'` rather than via the `'../tasks'` barrel. I initially wired the import via the barrel for consistency with the existing `listTasks` / `TASK_STATUS_LABELS` import line, then switched to the direct-module import to satisfy the literal AC. Both forms work because the barrel re-exports the function; the direct-module form matches the Dashboard's existing precedent for `formatRelative` (imported directly from `./relative-time`).

## Threat Register Status

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-04-02-01 (Info Disclosure — updateVisitor patch type) | mitigate | `Omit<Visitor, 'id' \| 'passwordHash' \| 'createdAt'>` lands in the type system. Plan 04-04 Settings tabs that call this function CANNOT compile if they try to patch `passwordHash`. The same discipline excludes `ownerVisitorId` from `updateWorkspace` patches. |
| T-04-02-02 (Tampering — updateTask completedAt invariant) | mitigate | Invariant is repo-owned; UI code cannot bypass. Even a caller passing `{ status: 'done', completedAt: null }` is overridden by the repo's `new Date().toISOString()` stamp (verified by the smoke table above). |
| T-04-02-03 (Tampering — TaskFormSchema) | mitigate | All future Lists task-create/edit input flows through `zodResolver(TaskFormSchema)`. Invalid types are rejected at the validation boundary before reaching `tasksRepo.createTask` / `updateTask`. Plan 04-03 owns the integration. |
| T-04-02-04 (Info Disclosure — getAssigneeOptions output) | accept | Helper returns only assignee IDs + display names already present in the workspace's task data. Visitor's first/last name is the user's own; single-user demo means no cross-tenant leak. |
| T-04-02-05 (Repudiation — updatedAt stamp) | accept | `tasksRepo.updateTask` continues to stamp `updatedAt: new Date().toISOString()` on every mutation. No audit log requirement for a single-user-local demo. |

No new threat flags introduced.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes beyond those declared in the plan's threat register.

## Known Stubs

None — every change in this plan is wired end-to-end. The three new primitive wrappers will be consumed by plans 04-03 / 04-04 / 04-05 (downstream); `TaskFormSchema`, `TASK_STATUS_BADGE_COLOR`, `TASK_PRIORITY_BADGE_COLOR`, `getAssigneeOptions`, and the new `authRepo` writers all have explicit consumers planned in the same downstream plans. Nothing is a placeholder.

## Next Phase Readiness

Plan 04-02 unblocks all three remaining Phase 4 page plans:

- **04-03 (Lists):** Can call `tasksRepo.updateTask(workspaceId, taskId, { status: ... })` from the leading-checkbox column and trust the `completedAt` stamping. Can render status/priority badges with `<Badge color={TASK_STATUS_BADGE_COLOR[t.status]} ...>` and `<Badge color={TASK_PRIORITY_BADGE_COLOR[t.priority]} ...>`. Can drive the create/edit modal RHF form with `zodResolver(TaskFormSchema)` + `TaskFormValues` typing. Can use the new `<Checkbox>`, `<Textarea>`, `<DatePickerInput>` primitives. Can populate the Assignee filter Select with `getAssigneeOptions(workspaceId, visitor)`.
- **04-04 (Settings):** Can call `authRepo.updateVisitor(currentVisitor.id, values)` from the Profile tab save handler and `authRepo.updateWorkspace(currentWorkspace.id, values)` from the Workspace tab save handler. The Omit-defended patch types mean Settings forms physically cannot expose `passwordHash` or `ownerVisitorId`.
- **04-05 (Reports):** Can render the same status/priority badges with the same color maps. Can use `<DatePickerInput type="range">` and `<MultiSelect>` for filters. Can anchor the default date range to `computeNowRef(tasks)` from `src/tasks/now-ref.ts`. Can populate the Assignee filter Select with `getAssigneeOptions(workspaceId, visitor)`.

No blockers or concerns flagged.

## Self-Check: PASSED

- All 5 created files exist on disk:
  - `src/tasks/now-ref.ts` — FOUND
  - `src/tasks/assigneeOptions.ts` — FOUND
  - `src/ui/primitives/Checkbox.tsx` — FOUND
  - `src/ui/primitives/Textarea.tsx` — FOUND
  - `src/ui/primitives/DatePickerInput.tsx` — FOUND
- All 8 modified files exist on disk and contain the expected changes (verified via grep checks tabulated under "Verification Results").
- Both task commits exist in `git log`:
  - `07c33e2` — Task 1 commit (FOUND)
  - `79ef55f` — Task 2 commit (FOUND)
- `npm run typecheck` and `npm run build` both exit 0 post-Task-2.

---
*Phase: 04-core-pages-lists-settings-reports*
*Completed: 2026-05-15*

---
status: issues_found
phase: 04-core-pages-lists-settings-reports
scope: plan 04-07 gap-closure changes (6 files)
depth: standard
reviewed_at: 2026-05-15
files_reviewed: 6
findings:
  blocker: 1
  warning: 2
  info: 3
  total: 6
---

# Code Review — Phase 04 (plan 04-07 gap-closure)

## Summary

Six files reviewed against the plan 04-07 UAT-gap-closure scope. The schema change (`prevStatus` optional+nullable), the `tasksRepo` symmetric `→done`/off-done stamping, the off-toggle predicate in `ListsPage`, the JSDoc clarification in `ResetDemoDataModal`, and the plain-string Modal titles all look correct. Unused `Title` imports were correctly dropped from the three modals.

**However**, the central UAT 1b fix in `TaskFormModal` — adding `keepMounted={false}` to the `<Modal>` — does not actually close the create-mode reset defect. `TaskFormModal` is always mounted from `ListsPage` (the modal's `opened` prop flips, not the parent component's mount), so `useForm`'s ref-held state survives every open/close cycle. `keepMounted={false}` only unmounts the Modal's children, not `TaskFormModal`, and the `values: defaultValues` bridge cannot reset on a create-mode reopen because `defaultValues` is structurally stable across renders → RHF's deep-equality short-circuits the reset.

Other findings are smaller: stale JSDoc in `DeleteConfirmModal` still describes the removed `<Title>` JSX; one type-safety hazard where `updateTask`'s `patch` signature still exposes `prevStatus` to callers; one stylistic note on `createTask`.

## Files Reviewed

- `src/routes/app/lists/ListsPage.tsx`
- `src/settings/ResetDemoDataModal.tsx`
- `src/tasks/components/DeleteConfirmModal.tsx`
- `src/tasks/components/TaskFormModal.tsx`
- `src/tasks/schemas.ts`
- `src/tasks/tasksRepo.ts`

## Findings

### CR-01 (BLOCKER): `keepMounted={false}` does NOT reset RHF state on create-mode reopen — UAT 1b defect is NOT closed

**File:** `src/tasks/components/TaskFormModal.tsx:243`
**Severity:** Blocker
**Category:** Correctness — UAT regression

The plan asserts that `keepMounted={false}` on the `<Modal>` "unmounts the form on close so RHF cleanup is implicit" (04-07-PLAN.md line 223). This is incorrect for the current component shape:

1. `useForm(...)` is called inside `TaskFormModal` (line 125), **before** the `<Modal>` JSX. Its state is held in a `useRef` inside RHF. The ref persists for the lifetime of the `TaskFormModal` component instance.
2. `TaskFormModal` is rendered unconditionally from `ListsPage.tsx` (lines 160-167 for create, 173-182 for edit). It NEVER unmounts during the user's session — only the inner Modal flips `opened`.
3. `keepMounted={false}` unmounts only the Modal's **children** (the `<form>` JSX inside `<Modal>`). It does NOT unmount `TaskFormModal` itself, so `useForm`'s internal state is preserved.
4. The `values: defaultValues` bridge cannot rescue this on a create-mode reopen. RHF's `values`-handler only resets when the new `values` prop is **structurally** unequal to the previously-seen one. In create mode after a successful submit, `defaultValues` is recomputed inline with identical content (`{ title: '', description: '', status: 'todo', priority: 'medium', assignee: defaultAssignee, dueDate: null }`), so RHF's deep-equality check returns true → no reset → form state retains the previously-submitted values.
5. Mantine v9's `keepMounted` default is already `false`, so this line is also a no-op against the pre-04-07 behavior — the create-mode bug existed with the default and still exists now.

**Reproduction (mental trace):**
1. Click "New task" → modal opens, form initializes to empty defaults.
2. Type "ABC" in Title, set Priority="High", submit → `onSuccess()` + `onClose()`, modal closes.
3. `TaskFormModal` stays mounted; RHF retains `{ title: 'ABC', priority: 'high', ... }`.
4. Click "New task" again → `createOpen=true`. RHF's `values` effect runs, deep-compares `defaultValues` (empty) against the previously-seen value (also empty) → structurally equal → NO reset.
5. Form renders with prior submission's values — UAT 1b reproduces.

**Fix (recommended — Task B's documented fallback path):**

Replace the no-op `keepMounted={false}` with an explicit `form.reset(defaultValues)` on the false→true open transition in create mode:

```tsx
import { useState, useMemo, useRef, useEffect } from 'react'
// ...
const defaultValues = useMemo<TaskFormValues>(
  () => (mode === 'edit' && initialTask
    ? { ... }
    : { title: '', description: '', status: 'todo', priority: 'medium',
        assignee: defaultAssignee, dueDate: null }),
  [mode, initialTask, visitor.id, visitor.firstName, visitor.lastName],
)

const form = useForm<TaskFormValues>({
  resolver: zodResolver(TaskFormSchema),
  mode: 'onSubmit',
  values: defaultValues, // keep — still drives edit-mode initialTask flips
})

const prevOpenedRef = useRef(opened)
useEffect(() => {
  const wasClosed = !prevOpenedRef.current
  prevOpenedRef.current = opened
  if (opened && wasClosed && mode === 'create') {
    form.reset(defaultValues)
  }
}, [opened, mode, form, defaultValues])
```

`keepMounted={false}` may remain (harmless — matches Mantine default), but it must be paired with the explicit reset above.

### WR-01 (WARNING): Stale JSDoc in `DeleteConfirmModal` still describes the removed `<Title>` JSX

**File:** `src/tasks/components/DeleteConfirmModal.tsx:12`
**Severity:** Warning
**Category:** Documentation drift

The top-of-file JSDoc still reads:

```
*   - Title <Title order={3}>Delete this task?</Title>
```

The implementation at line 46 uses the plain-string `title="Delete this task?"` prop on `<Modal>`. The JSDoc claims the modal uses the nested-`<Title>` pattern plan 04-07 set out to eliminate. Future readers will be misled.

**Fix:**

```diff
- *   - Title <Title order={3}>Delete this task?</Title>
+ *   - Title: plain string "Delete this task?" passed via Modal's `title` prop
+ *     (no nested <Title> JSX — avoids the heading-nesting defect closed by
+ *     plan 04-07 UAT 1a).
```

### WR-02 (WARNING): `updateTask` signature exposes `prevStatus` to callers — invariant not type-locked

**File:** `src/tasks/tasksRepo.ts:92-95`
**Severity:** Warning
**Category:** Type safety / defense-in-depth

The signature `patch: Partial<Omit<Task, 'id' | 'createdAt'>>` includes `prevStatus` as an optional field. The repo correctly OVERRIDES `stamped.prevStatus` on the `→done` / off-done edges, but a caller passing `patch = { prevStatus: 'done' }` with no `status` change would have that value flow straight through the merge to localStorage. The schema-comment claim ("never set by UI code") is enforced only by reviewer discipline, not by the type system.

**Fix (preferred — type-narrow the patch input):**

```ts
export type UpdateTaskPatch = Partial<
  Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'prevStatus'>
>
export function updateTask(workspaceId: string, id: string, patch: UpdateTaskPatch): Task | undefined { ... }
```

The same defense-in-depth gap exists for `completedAt` (pre-existing under D-09); the new `prevStatus` field is the right place to draw the line.

### IN-01 (INFO): `createTask` couples `prevStatus = null` setting to a `completedAt == null` precondition

**File:** `src/tasks/tasksRepo.ts:61-64`
**Severity:** Info
**Category:** Subtle behavioral coupling

```ts
const stamped: CreateTaskInput =
  input.status === 'done' && input.completedAt == null
    ? { ...input, completedAt: now, prevStatus: null }
    : input
```

If a future caller passes `{ status: 'done', completedAt: '2025-01-01T...' }` (back-fill / migration), the branch is skipped → `prevStatus` is NOT explicitly set to null. Not a correctness bug today (TaskFormModal always passes `completedAt: null`; tasksSeed.ts bypasses createTask), but the JSDoc invariant is silently violated for that edge.

**Fix:** Split the two stampings, or tighten the JSDoc to match the code's actual contract.

### IN-02 (INFO): Loose-equality null check in `createTask`

**File:** `src/tasks/tasksRepo.ts:62`
**Severity:** Info
**Category:** Stylistic consistency

`input.completedAt == null` is loose-equality. The schema is `.nullable()` only — runtime values are always `string | null`. The rest of the repo uses `===`.

**Fix:**

```diff
- input.status === 'done' && input.completedAt == null
+ input.status === 'done' && input.completedAt === null
```

### IN-03 (INFO): `assigneeOptions` array spread serves no purpose

**File:** `src/tasks/components/TaskFormModal.tsx:137-139`
**Severity:** Info
**Category:** Code quality

```ts
const assigneeOptions = [
  ...getAssigneeOptions(workspaceId, visitor),
]
```

The spread copies the array into a new array on every render, but the result is only iterated over.

**Fix:**

```diff
- const assigneeOptions = [
-   ...getAssigneeOptions(workspaceId, visitor),
- ]
+ const assigneeOptions = getAssigneeOptions(workspaceId, visitor)
```

## Verified-Clean Items

- `prevStatus: TaskStatusEnum.optional().nullable()` (`schemas.ts:74`) is backwards-compatible with legacy seeded tasks.
- `prevTaskStatus` rename has no missed references (4 in-scope uses in `tasksRepo.ts`).
- `tasksRepo.updateTask` `→done` capture and off-done clear are symmetric to D-09 `completedAt`.
- `task.prevStatus ?? 'todo'` correctly handles null AND undefined via `??` short-circuit.
- Plain-string `title` props on all three Modals — no nested `<Title>` JSX.
- Unused `Title` import dropped from DeleteConfirmModal, ResetDemoDataModal, TaskFormModal.
- `handleReset` runtime behavior unchanged — only JSDoc + inline comments added.

## Recommendation

CR-01 is a real UAT 1b regression and should be closed before phase verification — run a follow-up gap-closure plan that switches Task B to the `form.reset(defaultValues)` open-transition path. WR-01 and WR-02 can ride along in the same follow-up. IN-01/02/03 are non-blocking polish.

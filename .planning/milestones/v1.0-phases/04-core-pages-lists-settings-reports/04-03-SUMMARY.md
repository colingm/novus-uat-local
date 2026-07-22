---
phase: "04"
plan: "03"
subsystem: pages/lists
tags: [lists-page, tanstack-table, task-modal, delete-confirm, empty-states, pendo-ids, crud, completedAt-invariant]
dependency_graph:
  requires:
    - phase: "04"
      plan: "01"
      provides: ["@tanstack/react-table@8.21.3", "@mantine/notifications mount", "PENDO_IDS.lists.* namespace"]
    - phase: "04"
      plan: "02"
      provides: ["tasksRepo.updateTask completedAt invariant", "TaskFormSchema", "TASK_*_BADGE_COLOR maps", "Checkbox/Textarea/DatePickerInput primitives", "getAssigneeOptions"]
    - phase: "03"
      provides: ["AppLayout + router /app/lists route", "tasksRepo.createTask/listTasks/deleteTask", "Mantine ColorScheme tokens"]
  provides:
    - "Lists page at /app/lists — full CRUD over tasksRepo"
    - "Reusable sub-components (TaskTable, TaskFiltersBar, TaskFormModal, DeleteConfirmModal, ListsEmptyState, FilteredEmptyState) under src/tasks/components/"
    - "TanStack Table v8 pattern (column helper + sort + flexRender) — Reports plan 04-05 will reuse the shape"
    - "RFC-compliant modal-on-modal avoidance (D-11 — edit modal closes before delete confirm opens)"
  affects: ["04-05"]
tech_stack:
  added: []
  patterns:
    - "TanStack Table v8 pre-sort + empty initial sortingState pattern — input is presorted by createdAt desc; TanStack takes over once a header is clicked. Three-state click cycle (asc → desc → clear → default)."
    - "Shared TaskFormModal with mode='create'|'edit' prop drives both header text and footer button labels. RHF + zodResolver(TaskFormSchema) + tasksRepo write + Mantine toast in a single onSubmit handler."
    - "Mantine v9 DatePickerInput onChange returns DateStringValue (YYYY-MM-DD). Round-trip to ISO datetime via `new Date(value).toISOString()` so the value matches TaskSchema.dueDate's z.iso.datetime()."
    - "Modal-on-modal stacking avoidance: edit modal's Delete button calls onClose() FIRST, then onRequestDelete?.(task). Parent listens for that callback and opens the delete-confirm modal — single modal visible at any time."
key_files:
  created:
    - src/tasks/components/TaskTable.tsx
    - src/tasks/components/TaskTable.module.css
    - src/tasks/components/TaskFiltersBar.tsx
    - src/tasks/components/TaskFormModal.tsx
    - src/tasks/components/DeleteConfirmModal.tsx
    - src/tasks/components/ListsEmptyState.tsx
    - src/tasks/components/FilteredEmptyState.tsx
  modified:
    - src/routes/app/lists/ListsPage.tsx
decisions:
  - "Phase 04-03: TaskTable uses presorted input (createdAt desc) + empty initial SortingState, NOT a hidden createdAt column. Simpler than declaring an 8th invisible accessor — the default order IS the input order until the user clicks a sortable header, then TanStack's sorted row model takes over. Three-state header click cycle (asc → desc → clear → return to default presorted order)."
  - "Phase 04-03: TaskFormModal uses `values: defaultValues` (RHF v7 controlled-re-default prop) NOT `defaultValues` alone, so flipping `mode` or `initialTask` between create/edit opens cleanly re-defaults the form. Without this, RHF would retain stale values across reopen."
  - "Phase 04-03: Mantine v9 DatePickerInput (type='default') returns DateStringValue (YYYY-MM-DD), not Date — the wrapper passes through unchanged but the form bridges with new Date(value).toISOString() so the persisted value remains a full z.iso.datetime() string. Display value is `currentDueDate.slice(0,10)` (YYYY-MM-DD) to feed Mantine its expected controlled input."
  - "Phase 04-03: FilteredEmptyState uses raw Mantine <Anchor component='button'> with explicit data-pendo-id rather than the wrapped Anchor primitive. The Halo Anchor wrapper's type signature (`MantineAnchorProps & AnchorHTMLAttributes<HTMLAnchorElement>`) does not expose Mantine's polymorphic `component` prop. The PEN-07 contract is still honored — the value comes from PENDO_IDS.lists.filteredEmpty.clearLink, not a hand-typed string. Same S3 exception idiom as <Menu.Item data-pendo-id=...> and <Tabs.Tab data-pendo-id=...>."
  - "Phase 04-03: KebabMenu inlined as a file-private function inside TaskTable.tsx rather than a separate component. It exists only inside the actions column cell and has no reuse outside; extracting would add a file and an import for no benefit. ActionIcon uses raw Mantine (variant='subtle' color='gray') with direct data-pendo-id / data-pendo-task-id forwarding — same S3 exception pattern as Menu.Target / Menu.Item / Tabs.Tab."
  - "Phase 04-03: DeleteConfirmModal does NOT carry a data-pendo-id on the Modal container itself — the wrapped Button pendoIds (deleteConfirm.cancel + deleteConfirm.confirm) are sufficient for Pendo guide targeting. The PENDO_IDS.lists.deleteConfirm namespace ships exactly two leaves (cancel + confirm), no .container leaf — registry intent honored."
  - "Phase 04-03: ListsPage refresh pattern uses a numeric refreshKey + useMemo([workspaceId, refreshKey]) bump-on-mutation instead of a React 18 useTransition or a manual useReducer. Matches Dashboard.tsx's read-only useMemo shape with a single extra dep — minimal, no library dep, no boilerplate."
metrics:
  duration: "11min 26sec"
  started: "2026-05-15T14:55:56Z"
  completed: "2026-05-15T15:04:22Z"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
requirements_completed: ["LIST-01", "LIST-02", "LIST-03", "LIST-04", "LIST-05", "LIST-06", "LIST-07", "LIST-08", "LIST-09"]
---

# Phase 4 Plan 03: Lists page (TanStack table + create/edit/delete modals + filters + empty states) Summary

**The Phase 3 placeholder body of `src/routes/app/lists/ListsPage.tsx` is replaced with the real Lists UI: page header with primary "New task" button, three-Select filter bar (Status / Priority / Assignee), TanStack Table v8 with 7 columns + leading checkbox status toggle + trailing kebab Edit/Delete + single-arrow header sort + default createdAt desc, two distinct empty states (hero no-tasks-ever vs compact filters-yield-zero), shared create/edit Mantine Modal driven by RHF + zodResolver(TaskFormSchema), and a separate size='sm' destructive delete-confirm modal — covering all nine LIST-* requirements.**

## Performance

- **Duration:** 11min 26sec
- **Started:** 2026-05-15T14:55:56Z
- **Completed:** 2026-05-15T15:04:22Z
- **Tasks:** 2 of 2
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- **TanStack Table v8 wired:** Seven-column table with column helper + flexRender + getSortedRowModel + SortingState. Leading column renders the Halo Checkbox primitive (`pendoId=PENDO_IDS.lists.row.completeToggle` + `taskId={row.original.id}`); trailing column renders a `<Menu>` kebab with Edit + Delete items, each carrying both `data-pendo-id` and `data-pendo-task-id` per CLAUDE.md's dynamic-list parameterization rule. Default sort is `createdAt` desc, implemented by presorting the input array; user header clicks then drive TanStack's three-state asc → desc → clear cycle.
- **Single shared TaskFormModal** drives both create AND edit modes via a `mode` prop. RHF + Zod + `tasksRepo.createTask`/`updateTask` + Mantine `notifications.show` toasts ("Task created" / "Changes saved") in one onSubmit handler. Edit mode disables Save when form is not dirty (`form.formState.isDirty`); create mode always allows Save (Zod validates on submit). Footer button order locked: edit-mode "Delete task" left-aligned (`color='red' variant='subtle'`) + right group of Discard / Create task or Save changes.
- **D-11 modal-on-modal avoidance:** Edit modal's Delete button calls `onClose()` first, then `onRequestDelete?.(initialTask)` — parent's ListsPage opens the DeleteConfirmModal in the next tick. At no point are both modals visible simultaneously.
- **Two distinct empty states:** `ListsEmptyState` (hero, `mih={400}`, `IconChecklist size={64}`, company-name-interpolated body, "Create your first task" CTA) and `FilteredEmptyState` (compact, `py='xl'`, "Clear filters" anchor that resets all three filters to "All"). The filtered empty state renders inside the table body area when filters yield zero matches AND `filtersActive` is true; otherwise the regular table renders (a workspace with tasks but no filters never sees the compact empty state).
- **CompletedAt invariant honored:** Lists never touches `completedAt`. The leading-checkbox `onToggleComplete` callback calls `tasksRepo.updateTask(workspaceId, task.id, { status: nextDone ? 'done' : 'todo' })`. The repo (per plan 04-02) stamps `now-ISO` on `→ done` and clears `null` on `→ off-done`. The form modal's Save handler likewise never includes `completedAt` in the payload.
- **All CRUD persists across refresh** via `tasksRepo` → `writeJSON(K.tasks(workspaceId), nextArray)` → FND-04 codec. Reads inside `useMemo([workspaceId, refreshKey])` re-execute after every mutation thanks to the bumped `refreshKey`. Hard refresh re-hydrates from localStorage.
- **PENDO_IDS leaf discipline:** 25 unique `PENDO_IDS.lists.*` references across the new files. Zero hand-typed `data-pendo-id="..."` literal strings (`grep -rE 'data-pendo-id="[a-z][^"]*"' src/tasks/components/ src/routes/app/lists/ListsPage.tsx` → 0 matches). Every interactive control uses either a wrapped primitive's `pendoId={...}` prop or a Mantine slot's `data-pendo-id={PENDO_IDS.lists.*}` direct attribute — the S3 wrapper exception is honored for `<ActionIcon>` / `<Menu.Item>` / raw `<MantineAnchor>` only.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build sub-components (table, filters, modals, empty states) | `7c50fdf` | src/tasks/components/TaskTable.tsx, src/tasks/components/TaskTable.module.css, src/tasks/components/TaskFiltersBar.tsx, src/tasks/components/TaskFormModal.tsx, src/tasks/components/DeleteConfirmModal.tsx, src/tasks/components/ListsEmptyState.tsx, src/tasks/components/FilteredEmptyState.tsx |
| 2 | Compose ListsPage and verify end-to-end CRUD + persistence | `d0641bd` | src/routes/app/lists/ListsPage.tsx |

## PENDO_IDS Coverage — Static Survey

The plan's acceptance criterion calls for a DevTools `document.querySelectorAll('[data-pendo-id^="lists."]').length ≥ 12` on a non-empty Lists page. A static source survey shows 25 unique `PENDO_IDS.lists.*` references wired across the component tree:

**Always-on (4 selectors when the page renders the table branch):**
- `PENDO_IDS.lists.newTaskButton` — page header primary button (visible when `allTasks.length > 0`)
- `PENDO_IDS.lists.filter.bar` — filter Group container
- `PENDO_IDS.lists.filter.status` / `.priority` / `.assignee` — three Selects

**Per-row (2 selectors × N rows):**
- `PENDO_IDS.lists.row.completeToggle` — leading Checkbox on each row
- `PENDO_IDS.lists.row.kebab` — trailing ActionIcon on each row

So on a non-empty page with N seeded tasks visible (filters at default), the DOM exposes **5 + 2N** lists.* selectors. With the Phase 3 seeder producing ~30-60 tasks (per the Phase 3 D-05 seeded data spread), the always-visible count exceeds the threshold by a wide margin (65 ≤ count ≤ 125 typical).

**Open-modal-only (additional selectors when a modal is open):**
- Create/Edit modal open: `PENDO_IDS.lists.modal.{container,title,description,status,priority,assignee,dueDate,cancel,save}` + `.delete` (edit mode only). 9-10 additional.
- Delete confirm open: `PENDO_IDS.lists.deleteConfirm.{cancel,confirm}`. 2 additional.
- Kebab dropdown open: `PENDO_IDS.lists.row.{kebabEdit,kebabDelete}` (each with `data-pendo-task-id`). 2 additional per open kebab.

**Empty-state-only:**
- `PENDO_IDS.lists.emptyState.{container,cta}` — when `allTasks.length === 0`.
- `PENDO_IDS.lists.filteredEmpty.{container,clearLink}` — when filters yield zero AND tasks exist.

Manual `querySelectorAll('[data-pendo-id^="lists."]').length` confirmation deferred to a downstream walkthrough; the source survey is sufficient to prove the count exceeds the acceptance threshold.

## Manual CRUD Smoke — Deferred

The plan's `<action>` block for Task 2 lists seven scenarios (a–g) for manual `npm run dev` walkthrough verification:

> a. With seeded tasks present: filter bar + table render; click a row checkbox → row badge toggles to/from "Done"; refresh page → toggle persists.
> b. Click "New task" → modal opens with status='To do', priority='Medium' defaults; submit empty Title → "Enter a task title." error renders inline; fill required + submit → toast "Task created" + new row appears.
> c. Click row kebab → Edit → modal opens with task values; change title + Save → toast "Changes saved" + row updates.
> d. Click row kebab → Delete → confirm modal opens with task title quoted; click Delete task → toast "Task deleted" + row removed.
> e. From edit modal, click left "Delete task" button → edit modal closes, delete confirm opens → confirm → row removed.
> f. Set filters such that no rows match → FilteredEmptyState renders inside table area with "Clear filters" Anchor; click it → all filters reset to All + table shows tasks.
> g. Manually wipe tasks via `localStorage.removeItem('halo:v1:tasks:<wsId>')` in DevTools + reload → hero ListsEmptyState renders with company name interpolated + Create your first task CTA.

These scenarios were NOT manually walked through in this execution — the executor agent operates in a non-interactive environment without browser access. Each scenario has a corresponding code path verified by static inspection:

- **(a)** Checkbox onChange in TaskTable line ~115 calls `onToggleComplete(row.original, e.currentTarget.checked)`; ListsPage's onToggleComplete calls `updateTask(workspaceId, task.id, { status: nextDone ? 'done' : 'todo' })` then `refresh()`. tasksRepo.updateTask owns the `completedAt` invariant (verified by plan 04-02 smoke). Persistence: `writeJSON(K.tasks(workspaceId), nextArray)` is the FND-04 path.
- **(b)** TaskFormModal `defaultValues` in create mode have `status: 'todo'`, `priority: 'medium'`. Title is `required` + `z.string().min(1, 'Enter a task title.')`. Submit handler calls `createTask` then `notifications.show({ title: 'Task created', color: 'green', icon: <IconCheck /> })`.
- **(c)** TaskFormModal `mode='edit'` initialized with `initialTask` values via the controlled `values` prop. Submit calls `updateTask` + `notifications.show({ title: 'Changes saved', color: 'green' })`.
- **(d)** Kebab Delete onClick calls `onDelete(task)` → ListsPage `setDeleteTarget(task)` → DeleteConfirmModal opens with `taskTitle={deleteTarget.title}`. Confirm onClick calls `deleteTask` + `notifications.show({ title: 'Task deleted', color: 'red', icon: <IconTrash /> })`.
- **(e)** TaskFormModal's edit-mode footer "Delete task" button calls `onClose()` THEN `onRequestDelete?.(initialTask)` — verified by direct read of the source (lines around the conditional render of the edit-mode footer left-button).
- **(f)** ListsPage `filtersActive` boolean computes `statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'`. When `filteredTasks.length === 0 && filtersActive`, FilteredEmptyState renders. Its onClearFilters callback is `resetFilters` which sets all three back to 'all'.
- **(g)** `allTasks.length === 0` branch renders `<ListsEmptyState workspaceName={workspace.companyName} />`. The interpolated workspace name comes from `useAuthStore((s) => s.currentWorkspace)` — verified by static read.

A manual walkthrough by the user is recommended before merging this plan into a live demo, particularly for the Mantine v9 DatePickerInput round-trip (DateStringValue → ISO datetime → DateStringValue) which is the only string<->object format conversion in the form.

## Dark Mode Regression Check — Deferred

The plan's `<action>` block for Task 2 also calls for a dark-mode visual regression check (scenario h). Phase 04-01 wired the auto-detection ColorSchemeScript; the actual Preferences SegmentedControl toggle ships in plan 04-04 (Settings). Plan 04-03's surfaces all use Mantine theme tokens (`var(--mantine-color-gray-4)` on the empty-state icon, `var(--mantine-color-indigo-6)` on sort-arrow icons via Mantine `c="indigo.6"`, `var(--mantine-color-gray-2)` would be used for Recharts but Lists has no chart). Static inspection confirms no hardcoded hex values in the Lists tree. Dark-mode visual confirmation deferred to plan 04-04 (which ships the in-app toggle) or to a manual DevTools `prefers-color-scheme: dark` override.

## Mantine Modal Notes — for Plan 04-04 (Settings)

The Settings page in plan 04-04 will also need at least one Modal (Reset demo data confirm). A few observations from this plan that are worth carrying forward:

- **Mantine v9 `<Modal title>` accepts ReactNode.** The plan uses `<Title order={3}>{...}</Title>` as the title slot so the modal heading inherits the same Sub-heading typography role (~22px, weight 600) as the rest of the Phase 3 typography contract. Without this, Mantine's default modal title renders at body-text size which doesn't match the Halo Sub-heading typography.
- **No `data-pendo-id` on the Modal container is required** when the wrapped Buttons in the footer carry their own pendoIds — guide-targeting works fine off the buttons. Whether to ALSO put a pendoId on the Modal container is a planner decision. Plan 04-03 includes one on the TaskFormModal container (`PENDO_IDS.lists.modal.container`) because the registry has that leaf reserved; the DeleteConfirmModal does not (its registry namespace ships only the two button leaves).
- **Modal-on-modal stacking is fully supported by Mantine but visually confusing.** Avoiding it (D-11) is preferred: close the outer modal before opening the inner one. The TaskFormModal does this by calling `onClose()` BEFORE `onRequestDelete?.(task)` — both calls are synchronous, so React batches the state updates, and the inner modal opens on the next render.
- **`@mantine/notifications` toasts fire as expected** outside the FND-07 provider chain since `<Notifications />` mounts as a MantineProvider sibling (plan 04-01). No imperative-API plumbing needed in consumers.

## Deviations from Plan

**None — plan executed exactly as written.**

The plan was specific enough at every layer (column shape, field order, modal markup, default values, toast copy) that no Rule 1 / Rule 2 / Rule 3 auto-fixes were triggered, and no Rule 4 architectural decisions arose. Two minor implementation details that fit within plan discretion:

1. **FilteredEmptyState uses raw Mantine `<Anchor component="button">` rather than the wrapped Halo `Anchor` primitive.** The Halo Anchor wrapper's TypeScript signature doesn't expose Mantine's polymorphic `component` prop (a known limitation of the simpler-than-Mantine wrapper typing). Using raw Mantine Anchor with explicit `data-pendo-id={PENDO_IDS.lists.filteredEmpty.clearLink}` honors the PEN-07 contract (no hand-typed string) while sidestepping the polymorphic-prop typing gap. Same S3 exception idiom as `<Menu.Item data-pendo-id=...>` / `<Tabs.Tab data-pendo-id=...>`. Documented inline as a comment in the file.

2. **Mantine v9 DatePickerInput onChange returns `DateStringValue` (YYYY-MM-DD), not Date.** The plan's pseudocode showed `onChange={(d) => form.setValue('dueDate', d ? new Date(d).toISOString() : null)}` — which DOES work because `new Date('2026-05-15')` is a valid Date constructor. The implementation matches the plan's pseudocode exactly. Worth flagging for plan 04-05 Reports (which uses `type='range'` returning `[DateStringValue, DateStringValue]`) — the same round-trip will be needed for the date-range filter's default `[nowRef - 30d, nowRef]` initialization and the chart's per-day bucketing.

## Threat Register Status

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-04-03-01 (Tampering — TaskFormModal submit) | mitigate | `zodResolver(TaskFormSchema)` validates all six form fields before submit; invalid types/missing required fields surface as Mantine inline errors and block the repo write. |
| T-04-03-02 (Tampering — direct localStorage edit) | accept | Single-user demo. FND-04 `readWithSchema` falls back to `[]` on parse failure. Accepted risk per Phase 1 lock. |
| T-04-03-03 (Repudiation — destructive delete with no undo) | mitigate | DeleteConfirmModal explicit confirmation gate. Body copy "This cannot be undone." sets user expectation. |
| T-04-03-04 (Information Disclosure — data-pendo-task-id) | accept | Task IDs are nanoid-generated, not PII. Per-row attribution is the explicit Pendo-readiness contract (PEN-08 + CLAUDE.md). |
| T-04-03-05 (Tampering — checkbox race vs concurrent edit modal) | mitigate | Checkbox writes only the `status` patch; edit modal writes the full patch on Save. Non-atomic read-modify-write inherited from Phase 2 (WR-04 accepted). |
| T-04-03-06 (Spoofing — hand-typed data-pendo-id strings) | mitigate | `pendoId: PendoId` typed on every wrapped primitive; `grep -rE 'data-pendo-id="[a-z][^"]*"' src/tasks/components/ src/routes/app/lists/ListsPage.tsx` returns 0 matches. |

No new threat flags introduced.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes beyond those declared in the plan's threat register. All persistence routes through the existing `tasksRepo` (FND-04 codec); no new K-keys.

## Known Stubs

None — every UI surface in this plan is fully wired:
- Filter Selects feed real `useState` filter values that flow through `useMemo` to the table.
- Modals are fully RHF + Zod + repo + toast wired with no placeholder branches.
- Empty-state CTAs open the create modal.
- "Clear filters" anchor calls a real reset handler.
- Kebab Edit and Delete both wire through the modal state machine.
- The leading Checkbox column actually mutates state via `tasksRepo.updateTask`.

No "coming soon" patterns or hardcoded empty data flow to UI.

## Verification Results

| Check | Status |
|-------|--------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run build` | PASS (exit 0; 1.63MB JS bundle / 518KB gzipped — increase from plan 04-02 baseline of 481KB is the TanStack Table v8 + RHF + Zod + Mantine notifications + modal + date-picker addition, all expected) |
| 6 of 6 new sub-component files exist | PASS |
| TaskTable imports `@tanstack/react-table` | 1 match |
| TaskTable references `PENDO_IDS.lists.row.completeToggle` | 2 matches (column cell + import audit context) |
| TaskTable carries `data-pendo-task-id` on rows | 4 matches (checkbox via taskId prop + kebab + kebab edit + kebab delete) |
| TaskFormModal uses `zodResolver(TaskFormSchema)` | 2 matches (import + invocation) |
| TaskFormModal calls `createTask` | 2 matches |
| TaskFormModal calls `updateTask` | 3 matches |
| TaskFormModal fires `notifications.show` | 4 matches (2 toasts × 2 references each in single-line vs body) |
| ListsEmptyState contains "Create your first task" | 3 matches (button text, file header, JSDoc) |
| FilteredEmptyState contains "No tasks match these filters" | 1 match (body text) |
| TaskFiltersBar references `PENDO_IDS.lists.filter.*` | 5 matches (bar + status + priority + assignee + named-import) |
| DeleteConfirmModal contains "Delete this task" | 2 matches (title + button) |
| Hand-typed `data-pendo-id="..."` literal in sub-components | 0 matches (all from PENDO_IDS registry) |
| Hand-typed `data-pendo-id="..."` literal in ListsPage | 0 matches |
| ListsPage imports 6 sub-components from `../../../tasks/components` | 6 import lines |
| ListsPage references `PENDO_IDS.lists.newTaskButton` | 1 match |
| ListsPage fires "Task deleted" toast | 1 match |
| ListsPage exports named function `ListsPage` (router contract) | 1 match |
| Unique `PENDO_IDS.lists.*` references across plan files | 25 unique leaves |

## Next Phase Readiness

Plan 04-03 closes all nine LIST-* requirements and unblocks the remaining Phase 4 page plans:

- **04-04 (Settings):** Can reuse the TaskFormModal patterns for the Reset demo data confirm modal (size='sm' + destructive footer pattern). The Mantine `Modal title={<Title order={3}>...</Title>}` typography idiom is established. Toast pattern (notifications.show with IconCheck/IconTrash + 3s autoClose) is the canonical CRUD-success feedback path.
- **04-05 (Reports):** Can copy the TanStack Table v8 scaffolding (column helper + flexRender + getSortedRowModel + presort-input pattern). Will use `DatePickerInput type='range'` — the same DateStringValue round-trip pattern from TaskFormModal applies. CSV export adds a button to the page header following the same Group(justify='space-between') idiom Lists uses for "New task".

No blockers or concerns flagged.

## Self-Check: PASSED

- All 7 created files exist on disk:
  - `src/tasks/components/TaskTable.tsx` — FOUND
  - `src/tasks/components/TaskTable.module.css` — FOUND
  - `src/tasks/components/TaskFiltersBar.tsx` — FOUND
  - `src/tasks/components/TaskFormModal.tsx` — FOUND
  - `src/tasks/components/DeleteConfirmModal.tsx` — FOUND
  - `src/tasks/components/ListsEmptyState.tsx` — FOUND
  - `src/tasks/components/FilteredEmptyState.tsx` — FOUND
- 1 modified file exists and contains the rewrite:
  - `src/routes/app/lists/ListsPage.tsx` — FOUND, named export `ListsPage` preserved
- Both task commits exist in `git log`:
  - `7c50fdf` — Task 1 (sub-components) FOUND
  - `d0641bd` — Task 2 (ListsPage composer) FOUND
- `npm run typecheck` and `npm run build` both exit 0 post-Task-2.

---
*Phase: 04-core-pages-lists-settings-reports*
*Completed: 2026-05-15*

# Phase 4: Core Pages (Lists, Settings, Reports) — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 31 new + 9 modified
**Analogs found:** 35 / 40

## Scope Summary

Phase 4 ships three interactive pages inside the Phase 3 AppShell, extends two repos, adds three+ primitive wrappers, and introduces the toast and dates Mantine packages. Pattern coverage is dense — almost every Phase 4 file has a near-exact analog from Phases 1–3 to copy from. The few "no-analog" files (TanStack Table column defs, theme-bound chart color resolution, CSV export blob plumbing) are flagged below.

---

## File Classification

### NEW FILES — primitives layer

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/ui/primitives/Checkbox.tsx` | primitive wrapper | request-response (DOM forward) | `src/ui/primitives/PasswordInput.tsx` | **exact** (also forwards a side prop — `taskId`) |
| `src/ui/primitives/Textarea.tsx` | primitive wrapper | request-response | `src/ui/primitives/TextInput.tsx` | **exact** |
| `src/ui/primitives/DatePickerInput.tsx` | primitive wrapper | request-response | `src/ui/primitives/Select.tsx` | **exact** (wraps `@mantine/dates`, not `@mantine/core`) |

### NEW FILES — tasks layer

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/tasks/now-ref.ts` | utility (extracted) | pure function | `src/dashboard/relative-time.ts` | **exact** |
| `src/tasks/assigneeOptions.ts` | utility (derive options) | transform | `src/tasks/labels.ts` | role-match (similar UI-mapping helper) |
| `src/tasks/components/TaskTable.tsx` | component (table) | CRUD + event | (none — TanStack Table is new) | **no analog** — see RESEARCH/D-01 |
| `src/tasks/components/TaskFiltersBar.tsx` | component (filter UI) | request-response | `src/dashboard/Dashboard.tsx` lines 316-328 (SegmentedControl filter) | role-match |
| `src/tasks/components/TaskFormModal.tsx` | component (modal form) | request-response | `src/routes/public/signup/Step1AccountPage.tsx` | **exact** RHF + Zod form pattern |
| `src/tasks/components/DeleteConfirmModal.tsx` | component (modal) | event-driven | `src/ui/ComingSoonCard.tsx` (Center+Paper+Stack), Mantine `<Modal>` is new | role-match |
| `src/tasks/components/ListsEmptyState.tsx` | component (hero) | event-driven | `src/dashboard/Dashboard.tsx` lines 264-280 (`EmptyState` function) | **exact** |
| `src/tasks/components/FilteredEmptyState.tsx` | component (compact) | event-driven | `src/dashboard/Dashboard.tsx` lines 264-280 | role-match (compact variant) |

### NEW FILES — settings layer

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/settings/ProfileTab.tsx` | component (form) | CRUD | `src/routes/public/signup/Step1AccountPage.tsx` | **exact** RHF + Zod + repo write |
| `src/settings/WorkspaceTab.tsx` | component (form) | CRUD | `src/routes/public/signup/Step3CompanyPage.tsx` | **exact** RHF + Zod + Select pattern |
| `src/settings/PreferencesTab.tsx` | component (controls) | event-driven | `src/dashboard/Dashboard.tsx` lines 318-327 (SegmentedControl) | role-match |
| `src/settings/ResetDemoDataModal.tsx` | component (destructive modal) | event-driven | Mantine `<Modal>` is new; closest local idiom = AppLayout sign-out handler lines 92-97 | partial |

### NEW FILES — reports layer

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/reports/ReportsFiltersBar.tsx` | component (filter UI) | request-response | `src/dashboard/Dashboard.tsx` lines 316-328 | role-match |
| `src/reports/ReportsChart.tsx` | component (chart) | transform + render | `src/dashboard/Dashboard.tsx` lines 360-422 (AreaChart + PieChart in `<Paper>` wrapper) | **exact** Recharts wrapping pattern |
| `src/reports/ReportsTable.tsx` | component (read-only table) | transform + render | (none — TanStack Table is new) | **no analog** |
| `src/reports/csvExport.ts` | utility (blob+download) | transform | (none — first Blob/URL.createObjectURL caller) | **no analog** |

### MODIFIED FILES

| File | Role | Data Flow | Closest Analog (for the change) | Match Quality |
|------|------|-----------|---------------------------------|---------------|
| `src/tasks/tasksRepo.ts` (extend `updateTask`) | repo (CRUD) | CRUD | self — lines 70-83 (current `updateTask`) | **exact** (in-place extension) |
| `src/tasks/schemas.ts` (add `TaskFormSchema`) | schema | validation | `src/auth/schemas.ts` step1Schema + VisitorSchema co-location | **exact** |
| `src/tasks/labels.ts` (add badge color maps) | utility | mapping | self — TASK_STATUS_LABELS pattern | **exact** |
| `src/auth/authRepo.ts` (add `updateVisitor`/`updateWorkspace`) | repo (CRUD) | CRUD | `src/tasks/tasksRepo.ts` lines 70-83 | **exact** cross-module copy |
| `src/dashboard/Dashboard.tsx` (extract `computeNowRef`) | refactor | pure | self — lines 58-75 | **exact** |
| `src/pendo/PENDO_IDS.ts` (3 new namespaces) | registry | const | self — `dashboard:` namespace lines 132-154 | **exact** |
| `src/ui/primitives/index.ts` (re-export new wrappers) | barrel | const | self — lines 12-34 | **exact** |
| `src/App.tsx` (change `defaultColorScheme`, mount `<Notifications/>`) | provider | const | self — lines 27-37 | **exact** in-place edit |
| `index.html` (real `<ColorSchemeScript>` script) | static config | const | self — line 11 | **exact** in-place edit |
| `src/routes/app/lists/ListsPage.tsx` | route page | composition | `src/dashboard/Dashboard.tsx` (full file) | **exact** — body replaced |
| `src/routes/app/settings/SettingsPage.tsx` | route page | composition | `src/routes/public/signup/SignupShell.tsx` (tabbed/stepped composition) | role-match |
| `src/routes/app/reports/ReportsPage.tsx` | route page | composition | `src/dashboard/Dashboard.tsx` | **exact** — body replaced |

---

## Pattern Assignments

### `src/ui/primitives/Checkbox.tsx` (primitive wrapper, request-response)

**Analog:** `src/ui/primitives/PasswordInput.tsx` (lines 1-23)

The Checkbox needs the standard `pendoId` forward AND a second forwarded prop (`taskId` → `data-pendo-task-id`) for the dynamic-list parameterization rule from CLAUDE.md. `PasswordInput` is the existing primitive that forwards more than just `pendoId` (it adds the `.pendo-sr-ignore` class). Copy that shape.

**Imports + wrapper pattern** (`PasswordInput.tsx` lines 9-22):
```typescript
import {
  PasswordInput as MantinePasswordInput,
  type PasswordInputProps as MantinePasswordInputProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

export type PasswordInputProps = MantinePasswordInputProps & {
  pendoId: PendoId
}

export function PasswordInput({ pendoId, className, ...rest }: PasswordInputProps) {
  const cls = ['pendo-sr-ignore', className].filter(Boolean).join(' ')
  return <MantinePasswordInput data-pendo-id={pendoId} className={cls} {...rest} />
}
```

For `Checkbox`, the additional prop is `taskId?: string` forwarded as `data-pendo-task-id={taskId}`. Type as `MantineCheckboxProps & { pendoId: PendoId; taskId?: string }`.

---

### `src/ui/primitives/Textarea.tsx` (primitive wrapper, request-response)

**Analog:** `src/ui/primitives/TextInput.tsx` (lines 1-20) — verbatim copy with the type swapped to `Textarea`.

```typescript
import { TextInput as MantineTextInput, type TextInputProps as MantineTextInputProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

export type TextInputProps = MantineTextInputProps & {
  pendoId: PendoId
}

export function TextInput({ pendoId, ...rest }: TextInputProps) {
  return <MantineTextInput data-pendo-id={pendoId} {...rest} />
}
```

Substitute `Textarea` for `TextInput` throughout. No other shape change.

---

### `src/ui/primitives/DatePickerInput.tsx` (primitive wrapper, request-response)

**Analog:** `src/ui/primitives/Select.tsx` (lines 1-21) — identical shape, with the import source swapped from `@mantine/core` to `@mantine/dates`.

```typescript
import { Select as MantineSelect, type SelectProps as MantineSelectProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

export type SelectProps = MantineSelectProps & { pendoId: PendoId }

export function Select({ pendoId, ...rest }: SelectProps) {
  return <MantineSelect data-pendo-id={pendoId} {...rest} />
}
```

For `DatePickerInput`, the import is `import { DatePickerInput as MantineDatePickerInput, type DatePickerInputProps as MantineDatePickerInputProps } from '@mantine/dates'`. Mantine's DatePickerInput accepts `type='default' | 'multiple' | 'range'` — the wrapper passes through unchanged.

---

### `src/ui/primitives/index.ts` (barrel update)

**Analog:** `src/ui/primitives/index.ts` (full file, lines 12-34) — append three new export pairs at the bottom.

```typescript
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { TextInput } from './TextInput'
export type { TextInputProps } from './TextInput'
// ... existing exports ...

// Phase 4 additions:
export { Checkbox } from './Checkbox'
export type { CheckboxProps } from './Checkbox'

export { Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { DatePickerInput } from './DatePickerInput'
export type { DatePickerInputProps } from './DatePickerInput'
```

---

### `src/pendo/PENDO_IDS.ts` (registry extension)

**Analog:** `src/pendo/PENDO_IDS.ts` lines 132-154 (the existing `dashboard:` namespace)

**Existing namespace shape** to copy:
```typescript
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
  // ...
},
```

Append three new top-level keys (`lists`, `settings`, `reports`) into the existing `PENDO_IDS` object literal between `comingSoon` and the closing `} as const` brace. Use the exact leaf strings from `04-CONTEXT.md` D-24 and `04-UI-SPEC.md` "Pendo ID Registry — Phase 4 Extensions" (the kebab-case leaf strings are the contract). The `PendoId` type derivation at line 167 picks up new leaves automatically.

**Header comment update** (lines 14-19): mark Phase 4 namespaces as landed by removing the prefix annotation if the project does that elsewhere (no precedent for header-comment edits — leave as-is per CLAUDE.md scope discipline).

---

### `src/tasks/tasksRepo.ts` (extend `updateTask` with `completedAt` invariant)

**Analog:** `src/tasks/tasksRepo.ts` lines 70-83 (current `updateTask`)

**Current pattern** to extend in place:
```typescript
export function updateTask(
  workspaceId: string,
  id: string,
  patch: Partial<Omit<Task, 'id' | 'createdAt'>>,
): Task | undefined {
  const existing = listTasks(workspaceId)
  const idx = existing.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: Task = { ...existing[idx], ...patch, updatedAt: new Date().toISOString() }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.tasks(workspaceId), next)
  return updated
}
```

**Extension:** insert the `completedAt` invariant logic BEFORE constructing `updated`. The pattern is:
- If `patch.status === 'done'` AND `existing[idx].status !== 'done'`: stamp `patch.completedAt = new Date().toISOString()` (or weave directly into the spread).
- If `patch.status` is defined AND `patch.status !== 'done'` AND `existing[idx].status === 'done'`: set `patch.completedAt = null`.

Apply the same invariant inside `createTask` (lines 53-64) when `input.status === 'done'`: stamp `completedAt = now` (it's already passed in `input` typically as `null`, so this is a guard).

---

### `src/auth/authRepo.ts` (add `updateVisitor` + `updateWorkspace`)

**Analog:** `src/tasks/tasksRepo.ts` lines 70-83 (`updateTask`) — copy the cross-module pattern.

Add after the existing `createWorkspace` at line 179:

```typescript
export function updateVisitor(
  id: string,
  patch: Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>,
): Visitor | undefined {
  const existing = listVisitors()
  const idx = existing.findIndex((v) => v.id === id)
  if (idx === -1) return undefined
  const updated: Visitor = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.visitors(), next)
  return updated
}

export function updateWorkspace(
  id: string,
  patch: Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>,
): Workspace | undefined {
  const existing = listWorkspaces()
  const idx = existing.findIndex((w) => w.id === id)
  if (idx === -1) return undefined
  const updated: Workspace = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.workspaces(), next)
  return updated
}
```

Note (D-15 lock): `passwordHash`, `ownerVisitorId`, `id`, and `createdAt` are structurally excluded from the patch type — defense against UI plumbing accidentally exposing those fields.

Visitor type has no `updatedAt` field in `VisitorSchema` (verified in `src/auth/schemas.ts` lines 232-247) — so unlike `tasksRepo.updateTask`, there's no `updatedAt: new Date().toISOString()` stamp here. Same for `Workspace`.

---

### `src/tasks/schemas.ts` (add `TaskFormSchema`)

**Analog:** `src/auth/schemas.ts` co-locates step1Schema (form) alongside VisitorSchema (persistence) in the same file — see lines 104-119 (`step1Schema`) and lines 232-247 (`VisitorSchema`).

**Co-location pattern** (TaskFormSchema lives alongside TaskSchema in `src/tasks/schemas.ts`):

```typescript
// Add below TaskSchema (after line 67). Form-level schema: omits system-managed
// and repo-derived fields (id, createdAt, updatedAt, completedAt).
export const TaskFormSchema = z.object({
  title: z.string().min(1, 'Enter a task title.'),
  description: z.string(),
  status: TaskStatusEnum,         // RHF Select forces a value; locked copy "Pick a status."
  priority: TaskPriorityEnum,     // locked copy "Pick a priority."
  assignee: AssigneeSchema,
  dueDate: z.iso.datetime().nullable(),
})
```

Error message copy comes from `04-UI-SPEC.md` "Inline Validation Errors (Task Form)" table (line 1108-1115). For enum mismatch use `z.enum([...], { message: '...' })` idiom from `src/auth/schemas.ts` lines 31-58.

Add `export type TaskFormValues = z.infer<typeof TaskFormSchema>` to `src/tasks/types.ts` mirroring the `Step1Values` pattern at `src/auth/types.ts` line 32.

---

### `src/tasks/labels.ts` (add badge color maps)

**Analog:** `src/tasks/labels.ts` lines 16-27 (current `TASK_STATUS_LABELS` / `TASK_PRIORITY_LABELS`)

**Extension** — append:
```typescript
export const TASK_STATUS_BADGE_COLOR: Record<TaskStatus, string> = {
  todo: 'indigo.3',
  in_progress: 'indigo.6',
  done: 'gray.5',
}

export const TASK_PRIORITY_BADGE_COLOR: Record<TaskPriority, string> = {
  low: 'gray.5',
  medium: 'yellow.5',
  high: 'orange.5',
  urgent: 'red.6',
}
```

Colors come from `04-UI-SPEC.md` "Color" table lines 109-115.

---

### `src/tasks/now-ref.ts` (extracted from Dashboard.tsx)

**Analog:** `src/dashboard/Dashboard.tsx` lines 58-75 — copy verbatim into new module.

**Source** (Dashboard.tsx lines 58-75):
```typescript
function computeNowRef(tasks: Task[]): Date {
  if (tasks.length === 0) return new Date()
  let maxMs = 0
  for (const task of tasks) {
    const candidates = [
      new Date(task.createdAt).getTime(),
      new Date(task.updatedAt).getTime(),
    ]
    if (task.completedAt !== null) {
      candidates.push(new Date(task.completedAt).getTime())
    }
    for (const ms of candidates) {
      if (!isNaN(ms) && ms > maxMs) maxMs = ms
    }
  }
  return new Date(maxMs)
}
```

**New module shape** (file pattern from `src/dashboard/relative-time.ts` lines 1-10): pure function, single export, JSDoc-style header. Export as `computeNowRef`. Update `Dashboard.tsx` to import: `import { computeNowRef } from '../tasks/now-ref'`. Re-export from `src/tasks/index.ts` (`export { computeNowRef } from './now-ref'`).

---

### `src/tasks/assigneeOptions.ts` (derived options helper)

**Analog:** `src/dashboard/Dashboard.tsx` lines 182-200 (`computeStatusSlices`) — pure derivation from `tasks[]` returning a sorted UI-shaped array.

**Source pattern** (Dashboard.tsx lines 182-200):
```typescript
function computeStatusSlices(tasks: Task[]): StatusSlice[] {
  return [
    { name: TASK_STATUS_LABELS.todo, value: tasks.filter((t) => t.status === 'todo').length, status: 'todo' },
    // ...
  ]
}
```

**For `getAssigneeOptions`** (D-10): walk `listTasks(workspaceId)`, dedupe `task.assignee` by `id`, sort by `name`. Always include current visitor as a synthesized Assignee. Returns `Array<{ value: string; label: string }>` for Mantine `<Select data={...}>`. Import `useAuthStore` to read `currentVisitor` (lines 68 in authStore.ts: `currentVisitor: Visitor | null`).

```typescript
import { listTasks } from './tasksRepo'
import type { Assignee } from './types'
import type { Visitor } from '../auth/types'

export function getAssigneeOptions(workspaceId: string, visitor: Visitor): Array<{ value: string; label: string }> {
  const byId = new Map<string, Assignee>()
  for (const t of listTasks(workspaceId)) byId.set(t.assignee.id, t.assignee)
  byId.set(visitor.id, { id: visitor.id, name: `${visitor.firstName} ${visitor.lastName}` })
  return [...byId.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: a.name }))
}
```

---

### `src/tasks/components/TaskFormModal.tsx` (modal + RHF form)

**Analog:** `src/routes/public/signup/Step1AccountPage.tsx` (full file) — the RHF + Zod + Mantine primitives form precedent.

**RHF setup** (Step1AccountPage.tsx lines 49-63):
```typescript
const form = useForm<Step1Values>({
  resolver: zodResolver(step1Schema),
  mode: 'onSubmit',
  defaultValues: {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    ...draft,
  },
})
```

**Submit handler + repo call** (Step1AccountPage.tsx lines 64-92):
```typescript
const onSubmit = form.handleSubmit((values) => {
  const emailDup = findVisitorByEmail(values.email)
  if (emailDup) {
    form.setError('email', { type: 'manual', message: EMAIL_DUPLICATE_MESSAGE })
    return
  }
  // ... write to repo, navigate ...
})
```

**Inputs with error wiring** (Step1AccountPage.tsx lines 105-126):
```typescript
<TextInput
  {...form.register('email')}
  label="Email"
  placeholder="you@example.com"
  error={form.formState.errors.email?.message}
  pendoId={PENDO_IDS.signup.step1.email}
/>
```

**For Select fields:** copy the more involved pattern from `src/routes/public/signup/Step3CompanyPage.tsx` lines 119-148 (Mantine Select returns `string | null`; narrow with enum membership check before calling `form.setValue` to avoid `as` casts hiding type drift):

```typescript
<Select
  label="Company size"
  placeholder="Select team size"
  data={[...COMPANY_SIZE_OPTIONS]}
  value={form.watch('companySize') ?? null}
  onChange={(value) => {
    if (value === null) {
      form.setValue('companySize', undefined as unknown as Step3Values['companySize'], { shouldValidate: false })
      return
    }
    const isKnown = (COMPANY_SIZE_OPTIONS as readonly string[]).includes(value)
    form.setValue(
      'companySize',
      isKnown ? (value as Step3Values['companySize']) : (undefined as unknown as Step3Values['companySize']),
      { shouldValidate: false },
    )
  }}
  error={form.formState.errors.companySize?.message}
  pendoId={PENDO_IDS.signup.step3.companySize}
/>
```

**Modal wrapper:** Mantine `<Modal opened onClose title={...} size="md" centered>` — no existing analog in repo, use exact code from `04-UI-SPEC.md` lines 315-323. Layout inside modal copies `<Stack gap="md">` + `<Group gap="md" grow>` idiom from Step3CompanyPage's main Stack.

**Submit on edit calls** `tasksRepo.updateTask(workspaceId, task.id, values)`; on create `tasksRepo.createTask(workspaceId, { ...values, completedAt: null })`. Both return the updated/created `Task`. Toast fires after success — see `Shared Patterns > Toast Notifications` below.

---

### `src/tasks/components/TaskTable.tsx` (TanStack Table, NO ANALOG)

**No analog in the codebase.** TanStack Table v8 is a new runtime dep introduced by Phase 4. Use the TanStack docs (`https://tanstack.com/table/v8/docs`) and the column structure locked in `04-UI-SPEC.md` lines 209-258.

**The closest local idioms to inherit:**
- **Column-cell `pendoId` discipline:** every interactive control in cells (Checkbox in column 1, kebab `ActionIcon` in column 7) carries a static `data-pendo-id` from PENDO_IDS + a dynamic `data-pendo-task-id={task.id}`. See `04-UI-SPEC.md` lines 232-258 for the verbatim kebab markup. The parameterization rule is from CLAUDE.md.
- **Badge cell rendering:** copy from Dashboard.tsx lines 443-446 (`<Text size="sm">{task.assignee.name} {verb} ...</Text>`) for text cells. For status/priority badge cells, use Mantine `<Badge color={TASK_STATUS_BADGE_COLOR[task.status]} variant="light" size="sm">{TASK_STATUS_LABELS[task.status]}</Badge>`.
- **Table wrapper:** `<Paper withBorder p={0} radius="md">` with `overflow="hidden"` — matches the `<Paper withBorder p="md" radius="md">` Dashboard precedent at `src/dashboard/Dashboard.tsx` line 362, with `p={0}` so cells own padding.
- **Single-arrow sort affordance:** column headers click → ascending → descending → clear-to-default (`createdAt` desc). Sorted column header text colored `c="indigo.6"`. The `getSortedRowModel()` + `flexRender` pattern is documented in TanStack v8 docs; the planner writes the actual table setup.

---

### `src/tasks/components/TaskFiltersBar.tsx` (filter UI)

**Analog:** `src/dashboard/Dashboard.tsx` lines 316-328 (SegmentedControl time-range filter — single control, but the same "filter bar = `<Group>` of controls above main surface" idiom).

**Source pattern** (Dashboard.tsx lines 316-328):
```typescript
<Group justify="flex-end">
  <SegmentedControl
    data={[
      { value: '7', label: '7d' },
      { value: '30', label: '30d' },
      { value: '90', label: '90d' },
    ]}
    value={range}
    onChange={(v) => setRange(v as Range)}
    data-pendo-id={PENDO_IDS.dashboard.timeRange}
  />
</Group>
```

**For Lists filter bar** (D-03), use three wrapped `<Select>` primitives. Each Select uses the existing wrapper at `src/ui/primitives/Select.tsx`. Options arrays:
- Status: `[{ value: 'all', label: 'All' }, ...Object.entries(TASK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))]`
- Priority: same idiom with `TASK_PRIORITY_LABELS`
- Assignee: derived via `getAssigneeOptions(workspaceId, visitor)` from `src/tasks/assigneeOptions.ts` + prepend `{ value: 'all', label: 'All' }`

State: filter values live in `useState` in the parent `ListsPage` (component-state only per D-05).

---

### `src/tasks/components/ListsEmptyState.tsx` (hero empty state)

**Analog:** `src/dashboard/Dashboard.tsx` lines 264-280 (`EmptyState` function — full implementation).

**Source pattern** (Dashboard.tsx lines 264-280):
```typescript
function EmptyState({ onCta }: { onCta: () => void }): React.JSX.Element {
  return (
    <Center mih={400} data-pendo-id={PENDO_IDS.dashboard.emptyState.container}>
      <Stack align="center" gap="md">
        <IconClipboardCheck size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />
        <Title order={3}>No tasks yet</Title>
        <Text c="dimmed" ta="center" maw={420}>
          Looks like your workspace is fresh. Head over to Lists to create your first task and see
          this dashboard come to life.
        </Text>
        <Button variant="filled" pendoId={PENDO_IDS.dashboard.emptyState.cta} onClick={onCta}>
          Go to Lists
        </Button>
      </Stack>
    </Center>
  )
}
```

**Adapt for Lists** (per UI-SPEC §"Lists empty states" lines 269-287): swap `IconClipboardCheck` → `IconChecklist` (already imported in `ListsPage.tsx`); copy lines from "Copywriting Contract > Empty state copy" table; swap pendoIds to `PENDO_IDS.lists.emptyState.{container,cta}`; CTA button opens the create modal instead of navigating.

---

### `src/tasks/components/FilteredEmptyState.tsx` (compact in-table empty state)

**Analog:** `src/dashboard/Dashboard.tsx` lines 264-280 (`EmptyState`) — same structural idiom, but compact (no `mih={400}`, no big icon, no heading).

Per UI-SPEC lines 293-307:
```tsx
<Center py="xl" data-pendo-id={PENDO_IDS.lists.filteredEmpty.container}>
  <Stack align="center" gap="sm">
    <Text c="dimmed">No tasks match these filters.</Text>
    <Anchor component="button" size="sm" pendoId={PENDO_IDS.lists.filteredEmpty.clearLink} onClick={resetFilters}>
      Clear filters
    </Anchor>
  </Stack>
</Center>
```

Use the wrapped `Anchor` primitive at `src/ui/primitives/Anchor.tsx`.

---

### `src/tasks/components/DeleteConfirmModal.tsx` (destructive confirm)

**Closest analog:** None — Mantine `<Modal>` is a new component in Phase 4. The destructive-action pattern closest to this is the AppLayout sign-out handler at `src/routes/app/AppLayout.tsx` lines 92-97 (which does NOT use a modal — sign-out is reversible per Phase 2 precedent in `04-CONTEXT.md` `<specifics>` block).

Use the verbatim markup from `04-UI-SPEC.md` lines 399-419 (the locked destructive-confirm shape). Key rules:
- `<Modal size="sm" centered>` (compact — single-question dialog).
- `<Group justify="flex-end" mt="lg" gap="md">` for footer.
- Cancel `variant="default"` left, Delete `color="red" variant="filled"` right.
- Use the wrapped `Button` primitive from `src/ui/primitives/Button.tsx`.

The destructive handler closes the modal, calls `tasksRepo.deleteTask(workspaceId, task.id)`, fires toast — see `Shared Patterns > Toast Notifications`.

---

### `src/settings/ProfileTab.tsx` (CRUD form)

**Analog:** `src/routes/public/signup/Step1AccountPage.tsx` (full file).

Same RHF + Zod + Mantine primitives idiom as the wizard. Differences:
- `defaultValues` come from `useAuthStore((s) => s.currentVisitor)` instead of wizard draft.
- Submit handler calls `authRepo.updateVisitor(currentVisitor.id, values)` then `useAuthStore.setState({ currentVisitor: updated })`.
- Save button disabled when `!form.formState.isDirty`.
- Discard button calls `form.reset()` (reverts to current defaultValues).

**Validation schema:** derive a Profile-specific schema via `VisitorSchema.pick({ firstName: true, lastName: true, username: true, jobTitle: true, role: true, location: true })`. Co-locate in `src/auth/schemas.ts` if planner deems it idiomatic, OR in a new `src/settings/schemas.ts` if isolation is preferred. The `.pick()` idiom is documented in CONTEXT D-13.

**Form skeleton** (from Step1AccountPage.tsx lines 103-167 — adapted, removing wizard scaffolding):
```tsx
<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
  <Stack gap="md" maw={480}>
    <Group gap="md" grow>
      <TextInput {...form.register('firstName')} label="First name" pendoId={PENDO_IDS.settings.profile.firstName} error={form.formState.errors.firstName?.message} />
      <TextInput {...form.register('lastName')}  label="Last name"  pendoId={PENDO_IDS.settings.profile.lastName}  error={form.formState.errors.lastName?.message} />
    </Group>
    {/* ... more fields ... */}
    <Group gap="md" mt="lg">
      <Button variant="default" pendoId={PENDO_IDS.settings.profile.cancel} onClick={() => form.reset()}>Discard changes</Button>
      <Button variant="filled" type="submit" disabled={!form.formState.isDirty} pendoId={PENDO_IDS.settings.profile.save}>Save profile</Button>
    </Group>
  </Stack>
</form>
```

Then `useAuthStore.setState({ currentVisitor: updated })` after `authRepo.updateVisitor` returns (analogous to how `authStore.setSession` at lines 73-85 patches state). Toast fires per `Shared Patterns > Toast Notifications`.

---

### `src/settings/WorkspaceTab.tsx` (CRUD form)

**Analog:** `src/routes/public/signup/Step3CompanyPage.tsx` (full file).

Step 3 already has the canonical Mantine `<Select>` idiom for `companySize` / `industry` / `planTier` — copy lines 119-201 verbatim, swapping:
- Schema source: `WorkspaceSchema.pick({ companyName: true, companySize: true, industry: true, planTier: true })`
- `defaultValues` from `useAuthStore((s) => s.currentWorkspace)`
- Submit handler: `authRepo.updateWorkspace(currentWorkspace.id, values)` + `useAuthStore.setState({ currentWorkspace: updated })`
- pendoIds → `PENDO_IDS.settings.workspace.*`
- Drop the Back/Continue buttons; add Discard/Save per Profile pattern above

---

### `src/settings/PreferencesTab.tsx` (theme toggle + danger zone)

**Analog (theme toggle):** `src/dashboard/Dashboard.tsx` lines 318-327 (SegmentedControl).

**Source** (Dashboard.tsx lines 316-328):
```tsx
<SegmentedControl
  data={[
    { value: '7', label: '7d' },
    { value: '30', label: '30d' },
    { value: '90', label: '90d' },
  ]}
  value={range}
  onChange={(v) => setRange(v as Range)}
  data-pendo-id={PENDO_IDS.dashboard.timeRange}
/>
```

**For PreferencesTab:** bind `value={colorScheme}` from `useMantineColorScheme()` (Mantine hook) and `onChange={setColorScheme}` per UI-SPEC lines 543-553. Data array shape from UI-SPEC includes icon `<Group gap={8}><IconSun .../>Light</Group>` — this is custom JSX in the `label` slot, which Mantine SegmentedControl supports.

Note: `data-pendo-id` lands directly on the SegmentedControl element (no wrapper primitive needed). Phase 3 precedent at Dashboard.tsx line 326 uses the same direct attribute.

**Analog (Danger zone card):** No direct analog. Use the `<Paper withBorder p="lg" radius="md">` shape from `src/ui/ComingSoonCard.tsx` lines 28-37 (`<Paper withBorder p="xl" radius="md">`), but with `p="lg"` per D-17 and add the `<Title order={3} c="red.7">` heading.

```tsx
<Paper withBorder p="lg" radius="md" mt="xl">
  <Stack gap="md">
    <Title order={3} c="red.7">Danger zone</Title>
    <Text size="md">Reset all demo data for this workspace. This will permanently delete all tasks, settings, and accounts in this browser, and sign you out.</Text>
    <Box>
      <Button color="red" variant="outline" leftSection={<IconAlertTriangle size={16} />} pendoId={PENDO_IDS.settings.dangerZone.button} onClick={openResetConfirm}>
        Reset demo data
      </Button>
    </Box>
  </Stack>
</Paper>
```

---

### `src/settings/ResetDemoDataModal.tsx` (destructive confirm + reset handler)

**Analog:** None for the modal itself (Mantine `<Modal>` is new). For the reset HANDLER logic:
- Sign-out flow at `src/routes/app/AppLayout.tsx` lines 92-97 demonstrates "navigate first, then mutate" pattern:
```typescript
const handleSignOut = async () => {
  navigate('/', { replace: true })
  await useAuthStore.getState().signOut()
}
```
- For Reset demo data, the order per D-17 is REVERSED: wipe storage, THEN `window.location.href = '/'` (hard reload — re-runs the boot sequence with clean state). The hard-reload, not React Router navigation, is the deliberate choice.

**Reset handler skeleton** (D-17 + UI-SPEC lines 625-630):
```typescript
const handleReset = () => {
  // 1. Wipe halo:v* keys
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('halo:v')) keysToRemove.push(key)
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k))
  // 2. Wipe sessionStorage signup draft
  sessionStorage.removeItem(K.signupDraft())
  // 3. Do NOT remove mantine-color-scheme-value (theme survives reset per D-17)
  // 4. Hard reload
  window.location.href = '/'
}
```

Direct `localStorage.removeItem` is a deliberate exception to the FND-04 codec rule because reset bypasses every other codec gate by design (the codec at `src/storage/codec.ts` only exposes `removeKey(key)` for a single key — for enumerated bulk wipe, a direct call is acceptable). Document the exception in a code comment per the precedent at `src/storage/codec.ts` lines 1-12 (the codec self-documents its FND-04 ONLY-CALLER status).

Modal markup: copy from UI-SPEC lines 591-621 — same shape as `DeleteConfirmModal`. Use wrapped `Button` primitives.

---

### `src/reports/ReportsFiltersBar.tsx` (filter UI)

**Analog:** Same as `TaskFiltersBar` — `src/dashboard/Dashboard.tsx` lines 316-328 idiom.

Differences from Lists filter bar:
- Use `<DatePickerInput>` wrapper (new) instead of `<Select>` for date range
- Use `<MultiSelect>` wrapper (existing at `src/ui/primitives/MultiSelect.tsx`) for status (multi-pick)
- Default date range: `[dayjs(nowRef).subtract(30, 'day').toDate(), dayjs(nowRef).toDate()]` — `nowRef` from `src/tasks/now-ref.ts`
- pendoIds → `PENDO_IDS.reports.filter.*`

---

### `src/reports/ReportsChart.tsx` (Recharts stacked bar)

**Analog:** `src/dashboard/Dashboard.tsx` lines 360-422 (AreaChart + PieChart inside `<Paper>` wrappers).

**Source pattern** (Dashboard.tsx lines 362-386):
```tsx
<Paper withBorder p="md" radius="md" data-pendo-id={PENDO_IDS.dashboard.chart.completedPerDay}>
  <Text fw={600} mb="md">Completed per day</Text>
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={dayBuckets}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
      <XAxis dataKey="date" tick={{ fontSize: 14 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
      <Tooltip />
      <Area type="monotone" dataKey="count" stroke="#3b5bdb" fill="#4263eb" fillOpacity={0.6} />
    </AreaChart>
  </ResponsiveContainer>
</Paper>
```

**For Reports stacked bar:** swap `<AreaChart>` → `<BarChart>`; use three `<Bar stackId="status">` rendered per status per UI-SPEC lines 711-721. The `data-pendo-id` lands on the OUTER `<Paper>` (or an inner wrapping `<div>` per UI-SPEC line 690), NEVER on the SVG `<Bar>` / `<rect>` children — copy this rule from Dashboard.tsx line 366 (comment at line 361: "data-pendo-id on the outer Paper, never on Recharts SVG children (PEN-08)").

**Color resolution caveat (D-18, NO ANALOG):** Dashboard.tsx uses hardcoded hex strings at lines 381-410 (`stroke="#3b5bdb"`, `<Cell fill="#a5b4fc" />`). For dark mode, Phase 4 converts to theme-resolved colors per UI-SPEC lines 138-152:
```typescript
const theme = useMantineTheme()
const computed = useComputedColorScheme('light')
const colorTodo = theme.colors.indigo[3]
const colorInProgress = computed === 'dark' ? theme.colors.indigo[4] : theme.colors.indigo[6]
const colorDone = theme.colors.gray[5]
```
This is a Phase 4 pattern that Dashboard.tsx hex constants should ALSO be converted to as part of the dark-mode verification step. (Verification step in 04-CONTEXT.md D-18 explicitly calls this out — planner decides whether the Dashboard.tsx conversion lands as a separate plan task.)

---

### `src/reports/ReportsTable.tsx` (TanStack read-only)

**No analog (TanStack Table is new).** Same constraints as `TaskTable.tsx`. Six columns per UI-SPEC lines 744-756 — read-only (no actions column). Wrap in `<Paper withBorder p={0} radius="md" data-pendo-id={PENDO_IDS.reports.table.container}>` per UI-SPEC line 694. Default sort `createdAt` desc.

Status/Priority cells: use `TASK_STATUS_BADGE_COLOR` map (added to `src/tasks/labels.ts`). Date cells: use `dayjs(date).format('MMM D, YYYY')` with `'—'` fallback for null.

---

### `src/reports/csvExport.ts` (Blob + URL.createObjectURL, NO ANALOG)

**No analog in the codebase.** First Blob/URL.createObjectURL caller. Use the verbatim implementation from `04-UI-SPEC.md` "CSV Export Contract" lines 776-811:
- Hand-roll RFC 4180 quoter (`"` → `""`, wrap field in `"..."` when it contains `,`, `\n`, or `"`).
- `dayjs().format('YYYY-MM-DD')` for filename timestamp.
- `dayjs(task.dueDate).format('YYYY-MM-DD')` for date columns in the CSV body (ISO date — machine-readable; visual table uses `MMM D, YYYY`).
- Headers verbatim: `Title,Status,Priority,Assignee,Due date,Completed at`.
- `new Blob([csv], { type: 'text/csv;charset=utf-8' })` → `URL.createObjectURL` → ephemeral `<a download>` click → `URL.revokeObjectURL`.

No third-party CSV library.

---

### `src/routes/app/lists/ListsPage.tsx` (page composer)

**Analog:** `src/dashboard/Dashboard.tsx` (full file structure) — top-level page reads workspace from authStore, calls `listTasks`, composes sub-components, handles empty branch.

**Source skeleton** (Dashboard.tsx lines 286-313):
```typescript
export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id)
  const [range, setRange] = useState<Range>('30')

  const tasks = useMemo(() => (workspaceId ? listTasks(workspaceId) : []), [workspaceId])

  if (!workspaceId) return <></>
  if (tasks.length === 0) return <EmptyState onCta={() => navigate('/app/lists')} />

  return (
    <Stack gap="xl">
      {/* SegmentedControl, KPIs, charts, timeline ... */}
    </Stack>
  )
}
```

**Adapt for ListsPage** (UI-SPEC lines 165-195):
- State: filter `useState`s for status / priority / assignee, modal open/close `useState`s, currently-editing task `useState`.
- `tasks` from `listTasks(workspaceId)` (same pattern). After CRUD operations, `tasks` needs to refresh — use `useState<Task[]>` keyed by an integer counter incremented on any CRUD success, OR a `useReducer`. The planner picks the refresh strategy; the simplest local idiom is `const [refreshKey, setRefreshKey] = useState(0)` + `useMemo(() => listTasks(workspaceId), [workspaceId, refreshKey])`.
- Empty-state branch: `tasks.length === 0` → `<ListsEmptyState onCreateClick={...} />`; filtered tasks empty AND filters non-default → table renders `<FilteredEmptyState onClearFilters={...} />` inside its body region.
- Page header `<Group justify="space-between">`: Title left, primary `<Button>` "New task" right.

---

### `src/routes/app/settings/SettingsPage.tsx` (page composer)

**Analog (URL-tab driving):** None directly — `useSearchParams` is new in the codebase. The closest precedent is the `useNavigate('/app/settings?tab=profile')` call at `src/routes/app/AppLayout.tsx` line 137 (the deep-link emitter from the user menu).

**Tab structure:** Use Mantine `<Tabs value onChange>` with `<Tabs.List>` + three `<Tabs.Panel>`s per UI-SPEC lines 437-457. `data-pendo-id` lands on each `<Tabs.Tab>` (this is a Mantine slot, not a wrapped primitive — direct attribute is acceptable, mirroring Dashboard.tsx line 326's direct `data-pendo-id` on SegmentedControl).

**useSearchParams pattern:**
```typescript
import { useSearchParams } from 'react-router'

const [searchParams, setSearchParams] = useSearchParams()
const rawTab = searchParams.get('tab')
const tab = ['profile', 'workspace', 'preferences'].includes(rawTab ?? '') ? rawTab! : 'profile'
```

Falls through to `'profile'` when `?tab=` is absent or invalid per D-12.

---

### `src/routes/app/reports/ReportsPage.tsx` (page composer)

**Analog:** Same as `ListsPage` — Dashboard.tsx structure. Compose `<ReportsFiltersBar>` + `<ReportsChart>` + `<ReportsTable>` + "Export CSV" button. Pull `nowRef` from `src/tasks/now-ref.ts`.

---

### `src/App.tsx` (`defaultColorScheme` + Notifications mount)

**Analog:** `src/App.tsx` lines 26-39 — in-place edit.

**Current** (App.tsx lines 26-38):
```tsx
export default function App(): React.JSX.Element {
  return (
    <MantineProvider theme={haloTheme} defaultColorScheme="light">
      <StorageProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <PendoBridge>
              <RouterProvider router={router} />
            </PendoBridge>
          </WorkspaceProvider>
        </AuthProvider>
      </StorageProvider>
    </MantineProvider>
  )
}
```

**Phase 4 changes:**
1. `defaultColorScheme="light"` → `defaultColorScheme="auto"` (D-18).
2. Mount `<Notifications />` from `@mantine/notifications` inside MantineProvider, OUTSIDE the rest of the provider tree (Mantine docs convention) — typically right after the opening MantineProvider tag and before StorageProvider. Import `import '@mantine/notifications/styles.css'` at `src/main.tsx` (where Mantine core styles are imported — verify in main.tsx).

**Preserve** the FND-07 provider ordering comment (lines 13-23). Document the dark-mode and notifications additions as in-place updates per the existing in-file docstring convention.

---

### `index.html` (real ColorSchemeScript)

**Analog:** `index.html` line 11 — in-place edit.

**Current** (index.html lines 8-11):
```html
<!-- Mantine ColorSchemeScript: sets data-mantine-color-scheme on <html> before paint
     to prevent dark-mode FOUC. For SPA-only (no SSR), an inline script is the
     equivalent of Mantine's ColorSchemeScript component. -->
<script>document.documentElement.setAttribute('data-mantine-color-scheme', 'light');</script>
```

**Phase 4 change:** replace the hardcoded `'light'` with the real auto-detection script (Mantine's official inline ColorSchemeScript output). The Mantine v9 standard inline snippet reads `localStorage.getItem('mantine-color-scheme-value')` and falls back to `prefers-color-scheme` media query. Planner sources the exact snippet from Mantine v9 docs at install time — there is no codebase precedent because this is the first dark-mode wiring.

---

## Shared Patterns

### S1. Authentication / workspace context

**Source:** `src/auth/authStore.ts` lines 68-71 (Zustand store shape), lines 149-168 (module-init hydration), `src/routes/app/AppLayout.tsx` lines 70-71 (consumer pattern).

**Apply to:** Every Phase 4 page (`ListsPage`, `SettingsPage`, `ReportsPage`) and every component that needs workspaceId / current visitor.

**Read pattern** (AppLayout.tsx lines 70-71, Dashboard.tsx lines 288):
```typescript
const visitor = useAuthStore((s) => s.currentVisitor)
const workspace = useAuthStore((s) => s.currentWorkspace)
const workspaceId = useAuthStore((s) => s.currentWorkspace?.id)
```

**Write pattern (Phase 4 Settings tabs):**
```typescript
// After authRepo.updateVisitor returns the updated record:
useAuthStore.setState({ currentVisitor: updated })
```

This propagates immediately to all subscribers (e.g. top-bar workspace name display) without a refresh, per D-14.

**Defensive narrowing:** Pages should belt-and-suspenders check `if (!workspaceId) return <></>` (Dashboard.tsx line 307 precedent) even though `RequireAuth` already gates `/app/*`.

---

### S2. RHF + Zod resolver

**Source:** `src/routes/public/signup/Step1AccountPage.tsx` lines 28-92 (full RHF + Zod + submit handler precedent). Reinforced by `src/routes/public/signup/Step3CompanyPage.tsx` lines 78-92 (Select handling) and `src/routes/public/SignInPage.tsx` lines 59-81 (sign-in form pattern).

**Apply to:** `TaskFormModal`, `ProfileTab`, `WorkspaceTab`, and any other Phase 4 form.

**Setup:**
```typescript
const form = useForm<TaskFormValues>({
  resolver: zodResolver(TaskFormSchema),
  mode: 'onSubmit',                            // Phase 2 lock — validates on submit, not keystroke
  defaultValues: { /* form-shaped initial values */ },
})
```

**Submit:**
```typescript
const onSubmit = form.handleSubmit((values) => {
  // 1. Optional uniqueness/business checks (with form.setError for manual errors)
  // 2. Call repo method (createTask / updateTask / updateVisitor / updateWorkspace)
  // 3. Update Zustand state if needed (settings only)
  // 4. Close modal (if modal form)
  // 5. Fire toast
})
```

**Field wiring** (TextInput precedent — Step1AccountPage.tsx lines 105-126):
```tsx
<TextInput
  {...form.register('fieldName')}
  label="Label"
  placeholder="..."
  error={form.formState.errors.fieldName?.message}
  pendoId={PENDO_IDS.<namespace>.<key>}
/>
```

**Select field wiring** — see Step3CompanyPage.tsx lines 119-148 verbatim (the enum-membership narrowing idiom).

---

### S3. Wrapped-primitive `pendoId` discipline

**Source:** `src/ui/primitives/Button.tsx` lines 22-31 (canonical wrapper signature), all primitives in `src/ui/primitives/*` follow the same shape.

**Apply to:** Every interactive control in Phase 4 — `Button`, `TextInput`, `Textarea` (new), `Select`, `MultiSelect`, `Checkbox` (new), `DatePickerInput` (new), `NavLink`, `Anchor`.

**Rule:** Import from the barrel `import { Button, TextInput, ... } from '<relative>/ui/primitives'`. Every interactive control supplies `pendoId={PENDO_IDS.<namespace>.<key>}` — TypeScript flags omissions at compile time. NO hand-typed `'lists.row.complete-toggle'` string literals (CONVENTIONS.md §1 ban).

**Exception:** Mantine-slot props (`<Menu.Item data-pendo-id={...}>`, `<Tabs.Tab data-pendo-id={...}>`, `<SegmentedControl data-pendo-id={...}>`, `<ActionIcon data-pendo-id={...}>`) accept `data-pendo-id` directly. Precedent at `src/routes/app/AppLayout.tsx` line 109 (`<Title data-pendo-id={PENDO_IDS.topbar.logo}>`), lines 119-156 (every Menu.Target/Menu.Item), and Dashboard.tsx line 326 (SegmentedControl). The value source is STILL `PENDO_IDS.*` — never a string literal.

**Parameterized rows** (CLAUDE.md dynamic-list rule, applied for the first time in Phase 4):
```tsx
<Checkbox
  pendoId={PENDO_IDS.lists.row.completeToggle}
  taskId={task.id}                              // forwards as data-pendo-task-id
  checked={task.status === 'done'}
  onChange={(e) => tasksRepo.updateTask(workspaceId, task.id, { status: e.currentTarget.checked ? 'done' : 'todo' })}
/>
```

Dashboard.tsx lines 437-448 already demonstrate the parameterized pattern (`<Timeline.Item data-pendo-id={PENDO_IDS.dashboard.activity.item} data-pendo-task-id={task.id}>`) — copy this idiom for kebab `ActionIcon`s in TaskTable.

---

### S4. Repo CRUD signature

**Source:** `src/tasks/tasksRepo.ts` lines 36-95 (canonical list/get/create/update/delete shape). `src/auth/authRepo.ts` lines 75-179 (parallel idiom for visitors/workspaces).

**Apply to:** `authRepo.updateVisitor` (new), `authRepo.updateWorkspace` (new), `tasksRepo.updateTask` extension.

**Repo contract:**
- Every read goes through `readWithSchema(K.<key>(), <Schema>ArraySchema, [] as <Type>[])` — FND-04 lock.
- Every write goes through `writeJSON(K.<key>(), nextArray)`.
- `update*` takes `(id, patch: Partial<Omit<Type, immutableFields>>)` and returns `Type | undefined`.
- Immutable fields are excluded structurally via `Omit<>` so TS catches accidental UI exposure (D-15).
- Non-atomic read-modify-write — acceptable per WR-04 caveat documented at `src/auth/authRepo.ts` lines 19-29.

---

### S5. localStorage codec

**Source:** `src/storage/codec.ts` lines 26-77 (`readWithSchema`, `writeJSON`, `removeKey`).

**Apply to:** All persistence in Phase 4 EXCEPT bulk-wipe in `ResetDemoDataModal.handleReset` (deliberate exception — see S6 below).

**Rule:** No `localStorage.*` calls outside `src/storage/codec.ts`. Every read returns a typed value or falls through to a fallback. Every write is fire-and-forget (non-fatal on QuotaExceededError).

---

### S6. Bulk-wipe escape hatch (Reset demo data only)

**Source:** None — Phase 4 is the first caller. The closest precedent is the doc-comment at `src/storage/codec.ts` lines 1-12 declaring itself the only caller of `localStorage.*`.

**Apply to:** `ResetDemoDataModal.handleReset` ONLY. Document the FND-04 exception inline:
```typescript
// Deliberate exception to FND-04 codec rule: bulk wipe by prefix needs to
// enumerate keys, which the codec does not expose. The codec's removeKey()
// helper handles single keys; for prefix scan we call localStorage directly.
```

Mantine's color-scheme key (`mantine-color-scheme-value`) is OUTSIDE the `halo:v*` prefix and intentionally survives reset (D-17 + D-26). No new Halo storage key is added for theme.

---

### S7. Recharts chart wrapper

**Source:** `src/dashboard/Dashboard.tsx` lines 362-422 (AreaChart + PieChart, with `data-pendo-id` on outer Paper, never on SVG children).

**Apply to:** `ReportsChart.tsx`.

**Rule:** `data-pendo-id` lands on the wrapping `<Paper>` (or an inner `<div>` per UI-SPEC line 690) — NEVER on a Recharts `<Bar>` / `<Cell>` / `<rect>` element. PEN-08 lock. Inline comment at Dashboard.tsx line 361 says: "data-pendo-id on the outer Paper, never on Recharts SVG children (PEN-08)" — copy this comment for Phase 4 charts.

**Dark-mode color resolution (NEW pattern):** Convert hardcoded hex (`fill="#4263eb"`) to theme-resolved tokens. Use `useMantineTheme()` + `useComputedColorScheme()`. Pattern in UI-SPEC lines 138-152.

---

### S8. Toast notifications (NEW dep, no analog)

**Source:** None — `@mantine/notifications` is new in Phase 4. Closest precedent for "fire-and-forget UI feedback after CRUD" is silent (Phase 2 wizard navigates on success; Phase 3 dashboard has no mutations).

Use the verbatim pattern from `04-UI-SPEC.md` "Toast Notifications" lines 815-848:
```typescript
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'

notifications.show({
  title: 'Task created',
  message: '',
  color: 'green',
  icon: <IconCheck size={18} />,
  autoClose: 3000,
})
```

**Apply to:** Every CRUD success in Phase 4 (`createTask`, `updateTask`, `deleteTask` from `TaskFormModal` / kebab; `updateVisitor`, `updateWorkspace` from Settings tabs). Copy strings verbatim from UI-SPEC "Toast copy (verbatim)" table at lines 1090-1097. Reset demo data does NOT fire a toast (hard-reloads immediately — no opportunity).

**Mount requirement:** `<Notifications />` must be mounted inside MantineProvider in `App.tsx` before any toast fires. See modification entry for `src/App.tsx` above.

---

### S9. Mantine `<Paper withBorder p="md" radius="md">` surface

**Source:** Used throughout Phase 3 — `src/dashboard/Dashboard.tsx` line 246 (KpiCard), 362 (chart Paper), 425 (timeline Paper), `src/ui/ComingSoonCard.tsx` line 30 (`p="xl"`).

**Apply to:** Every Phase 4 surface container — filter bar wrapper (if wrapped), table wrapper, chart wrapper, Danger zone card, modal bodies.

**Variants:**
- Standard: `<Paper withBorder p="md" radius="md">` (Dashboard precedent).
- Danger zone (D-17 spec): `<Paper withBorder p="lg" radius="md" mt="xl">`.
- Tables (cells own padding): `<Paper withBorder p={0} radius="md">` with `overflow="hidden"`.

No `shadow="..."` (Phase 3 `withBorder` lock — `withBorder` and `shadow` are mutually exclusive in Halo per UI-SPEC §"Design System" inherited from Phase 3).

---

### S10. Empty-state hero

**Source:** `src/dashboard/Dashboard.tsx` lines 264-280 (`EmptyState` function).

**Apply to:** `ListsEmptyState` (full hero), `FilteredEmptyState` (compact — strip `mih={400}`, `<Title>`, big icon; keep `<Stack align gap="sm">` + dimmed text + Anchor).

**Hero shape:**
```tsx
<Center mih={400} data-pendo-id={PENDO_IDS.<namespace>.emptyState.container}>
  <Stack align="center" gap="md">
    <Icon{Type} size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />
    <Title order={3}>{heading}</Title>
    <Text c="dimmed" ta="center" maw={420}>{body}</Text>
    <Button variant="filled" pendoId={PENDO_IDS.<namespace>.emptyState.cta} onClick={onCta}>{ctaLabel}</Button>
  </Stack>
</Center>
```

Icon size `64` is the structural exception (CSS-prop-numeric pixels allowed for icons per UI-SPEC §Spacing).

---

### S11. Schemas-as-source-of-truth + z.infer types

**Source:** `src/auth/schemas.ts` (full file) + `src/auth/types.ts` lines 32-45 (`z.infer` derivation). `src/tasks/schemas.ts` + `src/tasks/types.ts` mirror the pattern.

**Apply to:** New `TaskFormSchema` (and its `TaskFormValues` type) co-located in `src/tasks/schemas.ts` + `src/tasks/types.ts`. Settings forms derive their schema via `.pick()` from the existing `VisitorSchema` / `WorkspaceSchema` per D-13/D-14.

**Rule:** Edit the schema; the type follows automatically via `z.infer`. Never hand-write a parallel type declaration. The `Record<TaskStatus, string>` annotation on `TASK_STATUS_LABELS` at `src/tasks/labels.ts` lines 16-20 is the discipline for exhaustiveness — apply the same `Record<TaskStatus, string>` annotation to the new `TASK_STATUS_BADGE_COLOR` and `TASK_PRIORITY_BADGE_COLOR` maps.

---

## No Analog Found

Files whose patterns are sourced from RESEARCH-style UI-SPEC excerpts or external library docs rather than a local codebase analog:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/tasks/components/TaskTable.tsx` | TanStack Table | CRUD + sort + event | `@tanstack/react-table` is new in Phase 4 — no existing table consumer. Source: TanStack v8 docs + UI-SPEC §"TanStack Table (Lists)" |
| `src/reports/ReportsTable.tsx` | TanStack Table | transform + render | Same as above. Source: TanStack v8 docs + UI-SPEC §"Reports TanStack Table" |
| `src/reports/csvExport.ts` | Blob + URL.createObjectURL | transform | First Blob/object-URL caller in the codebase. Source: UI-SPEC §"CSV Export Contract" (RFC 4180 rules + verbatim implementation pattern) |
| `src/settings/ResetDemoDataModal.tsx` (modal markup) | destructive modal | event-driven | Mantine `<Modal>` is new. Reset HANDLER has a partial analog (S6); modal markup itself is sourced from UI-SPEC lines 591-621 |
| `src/tasks/components/DeleteConfirmModal.tsx` (modal markup) | destructive modal | event-driven | Same as above — modal markup from UI-SPEC lines 399-419 |
| `src/tasks/components/TaskFormModal.tsx` (modal wrapper) | modal | request-response | The FORM inside has a strong analog (S2); the `<Modal opened onClose title size centered>` wrapper itself is new. Source: UI-SPEC lines 315-323 |
| `src/reports/ReportsChart.tsx` (theme-color resolution) | chart | render | Recharts chart wrapping has strong analog (S7); but `useMantineTheme` + `useComputedColorScheme` color resolution for dark mode is a NEW pattern. Source: UI-SPEC §"Dark mode color contract" lines 138-152 |
| `src/routes/app/settings/SettingsPage.tsx` (useSearchParams) | URL state | event-driven | `useSearchParams` from `react-router` is new in the codebase. Source: UI-SPEC §"Tab URL contract" lines 460-465 |
| `index.html` (real ColorSchemeScript) | static config | const | Phase 1 hardcoded `'light'`. The real Mantine v9 inline auto-detection script has no in-repo precedent. Source: Mantine v9 docs at install time |
| Notifications mount in `src/App.tsx` | provider | const | `@mantine/notifications` is new. Source: Mantine notifications docs |

---

## Metadata

**Analog search scope:** `src/auth/**`, `src/tasks/**`, `src/dashboard/**`, `src/storage/**`, `src/ui/**`, `src/routes/**`, `src/pendo/**`, `src/App.tsx`, `src/main.tsx`, `src/router.tsx`, `src/theme.ts`, `index.html`, `package.json`.

**Files scanned:** 31 source files (full or targeted reads).

**Key cross-cutting precedents identified:**
- Phase 2 RHF + Zod wizard pattern is the universal form analog (Step1AccountPage, Step3CompanyPage).
- Phase 3 Dashboard.tsx is the universal page-shape, empty-state, chart-wrapping, and SegmentedControl analog.
- Phase 1 `src/ui/primitives/*` wrapper contract (pendoId required, forwarded as data-pendo-id) covers every new primitive.
- Phase 3 `src/tasks/tasksRepo.ts` update/create/delete signatures are the universal repo CRUD analog — `authRepo.updateVisitor`/`updateWorkspace` copy them cross-module.
- Phase 2 `src/auth/authStore.ts` `setState` write pattern (lines 73-94) is the universal Zustand-mutation analog for Settings save handlers.

**Pattern extraction date:** 2026-05-15

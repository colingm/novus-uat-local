# Phase 3: Authenticated Shell & Dashboard - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 23 (17 new + 5 modified + 1 deleted)
**Analogs found:** 17 / 17 (every new file has at least one strong analog in repo)

> **CRITICAL READING ORDER FOR PLANNER**
>
> Phase 3 is heavily pattern-driven. The repo already establishes:
> - The `pendoId: PendoId` primitive-wrapper contract (7 existing wrappers in `src/ui/primitives/`)
> - The Zod-schemas-first → `z.infer` types pattern (`src/auth/schemas.ts` + `src/auth/types.ts`)
> - The `K.{name}(scope)` storage key builder pattern (`src/storage/keys.ts`)
> - The `readWithSchema(key, Schema, fallback)` envelope (`src/storage/codec.ts`)
> - The per-key feature module pattern (`src/auth/authRepo.ts`)
> - The module-init hydration pattern (`src/auth/authStore.ts` line 173)
> - The PENDO_IDS additive namespace pattern (`src/pendo/PENDO_IDS.ts`)
>
> The planner MUST anchor every Phase 3 plan to a concrete line excerpt from these analogs.
> There is no placeholder-route analog in the repo today — `src/routes/app/AppPlaceholder.tsx`
> is the closest, and it is being deleted. Use it as a structural template, not a literal copy.

---

## File Classification

### New files

| New file | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/tasks/schemas.ts` | feature-schema | (validation contract) | `src/auth/schemas.ts` | **exact** — same role: Zod schemas as source of truth for one feature's persistence + display |
| `src/tasks/types.ts` | feature-types | (z.infer derivation) | `src/auth/types.ts` | **exact** — every type derived via `z.infer<typeof XSchema>`, no hand-written parallel declarations |
| `src/tasks/tasksRepo.ts` | repository | CRUD (read-modify-write over a single localStorage key) | `src/auth/authRepo.ts` | **exact** — same module shape: `list*` / `find*` / `create*` over `K.x()` via `readWithSchema` + `writeJSON` |
| `src/tasks/tasksSeed.ts` | bootstrap-utility | one-shot write gated by `meta.seededAt` | `src/storage/migrations.ts` (runMigrations) + `src/auth/authStore.ts` (`hydrateAuthFromStorage`) | **role-match** — no prior "seed" module exists, but the idempotent-gate-on-`meta` pattern is established in `runMigrations`; the "run-once at module-init" pattern is established in `hydrateAuthFromStorage` |
| `src/tasks/labels.ts` | display-mapper | pure const map | `src/auth/schemas.ts` enum declarations | **partial** — closest pattern is enum-with-options; labels.ts is new shape; ALSO inherits the "Phase 3 typography-pure-data file" convention |
| `src/tasks/index.ts` | barrel | re-export only | `src/auth/index.ts` and `src/storage/index.ts` | **exact** — `src/auth/index.ts` is the canonical pattern (named re-exports + `export *` for schemas/types) |
| `src/dashboard/Dashboard.tsx` | page-component | request-response (reads tasks → renders KPIs/charts/timeline) | `src/routes/public/SignInPage.tsx` (page structure) + `src/routes/public/signup/Step1AccountPage.tsx` (form/state hook patterns) | **role-match** — no chart-bearing page exists today; SignInPage is the closest "single-page-with-business-logic" analog |
| `src/dashboard/relative-time.ts` | utility | pure function | `src/auth/passwordHash.ts` | **role-match** — single-purpose pure utility module with no external deps |
| `src/ui/ComingSoonCard.tsx` | shared-component | display only | `src/ui/DemoBanner.tsx` | **exact** — same role: a shared chrome component used by many routes, no `data-pendo-id` on the wrapper itself (the `comingSoon.card` ID lands on the inner `<Paper>` per the wrapper convention in `Button.tsx`) |
| `src/ui/primitives/NavLink.tsx` | primitive-wrapper | pendoId forwarding | `src/ui/primitives/Button.tsx`, `Select.tsx`, `MultiSelect.tsx`, `NumberInput.tsx` | **exact** — six existing wrappers establish a four-line forwarding template; NavLink is the seventh |
| `src/routes/app/lists/ListsPage.tsx` | placeholder-route | display only | `src/routes/app/AppPlaceholder.tsx` (about to be deleted) | **exact** — the deleted file IS the template; copy structure, swap body for `<ComingSoonCard featureName="Lists" phase={4} />` |
| `src/routes/app/reports/ReportsPage.tsx` | placeholder-route | display only | same as above | **exact** |
| `src/routes/app/team/TeamPage.tsx` | placeholder-route | display only | same as above | **exact** |
| `src/routes/app/settings/SettingsPage.tsx` | placeholder-route | display only | same as above | **exact** |
| `src/routes/app/help/HelpPage.tsx` | placeholder-route | display only | same as above | **exact** |

### Modified files

| Modified file | What changes | Analog for the change | Match Quality |
|---------------|--------------|------------------------|---------------|
| `src/routes/app/AppLayout.tsx` | Body replaced — Mantine `AppShell` with navbar + header + Outlet | `src/routes/public/PublicLayout.tsx` (Outlet host) + `src/routes/public/signup/SignupShell.tsx` (Stepper-driven shell with `useLocation`-derived active state) | **role-match** — no AppShell exists; SignupShell is the closest "shell with active-position derived from pathname" |
| `src/router.tsx` | `/app` `children` gets 6 new entries; index swaps `AppPlaceholder → Dashboard` | `src/router.tsx` itself (existing `/signup` block with shell+index+4 named children) | **exact** — Phase 2 added five `/signup` children under SignupShell using the same `index: true + path: 'name'` shape Phase 3 needs |
| `src/pendo/PENDO_IDS.ts` | Append 4 new namespaces (`nav`, `topbar`, `dashboard`, `comingSoon`); retire `layout.appPlaceholder` | `src/pendo/PENDO_IDS.ts` itself (Phase 2's append of `signup` + `signin` namespaces) | **exact** — file documents the additive namespace convention in its header comment |
| `src/storage/keys.ts` | Add one `K.tasks(workspaceId)` builder | `src/storage/keys.ts` itself (header note already calls out scoped keys: "Keys are functions (even zero-argument ones) so the API stays uniform when scoped keys like `tasks(accountId)` are added in Phase 4") | **exact** — the existing file pre-declares the convention for Phase 3's exact use case |

### Deleted files

| File | Disposition |
|------|-------------|
| `src/routes/app/AppPlaceholder.tsx` | Replaced by `src/dashboard/Dashboard.tsx`. Also retire the leaf `PENDO_IDS.layout.appPlaceholder` (`'layout.app.placeholder'`) since its target no longer exists. |

---

## Pattern Assignments

### `src/tasks/schemas.ts` (feature-schema, validation contract)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/schemas.ts`

**File-header comment pattern** (lines 1–22) — DO copy this exact docblock shape, adapted for tasks:
```ts
/**
 * Halo tasks — Zod schemas (Phase 3).
 *
 * This module is the single source of truth for:
 *
 *   1. Task persistence schemas — `readWithSchema` reads against TasksArraySchema
 *      on every K.tasks(workspaceId) hydration.
 *   2. Status / priority enums — reused by Phase 4's filter UI (LIST-07) and
 *      Phase 3's dashboard label map (src/tasks/labels.ts).
 *   3. Assignee snapshot — embedded shape; Phase 5 TEAM-01 introduces the
 *      canonical K.teammates(workspaceId) store and may rewrite this slot.
 *
 * Schema lock: every field shape in TaskSchema is the Phase 4 LIST contract.
 * Editing TaskSchema is a deliberate cross-phase change, not a refactor.
 */
```

**Zod enum declaration pattern** (lines 26–82 of auth/schemas.ts):
```ts
/** Status options on Task forms + the persisted Task record. */
export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done'])

/** Priority options on Task forms + the persisted Task record. */
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])
```
**NOTE — no `{ message: '...' }` argument** is required for these enums because Phase 3 has no form surface for tasks (the enums are for persistence + dashboard label mapping only). Phase 4 may add error messages when LIST-02 builds the create-task modal — that is a Phase 4 edit, not a Phase 3 one.

**Embedded-object schema pattern** (modeled on `VisitorSchema` lines 232–247):
```ts
export const AssigneeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
})

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  assignee: AssigneeSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  dueDate: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
})
```

**Array schema pattern** (lines 286–289 of auth/schemas.ts):
```ts
export const TasksArraySchema = z.array(TaskSchema)
```

**`z.iso.datetime()` vs `z.string().datetime()`:** Note `VisitorSchema` uses `z.iso.datetime()` (line 246) — this is the canonical Halo idiom. Do NOT use `z.string().datetime()`.

---

### `src/tasks/types.ts` (feature-types, z.infer derivation)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/types.ts`

**File-header comment pattern** (lines 1–13) — DO copy this exact docblock, adapted:
```ts
/**
 * Halo tasks — TypeScript types (Phase 3).
 *
 * Every type in this file is derived from a Zod schema in `./schemas` via
 * `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel
 * type declarations here. If a field shape changes, edit the schema; the type
 * follows automatically.
 */
```

**Type-only import + z.infer pattern** (lines 15–45):
```ts
import type { z } from 'zod'
import type {
  TaskSchema,
  TaskStatusEnum,
  TaskPriorityEnum,
  AssigneeSchema,
} from './schemas'

export type Task = z.infer<typeof TaskSchema>
export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type TaskPriority = z.infer<typeof TaskPriorityEnum>
export type Assignee = z.infer<typeof AssigneeSchema>
```

**Critical:** `import type` (not `import`) — auth/types.ts uses type-only imports to keep the runtime graph clean.

---

### `src/tasks/tasksRepo.ts` (repository, CRUD over K.tasks(workspaceId))

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/authRepo.ts`

**File-header docblock** (lines 1–29) — copy the rationale structure verbatim, adapted to tasks:
```ts
/**
 * Halo tasks repo (Phase 3 — owner of K.tasks(workspaceId)).
 *
 * CRUD over the `halo:v1:tasks:{workspaceId}` localStorage array. Every read
 * goes through `readWithSchema` so a corrupt or tampered value falls through
 * to `[]` rather than crashing the app (FND-04). No direct localStorage calls
 * — the storage codec is the only sanctioned accessor.
 *
 * Contract notes:
 *   - Phase 3 only CALLS `listTasks` (for the Dashboard). The other methods
 *     are stubbed/exported now so Phase 4 doesn't have to extend the repo
 *     signature.
 *   - `createTask` accepts a `partial` (no id/createdAt/updatedAt) and the
 *     repo fills `id` (nanoid), `createdAt`, `updatedAt = createdAt`.
 *   - Non-atomic read-modify-write — same WR-04 caveat as authRepo. Two
 *     concurrent tabs can drop a task; acceptable for a demo surface.
 */
```

**Imports pattern** (lines 31–35):
```ts
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { TasksArraySchema } from './schemas'
import type { Task } from './types'
```

**Read-helper pattern** (auth/authRepo.ts lines 74–104) — copy verbatim shape:
```ts
/** Return all persisted tasks for `workspaceId`. Falls through to `[]` on corrupt / schema-invalid storage. */
export function listTasks(workspaceId: string): Task[] {
  return readWithSchema(K.tasks(workspaceId), TasksArraySchema, [] as Task[])
}

/** Strict-equality lookup by task id. Returns `undefined` if no match. */
export function getTaskById(workspaceId: string, id: string): Task | undefined {
  return listTasks(workspaceId).find((t) => t.id === id)
}
```

**Write-helper pattern** (auth/authRepo.ts lines 119–158 — `createVisitor` is the closest analog):
```ts
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

export function createTask(workspaceId: string, input: CreateTaskInput): Task {
  const now = new Date().toISOString()
  const task: Task = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    ...input,
  }
  const existing = listTasks(workspaceId)
  writeJSON(K.tasks(workspaceId), [...existing, task])
  return task
}

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

export function deleteTask(workspaceId: string, id: string): boolean {
  const existing = listTasks(workspaceId)
  const next = existing.filter((t) => t.id !== id)
  if (next.length === existing.length) return false
  writeJSON(K.tasks(workspaceId), next)
  return true
}
```

**Key contract enforced by analog:** Every read goes through `readWithSchema(K.x(), XArraySchema, [])`. NO direct `localStorage.getItem` calls anywhere in this module. The pattern is enforced by `src/auth/authRepo.ts` lines 75–82 and is the FND-04 contract.

---

### `src/tasks/tasksSeed.ts` (bootstrap-utility, idempotent seed gated by meta.seededAt)

**No exact analog exists — this is the FIRST writer of `meta.seededAt`.** Compose from two sources:

**Source 1 — idempotent-gate pattern** from `/Users/colin.maxfield/testspace/test-sites/halo-app/src/storage/migrations.ts` lines 52–93:
```ts
/**
 * Execution path:
 *  1. First boot (no meta key): writes DEFAULT_META and returns.
 *  2. Current boot with matching version and appVersion: no-op (fast return).
 */
export function runMigrations(): void {
  const rawMeta = peekRaw(K.meta())
  if (rawMeta === null) {
    writeJSON(K.meta(), DEFAULT_META)
    return
  }

  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  // ... idempotency check on meta.schemaVersion
}
```

**Source 2 — module-init invocation pattern** from `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/authStore.ts` lines 149–173:
```ts
/**
 * Module-init hydration. Reads `halo:v1:session` through `readWithSchema`
 * (so a tampered or schema-invalid value falls through to `null`)...
 *
 * Runs ONCE at module load — see the bare call at the bottom of this file.
 * Not wrapped in a React effect hook because we need the store populated
 * BEFORE React first renders.
 */
export function hydrateAuthFromStorage(): void {
  const session = readWithSchema<Session | null>(K.session(), SessionSchema, null)
  if (session === null) return
  // ...
}

// Run once at module-init level — strictly NOT inside any function/component body.
hydrateAuthFromStorage()
```

**Composed pattern for `tasksSeed.ts`:**
```ts
/**
 * Halo tasks seeder (Phase 3 — first writer of meta.seededAt per FND-05).
 *
 * Generates ~40-60 faker tasks for the supplied workspace, gated on the
 * `meta.seededAt` flag so subsequent reloads never clobber user mutations
 * from Phase 4's LIST CRUD.
 *
 * Idempotency contract:
 *   - Read meta via readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
 *   - If meta.seededAt !== null: skip seeding entirely.
 *   - Else if listTasks(workspaceId).length > 0: skip (defensive; should
 *     not happen if seededAt is correctly null).
 *   - Else: generate tasks, writeJSON(K.tasks(workspaceId), tasks),
 *     stamp meta.seededAt = new Date().toISOString().
 *
 * Caller: src/routes/app/AppLayout.tsx — invokes seedIfNeeded(workspaceId)
 * once on first authenticated mount per workspace. Module-init invocation
 * is NOT used here (unlike authStore.hydrate) because seeding requires a
 * known workspaceId, which is only available post-sign-in.
 */
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON, MetaSchema } from '../storage'
import { TasksArraySchema } from './schemas'
import type { Task } from './types'

export function seedIfNeeded(workspaceId: string): void {
  const meta = readWithSchema(K.meta(), MetaSchema, {
    schemaVersion: 1,
    seededAt: null,
    appVersion: '0.1.0',
  })
  if (meta.seededAt !== null) return

  const existing = readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])
  if (existing.length > 0) return // defensive

  const tasks = generateTasks(/* 40-60 */)
  writeJSON(K.tasks(workspaceId), tasks)
  writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })
}
```

**Faker distribution rules (D-05):** spread `createdAt` across last 90 days from `new Date()`; ~55% of tasks `status='done'` with `completedAt >= createdAt`; ~80% have `dueDate` with ~15% in the past (drives Overdue KPI).

**Discretionary item (per CONTEXT.md `Claude's Discretion`):** Whether to call `faker.seed(N)` for deterministic demos is a planner-discretion call. Either is acceptable.

---

### `src/tasks/labels.ts` (display-mapper, pure const map)

**Analog:** No direct analog. This is a new shape — a display-label map. Use the simplest possible idiom (record literal `as const`):
```ts
/**
 * Halo task display labels (Phase 3).
 *
 * UI-layer mapping ONLY — do NOT add these to the Zod schemas. The schemas
 * own the wire/storage shape (snake_case for status, no labels); this module
 * owns the screen shape. Dashboard chart legends (Phase 3) and Phase 4
 * filter chips share this single source of truth.
 */
import type { TaskStatus, TaskPriority } from './types'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
```

**Why `Record<TaskStatus, string>` and not a plain object literal:** Forces exhaustiveness — if a future phase adds a status to `TaskStatusEnum`, TypeScript flags the missing label here at compile time. This is the same "Zod-as-source-of-truth" discipline that `src/auth/types.ts` enforces via `z.infer`.

---

### `src/tasks/index.ts` (barrel, re-export only)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/index.ts` (lines 1–51)

**Pattern excerpt** (lines 1–17 of auth/index.ts):
```ts
/**
 * Halo auth barrel.
 *
 * Single import target for the entire Phase 2 auth surface — provider, hook,
 * Zustand store, route guards, repo functions, password hashing,
 * sessionStorage wizard-draft helpers, Zod schemas, and types.
 *
 * Convention: named re-exports for the curated surface; `export *` for
 * schemas / types / authRepo where the file IS the surface (every symbol
 * is intended to be public).
 */
```

**Re-export pattern** (lines 32–50 of auth/index.ts):
```ts
// Data layer — every symbol in authRepo is part of the public surface
export * from './authRepo'

// Schemas + types — IS the surface for these files
export * from './schemas'
export * from './types'
```

**Composed for `src/tasks/index.ts`:**
```ts
/**
 * Halo tasks barrel.
 *
 * Single import target for the Phase 3 tasks surface — schemas, types,
 * the repo (Phase 3 readers, Phase 4 writers), the seeder, and the
 * display-label map.
 *
 * Convention: `export *` for schemas / types / repo / labels where the
 * file IS the surface; named re-exports for the seeder which has a single
 * intended entry point.
 */
export * from './schemas'
export * from './types'
export * from './tasksRepo'
export * from './labels'
export { seedIfNeeded } from './tasksSeed'
```

---

### `src/dashboard/Dashboard.tsx` (page-component, request-response)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/public/SignInPage.tsx` (closest single-page-with-business-logic) PLUS `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/public/signup/Step1AccountPage.tsx` (form/hook patterns).

**Imports pattern from SignInPage.tsx** (lines 40–48):
```ts
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Container, Stack, Paper, Title, Text } from '@mantine/core'
import { Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { useAuthStore } from '../auth'
```

**Page-component shell pattern** (SignInPage.tsx lines 50–84):
```ts
export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id)
  // Phase 3 D-26: AppShell only renders for authenticated users; workspaceId is non-null in practice.
  if (!workspaceId) return <></>

  const [range, setRange] = useState<'7' | '30' | '90'>('30')

  const tasks = useMemo(() => listTasks(workspaceId), [workspaceId])
  const nowRef = useMemo(() => computeNowRef(tasks), [tasks])

  if (tasks.length === 0) {
    return <EmptyState onCta={() => navigate('/app/lists')} />
  }

  return (
    <Stack gap="xl">{/* SegmentedControl / KPIs / charts / Timeline */}</Stack>
  )
}
```

**Selector-from-store pattern** (SignInPage.tsx lines 69–71):
```ts
const result = await useAuthStore.getState().signInWithCredentials(values.email, values.password)
```
…vs reactive subscription (RequireAuth.tsx line 42):
```ts
const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
```
For the Dashboard, READ the workspaceId reactively (line 42 pattern); DO NOT use `.getState()` for it.

**Pendo-ID-on-wrapper-element pattern** (from CLAUDE.md and existing Step1AccountPage.tsx line 158–164):
```tsx
<Paper withBorder p="md" radius="md" data-pendo-id={PENDO_IDS.dashboard.kpi.active}>
  <Text size="sm" c="dimmed" tt="uppercase" mb="sm">Active tasks</Text>
  <Title order={2}>{kpis.active}</Title>
</Paper>
```
**Key rule:** `data-pendo-id` lands on the OUTER `<Paper>` for charts (per CLAUDE.md chart-wrapper rule line 185 of CONTEXT.md). Never on Recharts SVG `<rect>` / `<path>` elements.

**Wrapped-primitive vs raw-Mantine usage** (Step1AccountPage.tsx lines 32, 99–164):
- Imports from `'../../../ui/primitives'`: `TextInput`, `PasswordInput`, `Button`, `Anchor`
- Imports from `'@mantine/core'` directly: layout-only components (`Stack`, `Group`, `Title`, `Text`, `Paper`, `Container`)

For Dashboard: `<Button pendoId={...}>` for the CTA, `<Stack>` / `<SimpleGrid>` / `<Paper>` / `<Text>` / `<Title>` direct from Mantine, `<SegmentedControl>` direct from Mantine (it carries `data-pendo-id` as a regular DOM attribute since SegmentedControl is not yet a wrapped primitive — UI-SPEC explicitly allows this for the segments). The wrappers exist only for interactive primitives that submit, navigate, or capture input.

---

### `src/dashboard/relative-time.ts` (utility, pure function)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/passwordHash.ts` (single-purpose pure utility module)

**File-header pattern** (passwordHash.ts lines 1–15):
```ts
/**
 * Halo relative-time formatting (Phase 3 dashboard activity feed).
 *
 * Produces strings like "2h ago", "Yesterday", "3d ago" from an ISO-8601 input
 * relative to a `nowRef` ISO-8601 input. Pure function, no dayjs dependency —
 * dayjs is in the recommended stack but not yet installed (CLAUDE.md
 * Recommended Stack section), and the activity feed only needs 4 cases.
 *
 * Buckets (matches Phase 3 UI-SPEC §"Activity feed layout"):
 *   - < 1 minute → "Just now"
 *   - < 1 hour → "{N}m ago"
 *   - < 24 hours → "{N}h ago"
 *   - < 48 hours → "Yesterday"
 *   - else → "{N}d ago"
 */
```

**Function signature pattern** (passwordHash.ts lines 29–35):
```ts
export function formatRelative(isoTimestamp: string, nowRefIso: string): string {
  // pure computation; never throws on malformed input — falls through to "—"
}
```

---

### `src/ui/ComingSoonCard.tsx` (shared-component, display only)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/ui/DemoBanner.tsx`

**File-header pattern** (DemoBanner.tsx lines 1–14):
```ts
/**
 * ComingSoonCard — shared placeholder card used by the five Phase 3 placeholder
 * routes (Lists, Reports, Team, Settings, Help). Phase 4/5 replace the body of
 * each route file without touching router.tsx (D-01).
 *
 * The wrapping Paper carries `data-pendo-id={PENDO_IDS.comingSoon.card}` — a
 * single ID covers all five surfaces (D-24) so guide targeting can find any
 * placeholder generically. The icon (per-route) is dimmed gray to keep
 * placeholders visually subordinate to real surfaces.
 */
```

**Component body pattern** (composed from DemoBanner.tsx + UI-SPEC §"ComingSoonCard layout"):
```tsx
import React from 'react'
import { Center, Paper, Stack, Title, Text } from '@mantine/core'
import { PENDO_IDS } from '../pendo/PENDO_IDS'

export type ComingSoonCardProps = {
  featureName: string
  phase: number
  icon: React.ReactNode
  description: string
}

export function ComingSoonCard({
  featureName,
  phase,
  icon,
  description,
}: ComingSoonCardProps): React.JSX.Element {
  return (
    <Center mih={400}>
      <Paper withBorder p="xl" radius="md" data-pendo-id={PENDO_IDS.comingSoon.card}>
        <Stack align="center" gap="md">
          {icon}
          <Title order={3}>{featureName} is coming in Phase {phase}</Title>
          <Text c="dimmed" ta="center" maw={360}>{description}</Text>
        </Stack>
      </Paper>
    </Center>
  )
}
```

**No `pendoId` prop on the wrapper component itself** — `ComingSoonCard` is a shared display component, not an interactive primitive. The `data-pendo-id` is BAKED IN inside the component (sourced from PENDO_IDS, not hand-typed) because all five callsites share the same target ID. Same pattern as DemoBanner.tsx (which has NO `data-pendo-id` at all — line 12 comment: "This component intentionally does NOT carry a data-pendo-id attribute").

---

### `src/ui/primitives/NavLink.tsx` (primitive-wrapper, pendoId forwarding)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/ui/primitives/Button.tsx` (and 5 sibling wrappers)

**Closest exact template — `Select.tsx`** (the simplest no-extra-prop wrapper, lines 1–20):
```ts
import { Select as MantineSelect, type SelectProps as MantineSelectProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo Select — wraps Mantine's Select and forwards the typed `pendoId` prop
 * as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 */
export type SelectProps = MantineSelectProps & {
  pendoId: PendoId
}

export function Select({ pendoId, ...rest }: SelectProps) {
  return <MantineSelect data-pendo-id={pendoId} {...rest} />
}
```

**Composed for `NavLink.tsx`:**
```ts
import {
  NavLink as MantineNavLink,
  type NavLinkProps as MantineNavLinkProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo NavLink — wraps Mantine's NavLink and forwards the typed `pendoId` prop
 * as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 *
 * Phase 3 caller: src/routes/app/AppLayout.tsx renders six instances inside
 * <AppShell.Navbar> with active-state derived from useLocation().pathname.
 */
export type NavLinkProps = MantineNavLinkProps & {
  pendoId: PendoId
}

export function NavLink({ pendoId, ...rest }: NavLinkProps) {
  return <MantineNavLink data-pendo-id={pendoId} {...rest} />
}
```

**Then update `src/ui/primitives/index.ts` barrel** (lines 1–32 of existing index.ts), appending:
```ts
export { NavLink } from './NavLink'
export type { NavLinkProps } from './NavLink'
```

**MenuTrigger.tsx (optional per D-15):** If the planner chooses the wrapper route, follow the same template substituting `UnstyledButton`. UI-SPEC explicitly allows forwarding `data-pendo-id` via `<Menu.Target>` props as an alternative — either is acceptable.

---

### `src/routes/app/AppLayout.tsx` (modified — body replaced with Mantine AppShell)

**Analog:** Two analogs cited per role split:

**For the Outlet-host shell** — `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/public/PublicLayout.tsx` (lines 19–28):
```tsx
export function PublicLayout(): React.JSX.Element {
  return (
    <>
      <DemoBanner />
      <Container size="lg" py="md">
        <Outlet />
      </Container>
    </>
  )
}
```

**For the active-state-from-pathname pattern** — `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/public/signup/SignupShell.tsx` (lines 57–67):
```ts
function pathToStepIndex(pathname: string): number {
  // WR-06: strict equality (with optional trailing-slash variant), NOT startsWith.
  if (pathname === '/signup' || pathname === '/signup/') return 0
  if (pathname === '/signup/details' || pathname === '/signup/details/') return 1
  if (pathname === '/signup/company' || pathname === '/signup/company/') return 2
  if (pathname === '/signup/preferences' || pathname === '/signup/preferences/') return 3
  return 0
}

export function SignupShell(): React.JSX.Element {
  const { pathname } = useLocation()
  const active = pathToStepIndex(pathname)
  // ...
}
```

**KEY DEVIATION from analog (per D-12):** Phase 3's NavLink uses `startsWith` (not strict equality) for nested routes (`pathname.startsWith('/app/lists')` etc.) BECAUSE Phase 4 may add `/app/lists/:id` detail routes that should keep "Lists" highlighted. The Dashboard case (`/app`) IS strict-equality (since `/app/lists` would otherwise also activate `/app`). This is the precise inverse of WR-06 from SignupShell — be explicit about the rationale in a code comment.

**Composed pattern excerpt for AppLayout.tsx body** (from UI-SPEC §"AppShell structure" + the imports of `PublicLayout` + `SignupShell`):
```tsx
import React from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router'
import {
  AppShell,
  Group,
  Stack,
  Box,
  Title,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
} from '@mantine/core'
import {
  IconLayoutDashboard, IconChecklist, IconChartBar, IconUsers,
  IconSettings, IconHelpCircle, IconChevronDown, IconUser, IconLogout,
} from '@tabler/icons-react'
import { NavLink } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { useAuthStore } from '../../auth'
import { seedIfNeeded } from '../../tasks'
import { useEffect } from 'react'

export function AppLayout(): React.JSX.Element {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const visitor = useAuthStore((s) => s.currentVisitor)
  const workspace = useAuthStore((s) => s.currentWorkspace)

  // Seed tasks once per workspace on first authenticated mount (FND-05).
  useEffect(() => {
    if (workspace) seedIfNeeded(workspace.id)
  }, [workspace?.id])

  // RequireAuth has already enforced this; narrow for TS.
  if (!visitor || !workspace) return <Navigate to="/signin" replace />

  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} header={{ height: 56 }} padding="md">
      <AppShell.Header>{/* ... topbar layout per UI-SPEC */}</AppShell.Header>
      <AppShell.Navbar p="md">{/* ... 6 NavLinks per UI-SPEC */}</AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
```

**`useEffect` for seedIfNeeded is acceptable here** (not module-init) because the workspace id isn't known until React render time. This is the deliberate exception called out in `tasksSeed.ts` analog notes above.

---

### `src/routes/app/{lists,reports,team,settings,help}/{Name}Page.tsx` (placeholder routes)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/app/AppPlaceholder.tsx` (the file Phase 3 is deleting — use as a structural template only)

**Existing pattern** (AppPlaceholder.tsx lines 1–22):
```tsx
import React from 'react'
import { Stack, Text, Title } from '@mantine/core'

/**
 * Phase 1 placeholder content for the /app index route.
 */
export function AppPlaceholder(): React.JSX.Element {
  return (
    <Stack gap="md" pt="md">
      <Title order={2}>Authenticated area (Phase 3 placeholder)</Title>
      <Text c="dimmed">
        Phase 3 will build out the Dashboard with charts, task lists, and KPI cards.
      </Text>
    </Stack>
  )
}
```

**Composed pattern for `src/routes/app/lists/ListsPage.tsx`** (all five files share this exact shape with only `featureName` / `phase` / `icon` / `description` differing):
```tsx
import React from 'react'
import { IconChecklist } from '@tabler/icons-react'
import { ComingSoonCard } from '../../../ui/ComingSoonCard'

/**
 * Phase 3 placeholder for /app/lists.
 *
 * Phase 4 (LIST-01..09) replaces the body of THIS file with the real task
 * list UI. router.tsx is NOT edited at that boundary — the page contract is
 * stable across the Phase 3 → Phase 4 handoff (D-01).
 */
export function ListsPage(): React.JSX.Element {
  return (
    <ComingSoonCard
      featureName="Lists"
      phase={4}
      icon={<IconChecklist size={48} color="var(--mantine-color-gray-4)" />}
      description="Create and manage tasks for your workspace."
    />
  )
}
```

**Per-route variation (from UI-SPEC §"Per-route icon and description"):**

| File | featureName | phase | icon | description |
|------|-------------|-------|------|-------------|
| `lists/ListsPage.tsx` | `Lists` | `4` | `IconChecklist` | `Create and manage tasks for your workspace.` |
| `reports/ReportsPage.tsx` | `Reports` | `4` | `IconChartBar` | `Filter task data and export reports.` |
| `team/TeamPage.tsx` | `Team` | `5` | `IconUsers` | `Invite teammates and manage roles.` |
| `settings/SettingsPage.tsx` | `Settings` | `4` | `IconSettings` | `Update your profile, workspace, and preferences.` |
| `help/HelpPage.tsx` | `Help` | `5` | `IconHelpCircle` | `Search articles and find answers.` |

---

### `src/router.tsx` (modified — append 5 new entries + replace index)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/router.tsx` itself — Phase 2's `/signup` block is the exact pattern Phase 3 needs.

**Phase 2's `/signup` children pattern** (router.tsx lines 70–78):
```ts
{
  path: 'signup',
  Component: SignupShell,
  children: [
    { index: true, Component: Step1AccountPage },
    { path: 'details', Component: Step2DetailsPage },
    { path: 'company', Component: Step3CompanyPage },
    { path: 'preferences', Component: Step4PreferencesPage },
  ],
},
```

**Phase 3 edits to the `/app` block** (existing lines 92–105 of router.tsx):
```ts
// BEFORE (Phase 1/2 lock)
children: [
  {
    Component: AppLayout,
    children: [
      { index: true, Component: AppPlaceholder },
    ],
  },
],

// AFTER (Phase 3)
children: [
  {
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'lists',    Component: ListsPage },
      { path: 'reports',  Component: ReportsPage },
      { path: 'team',     Component: TeamPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'help',     Component: HelpPage },
    ],
  },
],
```

**Import block edits** (router.tsx lines 39–40):
```ts
// REMOVE: import { AppPlaceholder } from './routes/app/AppPlaceholder'
// ADD:
import { Dashboard } from './dashboard/Dashboard'
import { ListsPage } from './routes/app/lists/ListsPage'
import { ReportsPage } from './routes/app/reports/ReportsPage'
import { TeamPage } from './routes/app/team/TeamPage'
import { SettingsPage } from './routes/app/settings/SettingsPage'
import { HelpPage } from './routes/app/help/HelpPage'
```

---

### `src/pendo/PENDO_IDS.ts` (modified — append 4 namespaces, retire 1 leaf)

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/pendo/PENDO_IDS.ts` itself — Phase 2 added the `signup` + `signin` namespaces using the exact additive pattern Phase 3 needs.

**Header comment already pre-declares Phase 3's namespaces** (lines 14–18):
```
* Namespace growth plan:
*   Phase 1: `layout`, `sandbox`
*   Phase 2 (landed): `signup`, `signin`
*   Phase 3: `nav`, `topbar`, `dashboard`
*   Phase 4: `lists`, `settings`, `reports`
*   Phase 5: `team`, `help`
```

**Existing `signup` namespace excerpt** (lines 48–98) — copy this exact shape:
- Top-level key is camelCase (`signup`)
- Sub-keys are camelCase (`step1`, `step2`, etc.)
- Leaf string values are kebab-case (`'signup.step1.email'`)
- Nested object literal `as const` (the `as const` is on the OUTER `PENDO_IDS` object at line 110, not per-namespace)

**Phase 3 additions** (full text per CONTEXT.md D-24, UI-SPEC §"PENDO_IDS Additions"):
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

**Retire `layout.appPlaceholder`** — delete this leaf from the existing `layout` namespace (line 33): `appPlaceholder: 'layout.app.placeholder',`. The `Leaves<typeof PENDO_IDS>` derivation at line 117 picks up the change automatically; any remaining references to `PENDO_IDS.layout.appPlaceholder` in the codebase will fail TypeScript compile (verify with `npm run typecheck`).

---

### `src/storage/keys.ts` (modified — add K.tasks(workspaceId))

**Analog:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/storage/keys.ts` itself.

**Existing scoped-key precedent** (lines 19–25 header note):
```
* Keys are functions (even zero-argument ones) so the API stays uniform when
* scoped keys like `tasks(accountId)` are added in Phase 4.
```
**The file pre-declares this exact pattern for Phase 3's exact use case.** (CONTEXT.md D-08 picks workspaceId over accountId — same shape, different parameter name.)

**Existing key builder pattern** (lines 35–53):
```ts
export const K = {
  meta: (): string => `halo:v${SCHEMA_VERSION}:meta`,
  pendoAnonId: (): string => `halo:v${SCHEMA_VERSION}:pendo:anonId`,
  visitors: (): string => `halo:v${SCHEMA_VERSION}:visitors`,
  workspaces: (): string => `halo:v${SCHEMA_VERSION}:workspaces`,
  session: (): string => `halo:v${SCHEMA_VERSION}:session`,
  signupDraft: (): string => `halo:v${SCHEMA_VERSION}:signup:draft`,
} as const
```

**Phase 3 addition** (one line, anywhere inside the `K` object — keep them grouped logically; suggest after `workspaces`):
```ts
/** `halo:v1:tasks:{workspaceId}` — per-workspace task array (Phase 3 seeder + Phase 4 CRUD). */
tasks: (workspaceId: string): string => `halo:v${SCHEMA_VERSION}:tasks:${workspaceId}`,
```

**SCHEMA_VERSION stays at 1 (per D-27)** — this is a non-breaking addition. Do NOT bump the version.

---

## Shared Patterns

### Pattern S1: PENDO_IDS-only `data-pendo-id` sourcing (PEN-07)

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/docs/CONVENTIONS.md` §1 + `/Users/colin.maxfield/testspace/test-sites/halo-app/src/pendo/PENDO_IDS.ts`
**Apply to:** EVERY Phase 3 file that ships a `data-pendo-id` attribute.

```tsx
// Correct — type-safe, refactor-safe
<NavLink pendoId={PENDO_IDS.nav.dashboard} ... />
<div data-pendo-id={PENDO_IDS.dashboard.chart.completedPerDay}>...</div>

// WRONG — hand-typed string, fails the PendoId type at compile time
<NavLink pendoId="nav.dashboard" ... />
<div data-pendo-id="dashboard.chart.completed-per-day">...</div>
```

The `PendoId` type (PENDO_IDS.ts line 117) is `Leaves<typeof PENDO_IDS>` — a literal union of every value in the registry. Hand-typed strings fail `pendoId: PendoId`. For raw `data-pendo-id` on Mantine layout components (e.g., the `<Paper>` wrapping a Recharts chart), the discipline still holds: source the value from `PENDO_IDS.dashboard.chart.byStatus`, never inline the kebab-case string.

---

### Pattern S2: Module-init synchronous hydration (FND-07 + AUTH-10)

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/authStore.ts` lines 149–173
**Apply to:** Decision point for `seedIfNeeded` invocation (planner choice).

```ts
// Module-init pattern — runs once when the module is imported, BEFORE React mounts.
export function hydrateAuthFromStorage(): void { /* ... */ }

// Run once at module-init level — strictly NOT inside any function/component body.
hydrateAuthFromStorage()
```

**Why this matters for Phase 3:** The seeder CANNOT run at module-init because the workspaceId is unknown until sign-in. Therefore the seeder uses a `useEffect` inside `AppLayout` keyed on `workspace?.id`. This is the deliberate exception — call it out in a code comment so a future contributor doesn't try to "fix" the seeder to match the authStore pattern.

---

### Pattern S3: Wrapped primitives vs raw Mantine

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/ui/primitives/index.ts` + actual usage in `Step1AccountPage.tsx` line 32
**Apply to:** Every Phase 3 component that uses Mantine components.

**Always wrap (interactive, captures input/navigation):**
- `Button` (existing) — used for the empty-state CTA
- `TextInput`, `PasswordInput`, `Select`, `MultiSelect`, `NumberInput` (existing) — none used in Phase 3
- `Anchor` (existing) — used inside menu items if needed
- `NavLink` (Phase 3 new) — used in side nav

**Use Mantine directly (display, layout, non-interactive):**
- `Stack`, `Group`, `SimpleGrid`, `Box`, `Center` (layout)
- `Title`, `Text` (typography)
- `Paper` (surface)
- `AppShell`, `AppShell.Header`, `AppShell.Navbar`, `AppShell.Main` (Phase 3 root chrome)
- `Avatar`, `Timeline`, `Timeline.Item` (display affordances; can carry `data-pendo-id` as a regular attribute)
- `SegmentedControl`, `Menu`, `Menu.Target`, `Menu.Dropdown`, `Menu.Item`, `Menu.Divider`, `UnstyledButton` (UI-SPEC explicitly allows these to be used directly with `data-pendo-id` forwarded as a regular DOM attribute; the wrapper-pendoId-prop pattern is reserved for primitives that submit/navigate)

---

### Pattern S4: Per-key feature-module ownership (FND-04)

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/authRepo.ts` + `wizardSession.ts`
**Apply to:** `src/tasks/tasksRepo.ts` is the ONLY file in Phase 3 allowed to touch `K.tasks(workspaceId)`. `src/tasks/tasksSeed.ts` exception: it ALSO touches `K.tasks(workspaceId)` because that is the seed write path; document this in a header comment as the deliberate co-owner.

**Excerpt from authRepo.ts** (line 7):
```
* No direct localStorage calls — the storage codec is the only sanctioned accessor (FND-04).
```

The Dashboard reads tasks via `listTasks(workspaceId)` (which routes through `readWithSchema`), NOT via `localStorage.getItem` and NOT via `readWithSchema` directly. Same for any Phase 4 mutation — go through `tasksRepo`, never the codec from a UI file.

---

### Pattern S5: `readWithSchema(key, Schema, fallback)` for every persistent read (FND-04)

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/storage/codec.ts` lines 26–36
**Apply to:** `tasksRepo.listTasks` and `tasksSeed.seedIfNeeded`.

```ts
export function readWithSchema<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}
```

**Three failure modes all return `fallback`** (key absent, JSON parse fail, Zod validation fail). Never throws. The fallback for `K.tasks(workspaceId)` is `[] as Task[]`, matching how `authRepo.listVisitors` uses `[] as Visitor[]` (line 76).

---

### Pattern S6: Recharts SVG-only chart instrumentation (PEN-08)

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/CLAUDE.md` + `/Users/colin.maxfield/testspace/test-sites/halo-app/docs/CONVENTIONS.md` §2
**Apply to:** `src/dashboard/Dashboard.tsx` only.

**CLAUDE.md verbatim quote (CONTEXT.md line 185):**
> "For chart elements (where Recharts renders SVG `<rect>` / `<path>` per data point), wrap charts in a container `<div data-pendo-id="dashboard.charts.velocity">` and rely on stable axis labels for sub-targeting. Don't try to target individual chart bars — they're recomputed on every render."

**Implementation contract for Phase 3:**
- `data-pendo-id` lands on the OUTER `<Paper>` per chart (`dashboard.chart.completedPerDay`, `dashboard.chart.byStatus`)
- NEVER on Recharts `<Cell>` / `<rect>` / `<path>` / `<Pie>` / `<Bar>` elements
- For Timeline.Item: per-item parameterized — `data-pendo-id={PENDO_IDS.dashboard.activity.item}` (static) + `data-pendo-task-id={task.id}` (dynamic). Same precedent as CLAUDE.md "lists.row.complete" + `data-pendo-item-id`.

**Approved canvas-free chart libs (CONVENTIONS.md §2):**
- Recharts (Phase 3 default — install at `^2.x`)
- Forbidden: Chart.js, Highcharts, raw `<canvas>`, ECharts in non-SVG mode

---

### Pattern S7: Schemas-first, types-via-z.infer

**Source:** `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/types.ts` lines 1–14 header
**Apply to:** `src/tasks/schemas.ts` + `src/tasks/types.ts` pairing.

> "Every type in this file is derived from a Zod schema in `./schemas` via `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel type declarations here. If a field shape changes, edit the schema; the type follows automatically."

The rule is enforceable by code review: any file in `src/tasks/types.ts` that declares a `type` or `interface` whose name matches a schema (`Task`, `Assignee`) without `z.infer` is wrong.

---

## No Analog Found

| File | Role | Data Flow | Why no exact analog |
|------|------|-----------|---------------------|
| `src/tasks/tasksSeed.ts` | bootstrap-utility | one-shot write gated by meta.seededAt | **First writer of `meta.seededAt`.** Phase 3 owns the FND-05 contract opening. Pattern is COMPOSED from `runMigrations` (idempotent gate) + `hydrateAuthFromStorage` (module-init style — but adapted to `useEffect` in AppLayout because workspaceId is render-time). |
| `src/tasks/labels.ts` | display-mapper | pure const map | **No prior display-label file exists** — Phase 2 inlined `RoleEnum.options` directly into `Step2DetailsPage.tsx` Select data. Phase 3 introduces the cleaner pattern (typed `Record<TaskStatus, string>`) because Phase 4 will share these labels across multiple surfaces. Planner: treat `labels.ts` as a Phase-3-original. |
| `src/dashboard/Dashboard.tsx` | page-component | chart-bearing dashboard | **No chart-rendering page exists yet.** Closest structural analog is `SignInPage.tsx` (single-page component reading store + rendering Mantine layout). Chart rendering itself is governed by Recharts docs (https://recharts.org) + the SVG-mandate from CLAUDE.md. Planner: lean on UI-SPEC §"Area chart layout" / §"Donut chart layout" / §"Activity feed layout" / §"Empty state layout" verbatim — these are precise enough to implement. |
| `src/dashboard/relative-time.ts` | utility | pure function | **No prior date-formatting helper exists.** `passwordHash.ts` is the closest pure-utility template. Halo intentionally has no dayjs / date-fns dependency yet (CLAUDE.md "Recommended Stack" lists it as MEDIUM confidence; Phase 3 chooses not to add it). Hand-roll 4 buckets per UI-SPEC §"Activity feed layout". |

---

## Metadata

**Analog search scope:**
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/auth/*` (schemas, types, repo, store, provider, guards, session helpers)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/storage/*` (keys, codec, migrations, schemas, provider)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/ui/primitives/*` (all 7 existing primitive wrappers)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/ui/DemoBanner.tsx` (shared display component analog)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/app/*` (AppLayout placeholder, AppPlaceholder)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/routes/public/*` (PublicLayout, SignInPage, Landing, PrimitivesSandbox, signup/*)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/router.tsx` (route map)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/pendo/PENDO_IDS.ts` (registry)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/src/App.tsx`, `main.tsx`, `theme.ts` (root composition)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/docs/CONVENTIONS.md` §§1-3 (markup rules)
- `/Users/colin.maxfield/testspace/test-sites/halo-app/CLAUDE.md` (tech-stack contract)

**Files scanned:** 32 source files (read in full) + 1 conventions doc

**Pattern extraction date:** 2026-05-14

**Key observations for the planner:**
1. **The repo is unusually consistent.** Every primitive wrapper is 4–5 lines. Every schema file ends in `Schema`. Every types file uses `z.infer`. Every repo wraps `readWithSchema`. Phase 3 plans should NOT invent new shapes — every new file has a 1-to-1 template above.
2. **The PENDO_IDS file already pre-declares Phase 3's exact namespaces** (line 17: `Phase 3: nav, topbar, dashboard`). The CONTEXT.md additions (`comingSoon`) is the one not in the original plan — call it out in the PENDO_IDS comment update.
3. **The `K.tasks(accountId)` pattern is pre-declared in `keys.ts`** (line 22). This is a Phase 1 plumbing decision Phase 3 inherits exactly.
4. **The seed gate is uncharted but composable.** `runMigrations` shows the idempotency check shape; `hydrateAuthFromStorage` shows the module-init invocation. Phase 3's `seedIfNeeded` is the first synthesis of both.
5. **No prior "feature seed module" exists.** Phase 3 sets the precedent that Phase 5 DATA-01 will extend (teammates seed, activity seed, help articles seed).

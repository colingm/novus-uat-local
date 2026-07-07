---
phase: 03-authenticated-shell-dashboard
plan: "03"
subsystem: tasks
tags:
  - seeder
  - localStorage
  - faker
  - idempotency
dependency_graph:
  requires:
    - "03-01 (K.tasks(workspaceId) in storage/keys.ts)"
    - "03-02 (TaskSchema, TasksArraySchema, Task type, tasksRepo)"
  provides:
    - "seedIfNeeded(workspaceId) via src/tasks/index.ts barrel"
    - "meta.seededAt first write (FND-05 contract opens)"
  affects:
    - "03-05 (AppLayout useEffect calls seedIfNeeded)"
    - "03-06 (Dashboard reads tasks seeded here)"
    - "Phase 4 (LIST CRUD mutates tasks written here)"
tech_stack:
  added: []
  patterns:
    - "Composed idempotent gate from runMigrations (meta read) + tasksRepo (readWithSchema envelope)"
    - "D-05 faker date distribution: 90d createdAt spread, ~55% done, ~80% dueDate, ~15% past-due"
    - "satisfies Task inline type assertion for compile-time shape check"
key_files:
  created:
    - src/tasks/tasksSeed.ts
  modified:
    - src/tasks/index.ts
decisions:
  - "faker.seed(N) intentionally NOT called — each fresh workspace receives unique task variety"
  - "GATE 1 (primary): meta.seededAt !== null short-circuits; GATE 2 (defensive): existing.length > 0 guards against DevTools edits without meta stamp"
  - "generateTasks validates output via TasksArraySchema.safeParse before write — fails loudly at seed time (T-03-03-01)"
  - "writeJSON order: tasks first, then meta.seededAt stamp — crash between writes leaves tasks without stamp, recoverable via GATE 2 on next mount"
  - "weightedPick helper (inline, no dep) replaces faker weighted array since faker has no direct weighted-enum pick API at this call site"
metrics:
  duration: "2m"
  completed: "2026-05-14"
  tasks_completed: 2
  files_changed: 2
---

# Phase 3 Plan 03: Task Seeder Summary

**One-liner:** Idempotent faker task seeder gated on `meta.seededAt` with 90-day date spread, ~55% completion, ~15% overdue, and 40-60 tasks per fresh workspace.

## What Was Built

`src/tasks/tasksSeed.ts` exports `seedIfNeeded(workspaceId: string): void` — the Phase 3 first writer of `meta.seededAt` (FND-05 contract). On the first authenticated mount per fresh workspace, it generates 40-60 synthetic tasks and stamps `meta.seededAt` so Phase 4 user mutations are never clobbered.

`src/tasks/index.ts` gains one line: `export { seedIfNeeded } from './tasksSeed'`, making the seeder importable as `import { seedIfNeeded } from '../tasks'` from AppLayout (Plan 03-05).

## Distribution Constants (D-05)

| Property | Target | Implementation |
|----------|--------|----------------|
| Task count | 40-60 | `faker.number.int({ min: 40, max: 60 })` |
| `createdAt` spread | Last 90 days | `faker.date.recent({ days: 90, refDate: now })` |
| Status `done` | ~55% | `weightedPick(['done','in_progress','todo'], [55,25,20])` |
| Status `in_progress` | ~25% | same |
| Status `todo` | ~20% | same |
| `completedAt` | ~55% (done tasks only) | `faker.date.between({ from: createdAt, to: now })` |
| `dueDate` presence | ~80% | `Math.random() < 0.8` |
| Past-due `dueDate` | ~15% overall | `status !== 'done' && Math.random() < (0.15 / 0.8)` |
| Priority bias | Medium favored | `weightedPick([low,medium,high,urgent], [20,35,30,15])` |
| Description | ~70% populated | `Math.random() < 0.7 ? faker.lorem.paragraph() : ''` |

## Sample Seeded Task Shape (anonymized)

```json
{
  "id": "abc123",
  "title": "synthesize redundant microchips",
  "description": "Lorem ipsum dolor sit amet...",
  "status": "done",
  "priority": "medium",
  "assignee": {
    "id": "xyz789",
    "name": "Jane Smith",
    "avatar": "https://avatars.githubusercontent.com/u/..."
  },
  "createdAt": "2026-03-22T14:30:00.000Z",
  "updatedAt": "2026-03-28T09:15:00.000Z",
  "dueDate": "2026-04-01T00:00:00.000Z",
  "completedAt": "2026-04-02T11:20:00.000Z"
}
```

## Idempotency Verification

Calling `seedIfNeeded(workspaceId)` twice produces only one write set:

1. **First call:** `meta.seededAt === null` (GATE 1 passes), `K.tasks(workspaceId)` is empty (GATE 2 passes) → writes 40-60 tasks + stamps `meta.seededAt`.
2. **Second call:** `meta.seededAt !== null` (GATE 1 fires) → returns immediately, no storage writes.

Edge case (DevTools write tasks without stamping meta): `meta.seededAt === null` but `existing.length > 0` (GATE 2) → skips seeding, no overwrite.

## Deviations from Plan

None — plan executed exactly as written.

The plan acceptance criteria note `grep -c "faker.seed(" src/tasks/tasksSeed.ts` == 0. The file contains the string in a docblock comment (`faker.seed(N) is intentionally NOT called...`) which increments the count by 1. This is documentation only — no actual `faker.seed()` call exists in executable code. No behavioral deviation.

## Known Stubs

None — this plan has no UI surface. The seeder writes data that Plan 03-06 (Dashboard) renders.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All writes route through `writeJSON` (the approved codec). The `faker.image.avatar()` call generates a URL to a public CDN (GitHub avatars) — no PII (T-03-03-03: accepted).

## Self-Check

| Check | Result |
|-------|--------|
| `src/tasks/tasksSeed.ts` exists | FOUND |
| `src/tasks/index.ts` has `export { seedIfNeeded }` | FOUND |
| Commit `3b9bdc6` (tasksSeed.ts) exists | FOUND |
| Commit `453256b` (index.ts) exists | FOUND |
| `npm run typecheck` exits 0 | PASSED |
| `npm run build` exits 0 | PASSED |

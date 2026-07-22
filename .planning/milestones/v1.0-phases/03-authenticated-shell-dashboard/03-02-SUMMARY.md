---
phase: 03-authenticated-shell-dashboard
plan: "02"
subsystem: tasks-data-layer
tags: [tasks, schema, zod, localStorage, repository, labels]
dependency_graph:
  requires: [03-01]
  provides: [tasks-schema-contract, tasks-crud-api, tasks-display-labels]
  affects: [03-03, 03-04, 04-all]
tech_stack:
  added: []
  patterns: [zod-schema-first, z-infer-types, readWithSchema-envelope, per-key-feature-module, exhaustive-record-labels]
key_files:
  created:
    - src/tasks/schemas.ts
    - src/tasks/types.ts
    - src/tasks/labels.ts
    - src/tasks/tasksRepo.ts
    - src/tasks/index.ts
  modified: []
decisions:
  - D-06 Task field shape locked exactly as specified — id/title/description/status/priority/assignee/createdAt/updatedAt/dueDate/completedAt with Zod 4 z.iso.datetime()
  - D-07 schemas.ts mirrors src/auth/schemas.ts layout exactly — enums first, embedded schema, main schema, array schema
  - D-09 TASK_STATUS_LABELS and TASK_PRIORITY_LABELS in labels.ts as Record<TaskStatus/Priority, string> for compile-time exhaustiveness
  - D-10 tasksRepo exposes listTasks/getTaskById/createTask/updateTask/deleteTask with every read through readWithSchema (FND-04 compliant)
metrics:
  duration: 8min
  completed_date: "2026-05-14"
  tasks_completed: 2
  files_created: 5
---

# Phase 3 Plan 02: Task Data Layer Summary

**One-liner:** Schema-first Task module with Zod 4 persistence contract, five-method CRUD repo, and exhaustive display label maps — the cross-phase contract Phase 4 LIST inherits verbatim.

## What Was Built

Five files in a new `src/tasks/` directory, establishing the Task feature module as a schema-first cross-phase contract.

### TaskSchema field-by-field contract (D-06 lock for Phase 4)

| Field | Zod type | Notes |
|-------|----------|-------|
| `id` | `z.string().min(1)` | nanoid-generated at createTask time |
| `title` | `z.string().min(1)` | Required non-empty |
| `description` | `z.string()` | May be empty |
| `status` | `TaskStatusEnum` | `'todo' \| 'in_progress' \| 'done'` |
| `priority` | `TaskPriorityEnum` | `'low' \| 'medium' \| 'high' \| 'urgent'` |
| `assignee` | `AssigneeSchema` | Embedded snapshot: `{ id, name, avatar? }` |
| `createdAt` | `z.iso.datetime()` | Zod 4 idiom (NOT z.string().datetime()) |
| `updatedAt` | `z.iso.datetime()` | Set at create time; mutated on Phase 4 edits |
| `dueDate` | `z.iso.datetime().nullable()` | null = no due date |
| `completedAt` | `z.iso.datetime().nullable()` | null = not completed; set on status→'done' |

### File inventory

**`src/tasks/schemas.ts`** — Zod schemas as single source of truth. Declares `TaskStatusEnum`, `TaskPriorityEnum`, `AssigneeSchema`, `TaskSchema`, `TasksArraySchema`. Uses `z.iso.datetime()` (Zod 4) for all datetime fields.

**`src/tasks/types.ts`** — All types via `z.infer<typeof XSchema>`. Type-only imports. No hand-written parallel declarations.

**`src/tasks/labels.ts`** — UI-layer display maps. `TASK_STATUS_LABELS: Record<TaskStatus, string>` and `TASK_PRIORITY_LABELS: Record<TaskPriority, string>`. Record annotation enforces exhaustiveness at compile time.

**`src/tasks/tasksRepo.ts`** — Five-method CRUD API. Every read routes through `readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])` — zero direct `localStorage.*` calls (FND-04 compliant). Phase 3 only calls `listTasks`; Phase 4 inherits `createTask`/`updateTask`/`deleteTask` without extending the repo surface.

**`src/tasks/index.ts`** — Barrel with four `export *` lines (schemas, types, tasksRepo, labels). Seeder re-export slot reserved for Plan 03-03.

## Verification

- `npm run typecheck` exits 0
- `npm run build` exits 0
- `grep -c "localStorage\." src/tasks/tasksRepo.ts` == 0 (FND-04)
- `grep -rn "K.tasks" src/` returns matches only inside `src/tasks/` (excluding `src/storage/keys.ts` definition)
- All five files exist at `src/tasks/{schemas,types,tasksRepo,labels,index}.ts`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond those covered in the plan's threat model (T-03-02-01, T-03-02-02, T-03-02-03).

## Self-Check: PASSED

- `src/tasks/schemas.ts` FOUND
- `src/tasks/types.ts` FOUND
- `src/tasks/tasksRepo.ts` FOUND
- `src/tasks/labels.ts` FOUND
- `src/tasks/index.ts` FOUND
- Commit `7d0d1ee` FOUND (Task 1: schemas, types, labels)
- Commit `89557e7` FOUND (Task 2: tasksRepo, index)

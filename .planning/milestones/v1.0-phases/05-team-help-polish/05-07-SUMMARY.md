---
phase: 05-team-help-polish
plan: "07"
subsystem: seed-coordinator
tags: [seed, storage, backward-compat, gap-closure]
dependency_graph:
  requires: ["05-01", "05-03"]
  provides: [per-domain-seed-ledger, cold-start-legacy-reconciliation]
  affects: [src/seed/seedAll.ts, src/storage/schemas.ts, src/team/teamSeed.ts, src/tasks/tasksSeed.ts]
tech_stack:
  added: []
  patterns: [per-domain-seeding-ledger, legacy-reconciliation-at-read-side]
key_files:
  created: []
  modified:
    - src/storage/schemas.ts
    - src/seed/seedAll.ts
    - src/team/teamSeed.ts
    - src/tasks/tasksSeed.ts
decisions:
  - "Option A (per-domain seeding ledger) over Option B (v1->v2 schema migration)"
  - "DEFAULT_META typed as Meta in all three seeders to pick up optional seededDomains"
  - "D-12 intentionally revised: per-domain ledger replaces single global gate"
metrics:
  duration: ~12min
  completed: "2026-05-16"
  tasks: 3
  files: 4
---

# Phase 5 Plan 07: Per-Domain Seed Ledger Summary

**One-liner:** Per-domain `meta.seededDomains` ledger replaces single `meta.seededAt` gate, closing UAT Gaps 1+4 (cold-start missing team data) while preserving legacy task data via read-side reconciliation.

## Option A vs Option B Decision

Option A (per-domain seeding ledger) was chosen over Option B (v1→v2 schema migration nulling `meta.seededAt`).

**Rationale:** Option A preserves existing task data for legacy installs — the coordinator interprets a pre-Phase-5 `meta.seededAt` stamp (written by Phase 3's tasksSeed tail, commit 3b9bdc6) as `{ tasks: <legacy stamp> }`, leaving `teammates` absent so the next boot runs only the teammate seeder. Option B would force re-seeding tasks for every legacy install, discarding any task mutations users had made. Option A also future-proofs additional seed domains (a third domain just adds a new key to `SeededDomainsSchema`) and directly completes the D-11 architectural direction ("per-domain seeders with a single coordinator"). The legacy backward-compat is a one-time read-side mapping, not a migration entry, which keeps `migrations.ts` empty and `SCHEMA_VERSION` at 1.

## Four Reconciliation Scenarios

**Scenario 1 — Cold start, LEGACY meta (tasks seeded, no teammates key):**
- meta = `{ schemaVersion: 1, seededAt: "2026-01-01T...", appVersion: "0.1.0" }` (no seededDomains)
- Coordinator: `meta.seededDomains` is `undefined` → takes the `else if meta.seededAt !== null` branch → `effectiveDomains = { tasks: "2026-01-01T..." }`
- `effectiveDomains.teammates` is falsy → calls `seedTeammatesIfNeeded(workspaceId)` → sets `effectiveDomains.teammates = <now>`
- `effectiveDomains.tasks` is truthy → skips `seedTasksIfNeeded` (existing tasks preserved)
- Tail write: `meta.seededDomains = { tasks: "2026-01-01T...", teammates: "<now>" }` + `meta.seededAt = "2026-01-01T..."` (legacy value preserved)
- teamSeed inner GATE 1: `meta.seededDomains?.teammates` is undefined → falsy → proceeds; GATE 2: empty array → seeds Owner + 8-12 teammates. **GAP 1 + GAP 4 CLOSED.**

**Scenario 2 — Cold start, fresh install (no meta record):**
- `runMigrations` writes `DEFAULT_META` → `{ schemaVersion: 1, seededAt: null, appVersion: "0.1.0" }`
- Coordinator: `meta.seededDomains` is undefined; `meta.seededAt` is null → `effectiveDomains = {}`
- Both gates fire: `seedTeammatesIfNeeded` then `seedTasksIfNeeded` run
- teamSeed GATE 1: `meta.seededDomains?.teammates` undefined → proceeds; GATE 2: empty → seeds
- tasksSeed GATE 1a: `meta.seededDomains?.tasks` undefined; GATE 1b: `seededAt` is null → condition false; GATE 2: empty → seeds
- Tail write: `seededDomains = { tasks: "<ts>", teammates: "<ts>" }` + `seededAt = "<ts>"`

**Scenario 3 — Reset + re-seed cycle (Test 10 must continue to PASS):**
- `ResetDemoDataModal` wipes all `halo:v*` keys including `halo:v1:meta`
- Next boot: `runMigrations` writes fresh `DEFAULT_META` (no seededDomains)
- Coordinator sees fresh state → identical to Scenario 2 → both seeders run
- Team page shows Owner + teammates; Lists page shows 40-60 tasks with team assignees
- **Test 10 continues to PASS.** Reset integrity preserved.

**Scenario 4 — Already on new ledger, both domains seeded, second boot:**
- `effectiveDomains = { tasks: "<ts>", teammates: "<ts>" }` (spread from `meta.seededDomains`)
- Both gates short-circuit; no seeder called
- Tail write writes back equivalent meta (harmless idempotent no-op)

## File-Level Diff Summary

**`src/storage/schemas.ts` (lines 1–25 → 1–48):**
- Added `SeededDomainsSchema`: Zod object with optional `tasks` and `teammates` datetime keys using `.partial()`
- Added `seededDomains: SeededDomainsSchema.optional()` field to `MetaSchema` between `seededAt` and `appVersion`
- Updated MetaSchema docblock to document the new field and D-12 revision

**`src/seed/seedAll.ts` (lines 1–73 → 1–118):**
- Added `import type { Meta }` from storage barrel; typed `DEFAULT_META` as `Meta`
- Removed single-gate `if (meta.seededAt !== null) return` (the root-cause bug)
- Added `effectiveDomains` local object with three-branch legacy reconciliation
- Added two per-domain `if (!effectiveDomains.{domain})` gate blocks with seeder calls
- Added tail `writeJSON` merging `seededDomains` + preserving legacy `seededAt`
- Updated file-header docblock with Plan 07 / Gaps 1+4 / D-12 revision reference

**`src/team/teamSeed.ts` (lines 100–104 gate region):**
- Added `import type { Meta }` from storage barrel; typed `DEFAULT_META` as `Meta`
- GATE 1: replaced `if (meta.seededAt !== null) return` with `if (meta.seededDomains?.teammates) return`
- Updated file-header docblock idempotency contract and CRITICAL note with Plan 07 reference
- GATE 2 (existing.length > 0), Owner row construction, faker batch, final `writeJSON` unchanged

**`src/tasks/tasksSeed.ts` (lines 170–174 gate region):**
- Added `import type { Meta }` from storage barrel; typed `DEFAULT_META` as `Meta`
- GATE 1: replaced single `if (meta.seededAt !== null) return` with two-clause gate
  - GATE 1a: `if (meta.seededDomains?.tasks) return` (per-domain ledger)
  - GATE 1b: `if (meta.seededAt !== null && meta.seededDomains === undefined) return` (legacy compat)
- Updated file-header docblock idempotency contract with Plan 07 + legacy-compat reference
- GATE 2 (existing.length > 0), teammate read, task generation, final `writeJSON` unchanged

## D-12 Revision Note

Phase 5 D-12 specified "a single global stamp gates both seeders" — this plan deliberately revises that decision. D-12 was correct when there was only one seed domain (tasks). Phase 5 added a second domain (teammates) without updating the gate semantics, creating the cold-start regression. The per-domain ledger completes the D-11 architectural direction. Future plans referencing D-12 should read the `seedAll.ts` file-header docblock for the revised semantics. The decision is recorded there for traceability.

## Test 10 (Reset+Re-seed) Confirmation

Test 10 (UAT-09 / Settings → Reset demo data → Confirm → re-sign-in → verify Team + Lists) was NOT broken by this change. The reset wipes `halo:v*` keys including `halo:v1:meta`, so `runMigrations` writes a fresh `DEFAULT_META` on next boot. The coordinator sees no `seededDomains` and null `seededAt`, falls into the fresh-install path, and runs both seeders. Scenario 3 analysis above confirms this end-to-end. Build, typecheck, and static grep verification all pass.

## Deviations from Plan

**1. [Rule 1 - Bug] Typed DEFAULT_META as Meta in all three seeders**

- **Found during:** Tasks 2 and 3 — TypeScript errors on `meta.seededDomains` access
- **Issue:** The `DEFAULT_META` objects in `seedAll.ts`, `teamSeed.ts`, and `tasksSeed.ts` were declared as inline literals inferred without `seededDomains`. TypeScript narrowed `meta` to the literal fallback type (missing the optional field), causing TS2339 errors on `meta.seededDomains`.
- **Fix:** Added `import type { Meta }` from the storage barrel in each of the three files; annotated each `DEFAULT_META` constant as `: Meta`. The `Meta` type is derived from `z.infer<typeof MetaSchema>` and now includes `seededDomains?: { tasks?: string; teammates?: string }` after Task 1 landed.
- **Files modified:** `src/seed/seedAll.ts`, `src/team/teamSeed.ts`, `src/tasks/tasksSeed.ts`
- **Commits:** 5bf12d9 (seedAll), c02bb22 (both seeders)

This deviation was required for TypeScript correctness and does not change runtime behavior — the `DEFAULT_META` shape is identical; only the type annotation changes so TypeScript accepts `meta.seededDomains` access.

## Self-Check

- src/storage/schemas.ts: FOUND
- src/seed/seedAll.ts: FOUND
- src/team/teamSeed.ts: FOUND
- src/tasks/tasksSeed.ts: FOUND
- Task 1 commit f7739c3: FOUND
- Task 2 commit 5bf12d9: FOUND
- Task 3 commit c02bb22: FOUND

## Self-Check: PASSED

---
phase: 01-foundation-cross-cutting-contracts
plan: "03"
subsystem: storage
tags: [zod, localstorage, typescript, storage-envelope, migrations, codec]

# Dependency graph
requires:
  - phase: 01-foundation-cross-cutting-contracts
    plan: "01"
    provides: "Vite 8 + React 19 + TypeScript 6 scaffold; src/main.tsx, src/App.tsx"
  - phase: 01-foundation-cross-cutting-contracts
    plan: "02"
    provides: "Mantine 9.2.0 + haloTheme wired in src/main.tsx and src/App.tsx"
provides:
  - "zod@^4.4.3 installed"
  - "src/storage/keys.ts: SCHEMA_VERSION=1, APP_VERSION='0.1.0', K key-builder (meta, pendoAnonId)"
  - "src/storage/codec.ts: readWithSchema, writeJSON, removeKey, peekRaw — sole localStorage accessor"
  - "src/storage/schemas.ts: MetaSchema + Meta type, AnonIdSchema"
  - "src/storage/migrations.ts: runMigrations() — idempotent boot-time migration runner with empty registry"
  - "src/storage/index.ts: barrel re-export of full storage public surface"
  - "src/main.tsx: runMigrations() called synchronously before ReactDOM.createRoot().render()"
  - "src/storage/__tests__/storage.smoke.ts: 8-assertion Node smoke test; exits 0 via npx tsx"
  - "tsconfig.app.json: excludes src/**/__tests__ so Node-targeted smoke test does not break browser tsc"
affects:
  - 01-04-provider-stack (StorageProvider is a thin Context shell — migrations already run pre-React)
  - 01-05-routing (router pages can import K, readWithSchema from './storage')
  - 01-06-ui-primitives (dismissal state can be persisted via writeJSON)
  - 02-onwards (all feature code uses readWithSchema/writeJSON via barrel import)
  - 06-pendo-wiring (K.pendoAnonId() + AnonIdSchema ready for getOrCreateAnonymousVisitorId())

# Tech tracking
tech-stack:
  added:
    - "zod 4.4.3"
  patterns:
    - "Pattern FND-04: src/storage/codec.ts is the ONLY module allowed to call localStorage.* directly"
    - "Pattern FND-05: halo:v1:meta is written on first boot; runMigrations() updates it on version changes"
    - "Pattern: All localStorage keys built via K.meta(), K.pendoAnonId() etc. — no raw string literals"
    - "Pattern: readWithSchema<T>(key, schema, fallback) — never throws, always returns T"
    - "Pattern: migrations registry Record<number, fn> is empty at v1; Phase 2+ adds entries without rearchitecting"
    - "Pattern: smoke test in src/storage/__tests__/ excluded from tsconfig.app.json; run via npx tsx"

key-files:
  created:
    - src/storage/keys.ts
    - src/storage/codec.ts
    - src/storage/schemas.ts
    - src/storage/migrations.ts
    - src/storage/index.ts
    - src/storage/__tests__/storage.smoke.ts
  modified:
    - package.json
    - package-lock.json
    - src/main.tsx
    - tsconfig.app.json

key-decisions:
  - "zod@^4.4.3 installed (latest major — plan spec called for 4.x; resolved to 4.4.3)"
  - "peekRaw(key) added to codec.ts as a first-boot exemption — avoids chicken-and-egg: runMigrations needs to detect null meta before schema validation, but only codec.ts may touch localStorage"
  - "tsconfig.app.json excludes src/**/__tests__ so Node scripts (process.exit, etc.) don't fail browser tsc check"
  - "K keys use template literals with SCHEMA_VERSION constant so they track the version automatically"
  - "runMigrations() called at module init level in main.tsx (not in useEffect) — StrictMode double-mount does not affect module-level code"

patterns-established:
  - "Pattern: import { K, readWithSchema, writeJSON, MetaSchema, runMigrations } from './storage' is the canonical downstream import"
  - "Pattern: K object extended with new zero-arg or scoped functions for each new localStorage domain"
  - "Pattern: migration handler added at migrations[N] for each schema version increment"

requirements-completed:
  - FND-04
  - FND-05

# Metrics
duration: 8min
completed: "2026-05-13"
---

# Phase 01 Plan 03: Storage Envelope Summary

**Namespaced, versioned localStorage envelope with Zod 4 validation: `K` key-builders, `readWithSchema`/`writeJSON` codec, `MetaSchema`, idempotent `runMigrations()` wired pre-React in main.tsx; 8-assertion Node smoke test exits 0.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-13T20:47:02Z
- **Completed:** 2026-05-13T20:55:00Z (Tasks 1–2 complete; Task 3 human-verify in progress)
- **Tasks:** 2 of 3 complete (Task 3 is checkpoint:human-verify gate — see below)
- **Files modified:** 4 modified, 6 created

## Accomplishments

- Installed `zod@^4.4.3` — Zod 4 validation library for all localStorage reads
- Built `src/storage/` module: keys, codec, schemas, migrations, barrel — zero `localStorage.*` calls outside `codec.ts` + `peekRaw` exemption in `migrations.ts`
- Wired `runMigrations()` into `src/main.tsx` at module-init level, before `createRoot().render()` — ensures `halo:v1:meta` is written on first boot
- Created 8-assertion Node smoke test confirming: first-boot meta write, idempotency, readWithSchema round-trip, pendoAnonId round-trip, corrupt-JSON fallback, schema-rejection fallback
- Added tsconfig.app.json `exclude` for `src/**/__tests__` (Rule 3 auto-fix — see Deviations)
- `npx tsc --noEmit` and `npm run build` both exit 0

## Task Commits

1. **Task 1: Install Zod 4 and build the storage module** — `1a4e0ad` (feat)
2. **Task 2: Wire runMigrations() into main.tsx; add smoke test** — `9f993ea` (feat)
3. **Task 3: Human verification** — checkpoint:human-verify gate (developer verifies `halo:v1:meta` in browser DevTools)

## K Key Shape

| Key builder | Returns | Defined phase |
|-------------|---------|---------------|
| `K.meta()` | `'halo:v1:meta'` | Phase 1 (this plan) |
| `K.pendoAnonId()` | `'halo:v1:pendo:anonId'` | Phase 1 (this plan) — used in Phase 6 |

Phase 2+ extends the `K` object in `src/storage/keys.ts` with new domain keys (session, visitors, accounts, tasks, etc.).

## Plan 04 Integration Note

`StorageProvider` in Plan 04 is a thin Context shell. The heavy work — `runMigrations()` — has already executed synchronously before React mounts. `StorageProvider` may expose `useStorage()` returning the `K` key-builder and codec helpers, or it may be empty (`just children`). Either way, no re-architecting of the storage layer is needed.

## Phase 6 Integration Note

`K.pendoAnonId()` and `AnonIdSchema` are pre-defined so Phase 6's `getOrCreateAnonymousVisitorId()` is a 5-line function:
```ts
import { K, readWithSchema, writeJSON, AnonIdSchema } from './storage'
import { nanoid } from 'nanoid'
export function getOrCreateAnonymousVisitorId(): string {
  const existing = readWithSchema(K.pendoAnonId(), AnonIdSchema, '')
  if (existing) return existing
  const id = nanoid()
  writeJSON(K.pendoAnonId(), id)
  return id
}
```

## Files Created/Modified

- `src/storage/keys.ts` — `SCHEMA_VERSION=1`, `APP_VERSION='0.1.0'`, `K` key-builder with `meta()` and `pendoAnonId()`
- `src/storage/codec.ts` — `readWithSchema`, `writeJSON`, `removeKey`, `peekRaw`; file-level JSDoc marks it as the sole `localStorage.*` accessor
- `src/storage/schemas.ts` — `MetaSchema` + `Meta` type, `AnonIdSchema`
- `src/storage/migrations.ts` — `CURRENT_SCHEMA_VERSION`, empty `migrations` registry, `runMigrations()` with first-boot detection + idempotency
- `src/storage/index.ts` — barrel re-export of all storage public surface
- `src/storage/__tests__/storage.smoke.ts` — 8-assertion Node smoke test with in-memory localStorage polyfill
- `package.json` — added `zod@^4.4.3`
- `package-lock.json` — updated lockfile
- `src/main.tsx` — added `import { runMigrations } from './storage'` and `runMigrations()` call before `createRoot`
- `tsconfig.app.json` — added `"exclude": ["src/**/__tests__"]`

## Decisions Made

- **Zod 4.4.3 installed** — plan spec called for `^4.x`; resolved to 4.4.3 at install time
- **`peekRaw()` exported from codec.ts** — migration runner needs first-boot detection (null check) before Zod schema parse; this is a sanctioned exemption from the "only codec.ts touches localStorage" rule; the function is documented as exclusively used by migrations.ts
- **K keys use template literals** — `halo:v${SCHEMA_VERSION}:meta` rather than hardcoded `'halo:v1:meta'` so the key tracks SCHEMA_VERSION automatically on future bumps
- **`runMigrations()` at module init, not useEffect** — StrictMode double-mount only affects React component effects; module-level code runs once; runner is idempotent regardless

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded `src/**/__tests__` from tsconfig.app.json**
- **Found during:** Task 2 (smoke test creation + tsc verification)
- **Issue:** `storage.smoke.ts` uses `process.exit()` which is a Node.js API not available in the browser DOM lib; TypeScript's `tsc --noEmit -p tsconfig.app.json` emitted `TS2591: Cannot find name 'process'`
- **Fix:** Added `"exclude": ["src/**/__tests__"]` to `tsconfig.app.json`; the smoke test is a Node-targeted script, not browser code, so it should not be compiled with browser libs
- **Files modified:** `tsconfig.app.json`
- **Verification:** `npx tsc --noEmit -p tsconfig.app.json` exits 0; `npm run build` exits 0; smoke test still runs correctly via `npx tsx`
- **Committed in:** `9f993ea` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking)
**Impact on plan:** Essential for acceptance-criteria compliance. No scope creep.

## Checkpoint Status

Task 3 (`checkpoint:human-verify`) is the final gate. The developer must:
1. Run `npm run dev`
2. Open the browser URL in a fresh/Incognito tab
3. Open DevTools → Application → Local Storage → verify `halo:v1:meta` exists with `{"schemaVersion":1,"seededAt":null,"appVersion":"0.1.0"}`
4. Refresh the page — confirm value unchanged
5. Check console for zero errors

Plan is **not yet marked complete** until the developer types "approved" at the checkpoint gate.

## Threat Flags

None — Plan 03 introduces no network endpoints, auth paths, file access patterns. The only surface change is writing `halo:v1:meta` to localStorage; this is trust-boundary-internal (same origin, no cross-origin access).

## Known Stubs

None — storage envelope is wired end-to-end. The empty `migrations` registry is intentional scaffolding, not a stub.

## Self-Check: PASSED

- `src/storage/keys.ts` exists: FOUND
- `src/storage/codec.ts` exists: FOUND
- `src/storage/schemas.ts` exists: FOUND
- `src/storage/migrations.ts` exists: FOUND
- `src/storage/index.ts` exists: FOUND
- `src/storage/__tests__/storage.smoke.ts` exists: FOUND
- `src/main.tsx` imports runMigrations: FOUND
- `src/main.tsx` calls runMigrations() before createRoot: FOUND (line 12 vs line 22)
- zod@^4.4.3 in package.json: FOUND
- Commit `1a4e0ad` exists: FOUND
- Commit `9f993ea` exists: FOUND
- smoke test exits 0: VERIFIED (8/8 assertions pass)
- tsc --noEmit exits 0: VERIFIED
- npm run build exits 0: VERIFIED

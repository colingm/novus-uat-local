---
phase: 2
plan: 3
subsystem: auth
tags: [auth, password-hash, repo, localStorage, sha256, nanoid, tdd]
requires:
  - 01-03 (storage codec: K, readWithSchema, writeJSON)
  - 02-02 (VisitorSchema, WorkspaceSchema, VisitorsArraySchema, WorkspacesArraySchema, Visitor + Workspace types)
provides:
  - src/auth/passwordHash.ts (hashPassword, verifyPassword)
  - src/auth/authRepo.ts (8 CRUD functions over halo:v1:visitors + halo:v1:workspaces)
  - nanoid@^5.1.11 as runtime dependency
  - src/auth/__tests__/auth.smoke.ts (17 assertions, 22 PASS lines)
affects:
  - 02-05 (auth Zustand store will compose authRepo + verifyPassword)
  - 02-09 (signup wizard completion calls createVisitor + createWorkspace)
  - 02-10 (sign-in page calls findVisitorByEmail + verifyPassword)
tech-stack:
  added:
    - nanoid@^5.1.11
  patterns:
    - "Web Crypto SHA-256 hashing via globalThis.crypto.subtle.digest('SHA-256', TextEncoder.encode(...))"
    - "ArrayBuffer → lowercase-hex via Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')"
    - "Constant-time-ish equality: short-circuit on shape mismatch, then length-prefixed XOR accumulator across char codes"
    - "Repo CRUD over typed-array localStorage keys via readWithSchema + writeJSON only (zero direct localStorage.*)"
    - "Case-insensitive lookups via toLowerCase on both stored and query values"
key-files:
  created:
    - src/auth/passwordHash.ts
    - src/auth/authRepo.ts
    - src/auth/__tests__/auth.smoke.ts
    - src/auth/__tests__/passwordHash.smoke.ts
  modified:
    - package.json (added nanoid@^5)
    - package-lock.json (regenerated)
decisions:
  - "passwordHash uses Web Crypto API only — no bcrypt / argon2 / crypto-js. UI-SPEC locks unsalted SHA-256 (demo app)."
  - "verifyPassword tolerates malformed stored hashes by short-circuiting on /^[0-9a-f]{64}$/ — corrupt storage fails verification rather than throwing."
  - "createVisitor accepts plaintext password but the returned Visitor and stored record contain only passwordHash (TypeScript-enforced via explicit destructure + Visitor return type)."
  - "Repo does NOT enforce email/username uniqueness — that's a page-handler UX concern at 02-09 submit time, surfaced via locked UI-SPEC error copy."
  - "Repo makes ZERO direct localStorage.* calls — every persistence call routes through readWithSchema / writeJSON per FND-04."
  - "Smoke test reused the storage.smoke.ts in-memory localStorage polyfill pattern (no separate test-helper module) — keeps Node smoke tests self-contained."
metrics:
  duration: 4min
  completed: 2026-05-14
---

# Phase 2 Plan 03: auth-repo-and-sha256-password-hash Summary

Halo auth data layer — `hashPassword` / `verifyPassword` (SHA-256 via Web Crypto, lowercase-hex, constant-time-ish verify) plus an `authRepo` CRUD module that owns `halo:v1:visitors` and `halo:v1:workspaces` through the storage codec only. `nanoid@^5` installed for stable visitor + workspace IDs.

## What Shipped

### 1. `src/auth/passwordHash.ts`

Two exported functions:

| Function | Signature | Behavior |
|---|---|---|
| `hashPassword` | `(password: string) => Promise<string>` | `TextEncoder.encode(password)` → `globalThis.crypto.subtle.digest('SHA-256', ...)` → `Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')`. Returns 64-char lowercase-hex. Deterministic. |
| `verifyPassword` | `(password: string, expectedHash: string) => Promise<boolean>` | Short-circuits to `false` if `expectedHash` doesn't match `/^[0-9a-f]{64}$/`. Otherwise hashes `password` and compares with a length-prefixed XOR-accumulator loop (no early-exit on first mismatch). Never throws. |

`hashPassword('hunter2')` resolves to the canonical SHA-256 hex `f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7` (verified via `echo -n 'hunter2' | shasum -a 256`).

No third-party hash library. No salt. Demo app per CLAUDE.md and REQUIREMENTS.md "Out of Scope: Real authentication."

### 2. `src/auth/authRepo.ts`

8 exported functions plus 2 exported input types:

| Symbol | Kind | Purpose |
|---|---|---|
| `CreateVisitorInput` | type | Plaintext-password input shape for `createVisitor` (TypeScript enforces no plaintext on output) |
| `CreateWorkspaceInput` | type | Input shape for `createWorkspace` |
| `listVisitors()` | fn | `readWithSchema(K.visitors(), VisitorsArraySchema, [])` |
| `listWorkspaces()` | fn | `readWithSchema(K.workspaces(), WorkspacesArraySchema, [])` |
| `findVisitorByEmail(email)` | fn | Case-insensitive (`toLowerCase` both sides) |
| `findVisitorByUsername(username)` | fn | Case-insensitive |
| `getVisitorById(id)` | fn | Strict-equality |
| `getWorkspaceById(id)` | fn | Strict-equality |
| `createVisitor(input)` | async fn | Hashes `input.password` → builds `Visitor` with `nanoid()` id and `new Date().toISOString()` createdAt → appends via `writeJSON(K.visitors(), [...existing, newVisitor])` |
| `createWorkspace(input)` | fn | Sync; nanoid id + ISO createdAt → `writeJSON(K.workspaces(), ...)` |

**Persistence discipline:** the file contains ZERO `localStorage.*` calls — `grep -E "localStorage\\." src/auth/authRepo.ts` returns no matches. All reads route through `readWithSchema` so corrupt or schema-invalid disk values fall through to `[]`.

**No plaintext leak:** the explicit destructure in `createVisitor` discards `password`, and the constructed `Visitor` literal is typed against `Visitor` (which has no `password` field per `VisitorSchema`). Smoke test asserts `'password' in visitor === false` and `localStorage.getItem(K.visitors())` does not include `'hunter2'`.

### 3. `nanoid@^5.1.11`

Added to `package.json` `"dependencies"`. Used by `authRepo.createVisitor` and `authRepo.createWorkspace` as the source of `Visitor.id` and `Workspace.id`. `package-lock.json` regenerated.

### 4. Smoke tests

- `src/auth/__tests__/passwordHash.smoke.ts` — 7 assertions covering hash shape, determinism, verify pos/neg, tolerant-of-malformed-hash. Used to drive Task 1's TDD RED → GREEN cycle.
- `src/auth/__tests__/auth.smoke.ts` — 17 logical tests (22 individual PASS lines) covering both modules end-to-end:
  1. hashPassword 64-char lowercase hex
  2. determinism
  3. verifyPassword positive
  4. verifyPassword negative
  5. verifyPassword tolerant of malformed hash
  6. createVisitor returns Visitor with nanoid id, hex passwordHash, ISO createdAt
  7. created Visitor has no `password` field AND stored JSON does not contain plaintext "hunter2"
  8. distinct ids from rapid successive createVisitor calls
  9. case-insensitive findVisitorByEmail
  10. case-insensitive findVisitorByUsername
  11. createWorkspace + getWorkspaceById round-trip
  12. corrupt JSON at K.visitors() → listVisitors returns [], findVisitorByEmail returns undefined
  13. schema-invalid JSON at K.visitors() → listVisitors returns []
  14. listVisitors returns 3 after three seeded createVisitor calls
  15. getVisitorById round-trip
  16. listWorkspaces returns 2 after two createWorkspace calls
  17. verifyPassword round-trips against the hash stored in a freshly-created Visitor

Run via `npx tsx src/auth/__tests__/auth.smoke.ts` → `auth smoke: 22 passed, 0 failed`. Exit 0.

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Typecheck (browser tsc, excludes `src/**/__tests__`) | `npm run typecheck` | Exit 0 |
| Production build | `npm run build` | Exit 0, built in ~553ms |
| Auth smoke (Node, via tsx) | `npx tsx src/auth/__tests__/auth.smoke.ts` | 22 PASS / 0 FAIL, exit 0 |
| passwordHash smoke (Node, via tsx) | `npx tsx src/auth/__tests__/passwordHash.smoke.ts` | 7 PASS / 0 FAIL, exit 0 |
| nanoid pinned to v5 | `grep -E '"nanoid": "\^5' package.json` | matches `"nanoid": "^5.1.11"` |
| No third-party hash lib in deps | `grep -iE "bcrypt\|argon2\|crypto-js" package.json` | no matches |
| `crypto.subtle.digest('SHA-256')` used exactly once | `grep -c "crypto.subtle.digest" src/auth/passwordHash.ts` | 1 |
| Zero direct localStorage.* in authRepo | `grep -E "localStorage\\." src/auth/authRepo.ts` | no matches (exit 1) |
| `createVisitor` calls `hashPassword` | `grep "hashPassword" src/auth/authRepo.ts` | 2 occurrences (import + call) |
| Case-insensitive lookups | `grep -c "toLowerCase" src/auth/authRepo.ts` | 4 (two helpers × needle + stored) |

## Commits

| Hash | Type | Description |
|---|---|---|
| `35bf6f7` | test | add failing smoke for passwordHash module (RED) |
| `1d7905f` | feat | add passwordHash module (SHA-256 via crypto.subtle) + nanoid dep (GREEN) |
| `515afae` | test | add failing smoke for authRepo (17 assertions) (RED) |
| `d20da3d` | feat | add authRepo (CRUD over halo:v1:visitors + halo:v1:workspaces) (GREEN) |

## TDD Gate Compliance

Both tasks followed RED → GREEN. RED commits (`test(...)`) precede their GREEN counterparts (`feat(...)`) in git log. No REFACTOR commits were needed — implementations were minimal and clean on first GREEN.

## must_haves Truths Reconciliation

| Truth | Reconciled |
|---|---|
| Hashing "hunter2" twice yields the same 64-char lowercase-hex SHA-256 | Test 1 + Test 2 confirm output equals `f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7` |
| `hashPassword` calls `crypto.subtle.digest('SHA-256', ...)` — no third-party hash lib, no plaintext returned | `grep -c "crypto.subtle.digest" src/auth/passwordHash.ts` returns 1; `grep "bcrypt\|argon2\|crypto-js" package.json` returns no matches; output is `Promise<string>` only |
| `createVisitor(...)` writes a Visitor whose `passwordHash` is hex, not plaintext | Test 6 + Test 7: hash matches `/^[0-9a-f]{64}$/`, no `'password' in visitor`, stored JSON does not contain `'hunter2'` |
| `findVisitorByEmail('A@B.CO')` finds visitor stored with lowercased email | Test 9 |
| `findVisitorByUsername` case-insensitive | Test 10 |
| Reading corrupted `halo:v1:visitors` returns `[]` and never crashes | Test 12 (corrupt JSON) + Test 13 (schema-invalid JSON) |
| `nanoid()` is the source of `Visitor.id` + `Workspace.id`; unique across rapid calls | Test 8 (visitors); workspace ids generated via same `nanoid()` call in `createWorkspace` |

## Deviations from Plan

None. The plan was explicit and the action was executed verbatim.

One minor cosmetic adjustment that does **not** rise to a deviation: the JSDoc file header in `passwordHash.ts` initially repeated the literal string `crypto.subtle.digest('SHA-256', ...)` inside a comment, which caused `grep -c "crypto.subtle.digest" src/auth/passwordHash.ts` to return 2 instead of the AC-required 1. The comment was rephrased to "SHA-256 via the subtle digest method" so the literal call appears exactly once (in the function body). The function behavior is unchanged.

## Pendo Considerations

- `nanoid` is the spec-locked source of visitor + account IDs that Pendo `initialize` consumes downstream (CLAUDE.md "Pendo Integration > Visitor + account IDs must be strings — generate them with `nanoid` at registration time"). This plan installs nanoid and uses it for `Visitor.id` + `Workspace.id`; Phase 6 PendoBridge reads those fields from the Session record.
- No `pendo.*` calls are added here — Phase 1–5 build a Pendo-ready app without wiring (per the 2026-05-13 user decision logged in STATE.md).

## Self-Check: PASSED

- `src/auth/passwordHash.ts` — FOUND
- `src/auth/authRepo.ts` — FOUND
- `src/auth/__tests__/auth.smoke.ts` — FOUND
- `src/auth/__tests__/passwordHash.smoke.ts` — FOUND
- Commit `35bf6f7` — FOUND
- Commit `1d7905f` — FOUND
- Commit `515afae` — FOUND
- Commit `d20da3d` — FOUND
- nanoid@^5.1.11 in package.json `dependencies` — FOUND

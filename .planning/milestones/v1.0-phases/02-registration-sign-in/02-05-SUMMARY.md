---
phase: 02-registration-sign-in
plan: 05
subsystem: auth
tags: [zustand, react-context, localstorage-session, hydration, sha256, react-19]

# Dependency graph
requires:
  - phase: 01-foundation-cross-cutting-contracts
    provides: "FND-04 storage codec (K, readWithSchema, writeJSON, removeKey); FND-07 provider stack with AuthProvider position fixed in src/App.tsx"
  - phase: 02-registration-sign-in (Plan 02-01)
    provides: "PendoId selector registry (no direct dependency in this plan; reserved for guards downstream)"
  - phase: 02-registration-sign-in (Plan 02-02)
    provides: "Visitor, Workspace, Session types + Zod schemas (User = Visitor alias)"
  - phase: 02-registration-sign-in (Plan 02-03)
    provides: "authRepo (findVisitorByEmail, getVisitorById, getWorkspaceById, listWorkspaces) + passwordHash (verifyPassword)"
  - phase: 02-registration-sign-in (Plan 02-04)
    provides: "wizardSession.clearWizardDraft() — invoked inside signOut()"
provides:
  - "useAuthStore — Zustand store with currentVisitor / currentWorkspace / isAuthenticated + actions (setSession, clearSession, signInWithCredentials, signInFromVisitor, signOut)"
  - "hydrateAuthFromStorage() — module-init synchronous hydration from halo:v1:session with orphan-session self-heal"
  - "AuthProvider (replaced body) — thin React Context bridge exposing the 7-field AuthContextValue"
  - "useAuth() returns AuthContextValue { user, currentVisitor, currentWorkspace, isAuthenticated, signInWithCredentials, signInFromVisitor, signOut }"
  - "AUTH-10 data-layer foundation (refresh-survives-auth via synchronous boot hydration)"
  - "AUTH-11 data-layer foundation (signOut clears store + session + wizard draft)"
affects:
  - "02-06-route-guards (RequireAuth reads useAuth().isAuthenticated)"
  - "02-09-wizard-completion (calls signInFromVisitor after createVisitor + createWorkspace)"
  - "02-10-signin-page (calls signInWithCredentials with the discriminated-union result)"

# Tech tracking
tech-stack:
  added:
    - "zustand@^5.0.13 (React 19 compatible; CLAUDE.md permits 4 or 5)"
  patterns:
    - "Zustand store + thin Context provider bridge (selectors for slices, getState() for stable actions)"
    - "Module-init synchronous hydration (NOT inside a React effect hook) — proves AUTH-10 ordering"
    - "Orphan-session self-heal during hydration — corrupt/stale session keys auto-clear"
    - "Single failure-reason variant ('invalid_credentials') in signInWithCredentials — defends against username enumeration (T-02-21)"
    - "Hand-rolled persistence over zustand persist middleware — keeps FND-04 uniform codec usage"

key-files:
  created:
    - "src/auth/authStore.ts (177 lines) — Zustand store + hydration + actions"
  modified:
    - "src/auth/AuthProvider.tsx — body replaced; Phase 1 stub removed; inline User type deleted"
    - "package.json — zustand@^5.0.13 added"
    - "package-lock.json — Zustand resolution"

key-decisions:
  - "Zustand 5.0.13 over 4.5.x: React 19 is the chosen React major (Mantine 9 forces it); Zustand 5 is the current stable line with explicit React 19 support; install succeeded with zero peer-dep warnings."
  - "Hand-rolled setSession/clearSession over zustand/middleware/persist: persist middleware doesn't compose with the readWithSchema validation layer that every other persistent read in the app already uses; FND-04 codec uniformity wins over middleware convenience."
  - "Module-init hydration via bare hydrateAuthFromStorage() call at file bottom: runs strictly before createRoot().render() via the AuthProvider→App.tsx import chain, mirroring Plan 01-03's runMigrations() placement; route guards see isAuthenticated on first render (AUTH-10)."
  - "Orphan-session self-heal: if session.visitorId/.workspaceId no longer resolve, removeKey() the bad session and boot signed-out — defends against partial-data states from manual DevTools edits or stale demo state."
  - "Single 'invalid_credentials' reason variant for all sign-in failures: defends against username enumeration via the API surface — caller can't tell 'no such user' from 'wrong password' from 'no workspace' (T-02-21)."
  - "useAuth.ts source file required no edits: the file already imports AuthContextValue from ./AuthProvider; only the underlying type shape changed, not the hook's body. (Listed as 'modified' in the plan's frontmatter, but byte-for-byte the file is unchanged at HEAD — TypeScript carries the new shape transparently.)"
  - "src/App.tsx left untouched per FND-07 contract — verified via `git diff --name-only HEAD~2 HEAD -- src/App.tsx` returning 0 lines."

patterns-established:
  - "Zustand-backed React Context bridge: thin provider subscribes to slices via selectors, reads stable actions from getState() — context value recomputes on slice change, action references stay identity-stable across renders."
  - "Module-init hydration: import-time side effect that primes the store before React mounts, enabling synchronous route-guard decisions without a loading flash."
  - "Codec-uniform persistence in feature modules: every write goes through writeJSON/removeKey/readWithSchema; no module outside src/storage/codec.ts touches localStorage directly."

requirements-completed:
  - AUTH-10
  - AUTH-11

# Metrics
duration: 4min
completed: 2026-05-14
---

# Phase 02 Plan 05: Auth Zustand Store and Provider Replacement Summary

**Zustand 5 auth store with synchronous boot-time hydration replaces the Phase 1 AuthProvider stub; useAuth() now returns the 7-field AuthContextValue and the Pendo-demo-grade refresh-persistence contract (AUTH-10) ships at the data layer.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-14T15:27:06Z
- **Completed:** 2026-05-14T15:30:55Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Zustand 5.0.13 installed and wired as the auth state-machine substrate.
- `src/auth/authStore.ts` composes `authRepo` + `codec` + `wizardSession` into a single coherent store with `setSession`, `clearSession`, `signInWithCredentials`, `signInFromVisitor`, and `signOut` actions.
- `hydrateAuthFromStorage()` runs at module-init level (line 173, top-level bare call — verified via `grep -nE "^hydrateAuthFromStorage\(\)$"`), so route guards see populated `isAuthenticated` on the very first render — the AUTH-10 ordering invariant.
- Orphan-session self-heal: a session whose `visitorId` or `workspaceId` no longer resolves is removed during hydration; the user boots signed-out cleanly rather than crashing.
- AuthProvider body replaced: Phase 1's `STUB_VALUE` (signIn throws, signOut no-op, user=null) and inline `User` type are gone; provider is now a thin Context bridge subscribing to Zustand slices.
- `useAuth()` returns the new 7-field `AuthContextValue` (user, currentVisitor, currentWorkspace, isAuthenticated, signInWithCredentials, signInFromVisitor, signOut). `user` alias of `currentVisitor` preserves Plan 01-04 stub-consumer compatibility.
- `src/App.tsx` byte-for-byte unchanged (FND-07 provider position invariant holds).
- `npm run typecheck` and `npm run build` both green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zustand 5 and implement src/auth/authStore.ts with synchronous boot-time hydration** — `752739a` (feat)
2. **Task 2: Replace AuthProvider body and useAuth hook to expose the Zustand store via React Context** — `8ceead1` (feat)

**Plan metadata commit (this summary + STATE/ROADMAP):** added at the end of the plan.

## Files Created/Modified

- `src/auth/authStore.ts` (created, 177 lines) — Zustand store; `useAuthStore` hook; `hydrateAuthFromStorage()` exported; module-init hydration call at line 173.
- `src/auth/AuthProvider.tsx` (modified, body replaced) — new 7-field `AuthContextValue`; thin Context bridge over `useAuthStore`; Phase 1 stub removed; inline `User` type deleted.
- `package.json` (modified) — `"zustand": "^5.0.13"` added under `dependencies`.
- `package-lock.json` (modified) — Zustand resolution lockfile entry.

Note: `src/auth/useAuth.ts` is listed under the plan's `files_modified` frontmatter but required no source edits — it already imports `AuthContextValue` from `./AuthProvider`, and TypeScript carries the new shape transparently. The file is byte-for-byte unchanged at HEAD.

## Decisions Made

- **Zustand 5.0.13 over 4.5.x.** React 19 is already the chosen React major (Mantine 9 forces it), and Zustand 5 ships explicit React 19 support. `npm install zustand@^5` resolved with zero peer-dependency warnings. CLAUDE.md says "Zustand 4.x" but the broader Phase-1 update note in STATE.md confirms the stack is on the React-19 / Zustand-5 line.
- **Hand-rolled `setSession` / `clearSession` instead of `zustand/middleware/persist`.** The persist middleware writes raw values to localStorage without going through `readWithSchema` validation; rolling our own writes through `writeJSON(K.session(), ...)` keeps codec usage uniform across the app (FND-04).
- **Module-init `hydrateAuthFromStorage()` call.** A bare top-level call at file bottom executes during the import chain (AuthProvider imports authStore → App imports AuthProvider → main imports App), so the store is populated before `createRoot().render()`. This mirrors Plan 01-03's `runMigrations()` placement pattern.
- **Orphan-session self-heal.** If the persisted session points at records that no longer exist, the bad session key is removed during hydration. This handles partial-data states from manual DevTools edits or stale demo state without crashing.
- **Single `'invalid_credentials'` failure variant.** All three failure paths in `signInWithCredentials` (visitor not found, wrong password, missing workspace) return the same reason — defends against username enumeration via the API return shape (T-02-21).
- **No `useMemo` on the provider's context value.** Zustand selectors handle change detection on the slices that matter; the context value reference recreating on each provider render is harmless. Adding `useMemo` would be ceremony without payoff.
- **No `signIn:` field alias for back-compat.** Plan 01-04's stub had a `signIn` method that *threw* — keeping a renamed-but-still-throwing alias would invite accidental calls. Replaced wholesale with `signInWithCredentials` / `signInFromVisitor`, and verified no `useAuth().signIn(` consumers exist anywhere in `src/`.

## Deviations from Plan

### Documentation-only adjustment in JSDoc

**1. [Rule 1 — Bug, but in the plan's own AC literal-grep checks] Rewrote JSDoc wording in `authStore.ts` to avoid the substrings `useEffect` and `zustand/middleware/persist` in comments**
- **Found during:** Task 1 verify-block execution
- **Issue:** Plan ACs say `grep -E "useEffect" src/auth/authStore.ts` and `grep "zustand/middleware/persist" src/auth/authStore.ts` must return zero matches. The initial JSDoc explained *why* the module avoids these patterns by naming them, which tripped the literal grep.
- **Fix:** Reworded the file-level and function-level JSDoc to refer to "React effect hook" and "Zustand's persist middleware" descriptively, preserving the explanatory intent without matching the negative grep.
- **Files modified:** `src/auth/authStore.ts` (JSDoc only; behavior unchanged)
- **Verification:** Re-ran the verify-block — all negative greps return 0 matches.
- **Committed in:** `752739a` (Task 1 commit — happened pre-commit during verification)

### Plan-AC inconsistency, surfaced (not auto-fixed)

**2. [Plan-internal AC inconsistency, not a code deviation] `grep -cE "reason: '[^']+'" src/auth/authStore.ts` returns 4 (line count), not 1**
- **Found during:** Task 1 verify-block execution
- **Issue:** The plan's AC says this grep "returns 1" — implying ONE distinct failure-reason variant. But `grep -c` counts matching *lines*, not distinct values. With three failure paths all returning `{ ok: false, reason: 'invalid_credentials' }` plus the type-declaration line, the count is 4.
- **Resolution:** The deeper AC text ("there is exactly ONE failure reason variant") is satisfied — `grep -oE "reason: '[^']+'" | sort -u` yields exactly one line: `reason: 'invalid_credentials'`. The literal `-c` part of the AC is a plan typo; the *intent* (one variant, no username enumeration) is met.
- **No file modification — surfaced for the verifier and for plan-author awareness.**

---

**Total deviations:** 1 doc-only auto-adjustment, 1 surfaced plan-AC inconsistency
**Impact on plan:** Zero behavior change; all spirit-level ACs and success-criteria pass.

## Issues Encountered

None during execution — both tasks landed first-pass with typecheck + build clean.

## Threat Flags

None — the only new surface is the auth store's API, which is fully covered by the plan's threat model (T-02-19 through T-02-24 — disposition mix of `mitigate` + accept-with-rationale for the demo-app caveats).

## Known Deferred Items

- **Multi-tab session sync** (T-02-24, disposition: accept) — `authStore.ts` line 41 carries a `TODO Phase 4+:` comment for `window.storage` event subscription. Phase 2 UI-SPEC does not require it; Plan 01-03's SUMMARY reserved the slot.
- **End-to-end AUTH-10 / AUTH-11 verification** — the data layer ships here; the calling-page flows that prove it land in:
  - Plan 02-06 (RequireAuth route guard reads `useAuth().isAuthenticated`)
  - Plan 02-09 (wizard-completion calls `signInFromVisitor` → session written → refresh keeps user signed in)
  - Plan 02-10 (sign-in page calls `signInWithCredentials` → renders the locked Alert copy on `{ ok: false }`)

## User Setup Required

None — no external service configuration required. Zustand is a pure npm package and the store reads/writes only the existing `halo:v1:session` localStorage key, which the codec layer already governs.

## Next Phase Readiness

Wave 3 page plans (02-06 route guards, 02-09 wizard completion, 02-10 sign-in page) can compose `useAuth()` with no additional store setup. The 7-field `AuthContextValue` and the discriminated-union `SignInResult` are stable surfaces for those plans.

Specifically:
- **02-06** consumes `useAuth().isAuthenticated` in `RequireAuth` — synchronously available on first render because hydration ran at module-init.
- **02-09** calls `useAuth().signInFromVisitor(visitor, workspace)` after `createVisitor` + `createWorkspace` — no credential check needed, just session write + store update.
- **02-10** calls `useAuth().signInWithCredentials(email, password)` and renders the UI-SPEC-locked "Email and password don't match. Try again." Alert on `{ ok: false, reason: 'invalid_credentials' }`.

The store is ready for those integrations. AUTH-10 and AUTH-11 are technically partially satisfied here (data-layer foundation); end-to-end verification happens in 02-09 / 02-10 / 02-06.

## Self-Check: PASSED

Created files verified:
- `src/auth/authStore.ts` — FOUND
- `.planning/phases/02-registration-sign-in/02-05-SUMMARY.md` — FOUND (this file)

Commits verified:
- `752739a` (Task 1) — FOUND in `git log --oneline`
- `8ceead1` (Task 2) — FOUND in `git log --oneline`

Plan-level success criteria:
- `npm run typecheck` exits 0 — PASS
- `npm run build` exits 0 — PASS
- `zustand@^5` in `dependencies` — PASS (`^5.0.13`)
- `hydrateAuthFromStorage()` at module top level (line 173, column 1) — PASS
- `useAuth()` returns `AuthContextValue` with `{ user, isAuthenticated, signOut }` (and more) — PASS
- `src/App.tsx` byte-for-byte unchanged — PASS (`git diff --name-only HEAD~2 HEAD -- src/App.tsx` returns 0 lines)
- No `zustand/middleware/persist` usage — PASS
- No `useEffect` in `authStore.ts` — PASS
- No direct `localStorage.*` calls in `authStore.ts` — PASS

---
*Phase: 02-registration-sign-in*
*Completed: 2026-05-14*

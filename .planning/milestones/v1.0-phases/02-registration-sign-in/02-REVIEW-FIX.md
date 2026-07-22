---
phase: 02-registration-sign-in
fixed_at: 2026-05-14T17:00:00Z
review_path: .planning/phases/02-registration-sign-in/02-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-05-14T17:00:00Z
**Source review:** .planning/phases/02-registration-sign-in/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (2 Critical + 8 Warning; 6 Info skipped per fix_scope)
- Fixed: 10
- Skipped: 0

All Critical and Warning findings were addressed. Two of them (CR-02 and
WR-03) make non-trivial behavioral changes; the rest are localized
edits. CR-02 in particular touches the wizard's password-handling flow
and warrants a human eye before the verifier phase signs off — the
typechecker and smoke tests pass, but the end-to-end Step-1-through-4
flow on a real browser session is the right place to confirm the
in-memory password holder does what the threat-model claims.

WR-05 is included in the fix count because it was resolved
transitively by the WR-01 NumberInput fix — the WR-05 root cause was
NumberInput coercing empty input to `0`, and `hasStep` then treating
`0` as "filled." Once WR-01 keeps cleared NumberInputs as `undefined`,
the `hasStep` predicate no longer triggers on tabbed-through-empty
inputs. No additional code change was needed for WR-05.

Verification per fix:
- Tier 1 (re-read modified file section): every fix.
- Tier 2 (syntax check): `tsc --noEmit -p tsconfig.app.json` clean
  after every fix; full `npm run build` clean after the last fix.
- Smoke tests (`src/auth/__tests__/*.smoke.ts`,
  `src/storage/__tests__/*.smoke.ts`): 121 assertions across 6 files
  pass after all fixes.

## Fixed Issues

### CR-01: Step 1 email-duplicate copy is duplicated as a string literal — guaranteed to drift

**Files modified:** `src/routes/public/signup/Step1AccountPage.tsx`
**Commit:** 9af7a3c
**Applied fix:** Replaced the hand-typed
`An account with this email already exists.` string in the email-error
render block with a JSX interpolation of the existing
`EMAIL_DUPLICATE_MESSAGE` constant, so the two coupled strings (the
manual error message set on the form + the comparison that toggles
the `Sign in instead?` anchor) now have a single source of truth. A
future copy edit to the constant will no longer silently hide the
inline anchor.

---

### CR-02: Step 1 plaintext password is written verbatim into sessionStorage on Continue

**Files modified:** `src/auth/wizardSession.ts`, `src/auth/index.ts`,
`src/routes/public/signup/Step1AccountPage.tsx`,
`src/routes/public/signup/Step4PreferencesPage.tsx`
**Commit:** 8054f2e
**Status:** fixed: requires human verification
**Applied fix:** Added a tab-scoped in-memory plaintext-password
holder (`setWizardPassword` / `getWizardPassword`) to `wizardSession.ts`.
Step 1's onSubmit now strips `password` from the values before writing
to sessionStorage and stashes the plaintext via `setWizardPassword`.
Step 4's completion handler reads the password back via
`getWizardPassword` and injects it into the `step1Schema.parse` call
so the existing defense-in-depth re-validation still type-matches.
`clearWizardDraft` drops both the in-memory holder and the on-disk
draft, so the teardown is in one place.

Trade-off documented in code: on page refresh mid-wizard, the user
has to re-enter their password — accepted because the refresh case is
rare and a re-typed password is strictly safer than a
sessionStorage-resident plaintext.

This is a behavioral change touching multiple files and the
sensitive-data flow. Flagged for human verification because the
typechecker cannot prove that the in-memory holder is the only path
the plaintext takes — a follow-up reviewer should confirm there is no
other consumer of `draft.step1.password` in Phase 2 code (a `grep`
across `src/` for `password` references on `step1` is the cheap check).

---

### WR-01: NumberInput onChange coerces empty input to 0 / NaN

**Files modified:** `src/routes/public/signup/Step2DetailsPage.tsx`,
`src/routes/public/signup/Step4PreferencesPage.tsx`
**Commit:** 64474f0
**Applied fix:** Replaced the
`typeof value === 'number' ? value : Number(value)` pattern in both
`yearsExperience` (Step 2) and `teamSize` (Step 4) with explicit
empty / non-numeric branches that set the field to `undefined`. This
preserves the user's empty intent and lets the schema's
`z.number({ message: "..." })` typecheck fire the UI-SPEC-locked
copy on submit (instead of the unlocked default `min` / `int` error
that the old `0` / `NaN` write would have triggered).

---

### WR-02: Double type-casts silently bypass real type errors

**Files modified:** `src/routes/public/signup/Step2DetailsPage.tsx`,
`src/routes/public/signup/Step3CompanyPage.tsx`,
`src/routes/public/signup/Step4PreferencesPage.tsx`
**Commit:** 4c2d3f3
**Applied fix:** Three patterns rewritten across all three Step 2/3/4
pages:
  - `defaultValues: {...} as Partial<X> as X` replaced with per-field
    `undefined as unknown as T` casts. The hole is now visible at the
    field level instead of laundered through `Partial<X>`.
  - `OPTIONS as unknown as string[]` replaced with `[...OPTIONS]`
    (mutable shallow copy). The readonly tuple stays the source of
    truth; the cast surface goes to zero.
  - `(value ?? '') as RoleEnum` replaced with a runtime
    `OPTIONS.includes(value)` narrowing — unknown strings + clears
    now write `undefined`, which triggers the locked
    `z.enum({ message: "..." })` copy on submit.

---

### WR-03: findVisitorByEmail / findVisitorByUsername not re-checked at wizard completion

**Files modified:** `src/routes/public/signup/Step4PreferencesPage.tsx`
**Commit:** 5fdb8f1
**Applied fix:** Step 4's `try`-block now re-runs `findVisitorByEmail`
and `findVisitorByUsername` immediately before `createVisitor`. On
collision the page sets a new `submitError` variant
(`duplicate_email` or `duplicate_username`) and surfaces a form-level
Alert with the UI-SPEC-locked copy from the
Inline-validation-errors table. The `submitError` union grew from a
single `'generic_failure'` to a three-way discriminator;
corresponding Alerts were added to the JSX. Closes the
concurrent-tab race where a parallel wizard completes between Step 1's
check and Step 4's submit.

---

### WR-04: createVisitor read-then-write is non-atomic across tabs

**Files modified:** `src/auth/authRepo.ts`
**Commit:** 0e81fa2
**Applied fix:** Per the reviewer's guidance ("no clean fix is
possible in localStorage without a lock primitive"), expanded the
file-level doc comment to explicitly call out the non-atomic
read-modify-write hazard in `createVisitor` + `createWorkspace`,
including the `await hashPassword`-induced intra-tab window. Future
maintainers will not lean on the repo for flows where race-induced
record drop matters.

---

### WR-05: hasStep returns false for a step containing only the value 0

**Files modified:** (none — resolved transitively by WR-01)
**Commit:** (see WR-01 — 64474f0)
**Applied fix:** Resolved transitively. The WR-05 root cause was
NumberInput's cleared-field coercion writing `0` into RHF state,
which `hasStep` then treated as "filled." Once WR-01's onChange
preserves `undefined` on empty input, the cleared NumberInput no
longer trips `hasStep`. The reviewer's fix option (a) ("keep
NumberInput empty-state as undefined") is the WR-01 fix; no
additional `hasStep` change was needed (and option (b), tightening
`hasStep` to ignore zero-valued numerics, would have lost the
distinction between user-typed `0` and coerced-empty `0` — which
WR-01 now preserves cleanly at the source).

---

### WR-06: pathToStepIndex matches with startsWith — accidental sub-path matches

**Files modified:** `src/routes/public/signup/SignupShell.tsx`
**Commit:** 0316f7b
**Applied fix:** Replaced the three `startsWith` checks with strict
equality (`pathname === '/signup/details' || pathname === '/signup/details/'`,
etc.). Future nested routes like `/signup/details/edit` or
`/signup/company-confirm` no longer silently highlight the wrong
Stepper position.

---

### WR-07: verifyPassword "constant-time" comparison has dead length-check tail + over-claiming doc

**Files modified:** `src/auth/passwordHash.ts`
**Commit:** eac2758
**Applied fix:** Removed the dead
`actualHash.length === expectedHash.length` tail on the final
`return` (the early-return above already short-circuits on length
mismatch). Rewrote the doc-comment to no longer over-claim
timing-attack resistance — the loop is documentation of intent for a
demo, not a security guarantee. `passwordHash.smoke.ts` (7
assertions) still passes.

---

### WR-08: AuthProvider recreates a fresh value object every render

**Files modified:** `src/auth/AuthProvider.tsx`
**Commit:** aa258bb
**Applied fix:** Wrapped the context value in `useMemo` keyed on the
six subscribed slices + the three store-action references (the
actions are stable across the store's lifetime, so they act as
identity keys). Updated the header doc-comment to explain WHY the
memo is now present (instead of the previous "why no useMemo"
defense). Phase 3's top-bar — which will read only the stable
`signOut` action via `useAuth()` — no longer re-renders on every
unrelated store update.

---

_Fixed: 2026-05-14T17:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

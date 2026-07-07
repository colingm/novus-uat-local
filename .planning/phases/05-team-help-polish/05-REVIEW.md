---
phase: 05-team-help-polish
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/storage/schemas.ts
  - src/seed/seedAll.ts
  - src/team/teamSeed.ts
  - src/tasks/tasksSeed.ts
  - src/team/components/InviteTeammateModal.tsx
findings:
  critical: 0
  blocker: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-05-15
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The Plan 05-07 (per-domain seed ledger) and Plan 05-08 (modal open-transition
reset) changes are sound and address the UAT gaps they target. Backward-compat
correctness for `MetaSchema` is preserved (`seededDomains` is `.optional()` on
top of a `.partial()` inner shape; pre-Phase-5 records still parse). Per-domain
gates are idempotent — every relevant call site checks ledger state before
mutating, and the coordinator is the sole writer of `meta.seededDomains`. The
`InviteTeammateModal` open-transition effect mirrors the TaskFormModal pattern
faithfully and the dep array is honest (memoized `defaultValues`, stable
`form` reference, `opened` as the actual trigger).

No BLOCKER issues found. Findings concentrate on three correctness gaps worth
fixing before this phase ships, plus a handful of doc/quality items:

- **WR-01** flags a stale-resolver hazard if `workspaceId` ever changes after
  `InviteTeammateModal` mounts.
- **WR-02** flags two stale docblock claims in `teamSeed.ts` and `tasksSeed.ts`
  that still reference the pre-Plan-07 single-stamp model — future debuggers
  will hit a contradiction between code and comments.
- **WR-03** flags the `firstName` derivation producing whitespace-only strings
  for pathological email local-parts (passes Zod `min(1)` but is ugly).
- Info items cover dead/redundant code paths, minor style, and traceability.

## Warnings

### WR-01: `InviteTeammateModal` resolver is captured at mount; `workspaceId` change ⇒ stale dedupe

**File:** `src/team/components/InviteTeammateModal.tsx:55-82`

**Issue:** `InviteFormSchema` is built inside a `useMemo` keyed on `workspaceId`
so the `.superRefine` closure can capture the right workspace for the dedupe
lookup. However, `resolver: zodResolver(InviteFormSchema)` is only passed to
`useForm` at first call. React Hook Form snapshots the resolver on the initial
`useForm` call; it does not subscribe to subsequent resolver identity changes
unless you call `form.reset` / `useForm({ resolver })` with the updated
resolver. If a parent ever re-renders this modal with a different
`workspaceId` (workspace switcher, tenant flip), the schema closure on the
form will keep dedup-checking the OLD workspace, accepting "duplicate" emails
that already exist in the new workspace.

Today the only caller is `TeamPage`, which keys off a single
`useAuthStore().currentWorkspaceId`, so this is latent. But the prop is
declared and threaded as if multi-workspace, and Phase 5 D-02 explicitly
positions workspace as switchable.

**Fix:** Either (a) pass the resolver dynamically by gating on workspaceId via
an effect (and re-`form.reset` on workspaceId change), or (b) document the
single-workspace-per-mount invariant via a useEffect assertion. Concrete (a):

```ts
// Re-bind the resolver if workspaceId changes after mount.
useEffect(() => {
  // Force RHF to pick up the new resolver closure.
  form.reset(defaultValues, { keepValues: false })
  // Note: react-hook-form does not expose setResolver. The cleanest fix is to
  // re-key the component from the parent: <InviteTeammateModal key={workspaceId} ... />
}, [workspaceId, form, defaultValues])
```

The simplest fix is parent-side keying:

```tsx
// In TeamPage.tsx
<InviteTeammateModal key={workspaceId} opened={...} ... workspaceId={workspaceId} />
```

This force-remounts the form (and its captured resolver) whenever workspace
flips. Add a code comment explaining why the `key` is required.

---

### WR-02: Stale docblocks in `teamSeed.ts` and `tasksSeed.ts` contradict Plan 07's per-domain ledger

**File:** `src/team/teamSeed.ts:96-97`, `src/tasks/tasksSeed.ts:168-170`

**Issue:** Two prominent docblock claims now contradict the implementation:

1. `teamSeed.ts:96-97` — "CRITICAL (D-12): This function DOES NOT stamp
   meta.seededAt. That stamp belongs to the seedAll.ts coordinator so a single
   stamp gates both seeders." The "single stamp" wording is the pre-Plan-07
   model; Plan 07 explicitly replaced this with a per-domain ledger. A future
   debugger reading this docblock will get the wrong mental model of the
   idempotency contract.

2. `tasksSeed.ts:168-170` — "Idempotent: calling this function multiple times
   for the same workspace is safe — after the first successful call,
   `meta.seededAt` is non-null and all subsequent calls return immediately
   without touching storage." This describes the pre-Plan-07 gate. Post-Plan-07
   the gate is `meta.seededDomains.tasks` (with `seededAt` only as a
   legacy-compat fallback when `seededDomains` is absent).

Plan 07's traceability blocks in seedAll.ts are excellent; these two docblocks
were missed.

**Fix:**

```ts
// teamSeed.ts:96-97 — replace with:
// CRITICAL (D-12 + Plan 07): This function DOES NOT write meta. The seedAll.ts
// coordinator owns all meta writes including the per-domain
// seededDomains.teammates timestamp. Plan 07 replaced the single global
// `seededAt` gate with a per-domain ledger; see seedAll.ts for the
// reconciliation logic.

// tasksSeed.ts:168-170 — replace with:
// Idempotent: calling this function multiple times for the same workspace
// is safe — after the first successful call, the coordinator stamps
// `meta.seededDomains.tasks` and all subsequent calls fast-return at GATE 1a.
// Pre-Plan-07 installs (with `meta.seededAt` only) fast-return at GATE 1b.
```

---

### WR-03: `firstName` derivation in `InviteTeammateModal` can produce whitespace-only strings

**File:** `src/team/components/InviteTeammateModal.tsx:96-100`

**Issue:** The derivation splits the email local-part on `.` and `_`, then
Title-cases each segment and joins with a space. For pathological but
RFC-5321-valid local parts the result is degenerate:

- `_@example.com` → local part `_`, `split(/[._]/)` → `["", ""]`, map →
  `["", ""]`, join → `" "` (a single space). `TeammateSchema.firstName`
  is `z.string().min(1)`, which accepts ` ` because it checks `.length`,
  not whitespace content. The teammate row renders with an empty/whitespace
  first name in the team table.
- `..@example.com` → `["", "", ""]` → `"  "` (two spaces).
- `123@example.com` → `["123"]` → `"123"` (digits passed unchanged — harmless
  but produces a numeric "first name").

The `z.string().email()` validation on the form may also accept some of these
(zod's default email regex permits `_@domain.com`).

**Fix:** Trim and fall back if the derived firstName is empty/whitespace:

```ts
const localPart = values.email.split('@')[0]
const derived = localPart
  .split(/[._]/)
  .filter(Boolean)                                  // drop empty segments
  .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
  .join(' ')
  .trim()
const firstName = derived.length > 0 ? derived : localPart || 'Teammate'
```

This preserves the happy-path behavior and gives a sane fallback for
degenerate inputs without weakening Zod validation downstream.

## Info

### IN-01: `SeededDomainsSchema` is not exported from the storage barrel

**File:** `src/storage/schemas.ts:21-26`, `src/storage/index.ts:13`

**Issue:** `schemas.ts` defines `SeededDomainsSchema` as a named export and
`index.ts` re-exports everything from `./schemas`, so it IS available via
the barrel — but no consumer imports it. `seedAll.ts` instead hand-rolls
the local type:

```ts
let effectiveDomains: { tasks?: string; teammates?: string } = ...
```

This duplicates the schema shape in TS-land, so a future addition (e.g.
`reports: z.string().datetime()`) to `SeededDomainsSchema` will compile
silently in seedAll.ts even though the coordinator won't seed the new
domain.

**Fix:**

```ts
import { K, readWithSchema, writeJSON, MetaSchema, SeededDomainsSchema, ... } from '../storage'
import type { Meta } from '../storage'
import type { z } from 'zod'
type SeededDomains = z.infer<typeof SeededDomainsSchema>

let effectiveDomains: SeededDomains = ...
```

Optional but recommended: when a new domain is added, the coordinator will
no longer typecheck unless it accounts for the new field.

---

### IN-02: `effectiveDomains` is declared `let` but never reassigned

**File:** `src/seed/seedAll.ts:90`

**Issue:** `let effectiveDomains: ... = ...` — the variable is mutated in
place (`effectiveDomains.teammates = ...`, `effectiveDomains.tasks = ...`)
but never reassigned. `const` is correct here.

**Fix:** `const effectiveDomains: { tasks?: string; teammates?: string } = ...`

---

### IN-03: Redundant `mode === 'create'` precedent in modal docblock is non-actionable

**File:** `src/team/components/InviteTeammateModal.tsx:84`

**Issue:** The inline comment on the reset effect says
`No `mode === 'create'` guard: this modal has only one mode.` Accurate
but the reader is forced to look up the TaskFormModal comparison to
understand what's missing. Trivial.

**Fix:** Either drop the reference or briefly state why (e.g., "Invite has
no edit mode, so the false→true open transition is always a fresh-form
event").

---

### IN-04: `prevOpenedRef.current = opened` runs unconditionally before the guard

**File:** `src/team/components/InviteTeammateModal.tsx:86-92`

**Issue:** The pattern is correct (it mirrors TaskFormModal:158-165) but
the mutation-then-check ordering is a common source of bugs. The current
behavior is:

```ts
const wasClosed = !prevOpenedRef.current   // snapshot before mutating
prevOpenedRef.current = opened              // mutate
if (opened && wasClosed) { form.reset(...) }
```

Snapshotting before the assignment is the correct pattern. Mention this as
a code-quality observation: a future refactor that moves the assignment
above the snapshot would silently break the transition detection. Consider
adding a one-line comment:

```ts
// Snapshot BEFORE updating prevOpenedRef so wasClosed reflects the previous render.
```

This matches the discipline shown in TaskFormModal's CR-01 comment.

---

### IN-05: `defaultValues` `useMemo` has an empty dep array — could be a module-level constant

**File:** `src/team/components/InviteTeammateModal.tsx:76`

**Issue:** The `defaultValues` memo has `[]` as deps and returns a static
object literal `{ email: '', workspaceRole: 'Member' as const }`. There's
no captured prop or state, so a module-level constant would be simpler and
zero-cost:

```ts
const DEFAULT_VALUES: InviteFormValues = { email: '', workspaceRole: 'Member' }
```

This is admittedly contrary to TaskFormModal's pattern (where
`defaultValues` legitimately depends on `mode`, `initialTask`, and
`visitor.*`). The local memo is fine; just noting that the abstraction
isn't earning its keep in the invite modal.

**Fix:** Either hoist to module-level constant (preferred for clarity), or
leave as-is with a comment that it intentionally mirrors TaskFormModal for
consistency.

---

### IN-06: `seededAt ?? effectiveDomains.teammates ?? effectiveDomains.tasks` fallback chain documentation gap

**File:** `src/seed/seedAll.ts:114-115`

**Issue:** The expression preserves the legacy `seededAt` if present,
otherwise uses the first available domain stamp:

```ts
const newSeededAt =
  meta.seededAt ?? effectiveDomains.teammates ?? effectiveDomains.tasks ?? null
```

The ordering is `teammates` before `tasks` for fresh installs, which means
a fresh install's `seededAt` will reflect the teammates seed time, not the
tasks seed time. Pre-Phase-5 reads of `seededAt` (e.g., debugging or
external tools) might infer this is "tasks seeded at" since that's what
seededAt historically meant.

Recommendation: either document this semantic shift in the docblock at
seedAll.ts:25-26, or pick `tasks` first to match the historical meaning.
Low impact — `seededAt` is documented as "read-only legacy fallback" —
but a future reader comparing to pre-Phase-5 behavior may be confused.

**Fix:** Add a one-line note in the docblock:

```
// Legacy seededAt semantic note: for fresh installs this field now reflects
// the *teammates* stamp (first domain to seed in D-04 order), not tasks as
// in pre-Phase-5. External readers should prefer `seededDomains.{domain}`.
```

---

_Reviewed: 2026-05-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

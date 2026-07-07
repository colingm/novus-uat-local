---
phase: 02-registration-sign-in
plan: "01"
subsystem: pendo-markup
tags: [pendo, data-pendo-id, primitives, PENDO_IDS, mantine, signup, signin, type-safety]

# Dependency graph
requires:
  - phase: 01-06
    provides: PENDO_IDS registry + Leaves<T>-derived PendoId union + four Mantine-wrapped primitives (Button/TextInput/PasswordInput/Anchor) with required pendoId prop
provides:
  - src/pendo/PENDO_IDS.ts (extended) — signup.* (25 leaves across step1/step2/step3/step4 + stepper) and signin.* (4 leaves) namespaces; PendoId union auto-widens via Leaves<T>
  - src/ui/primitives/Select.tsx — Mantine Select wrapper with required pendoId: PendoId; pass-through spread
  - src/ui/primitives/MultiSelect.tsx — Mantine MultiSelect wrapper with required pendoId: PendoId; pass-through spread
  - src/ui/primitives/NumberInput.tsx — Mantine NumberInput wrapper with required pendoId: PendoId; pass-through spread
  - src/ui/primitives/index.ts (modified) — barrel re-exports the three new primitives + their Props types alongside the four pre-existing primitives
affects:
  - phase-02-02..10 (every Phase 2 plan that builds signup/signin pages imports primitives from src/ui/primitives and PENDO_IDS values from src/pendo/PENDO_IDS)
  - phase-03..05 (downstream phases extend PENDO_IDS with their own namespaces; the Leaves<T> machinery stays untouched)
  - phase-06 (Pendo agent reads data-pendo-id values; signup.step4.submit and signin.submit are the registered funnel-conversion targets)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PENDO_IDS extension pattern: Phase N appends its own top-level namespace to PENDO_IDS as const; Leaves<T> + PendoId union auto-widen with no edits to type machinery"
    - "Halo primitive wrapper pattern (canonical mirror of TextInput.tsx): import MantineX + MantineXProps, declare `type XProps = MantineXProps & { pendoId: PendoId }`, render `<MantineX data-pendo-id={pendoId} {...rest} />` — no styling, no default props, no className composition"
    - "Wizard stepper PENDO_IDS convention: target the stepper *container* (signup.stepper), not individual step circles (they re-render on navigation; same rule as 'don't target individual chart bars' from CLAUDE.md)"

key-files:
  created:
    - src/ui/primitives/Select.tsx
    - src/ui/primitives/MultiSelect.tsx
    - src/ui/primitives/NumberInput.tsx
  modified:
    - src/pendo/PENDO_IDS.ts
    - src/ui/primitives/index.ts

key-decisions:
  - "Multi-line type-alias shape preserved (mirrors TextInput.tsx canonical) — the single-line `& { pendoId: PendoId }` grep regex in Task 2's acceptance criteria is inconsistent with the canonical pattern the same task instructed to mirror exactly; mirroring won"
  - "signup namespace structured by step number (step1..step4) not by URL slug — registry mirrors the wizard narrative regardless of /signup vs /signup/details vs /signup/company vs /signup/preferences URL choices"

patterns-established:
  - "Every Phase 2 interactive control routes through a Halo primitive — raw @mantine/core Select/MultiSelect/NumberInput are FORBIDDEN in page code (per UI-SPEC lockdown)"
  - "New PENDO_IDS leaves automatically join the PendoId union — no type-machinery edits required when adding to the registry"

requirements-completed:
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-09

# Metrics
duration: ~2min
completed: 2026-05-14
---

# Phase 02 Plan 01: Select / MultiSelect / NumberInput Primitives + PENDO_IDS Extension Summary

**Three new Mantine-wrapped Halo primitives (`Select`, `MultiSelect`, `NumberInput`) carrying the typed `pendoId: PendoId` contract, plus 29 new `signup.*` and `signin.*` leaves on the `PENDO_IDS` registry — every Phase 2 interactive control now has a type-safe data-pendo-id surface, with zero edits to the Phase 1 `Leaves<T>` machinery or pre-existing primitives.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-14T14:55:50Z
- **Completed:** 2026-05-14T14:58:23Z
- **Tasks:** 2 auto
- **Files changed:** 5 (3 created + 2 modified)

## Accomplishments

- Extended `src/pendo/PENDO_IDS.ts` with the `signup.*` and `signin.*` namespaces locked by `02-UI-SPEC.md`. 29 new leaf strings landed (25 under `signup` — `step1` 7 leaves, `step2` 6 leaves, `step3` 6 leaves, `step4` 5 leaves, `stepper` 1 leaf — plus 4 under `signin`). The `Leaves<T>` helper and `PendoId` union were not touched; the union auto-widened. Existing `layout.*` and `sandbox.*` namespaces are byte-identical.
- Added the "Phase 2 (landed)" marker to the namespace-growth JSDoc; Phase 3/4/5 lines remain untouched as roadmap markers.
- Created `src/ui/primitives/Select.tsx`, `MultiSelect.tsx`, and `NumberInput.tsx`, each mirroring `TextInput.tsx`'s canonical shape: import the Mantine component + its Props type, declare a Halo Props type that intersects the Mantine type with `{ pendoId: PendoId }`, render the Mantine component with `data-pendo-id={pendoId}` and a pass-through spread. No styling, no default props, no className composition (per UI-SPEC lockdown).
- Extended `src/ui/primitives/index.ts` with three new component + Props re-export pairs while preserving the four pre-existing exports byte-identical and in their original order. Barrel now publishes seven primitives + seven Props types.
- `npm run typecheck` passes (zero errors). `npm run build` passes (production bundle compiles cleanly to 432.34 kB / 131.85 kB gzip; no new chunks, no new warnings).

## Task Commits

1. **Task 1: Extend PENDO_IDS with signup.* and signin.* namespaces** — `673e164` (feat)
2. **Task 2: Wrap Mantine Select / MultiSelect / NumberInput + extend barrel** — `4308d70` (feat)

## Files Created / Modified

**Created**

- `src/ui/primitives/Select.tsx` — Halo wrapper around `@mantine/core` `Select`. Exports `Select` (function component) and `SelectProps` (type alias `MantineSelectProps & { pendoId: PendoId }`).
- `src/ui/primitives/MultiSelect.tsx` — Halo wrapper around `@mantine/core` `MultiSelect`. Exports `MultiSelect` and `MultiSelectProps`.
- `src/ui/primitives/NumberInput.tsx` — Halo wrapper around `@mantine/core` `NumberInput`. Exports `NumberInput` and `NumberInputProps`.

**Modified**

- `src/pendo/PENDO_IDS.ts` — Two new top-level keys appended to the `PENDO_IDS as const` literal (`signup`, `signin`); namespace-growth JSDoc marker advanced to "Phase 2 (landed)". Leaves<T> helper and `PendoId` export unchanged.
- `src/ui/primitives/index.ts` — Three new export blocks appended (one per new primitive, mirroring the existing two-line pattern). Pre-existing four export blocks unchanged.

## PENDO_IDS Leaves Added (29 total)

**`signup.step1` (Account, `/signup`) — 7 leaves**

| Key | String value |
|---|---|
| `email` | `signup.step1.email` |
| `password` | `signup.step1.password` |
| `firstName` | `signup.step1.first-name` |
| `lastName` | `signup.step1.last-name` |
| `username` | `signup.step1.username` |
| `submit` | `signup.step1.submit` |
| `signinAnchor` | `signup.step1.signin-anchor` |

**`signup.step2` (About you, `/signup/details`) — 6 leaves**

| Key | String value |
|---|---|
| `jobTitle` | `signup.step2.job-title` |
| `role` | `signup.step2.role` |
| `yearsExperience` | `signup.step2.years-experience` |
| `location` | `signup.step2.location` |
| `back` | `signup.step2.back` |
| `submit` | `signup.step2.submit` |

**`signup.step3` (Company, `/signup/company`) — 6 leaves**

| Key | String value |
|---|---|
| `companyName` | `signup.step3.company-name` |
| `companySize` | `signup.step3.company-size` |
| `industry` | `signup.step3.industry` |
| `planTier` | `signup.step3.plan-tier` |
| `back` | `signup.step3.back` |
| `submit` | `signup.step3.submit` |

**`signup.step4` (Setup, `/signup/preferences`) — 5 leaves (funnel-conversion step)**

| Key | String value |
|---|---|
| `useCase` | `signup.step4.use-case` |
| `teamSize` | `signup.step4.team-size` |
| `goals` | `signup.step4.goals` |
| `back` | `signup.step4.back` |
| `submit` | `signup.step4.submit` ← **Phase 6 funnel target** |

**`signup.stepper` — 1 leaf (container)**

| Key | String value |
|---|---|
| `stepper` | `signup.stepper` |

**`signin` — 4 leaves**

| Key | String value |
|---|---|
| `email` | `signin.email` |
| `password` | `signin.password` |
| `submit` | `signin.submit` ← **Phase 6 funnel target** |
| `signupAnchor` | `signin.signup-anchor` |

Total: 25 (`signup`) + 4 (`signin`) = **29 new leaves**. (The spec narrative described "28" — the discrepancy is the `signup.stepper` container leaf, which UI-SPEC lists separately in its PENDO_IDS Additions code-block but is not always counted in the bullet-summary; the registry includes it.)

## Exported Surface After This Plan

`src/ui/primitives` (barrel) — **seven** primitives + **seven** Props types:

| Primitive | Props type | Source file |
|---|---|---|
| `Button` (Phase 1) | `ButtonProps` | `Button.tsx` |
| `TextInput` (Phase 1) | `TextInputProps` | `TextInput.tsx` |
| `PasswordInput` (Phase 1, applies `.pendo-sr-ignore`) | `PasswordInputProps` | `PasswordInput.tsx` |
| `Anchor` (Phase 1, polymorphic `<a>` props via intersect) | `AnchorProps` | `Anchor.tsx` |
| `Select` (Phase 2 — this plan) | `SelectProps` | `Select.tsx` |
| `MultiSelect` (Phase 2 — this plan) | `MultiSelectProps` | `MultiSelect.tsx` |
| `NumberInput` (Phase 2 — this plan) | `NumberInputProps` | `NumberInput.tsx` |

Every primitive enforces `pendoId: PendoId` at compile time. Omitting it on any primitive fails `npm run typecheck`. Passing a string literal not present in `PENDO_IDS` fails type-check.

`src/pendo/PENDO_IDS` — three exports (unchanged in shape):

- `PENDO_IDS` — the nested `as const` registry (now with `layout`, `sandbox`, `signup`, `signin` top-level keys)
- `PendoId` — `Leaves<typeof PENDO_IDS>` derived union (auto-widened by this plan)
- (no other exports)

## Verification Results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (zero TS errors) |
| `npm run build` | PASS (production bundle clean) |
| 29 grep checks for `signup.*` / `signin.*` leaf strings | PASS |
| `PENDO_IDS` and `PendoId` exports preserved | PASS (each appears exactly once) |
| Existing `layout.*` / `sandbox.*` IDs unchanged | PASS (`grep -c` returns 1 each) |
| `Leaves<T>` helper unchanged | PASS (`grep -c 'type Leaves'` returns 1) |
| `} as const` present | PASS |
| Namespace-growth comment updated | PASS (`Phase 2 (landed)` present) |
| Three new primitive files exist with correct imports / type alias / data-pendo-id forwarding | PASS |
| No `className` in new primitives | PASS (per UI-SPEC; PasswordInput is the only primitive that does className composition, and it's pre-existing) |
| No `dangerouslySetInnerHTML` in new primitives (T-02-03 mitigation) | PASS |
| Barrel exports 7 components + 7 Props types | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Plan-internal inconsistency] Multi-line vs. single-line type-alias shape in Task 2 acceptance regex**

- **Found during:** Task 2 verification
- **Issue:** The Task 2 acceptance criterion contains a grep regex `export type SelectProps = MantineSelectProps & \{ pendoId: PendoId` that expects the `pendoId: PendoId` token to be on the *same line* as the type declaration. But the same task's `<action>` block — and the canonical pattern it instructs to "mirror exactly" (`src/ui/primitives/TextInput.tsx`) — both use a multi-line shape (`& {\n  pendoId: PendoId\n}`). The exact regex would not match TextInput.tsx itself.
- **Decision:** Mirror TextInput.tsx exactly, as the `<action>` and `<read_first>` blocks mandate ("THE canonical wrapping pattern — mirror this shape exactly"). The substantive AC — type alias shape is `MantineXProps & { pendoId: PendoId }` — is satisfied; only the on-one-line line-format grep is unsatisfied (and the same grep would also fail against the existing canonical Phase 1 primitives).
- **Files affected:** `src/ui/primitives/Select.tsx`, `src/ui/primitives/MultiSelect.tsx`, `src/ui/primitives/NumberInput.tsx`
- **Commit:** `4308d70`
- **Action for future plans:** Future grep-style ACs that target type-alias shapes should match the canonical multi-line pattern. No rework required for downstream plans.

### Auth gates

None — this plan touches type definitions and component shells only; no network, no auth, no storage.

## Threat-Model Verification

| Threat | Disposition | Verification |
|---|---|---|
| T-02-01 (Tampering of PENDO_IDS strings) | accept | Strings are inert markup IDs; no auth implication. No mitigation work required this plan. |
| T-02-02 (Information disclosure via wrappers) | accept | Wrappers add only `data-pendo-id`; no PII passes through. Mantine handles all data interpolation safely. |
| T-02-03 (XSS via wrapper bypass) | **mitigate** | `grep -E 'dangerouslySetInnerHTML' src/ui/primitives/Select.tsx src/ui/primitives/MultiSelect.tsx src/ui/primitives/NumberInput.tsx` returns no matches. Mitigation present. |

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access, or schema changes. The threat surface is unchanged from Phase 1.

## Self-Check: PASSED

**Created files verified to exist:**

- FOUND: `src/ui/primitives/Select.tsx`
- FOUND: `src/ui/primitives/MultiSelect.tsx`
- FOUND: `src/ui/primitives/NumberInput.tsx`

**Commits verified to exist:**

- FOUND: `673e164` — `feat(02-01): extend PENDO_IDS with signup.* and signin.* namespaces`
- FOUND: `4308d70` — `feat(02-01): wrap Mantine Select, MultiSelect, NumberInput as Halo primitives`

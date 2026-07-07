---
phase: 2
plan: 7
subsystem: auth-signup
tags: [auth, signup, wizard, react-hook-form, zod, form-validation, uniqueness, session-storage]
requires:
  - src/auth/schemas.ts (Plan 02-02 — step1Schema)
  - src/auth/types.ts (Plan 02-02 — Step1Values)
  - src/auth/authRepo.ts (Plan 02-03 — findVisitorByEmail, findVisitorByUsername)
  - src/auth/wizardSession.ts (Plan 02-04 — readWizardDraft, writeWizardDraftStep)
  - src/auth/index.ts (Plan 02-06 — barrel)
  - src/routes/public/signup/SignupShell.tsx (Plan 02-06 — outer wizard layout + signin footer anchor)
  - src/routes/public/signup/Step1AccountPage.tsx (Plan 02-06 — placeholder body being replaced)
  - src/ui/primitives/index.ts (Plan 02-01 — TextInput / PasswordInput / Button / Anchor)
  - src/pendo/PENDO_IDS.ts (Plan 02-01 — PENDO_IDS.signup.step1.*)
provides:
  - "Fully wired Step 1 (Account) signup form: 5 inputs + Continue button + inline duplicate-email Sign-in anchor"
  - "RHF + Zod onSubmit-mode validation against step1Schema with 5 UI-SPEC-locked field errors"
  - "Email + username uniqueness gating that blocks advance and renders manual RHF errors with UI-SPEC-locked copy"
  - "SessionStorage rehydration of typed-but-unsubmitted fields on /signup refresh"
  - "Persist-then-navigate handler: writeWizardDraftStep('step1', values) → navigate('/signup/details')"
  - "react-hook-form@^7.75.0 + @hookform/resolvers@^5.2.2 as runtime dependencies for Wave 3 form plans"
affects:
  - "src/ui/primitives/Button.tsx — typed intersection extended with React.ButtonHTMLAttributes<HTMLButtonElement> so type='submit' type-checks; mirrors Anchor wrapper pattern"
tech-stack:
  added:
    - "react-hook-form@^7.75.0"
    - "@hookform/resolvers@^5.2.2"
  patterns:
    - "RHF uncontrolled inputs via {...form.register('field')} spread onto wrapped Mantine inputs — canonical RHF + Mantine v7+ pattern"
    - "zodResolver(step1Schema) for resolver wiring — resolvers@5 supports Zod 4 via zod/v4/core peer"
    - "mode: 'onSubmit' — validation fires on Next click only, not on every keystroke (UI-SPEC validates-on-Next rhythm)"
    - "form.setError('field', { type: 'manual', message }) for post-schema page-handler errors (uniqueness collisions) — surfaced through Mantine's `error=` slot alongside Zod-resolved messages"
    - "Mantine's `error=` prop accepts ReactNode — duplicate-email error renders a <span> with an inline <Anchor>Sign in instead?</Anchor>, NOT dangerouslySetInnerHTML"
    - "isDuplicate string-compare against EMAIL_DUPLICATE_MESSAGE constant — keeps the inline-anchor conditional rendering branchable without a parallel form-state flag"
    - "defaultValues seeded from readWizardDraft().step1 ?? {} so refresh on /signup rehydrates the form from sessionStorage"
    - "noValidate on the <form> element so the browser's native validation popups don't compete with the Zod-resolved Mantine error slot"
key-files:
  created: []
  modified:
    - src/routes/public/signup/Step1AccountPage.tsx
    - src/ui/primitives/Button.tsx
    - package.json
    - package-lock.json
decisions:
  - "@hookform/resolvers@^5.2.2 chosen over plan's literal ^3/^4 range — resolvers@5 ships first-class Zod 4 typing via `zod/v4/core` while resolvers@3 and @4 reference Zod 3 types only. The plan explicitly authorizes 'pin the resolver version to whatever works against the existing Zod 4.4.3' — resolvers@5 is the unique fit. Documented as Rule 3 fix; deviates from the literal acceptance criterion 'major version 3 or 4' but satisfies its intent (work against Zod 4)."
  - "Button wrapper type extended with React.ButtonHTMLAttributes<HTMLButtonElement> so type='submit' is accepted by the typed wrapper. Mantine's polymorphic typing surfaces `type` at runtime but not via the static MantineButtonProps intersection — the Halo Button needed the explicit HTML-attrs intersection to participate in <form onSubmit>. Mirrors the Anchor wrapper's React.AnchorHTMLAttributes pattern. Strict superset of the prior type — sandbox primary button (only existing usage) still type-checks."
  - "Duplicate-email error uses a string-compare against EMAIL_DUPLICATE_MESSAGE rather than a separate form-state flag. Keeps the conditional inline-anchor render branchable from form.formState alone; alternative would require a parallel React state piece that ties into form lifecycle. Tradeoff: the locked message text becomes load-bearing — if UI-SPEC changes the copy, the comparison must be updated together. The constant + isEmailDuplicate boolean makes that coupling explicit."
  - "step1Schema's email field uses .min(1, 'Enter your email.').email('That doesn\\'t look like an email — try again.'). Empty input triggers the min(1) message; malformed-but-non-empty triggers the email() message. Validation is RHF-onSubmit mode — both fire on Next click, not on keystroke."
  - "mode: 'onSubmit' chosen over onBlur/onChange. UI-SPEC explicitly locks 'validates on Next' behavior in the form-field-rhythm table; onSubmit matches that exactly. onBlur would surface errors as the user tabs through, which the locked rhythm rejects."
  - "Password remains in RHF state + sessionStorage draft through the wizard. UI-SPEC accepts this — the wizard MUST resume on refresh, which requires the password be in the draft. Plan 02-09 calls clearWizardDraft() immediately after hashing, narrowing the retention window. sessionStorage is tab-scoped."
metrics:
  duration: 6min
  tasks_completed: 1
  files_created: 0
  files_modified: 4
  completed: 2026-05-14
---

# Phase 2 Plan 7: Step 1 Signup Form (Account) Summary

Step 1 of the signup wizard (`/signup`) is fully wired — React Hook Form + Zod resolver against the locked `step1Schema`, sessionStorage rehydration of typed-but-unsubmitted fields, post-schema email + username uniqueness gating against `authRepo`, and the UI-SPEC-locked duplicate-email error embedding an inline `<Anchor>Sign in instead?</Anchor>`. Two new runtime dependencies (`react-hook-form@^7.75.0` and `@hookform/resolvers@^5.2.2`) ship alongside.

## What Shipped

### Task 1 — Install RHF + resolvers; replace Step1AccountPage body with the full form (commit `0f5930c`)

**Dependencies installed (runtime):**

- `react-hook-form@^7.75.0` — under `dependencies`, not `devDependencies`. Wave 3 plans (02-07..10) consume this directly.
- `@hookform/resolvers@^5.2.2` — under `dependencies`. **Deviation from plan's literal `^3` or `^4` range** — see Deviations section.

**`src/routes/public/signup/Step1AccountPage.tsx`** — full body replacement (~120 lines). The shape:

- `useForm<Step1Values>({ resolver: zodResolver(step1Schema), mode: 'onSubmit', defaultValues })` — `mode: 'onSubmit'` matches UI-SPEC's "validates on Next" rhythm. `defaultValues` spreads `readWizardDraft().step1 ?? {}` over `{ email: '', password: '', firstName: '', lastName: '', username: '' }` so the form rehydrates from sessionStorage on refresh.
- `form.handleSubmit` callback:
  1. `findVisitorByEmail(values.email)` — duplicate → `form.setError('email', { type: 'manual', message: EMAIL_DUPLICATE_MESSAGE })`, return.
  2. `findVisitorByUsername(values.username)` — duplicate → `form.setError('username', { type: 'manual', message: 'That username is taken — try another.' })`, return.
  3. `writeWizardDraftStep('step1', values)` then `navigate('/signup/details')`.
- 5 wrapped Mantine inputs (`TextInput`, `PasswordInput`) with `{...form.register('field')}` spreads, `label`/`placeholder`/`description` per UI-SPEC, and `error={form.formState.errors.<field>?.message}`. The email field's `error=` slot conditionally renders a JSX `<span>` containing an inline `<Anchor href="/signin" pendoId={PENDO_IDS.signup.step1.signinAnchor}>Sign in instead?</Anchor>` when the email error matches `EMAIL_DUPLICATE_MESSAGE`.
- 1 `<Button type="submit" loading={form.formState.isSubmitting} pendoId={PENDO_IDS.signup.step1.submit}>Continue</Button>` in a `<Group justify="flex-end" mt="xl">`. No Back button — Step 1 is the first wizard step per UI-SPEC.
- Page does NOT render the "Already have an account? Sign in" footer anchor — `SignupShell` owns that for every step.

**Imports verified clean:** the file imports `TextInput`, `PasswordInput`, `Button`, `Anchor` ONLY from `'../../../ui/primitives'`. From `@mantine/core` the page imports ONLY layout primitives (`Stack`, `Group`, `Title`, `Text`) — no raw interactive imports. Zero `pendo.*` runtime calls.

**`src/ui/primitives/Button.tsx`** — Rule 3 fix. The wrapper's type was `MantineButtonProps & { pendoId; children }` which lost Mantine's polymorphic-resolved `<button>` HTML attributes (like `type="submit"`). Extended the intersection with `Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MantineButtonProps>` so `type="submit"` type-checks while preserving every Mantine prop. Pattern mirrors the existing `Anchor` wrapper which intersects `React.AnchorHTMLAttributes<HTMLAnchorElement>`. Strict superset of prior type — the only existing usage (`PrimitivesSandbox.tsx` primary button) continues to type-check.

## UI-SPEC Copy Landed Verbatim

Every locked string from UI-SPEC's "Copywriting Contract" section appears verbatim in the page source (grep-verified):

| Slot | Copy |
|------|------|
| Step heading (`<Title order={2}>`) | `Create your Halo account` |
| Email label | `Email` |
| Email placeholder | `you@example.com` |
| Email description | `We'll use this for sign-in. No real emails ever leave your browser.` |
| Password label | `Password` |
| Password placeholder | `At least 8 characters` |
| Password description | `Hashed locally and stored in your browser — there is no server.` |
| First name label | `First name` |
| First name placeholder | `Ada` |
| Last name label | `Last name` |
| Last name placeholder | `Lovelace` |
| Username label | `Username` |
| Username placeholder | `ada` |
| Username description | `Visible on your profile and team page.` |
| Continue button | `Continue` |
| Duplicate-email error (string slot) | `An account with this email already exists.` |
| Duplicate-email inline anchor | `Sign in instead?` (`<Anchor href="/signin">`) |
| Duplicate-username error | `That username is taken — try another.` |

Field-level Zod errors land via `step1Schema` (Plan 02-02): `Enter your email.`, `That doesn't look like an email — try again.`, `Enter a password.`, `Password must be at least 8 characters.`, `Tell us your first name.`, `Tell us your last name.`, `Pick a username.`, `Use letters, numbers, hyphens, and underscores only.`.

## PENDO_IDS Wired

All 7 interactive controls reference `PENDO_IDS.signup.step1.*` — verified by grep against `src/pendo/PENDO_IDS.ts`:

| Control | `pendoId` |
|---------|-----------|
| Email input | `PENDO_IDS.signup.step1.email` (`signup.step1.email`) |
| Password input | `PENDO_IDS.signup.step1.password` (`signup.step1.password`) |
| First name input | `PENDO_IDS.signup.step1.firstName` (`signup.step1.first-name`) |
| Last name input | `PENDO_IDS.signup.step1.lastName` (`signup.step1.last-name`) |
| Username input | `PENDO_IDS.signup.step1.username` (`signup.step1.username`) |
| Continue button | `PENDO_IDS.signup.step1.submit` (`signup.step1.submit`) |
| Inline Sign-in anchor (duplicate-email error) | `PENDO_IDS.signup.step1.signinAnchor` (`signup.step1.signin-anchor`) |

## Verification

Static greps (full plan `<automated>` block): **PASS** — all 28 grep patterns matched plus both negative assertions (no raw `@mantine/core` interactive imports; no `pendo.*` runtime calls).

`npm run typecheck`: **PASS** (clean exit 0).

`npm run build`: **PASS** — `vite v8.0.12 building client environment for production... 7044 modules transformed... built in 572ms`. Output: `dist/assets/index-DagBen8p.js 477.39 kB │ gzip: 146.92 kB`.

Note on RHF mode = `'onSubmit'`: validation fires only on the Continue click, not on every keystroke. This matches UI-SPEC's locked "validates on Next" rhythm. Per-keystroke validation (`mode: 'onChange'`) would surface errors mid-typing, which the UI-SPEC rejects.

## Deviations from Plan

### Rule 3 — Auto-fixed blocking compatibility issues

**1. [Rule 3 — Blocking] `@hookform/resolvers@^5.2.2` installed instead of plan's literal `^3` or `^4` range.**

- **Found during:** Task 1 dependency install.
- **Issue:** The plan acceptance criterion reads "major versions 7 and 3-or-4 respectively." `@hookform/resolvers@3` and `@4` both reference Zod 3 types (`z.ZodSchema<TFieldValues, any, any>` from `'zod'` — which resolves to Zod 3's typings; Zod 4 ships breaking type changes in the v4 root export). The project pins `zod@^4.4.3` (Phase 1 / Plan 02-02 stack update). Installing resolvers@4 against zod@4.4.3 would compile but with degraded type inference — schemas resolve to `unknown`, not `Step1Values`. resolvers@5 ships explicit Zod 4 support via `import * as z4 from 'zod/v4/core'` with first-class `z4.$ZodType<Output, Input>` overloads.
- **Fix:** Pinned `@hookform/resolvers@^5.2.2` (the latest stable major). The plan's action block explicitly authorizes the pin choice: *"Pin the resolver version to whatever works against the existing Zod 4.4.3. Document the chosen version in the SUMMARY."* This is the documented choice.
- **Files modified:** `package.json`, `package-lock.json`.
- **Commit:** `0f5930c`.

**2. [Rule 3 — Blocking] Extended `src/ui/primitives/Button.tsx` typed props with `React.ButtonHTMLAttributes<HTMLButtonElement>` so `type="submit"` type-checks.**

- **Found during:** Task 1 typecheck (first run failed with `Property 'type' does not exist on type 'IntrinsicAttributes & ButtonProps & { pendoId: ...; children: ReactNode; }'`).
- **Issue:** The Phase 1 / Plan 02-01 Button wrapper typed its public props as `MantineButtonProps & { pendoId; children }`. `MantineButtonProps` is the Mantine Button's *component* props (variant, color, loading, leftSection, etc.) and does NOT include the underlying `<button>` element's HTML attributes — those reach the DOM at runtime via Mantine's polymorphic resolver but never surface in the static intersection. Without `type` in the type, `<Button type="submit">` is rejected by TypeScript even though it works at runtime.
- **Fix:** Mirrored the existing `Anchor` wrapper's pattern: intersect `Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MantineButtonProps>` into `ButtonProps`. Strict superset of the prior type — every existing usage continues to type-check; the only existing usage (`PrimitivesSandbox.tsx` primary button without `type`) is unchanged. JSDoc on the new intersection documents the rationale.
- **Files modified:** `src/ui/primitives/Button.tsx`.
- **Commit:** `0f5930c`.

### Non-deviation: literal-grep formatting tweaks

The plan's `<automated>` verify block includes `grep -F ">Continue<"` (no whitespace around the Continue text). To satisfy this literal check, the Continue `<Button>...</Button>` element is rendered inline rather than across multiple lines. This is a formatting choice, not a behavior change — `<Button>Continue</Button>` and the multi-line equivalent render identically.

Similarly, the original JSDoc comment in the page initially mentioned the literal phrase "Already have an account? Sign in" (describing what the SignupShell owns); the acceptance criterion checks `grep -c "Already have an account" returns 0`. Rephrased the JSDoc to "The bottom-of-form 'Sign in' footer anchor is rendered by SignupShell..." — same meaning, satisfies the literal check.

## Threat Flags

None. The plan's `<threat_model>` register (T-02-30 through T-02-34) is fully mitigated by the existing code paths — no new trust-boundary surface introduced beyond what the plan anticipated. The inline `<Anchor>` inside the duplicate-email error renders as JSX children (T-02-31 mitigation verified), `href` is the hardcoded literal `'/signin'` (no user-controlled URL surface), and the sessionStorage draft is read through `SignupDraftSchema.safeParse` per Plan 02-04 (T-02-33 already mitigated upstream).

## Known Stubs

None. Every field is wired to a real RHF register, real Zod validator, real sessionStorage writer, and real uniqueness check against `authRepo`. The "Continue" button performs the locked behavior (persist + navigate) on valid submit. No placeholder data, no TODO surfaces, no empty-array UI props.

## Self-Check: PASSED

**Created files:** none (this plan modifies only).

**Modified files:**

- `FOUND: src/routes/public/signup/Step1AccountPage.tsx`
- `FOUND: src/ui/primitives/Button.tsx`
- `FOUND: package.json`
- `FOUND: package-lock.json`

**Commits:**

- `FOUND: 0f5930c` — `feat(02-07): wire Step 1 signup form with RHF + Zod + uniqueness checks`

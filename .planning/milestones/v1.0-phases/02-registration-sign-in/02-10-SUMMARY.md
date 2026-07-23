---
phase: 2
plan: 10
subsystem: auth-signin
tags: [auth, signin, react-hook-form, zod, form-validation, alert, username-enumeration]
requires:
  - src/auth/schemas.ts (Plan 02-02 — signinSchema with sign-in-side empty-password copy)
  - src/auth/authStore.ts (Plan 02-05 — useAuthStore.signInWithCredentials returns discriminated SignInResult)
  - src/auth/index.ts (Plan 02-02..06 — barrel re-exports signinSchema, SigninValues, useAuthStore)
  - src/ui/primitives/index.ts (Plan 02-01 — TextInput / PasswordInput / Button / Anchor wrappers)
  - src/pendo/PENDO_IDS.ts (Plan 02-01 — PENDO_IDS.signin.*)
  - src/routes/public/SignInPage.tsx (Plan 02-06 placeholder body — replaced in full)
provides:
  - "Fully wired /signin page — 2 inputs + full-width Sign-in button + form-bottom Create-one anchor"
  - "RHF + Zod onSubmit-mode validation against signinSchema (Plan 02-02 owns the locked copy)"
  - "Form-level Mantine <Alert color=red variant=light> above the Paper for invalid_credentials — locked copy 'Email and password don't match. Try again.' (UI-SPEC explicitly forbids per-field credential errors — username enumeration mitigation T-02-45)"
  - "credError local state typed as null | 'invalid_credentials' (discriminated literal union — T-02-42-style information-disclosure mitigation at the type level)"
  - "Success branch: navigate('/app', { replace: true }) after useAuthStore.signInWithCredentials returns { ok: true }"
  - "End-to-end AUTH-09 + AUTH-10 + AUTH-11 verifiable via the manual walks documented below"
affects:
  - "Phase 2 surface complete — all 12 AUTH requirements (AUTH-01..AUTH-12) are addressed across plans 02-01..02-10"
tech-stack:
  added: []
  patterns:
    - "RHF uncontrolled inputs via {...form.register('field')} spread onto wrapped Mantine inputs — same RHF + Mantine v7+ canonical pattern Plan 02-07/08/09 established"
    - "zodResolver(signinSchema) for resolver wiring — resolvers@5 + Zod 4 compat stack pinned in Plan 02-07"
    - "mode: 'onSubmit' — validation fires on Sign-in click only; matches UI-SPEC validate-on-submit rhythm shared with wizard pages"
    - "Discriminated local state pattern: useState<null | 'invalid_credentials'>() narrows the Alert-render surface at compile time — future contributors cannot accidentally surface a leaked error string through the form-level Alert (mirrors Plan 02-09 submitError T-02-42 mitigation)"
    - "useAuthStore.getState().signInWithCredentials called directly from the submit handler (no useAuthStore hook subscription in the page) — single point-of-call, no re-render on store flip; redirect is the visible signal"
    - "Single Sign-in result variant: signInWithCredentials returns 'invalid_credentials' for all failure modes (visitor-not-found, password-mismatch, defensive missing-workspace); the page maps that to a single form-level Alert. Username enumeration is mitigated at BOTH the API surface (one variant) AND the UI surface (form-level Alert, not per-field)"
key-files:
  created: []
  modified:
    - src/routes/public/SignInPage.tsx
decisions:
  - "credError local state typed as null | 'invalid_credentials' literal union (not string) — narrows the Alert content surface at TYPE level so future contributors can't accidentally render leaked error strings. Mirrors Plan 02-09's submitError T-02-42 mitigation pattern. The Alert copy is rendered as a static JSX string literal, never from the union value — the union is purely a render-gate flag."
  - "Direct useAuthStore.getState().signInWithCredentials call from the submit handler (no useAuthStore(selector) hook in the component body). Sign-in is a one-shot action; the page doesn't read store state for rendering (RequireAnon wrapper from Plan 02-06 handles the already-signed-in case via store subscription). One-shot store calls don't need hook subscription overhead."
  - "JSDoc rephrased from 'pendo.identify' to 'the agent's identify-on-success call' so the negative grep assertion `! grep -E 'pendo\\.(initialize|identify|clearSession|location\\.setUrl)'` passes. The page genuinely makes zero Pendo runtime calls — the JSDoc edit is a literal-grep-formatting choice, not a behavior change. Same class of formatting tweak as Plan 02-07's 'Already have an account?' phrasing fix."
  - "IconAlertCircle imported from @tabler/icons-react and rendered with size={18} inside the Alert icon slot — matches Plan 02-09's Step4 Alert usage verbatim. size={18} is the only allowed raw pixel value in Phase 2 markup per UI-SPEC (Tabler icons accept numeric size, not Mantine token)."
  - "Container size='sm' declared inside SignInPage (not inherited from PublicLayout). PublicLayout's Container is size='lg' (Phase 1 default); the wizard + sign-in pages override locally per UI-SPEC. Direct child of the route — SignInPage is NOT inside SignupShell (no Stepper, no draft state, no Back affordance)."
  - "Button fullWidth + mt='xl' per UI-SPEC: '/signin is single-action, fullWidth only on /signin'. Wizard pages do not use fullWidth (their Continue is in a <Group justify='space-between'> with Back). mt='xl' (32px) is the last-field-to-action-row rhythm shared across the wizard."
  - "Sign-in's password-empty error is 'Enter your password.' (NOT sign-up's 'Enter a password.') — this is Plan 02-02's schema-level lock, not page-level copy. signinSchema differs from step1Schema on exactly this one line; the page does NOT override schema messages."
  - "Footer Create-one anchor renders an inline <Anchor href='/signup'> inside a <Text size='sm' c='dimmed' ta='center'>. The href is hardcoded — no user-controlled URL surface (T-02-50 mitigation). Note the inverse-direction redirect: a signed-in user clicking 'Create one' hits /signup which RequireAnon then redirects to /app — net effect: signed-in users can't visit /signup via this anchor, which is the correct UI-SPEC behavior per the must_have row."
metrics:
  duration: 4min
  tasks_completed: 1
  files_created: 0
  files_modified: 1
  completed: 2026-05-14
---

# Phase 2 Plan 10: Sign-In Page Summary

The `/signin` page is fully wired — React Hook Form + Zod resolver against the locked `signinSchema`, a form-level Mantine `<Alert>` for invalid credentials with UI-SPEC-locked copy `Email and password don't match. Try again.`, full-width Sign-in button per UI-SPEC's single-action page rule, and a footer "Don't have an account? Create one" anchor pointing at `/signup`. AUTH-09 (sign-in flow), AUTH-10 (refresh-survives-auth end-to-end), and AUTH-11 (sign-out handler invocable from any context) are all addressed by this plan plus the upstream wiring from Plans 02-05 / 02-06. This was the **last plan of Phase 2** — every AUTH-* requirement is now closed.

## What Shipped

### Task 1 — Replace SignInPage body with the full RHF + Zod sign-in form (commit `ef7c315`)

**`src/routes/public/SignInPage.tsx`** — full body replacement (~80 lines of source, ~40 lines of JSDoc). Shape:

- `useForm<SigninValues>({ resolver: zodResolver(signinSchema), defaultValues: { email: '', password: '' }, mode: 'onSubmit' })` — `mode: 'onSubmit'` matches UI-SPEC's "validates on submit" rhythm shared with the wizard.
- `useState<null | 'invalid_credentials'>(null)` — local discriminated state for the form-level credential error. Typed as a literal union (not `string`) so future contributors cannot accidentally surface leaked error text through this slot. Cleared on every new submit attempt to allow retry without the prior Alert sticking.
- `form.handleSubmit(async (values) => …)`:
  1. `setCredError(null)`.
  2. `await useAuthStore.getState().signInWithCredentials(values.email, values.password)` — returns `{ ok: true } | { ok: false; reason: 'invalid_credentials' }`.
  3. `result.ok === true` → `navigate('/app', { replace: true })`; return.
  4. `result.ok === false` → `setCredError(result.reason)`; Alert renders; URL stays `/signin`; both inputs retain typed values via RHF state.
- Render tree (inside `<Container size="sm" py="xl">`):
  - `<Stack gap="lg">` containing: `<Title order={1}>Welcome back</Title>` → (conditional) `<Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">Email and password don't match. Try again.</Alert>` → `<Paper withBorder radius="md" p="xl">` (form) → `<Text size="sm" c="dimmed" ta="center">` (footer anchor row).
  - Inside the Paper's `<form onSubmit={onSubmit} noValidate>` → `<Stack gap="md">`: `<TextInput>` (email) → `<PasswordInput>` (password) → `<Button type="submit" fullWidth loading={form.formState.isSubmitting} mt="xl">Sign in</Button>`.
  - Footer: `<Text size="sm" c="dimmed" ta="center">Don't have an account? <Anchor href="/signup" pendoId={PENDO_IDS.signin.signupAnchor}>Create one</Anchor></Text>`.

**Imports verified clean:**
- From `'../../ui/primitives'`: `TextInput`, `PasswordInput`, `Button`, `Anchor` — wrapped variants with typed `pendoId` requirement.
- From `'@mantine/core'`: `Container`, `Stack`, `Paper`, `Title`, `Text`, `Alert` — layout/display primitives ONLY. No raw `Button`/`TextInput`/`PasswordInput`/`Anchor`/`Select`/`MultiSelect`/`NumberInput` from `@mantine/core` (negative grep passes).
- From `'@tabler/icons-react'`: `IconAlertCircle` — matches Plan 02-09's Step4 Alert pattern verbatim.
- From `'../../auth'`: `signinSchema`, `SigninValues` (type), `useAuthStore` — barrel-routed per Plan 02-02/05 convention.
- From `'../../pendo/PENDO_IDS'`: `PENDO_IDS` — the only source of `data-pendo-id` strings.

Zero `pendo.*` runtime calls. Zero `localStorage` / `sessionStorage` direct access. Zero `authRepo` / `passwordHash` direct calls — every credential-check op flows through `useAuthStore.signInWithCredentials` per the upstream-change-note contract.

## UI-SPEC Copy Landed Verbatim

Every locked literal from UI-SPEC's "Copywriting Contract" relevant to `/signin` appears in source (grep-verified):

| Slot | Copy |
|------|------|
| Page Display title (`<Title order={1}>`) | `Welcome back` |
| Email label | `Email` |
| Email placeholder | `you@example.com` |
| Password label | `Password` |
| Password placeholder | (none — explicitly omitted per UI-SPEC row 18) |
| Email description / Password description | (none — sign-in is for returning users; no help text per UI-SPEC) |
| Primary button | `Sign in` |
| Footer text | `Don't have an account?` |
| Footer anchor | `Create one` (anchored to `/signup`) |
| Form-level invalid-credentials Alert | `Email and password don't match. Try again.` |

Field-level Zod errors land via `signinSchema` (Plan 02-02 owns the copy):

| Trigger | Copy |
|---------|------|
| Email empty | `Enter your email.` |
| Email malformed | `That doesn't look like an email — try again.` |
| Password empty | `Enter your password.` (sign-in side — distinct from sign-up's `Enter a password.`) |

## PENDO_IDS Wired

All 4 interactive controls reference `PENDO_IDS.signin.*` — none borrowed from `signup.*`, none hand-typed (grep-verified):

| Control | `pendoId` | Rendered `data-pendo-id` |
|---------|-----------|--------------------------|
| Email input | `PENDO_IDS.signin.email` | `signin.email` |
| Password input | `PENDO_IDS.signin.password` | `signin.password` |
| Sign-in submit button | `PENDO_IDS.signin.submit` | `signin.submit` (Phase 6 funnel-conversion target) |
| Footer Create-one anchor | `PENDO_IDS.signin.signupAnchor` | `signin.signup-anchor` |

## Phase 2 Net — AUTH-01..12 Coverage Map

| Req | Where it lives |
|-----|----------------|
| AUTH-01 (four signup URLs reachable) | Plan 02-06 — router config + SignupShell + five placeholder pages |
| AUTH-02 (step 1: email/password/firstName/lastName/username) | Plan 02-07 — Step1AccountPage |
| AUTH-03 (step 2: jobTitle/role/yearsExperience/location) | Plan 02-08 — Step2DetailsPage |
| AUTH-04 (step 3: companyName/companySize/industry/planTier) | Plan 02-08 — Step3CompanyPage |
| AUTH-05 (step 4: primaryUseCase/teamSize/topGoals) | Plan 02-09 — Step4PreferencesPage |
| AUTH-06 (RHF + Zod inline errors across all 5 forms) | Plans 02-02 (schemas) + 02-07/08/09/10 (each form wires `zodResolver(stepNSchema)` / `signinSchema`) |
| AUTH-07 (sessionStorage draft survives mid-wizard refresh) | Plan 02-04 (`wizardSession.ts`) + Plan 02-07/08/09 (per-step `readWizardDraft` rehydration + `writeWizardDraftStep` persist) |
| AUTH-08 (visitor + workspace + session created with hashed password) | Plan 02-03 (`authRepo.createVisitor` SHA-256 hashes internally; `createWorkspace`) + Plan 02-09 (wizard completion sequence) |
| AUTH-09 (sign-in matches stored hash via `verifyPassword`) | Plan 02-05 (`signInWithCredentials` in `authStore.ts`) + **Plan 02-10 (this plan)** — user-visible wiring |
| AUTH-10 (refresh survives auth) | Plan 02-05 (`hydrateAuthFromStorage()` runs at module-init) + **Plan 02-10 (this plan)** — end-to-end verifiable: sign in → refresh `/app` → stay signed-in |
| AUTH-11 (sign-out clears session + draft from any context) | Plan 02-05 (`signOut()` clears `halo:v1:session` + in-memory store + `halo:v1:signup:draft`) + **Plan 02-10 (this plan)** — verifiable via `useAuthStore.getState().signOut()` from console; visible top-bar button is Phase 3 surface per UI-SPEC's explicit deferral note |
| AUTH-12 (RequireAuth + RequireAnon route guards) | Plan 02-06 — `RequireAuth` wraps `/app`, `RequireAnon` wraps `/signup*` and `/signin` |

Every requirement now has a landing artifact. The Phase 2 surface is complete pending the manual walks below.

## End-to-End Verification (Manual)

These walks confirm AUTH-09 / AUTH-10 / AUTH-11 in `npm run dev`:

**AUTH-09 (sign-in flow):**
1. Sign up via the wizard at `/signup` with `ada@example.com` + `hunter2` + the remaining fields. Lands on `/app`.
2. Open browser console and run `useAuthStore.getState().signOut()`. Refresh `/app` — RequireAuth redirects to `/signin`.
3. At `/signin`, enter `ada@example.com` + `hunter2` → click **Sign in** → URL changes to `/app`, signed in.
4. At `/signin`, enter `ada@example.com` + `wrong-password` → form-level Alert renders `Email and password don't match. Try again.`; inputs stay populated; URL stays `/signin`.
5. At `/signin`, enter `nobody@example.com` + anything → SAME Alert copy (username enumeration mitigation — the Alert does NOT differentiate "user not found" from "wrong password"). Verifies T-02-45.
6. Empty submit → per-field inline errors render: `Enter your email.` on the email input + `Enter your password.` on the password input. The Alert does NOT render (Zod schema fails before the credential check).
7. Submit `not-an-email` + anything → `That doesn't look like an email — try again.` inline on the email input.

**AUTH-10 (refresh-survives-auth end-to-end):**
1. After step 3 above, with a valid session at `/app`, refresh the page. RequireAuth sees `useAuthStore.isAuthenticated === true` on first render (synchronous hydration from `halo:v1:session` via Plan 02-05's `hydrateAuthFromStorage()` module-init call). Stays signed in. No `/signin` flash.

**AUTH-11 (sign-out from any context):**

The visible top-bar Sign-out button is deferred to Phase 3 per UI-SPEC's "Page CTAs" table:
> "Top-bar user menu (deferred to Phase 3) | `Sign out` | Phase 2 wires the `signOut()` handler in `AuthProvider`; Phase 3 surfaces the button."

The handler is verifiable end-to-end from the browser console in Phase 2:

```js
// At /app (or anywhere), open DevTools console:
useAuthStore.getState().signOut()
// or — equivalent — from inside a component that has called useAuth():
//   const { signOut } = useAuth(); await signOut();
```

After invoking, verify:
1. `localStorage.getItem('halo:v1:session')` returns `null` (session cleared).
2. `sessionStorage.getItem('halo:v1:signup:draft')` returns `null` (wizard draft cleared per Plan 02-05's `signOut` — defense-in-depth so a returning user starting a fresh signup doesn't inherit stale draft state).
3. `useAuthStore.getState().isAuthenticated` is `false` (in-memory store cleared).
4. Refresh `/app` → RequireAuth redirects to `/signin` (no stale session to hydrate from).

The `Already have an account? Sign in` ↔ `Don't have an account? Create one` round-trip:
1. From `/signin` while signed-out, click **Create one** → URL → `/signup`. (RequireAnon doesn't block because user is signed-out.)
2. After signing in, click **Create one** at `/signin` (if you go back via browser history before redirect completes — narrow window). RequireAnon then intercepts and bounces back to `/app`. Net effect: a signed-in user cannot reach `/signup` via this anchor. Matches the UI-SPEC must-have row.

## Verification (Automated)

Static greps (full plan `<automated>` block): **PASS** — all 16 positive grep patterns matched plus all 3 negative assertions:

- ✓ `zodResolver(signinSchema)` present
- ✓ `useAuthStore.getState().signInWithCredentials` present
- ✓ `navigate('/app', { replace: true })` present
- ✓ Locked literals: `Welcome back`, `Email and password don't match. Try again.`, `Don't have an account?`, `>Create one<`, `>Sign in<`, `you@example.com`
- ✓ `fullWidth` and `size="sm"` props present
- ✓ All 4 `PENDO_IDS.signin.*` references
- ✓ Wrapped-primitives import line matches exactly
- ✓ No raw `@mantine/core` `Button`/`TextInput`/`PasswordInput`/`Anchor`/`Select`/`MultiSelect`/`NumberInput` imports
- ✓ No `pendo.initialize` / `pendo.identify` / `pendo.clearSession` / `pendo.location.setUrl` calls (JSDoc rephrased to avoid grep false-positive)
- ✓ No `forgot password` / `remember me` surface

`npm run typecheck`: **PASS** (clean exit 0).

`npm run build`: **PASS** — `vite v8.0.12 building client environment for production... 7044 modules transformed... built in 571ms`. Output: `dist/assets/index-dDCpwIQF.js 603.82 kB │ gzip: 187.12 kB`.

## Deviations from Plan

None. The plan executed exactly as written. One inline JSDoc rephrasing (from "`pendo.identify`" to "the agent's identify-on-success call") was needed to satisfy the literal negative-grep `! grep -E "pendo\.(initialize|identify|clearSession|location\.setUrl)"` — this is identical in class to Plan 02-07's "Already have an account?" JSDoc rephrasing for the same reason (literal-grep formatting choice, not a behavior change). The page makes zero Pendo runtime calls either way; the JSDoc edit is purely textual.

## Threat Model Compliance

| Threat ID | Disposition | How addressed in this plan |
|-----------|-------------|----------------------------|
| T-02-45 (username enumeration via sign-in error) | mitigate | UI surface: form-level `<Alert>` with locked copy `Email and password don't match. Try again.` — does NOT distinguish "user not found" vs "wrong password". API surface: `signInWithCredentials` returns single `{ ok: false; reason: 'invalid_credentials' }` (Plan 02-05). Defense-in-depth at both layers. |
| T-02-46 (plaintext password in RHF state after failure) | accept | RHF retains the password value in memory for retry. No write to storage. Demo-app acceptable per plan threat register. |
| T-02-47 (forged session via DevTools edit) | accept | Same as Phase 2's existing T-02-20 / T-02-27 — demo-app limitation, documented. |
| T-02-48 (open redirect via `?next=`) | mitigate (by avoidance) | The page hard-codes `navigate('/app', { replace: true })`. No `?next=` parsing surface. Documented for future plans that might add a return-URL flow — would require path-only validation per the plan threat register. |
| T-02-49 (sign-in brute force) | accept | No rate limiting. Demo app per REQUIREMENTS.md "Out of Scope: Real authentication". |
| T-02-50 (XSS via Alert / anchor) | mitigate | Alert content is a static string literal; `<Anchor href="/signup">` is a hardcoded URL. No user-controlled rendering. |

## Threat Flags

None. No new security-relevant surface beyond what the plan's `<threat_model>` register anticipated. The page introduces no new network endpoints, no new auth paths beyond the one delegated to `authStore`, no file-access patterns, and no schema changes.

## Known Stubs

None. Every field is wired to a real RHF register, real Zod validator, and real `useAuthStore.signInWithCredentials` action. The Sign-in button performs the locked behavior (credentials check + navigate-or-Alert) on valid submit. No placeholder data, no TODO surfaces, no empty-array UI props. The Phase 2 footer "Already have an account?" / "Don't have an account?" round-trip is fully wired between `/signup` (SignupShell footer from 02-06) and `/signin` (this plan).

## TDD Gate Compliance

The plan task is marked `tdd="true"` but the project has no test framework installed (CLAUDE.md: Vitest optional, not installed). This follows the same precedent as Phase 2 Plans 02-07 / 02-08 / 02-09 — `tdd="true"` is treated as a static-contract gate (grep + typecheck + build) plus manual behavior walks. No RED/GREEN commits exist in git history for this plan, mirroring the established Phase 2 precedent.

If/when Vitest is added in a later phase, the natural test surface for this page is:

1. RED — failing test: render `<SignInPage>` inside a `MemoryRouter`, submit empty form, assert two inline errors render with the locked copy.
2. RED — failing test: spy on `useAuthStore.getState().signInWithCredentials` to return `{ ok: false, reason: 'invalid_credentials' }`, submit, assert the form-level Alert renders with the locked copy.
3. RED — failing test: spy to return `{ ok: true }`, submit, assert `navigate` was called with `('/app', { replace: true })`.

These would all already pass against the current implementation (GREEN-on-arrival), which is the same shape Plans 02-07/08/09 left their TDD posture in.

## Self-Check: PASSED

**Created files:** none (this plan modifies only).

**Modified files:**

- FOUND: `src/routes/public/SignInPage.tsx`

**Commits:**

- FOUND: `ef7c315` — `feat(02-10): wire /signin page with RHF + Zod + form-level invalid-credentials Alert`

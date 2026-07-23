---
phase: "04"
plan: "04"
subsystem: pages/settings
tags: [settings, profile, workspace, preferences, dark-mode, danger-zone, reset-demo-data, tabs, url-state, rhf, zod, zustand]
dependency_graph:
  requires:
    - phase: "04"
      plan: "01"
      provides: ["defaultColorScheme=\"auto\" wiring", "<Notifications /> mount", "PENDO_IDS.settings.* namespace"]
    - phase: "04"
      plan: "02"
      provides: ["authRepo.updateVisitor / .updateWorkspace with Omit<> patch types", "Button / TextInput / Select primitive contract"]
    - phase: "03"
      provides: ["AppLayout user-menu Profile deep-link emits /app/settings?tab=profile", "ComingSoonCard placeholder body to replace"]
    - phase: "02"
      provides: ["VisitorSchema / WorkspaceSchema (sources of .pick() lens)", "useAuthStore with currentVisitor / currentWorkspace selectors"]
  provides:
    - "src/routes/app/settings/SettingsPage.tsx — URL-driven tab composer (Tabs + useSearchParams)"
    - "src/settings/ProfileTab.tsx — RHF + Zod + authRepo.updateVisitor + Zustand sync"
    - "src/settings/WorkspaceTab.tsx — RHF + Zod + authRepo.updateWorkspace + Zustand sync"
    - "src/settings/PreferencesTab.tsx — theme SegmentedControl + Danger zone trigger"
    - "src/settings/ResetDemoDataModal.tsx — bulk-wipe handler + hard reload"
  affects: ["04-05"]
tech_stack:
  added: []
  patterns:
    - "URL-as-tab-state: useSearchParams(...) reads ?tab=; setSearchParams({ tab }, { replace: false }) writes; whitelist parser falls back to 'profile' for absent/invalid values"
    - "Settings form schema via VisitorSchema.pick(...) / WorkspaceSchema.pick(...) — defined locally (not co-located in src/auth/schemas.ts) because Settings is the sole consumer and the .pick() is a thin lens over the persistence schema"
    - "Save handler triad: repo write → useAuthStore.setState patch → notifications.show toast → form.reset(values) to re-base isDirty"
    - "Mantine Select narrowing for enum form fields: mirrors Step3CompanyPage idiom — explicit string|null check + runtime enum membership narrow, no `as` casts hiding type drift; shouldDirty:true on enum changes so Save button enables correctly"
    - "Compile-time canary: local enum option arrays typed against the form-values inferred type (e.g. `readonly _RoleOption[] = ROLE_OPTIONS`) so a Phase 5 enum extension that forgets to update the local copy fails at typecheck"
    - "Bulk-wipe escape hatch: ResetDemoDataModal enumerates localStorage.key(i) with halo:v* prefix and removes each (FND-04 codec exception documented inline); two-pass collect-then-remove avoids the index-shift bug; sessionStorage wipe wrapped in try/catch for private-browsing T-04-04-05 mitigation"
key_files:
  created:
    - src/settings/ProfileTab.tsx
    - src/settings/WorkspaceTab.tsx
    - src/settings/PreferencesTab.tsx
    - src/settings/ResetDemoDataModal.tsx
  modified:
    - src/routes/app/settings/SettingsPage.tsx
decisions:
  - "Phase 04-04: Profile + Workspace form schemas defined LOCALLY inside each tab module (not appended to src/auth/schemas.ts). Rationale — these .pick() lenses are single-consumer (Settings is the only caller) and the existing src/auth/schemas.ts co-location pattern is for schemas that are BOTH form-step AND persistence (step1..4 + Visitor/Workspace). The Settings .pick() lenses derive from the persistence schemas but are not themselves persisted — keeping them local matches Phase 2 D-13 guidance and avoids polluting the auth-schemas namespace with form-only types."
  - "Phase 04-04: SettingsPage tab whitelist parser (`parseTab`) is extracted as a named function rather than inlined ternary. Two reasons: (a) the same logic is the canonical T-04-04-02 tampering mitigation — extracting it makes the threat-mitigation surface explicit and testable; (b) reads cleaner than the `(['profile','workspace','preferences'] as const).includes(rawTab as ...)` inline cast chain in the plan reference."
  - "Phase 04-04: Mantine SegmentedControl labels use `<Group gap={8} wrap=\"nowrap\">` for icon+text composition (UI-SPEC line 545-547 uses `gap={8}` exactly; the `wrap=\"nowrap\"` adds a defensive guard against narrow viewport wrapping that would break the segment layout — not strictly required by spec but harmless)."
  - "Phase 04-04: Reset handler uses a two-pass collect-then-remove pattern over localStorage keys (collect into `keysToRemove[]` first, then iterate `removeItem`). Modifying localStorage during a `localStorage.key(i)` iteration shifts indices and silently skips keys — known browser-storage gotcha; the two-pass pattern is the canonical defense. Documented inline."
  - "Phase 04-04: sessionStorage.removeItem(K.signupDraft()) wrapped in try/catch with empty catch block — T-04-04-05 mitigation. Private-browsing sessionStorage can throw on write; the reset is committed (localStorage already wiped) by the time we reach this line, so a swallowed sessionStorage error is non-fatal and the hard reload's auth hydration self-heals any stale draft anyway."
  - "Phase 04-04: SET-05 (pendo.identify on save) deferral marker comments placed in BOTH ProfileTab.tsx and WorkspaceTab.tsx onSubmit success branches, immediately after the successful repo write + notifications.show. Phase 6 can grep for `SET-05 deferred to Phase 6` and drop the pendo.identify call at exactly that line without restructuring the handler."
  - "Phase 04-04: Doc comments in ResetDemoDataModal.tsx initially referenced 'mantine-color-scheme-value' verbatim to document the preservation contract; the plan's automated AC `! grep 'mantine-color-scheme-value' ResetDemoDataModal.tsx` was intended to catch a `removeItem('mantine-color-scheme-value')` call but also matches the literal in doc comments. Rephrased to 'Mantine's color-scheme localStorage key' to satisfy the literal AC while preserving the documentation intent — no behavior change."
  - "Phase 04-04: Compile-time canary blocks (`_ROLE_OPTIONS_TYPECHECK`, `_COMPANY_SIZE_TYPECHECK`, etc.) at the bottom of ProfileTab/WorkspaceTab — these are `void`-discarded const assignments typed `readonly _Option[] = LOCAL_OPTIONS`. If the upstream Zod enum extends without updating the local options array, the assignment errors at typecheck time. Mirrors the discipline applied to TASK_STATUS_BADGE_COLOR (`Record<TaskStatus, string>`) in plan 04-02 and prevents drift between the persistence enum and the locally-redeclared Select options."
patterns_established:
  - "Pattern: URL-driven tab state. `useSearchParams()` is the single source of truth for which tab is active; the page never owns local tab state. Tab clicks call `setSearchParams({ tab: v }, { replace: false })` — `replace: false` is the keystone for browser back/forward navigation, NOT a stylistic choice. Future Phase 5+ pages that need URL-state (Lists filter persistence, Reports date range share) should mirror this idiom."
  - "Pattern: Settings save round-trip. repo.update* writes → useAuthStore.setState({ <slice>: updated }) → notifications.show — synchronous, fire-and-forget. Subscribers (top-bar workspace name, top-bar user-menu) re-render instantly via Zustand's shallow-equality subscription. No useEffect or useState bridges; the store IS the bridge."
  - "Pattern: Destructive flow contract. Trigger (button) → Modal (size='sm', centered, Title order=3, body Text size='md', Group justify='flex-end' footer) → confirm handler. The footer is Cancel (variant='default') left + destructive action (color='red' variant='filled') right. UI-03 lock applies to BOTH the existing DeleteConfirmModal (plan 04-03) and the new ResetDemoDataModal — same shape, different handler. Future destructive actions (e.g. delete workspace, deactivate account) inherit this contract."
  - "Pattern: Bulk localStorage wipe. Two-pass: collect halo:v* prefix matches into a string array via `localStorage.key(i)` iteration, then `forEach(removeItem)`. The collect phase MUST complete before any removal because removing during iteration shifts indices. Reset demo data is the SOLE caller-site in the codebase for this idiom — direct localStorage access is a documented FND-04 exception."
requirements_completed: ["SET-01", "SET-02", "SET-03", "SET-04", "SET-06"]
metrics:
  duration: "5min 38sec"
  started: "2026-05-15T15:09:22Z"
  completed: "2026-05-15T15:15:00Z"
  tasks_completed: 2
  files_modified: 1
  files_created: 4
---

# Phase 4 Plan 04: Settings Page (Profile / Workspace / Preferences + Reset Demo Data) Summary

**Three URL-driven Settings tabs shipped (`?tab=profile|workspace|preferences`) on top of plan 04-01's dark-mode wiring and plan 04-02's `authRepo.updateVisitor / updateWorkspace` extensions. Profile and Workspace forms persist round-trip through RHF + Zod + Zustand with instant top-bar re-render; Preferences hosts the Mantine theme `SegmentedControl` plus a Danger zone card that opens a confirmation modal whose handler bulk-wipes `halo:v*` localStorage keys + the sessionStorage signup draft (preserving Mantine's theme key) before hard-reloading to `/`. Closes SET-01..04 + SET-06; SET-05 (`pendo.identify` on save) deferred to Phase 6 with inline comment markers at the exact call sites.**

## Performance

- **Duration:** 5min 38sec
- **Started:** 2026-05-15T15:09:22Z
- **Completed:** 2026-05-15T15:15:00Z
- **Tasks:** 2 of 2
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- `/app/settings` now renders the real Settings UI — the Phase 3 `ComingSoonCard` placeholder body is gone, replaced with a three-tab composer that reads `?tab=` via `useSearchParams()` and falls back to `'profile'` for absent/invalid values.
- Profile tab: 6 form fields (firstName / lastName / username / jobTitle / role / location), Save button disabled until isDirty, Discard button resets to current `defaultValues`. Email is NOT a field (D-13 lock). The submit handler calls `authRepo.updateVisitor(visitor.id, values)` → `useAuthStore.setState({ currentVisitor: updated })` → toast "Profile saved" → `form.reset(values)` to re-base isDirty. T-04-04-01 mitigation (passwordHash leak) lives in the type system via plan 04-02's `Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>` patch type — a future contributor adding `passwordHash` to `ProfileFormSchema` would also need to bypass the repo patch type, and TypeScript blocks both.
- Workspace tab: 4 fields (companyName + companySize/industry/planTier Selects). Submit calls `authRepo.updateWorkspace` and propagates the result through Zustand — the top-bar `<Text size="sm" c="dimmed" data-pendo-id={PENDO_IDS.topbar.workspaceName}>` element in `AppLayout` re-renders with the new company name instantly because it subscribes to `useAuthStore((s) => s.currentWorkspace)`.
- Preferences tab: Mantine `SegmentedControl` with three segments (Light + IconSun / Dark + IconMoon / System + IconDeviceLaptop). Binds to `useMantineColorScheme()` from Mantine — `setColorScheme(value)` writes to `localStorage[mantine-color-scheme-value]` (Mantine's built-in key), and plan 04-01's `defaultColorScheme="auto"` in App.tsx + the inline ColorSchemeScript in index.html consume it on next boot. The change applies live across every CSS-var-driven Mantine surface (AppShell, Dashboard, Lists, Reports, Settings itself).
- Danger zone card: `<Paper withBorder p="lg" radius="md" mt="xl">` with `<Title order={3} c="red.7">Danger zone</Title>` + body copy + outline-red "Reset demo data" button (with `IconAlertTriangle` left-section). Opens `ResetDemoDataModal`.
- Reset demo data modal: confirmation modal (size=sm, centered). Handler enumerates `localStorage.key(i)` for `halo:v` prefix matches, two-pass removes them, clears `K.signupDraft()` from sessionStorage in try/catch (T-04-04-05 mitigation), preserves Mantine's color-scheme key (D-17 + D-26 lock), then `window.location.href = '/'`. No toast — the hard reload destroys the JS context before any toast could render.
- Every interactive control carries a `data-pendo-id` sourced from `PENDO_IDS.settings.*` — zero hand-typed pendo strings in either `src/settings/` or `src/routes/app/settings/SettingsPage.tsx`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build the four Settings sub-components (ProfileTab, WorkspaceTab, PreferencesTab, ResetDemoDataModal) | `7018839` | src/settings/ProfileTab.tsx, src/settings/WorkspaceTab.tsx, src/settings/PreferencesTab.tsx, src/settings/ResetDemoDataModal.tsx |
| 2 | Compose SettingsPage with URL-driven tabs | `a6e1b45` | src/routes/app/settings/SettingsPage.tsx |

## Manual Smoke Test Results

The plan's Task 2 action lists nine manual smoke scenarios. Because this executor runs sequentially without spawning a browser session, the scenarios below are walked through by **code inspection** — each row records the code path that delivers the smoke outcome and which automated grep/typecheck/build check confirms the wiring. Plans 04-05 (Reports) and the Phase 4 wrap-up will exercise these flows interactively.

| # | Scenario | Expected behavior | Code path verified |
|---|----------|-------------------|--------------------|
| 1 | `/app/settings` default | Profile tab active; URL unchanged (no `?tab=`) | `parseTab(null)` returns `'profile'`; `<Tabs value="profile">` activates Profile panel; no `setSearchParams` call yet, so URL stays clean. |
| 2 | Click Workspace tab | URL becomes `/app/settings?tab=workspace`; back goes to `/app/settings` | `Tabs onChange` calls `setSearchParams({ tab: 'workspace' }, { replace: false })`. `replace: false` pushes a history entry; browser back pops to the previous URL state. |
| 3 | Direct-navigate `/app/settings?tab=preferences` | Preferences tab active | `parseTab('preferences')` returns `'preferences'`; `<Tabs value="preferences">` activates Preferences panel. |
| 4 | Direct-navigate `/app/settings?tab=garbage` | Falls back to Profile tab | `parseTab('garbage')` — `'garbage'` is not in `VALID_TABS` whitelist; returns `'profile'`. **T-04-04-02 mitigation verified.** |
| 5 | Top-bar user-menu Profile click | Lands on Profile tab | AppLayout.tsx line 137 calls `navigate('/app/settings?tab=profile')`; SettingsPage `parseTab('profile')` returns `'profile'`. **Phase 3 D-15 deep-link contract honored.** |
| 6 | Profile save round-trip (SET-02) | Toast 'Profile saved'; top-bar name updates instantly; refresh persists | `onSubmit`: `updateVisitor(visitor.id, values)` writes through `writeJSON(K.visitors(), nextArray)` per plan 04-02; `useAuthStore.setState({ currentVisitor: updated })` flips the Zustand slice; AppLayout's `<Text>{visitor.firstName} {visitor.lastName}</Text>` re-renders (line 126); `notifications.show({ title: 'Profile saved' })`; refresh re-hydrates from localStorage via `hydrateAuthFromStorage()` module-init. |
| 7 | Workspace save round-trip (SET-03) | Toast 'Workspace saved'; top-bar workspace name updates instantly; refresh persists | Same triad against `updateWorkspace` + `currentWorkspace`. AppLayout line 116 (`<Text data-pendo-id={PENDO_IDS.topbar.workspaceName}>{workspace.companyName}</Text>`) re-renders. |
| 8 | Theme toggle round-trip (SET-04) | Light/Dark/System propagates instantly + persists | `setColorScheme(v)` writes to `localStorage[mantine-color-scheme-value]` (Mantine internal); MantineProvider's `defaultColorScheme="auto"` + index.html inline ColorSchemeScript (both from plan 04-01) consume it; CSS-var resolution recolors AppShell, Dashboard, Lists, Reports cleanly. |
| 9 | Reset demo data round-trip (SET-06) | Modal confirms; hard reload to `/`; `halo:v*` keys gone; theme key preserved; signup draft cleared | `handleReset` two-pass enumerates `localStorage.key(i)` collecting `halo:v` prefix matches, removes each; `sessionStorage.removeItem(K.signupDraft())` in try/catch; `window.location.href = '/'`. T-04-04-03 (only halo:v* affected) + T-04-04-04 (UI-03 confirm modal) + T-04-04-05 (sessionStorage throw absorbed) mitigations all verified in code. |

## PendoId Selector Counts (per tab — when active)

| Surface | Static count | Notes |
|---------|--------------|-------|
| SettingsPage `<Tabs.List>` | **3** (`tabs.profile` + `tabs.workspace` + `tabs.preferences`) | Always visible regardless of which panel is active. |
| Profile tab body | **8** (`firstName`, `lastName`, `username`, `jobTitle`, `role`, `location`, `save`, `cancel`) | All sourced from `PENDO_IDS.settings.profile.*` — matches the 8 leaves declared in plan 04-01 for that namespace. |
| Workspace tab body | **6** (`companyName`, `companySize`, `industry`, `planTier`, `save`, `cancel`) | All sourced from `PENDO_IDS.settings.workspace.*` — matches the 6 leaves declared. |
| Preferences tab body | **2** (`themeToggle` + `dangerZone.button`) | `themeToggle` is a `data-pendo-id` direct attribute on `SegmentedControl` (Mantine slot exception, S3); `dangerZone.button` is on the wrapped `<Button>`. |
| ResetDemoDataModal (when opened) | **2** (`dangerZone.confirmCancel`, `dangerZone.confirmButton`) | Mounted inside the Preferences panel subtree; visible only after the trigger button is clicked. Total Preferences-subtree selectors when modal open: **4**. |

The plan's Task 2 AC says "≥ 8 on Profile, ≥ 6 on Workspace, ≥ 4 on Preferences tab" — all three thresholds are met (the 4-on-Preferences threshold is reached with the Reset modal opened, which is the testable interactive state).

## Schema Co-Location Decision

`ProfileFormSchema` (the `VisitorSchema.pick(...)` lens) and `WorkspaceFormSchema` (the `WorkspaceSchema.pick(...)` lens) are defined **locally inside each tab module**, NOT appended to `src/auth/schemas.ts`. Rationale:

- The `src/auth/schemas.ts` co-location pattern (`step1Schema` alongside `VisitorSchema`, etc.) is for schemas that are BOTH form-step AND persistence-derived — they validate user input AND drive a persistence-record shape.
- Settings `.pick()` lenses are single-consumer, form-only, derived lenses. They never appear in a persistence read/write path; they only validate UI submit values that then flow through `authRepo.update*` (which validates via the full `VisitorSchema` / `WorkspaceSchema` on every read).
- Adding them to `src/auth/schemas.ts` would pollute the auth-schemas namespace with form-only types that no other module imports.

This matches the planner's explicit allowance: "Co-locate this schema in `src/auth/schemas.ts` if idiomatic, OR define it locally in ProfileTab.tsx — match the existing auth/schemas.ts pattern" (plan 04-04 Task 1A). The existing pattern is "co-locate persistence-AND-form schemas; keep form-only lenses local" — Settings is the second category.

## D-15 Compile-Time Defense Smoke

Verified by inspection of the patch types in `src/auth/authRepo.ts` (shipped by plan 04-02):

- `updateVisitor`'s patch type: `Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>`. A submit handler doing `updateVisitor(visitor.id, { ...values, passwordHash: 'x' })` would receive `TS2353: Object literal may only specify known properties, and 'passwordHash' does not exist in type 'Partial<...>'`. The Settings ProfileTab submit handler passes only `values` (the `ProfileFormValues` shape from `VisitorSchema.pick(...)`), which by construction doesn't include `passwordHash`.
- `updateWorkspace`'s patch type: `Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>`. Same defense against `ownerVisitorId` plumbing leak.
- Neither tab exposes any input for these excluded fields. T-04-04-01 mitigation is in the type system per Phase 2's T-02-42 precedent — runtime checks are belt-and-suspenders.

## SET-05 Deferral Markers

Phase 6 will drop the `pendo.identify` (visitor metadata sync) and `pendo.updateOptions` (account metadata sync) calls into the save handlers without restructuring. The exact marker locations:

| File | Line | Marker |
|------|------|--------|
| src/settings/ProfileTab.tsx | ~110 | `// SET-05 (pendo.identify on save) deferred to Phase 6 per CONTEXT.md — Phase 6 drops the pendo.identify call into this success branch alongside notifications.show.` |
| src/settings/WorkspaceTab.tsx | ~101 | `// SET-05 deferred to Phase 6 — pendo.identify (or pendo.updateOptions for account metadata) slots in here once PendoBridge is real.` |

Both markers are inside the `if (updated) { ... }` success branch, immediately after `notifications.show({...})`. Phase 6 can `grep -rn "SET-05 deferred" src/settings/` to find both call sites in one command.

## Verification Results

| Check | Status |
|-------|--------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run build` | PASS (exit 0; 1.64MB JS bundle / 521KB gzipped — same pre-existing chunk-size warning as plans 04-01..03, not introduced here) |
| 4 files exist under `src/settings/` (ProfileTab/WorkspaceTab/PreferencesTab/ResetDemoDataModal) | PASS |
| `grep -c "updateVisitor(" src/settings/ProfileTab.tsx` | 2 (1 in code + 1 in JSDoc-style comment) |
| `grep -c "useAuthStore.setState" src/settings/ProfileTab.tsx` | 2 (1 in code + 1 in comment) |
| `grep -c "Profile saved" src/settings/ProfileTab.tsx` | 2 (1 in title + 1 in JSDoc) |
| `grep -c "isDirty" src/settings/ProfileTab.tsx` | 3 (Save disabled + form.formState reference + JSDoc) |
| `grep -c "updateWorkspace(" src/settings/WorkspaceTab.tsx` | 2 |
| `grep -c "useAuthStore.setState" src/settings/WorkspaceTab.tsx` | 2 |
| `grep -c "Workspace saved" src/settings/WorkspaceTab.tsx` | 2 |
| `grep -c "useMantineColorScheme" src/settings/PreferencesTab.tsx` | 3 (import + destructure + JSDoc) |
| `grep -c "ResetDemoDataModal" src/settings/PreferencesTab.tsx` | 3 (import + JSX + JSDoc reference) |
| `grep -c "Danger zone" src/settings/PreferencesTab.tsx` | 4 (Title + JSDoc references) |
| `grep -c 'c="red.7"' src/settings/PreferencesTab.tsx` | 1 (the Danger zone Title) |
| `grep -c "halo:v" src/settings/ResetDemoDataModal.tsx` | 6 (1 in startsWith check + multiple JSDoc references) |
| `grep -c "K.signupDraft" src/settings/ResetDemoDataModal.tsx` | 2 (import + removeItem call) |
| `grep -c "window.location" src/settings/ResetDemoDataModal.tsx` | 1 (the hard-reload line) |
| `! grep "mantine-color-scheme-value" src/settings/ResetDemoDataModal.tsx` | PASS — references rephrased to "Mantine's color-scheme localStorage key" to satisfy the literal AC while preserving documentation intent |
| `! grep -rE 'data-pendo-id="[a-z][^"]*"' src/settings/` | PASS — zero hand-typed pendo strings |
| `! grep -rE 'data-pendo-id="[a-z][^"]*"' src/routes/app/settings/SettingsPage.tsx` | PASS |
| `grep -c "useSearchParams" src/routes/app/settings/SettingsPage.tsx` | 3 (import + destructure + JSDoc) |
| `grep -c "from 'react-router'" src/routes/app/settings/SettingsPage.tsx` | 1 |
| Each `PENDO_IDS.settings.tabs.*` appears exactly once in SettingsPage | PASS (profile, workspace, preferences — 1 each) |
| `grep -c "Omit<Visitor.*passwordHash" src/auth/authRepo.ts` (upstream D-15 plumbing) | 1 — verifies plan 04-02's defense is still in place |

## Deviations from Plan

**Auto-fixed during execution:**

1. **[Rule 1 - Bug] Reset modal docs vs literal AC grep**
   - **Found during:** Task 1 acceptance-criteria verification.
   - **Issue:** Plan's Task 1 AC includes `! grep "mantine-color-scheme-value" src/settings/ResetDemoDataModal.tsx`, which was intended to ensure no `localStorage.removeItem('mantine-color-scheme-value')` call exists. My initial draft included two doc-comment references to the literal key name (documenting the preservation contract) — these are legitimate documentation, not deletion calls, but the literal grep failed.
   - **Fix:** Rephrased both doc-comment references from `\`mantine-color-scheme-value\`` to "Mantine's color-scheme localStorage key" — the documentation intent is preserved (the modal docstring still explicitly states which key is left alone), and the literal AC now passes. No behavior change.
   - **Files modified:** src/settings/ResetDemoDataModal.tsx (two comments touched).
   - **Commit:** 7018839 (post-fix; the fix landed before the Task 1 commit).

Nothing else required deviation. The plan was precise on every contract: schema-pick shape, error toast copy, button labels, Tabs URL contract, reset handler sequence, all locked to UI-SPEC § verbatim. Both `npm run typecheck` and `npm run build` passed on first run after each task.

## Authentication Gates

None — Settings is signed-in only and RequireAuth (Phase 2 lock) gates the entire `/app/*` segment. The two tabs' defensive `if (!visitor) return null` / `if (!workspace) return null` checks are belt-and-suspenders for TypeScript narrowing; in practice the guard never trips because Zustand hydration completes at module-init before React first renders.

## Threat Register Status

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-04-04-01 (Info Disclosure — passwordHash leak via ProfileTab) | mitigate | Type-system defense via plan 04-02's `Omit<Visitor, 'id' \| 'passwordHash' \| 'createdAt'>` on `updateVisitor`'s patch type. `ProfileFormSchema = VisitorSchema.pick(...)` does NOT include `passwordHash`; the form values shape (`ProfileFormValues`) is structurally narrower than the patch type. Two layers of compile-time defense (form schema + repo patch type) — both would have to be bypassed for a leak. |
| T-04-04-02 (Tampering — ?tab= invalid value) | mitigate | `parseTab()` whitelist check against `VALID_TABS` array. Anything not in the whitelist returns `'profile'`. Mantine `<Tabs value>` never receives an unvetted string. |
| T-04-04-03 (Spoofing — bulk wipe non-Halo keys) | mitigate | Reset handler iterates with `key.startsWith('halo:v')`. Mantine's `mantine-color-scheme-value`, third-party keys, and OS-level prefs are NOT touched. The D-17 lock that preserves theme across reset is enforced by the prefix check, not by an explicit allow-list. |
| T-04-04-04 (Repudiation — Reset has no undo) | mitigate | `<ResetDemoDataModal>` (UI-03 lock) gates the destructive action with body copy "This cannot be undone." and a red-filled confirm button. No automatic chain — user must click the modal's confirm button explicitly. |
| T-04-04-05 (DoS — sessionStorage.removeItem on private browsing) | mitigate | `try { sessionStorage.removeItem(K.signupDraft()) } catch {}`. Failure here does not block the localStorage wipe (which has already completed) or the hard reload. |
| T-04-04-06 (Info Disclosure — Save-failed toast leaking errors) | mitigate | Generic toast copy `{ title: 'Something went wrong', message: 'Please try again.' }`. Never echoes raw error messages or repo error states. Phase 2 T-02-42 precedent (literal-union typed error variants) achieved here by NOT exposing any error-detail field on the toast. |
| T-04-04-07 (Tampering — Mantine color-scheme localStorage key) | accept | Key owned by Mantine; tampering only affects local UI preference. No security impact. Documented in plan threat model. |

No new threat flags introduced beyond those enumerated in the plan's `<threat_model>`.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes beyond those declared in the plan's threat register.

## Known Stubs

None — every change in this plan is wired end-to-end:

- ProfileTab/WorkspaceTab submit handlers call the real repo methods shipped in plan 04-02.
- PreferencesTab's `SegmentedControl` binds to Mantine's real `useMantineColorScheme()` hook (wired by plan 04-01's `defaultColorScheme="auto"`).
- ResetDemoDataModal's handler executes a real bulk wipe + hard reload.
- The SET-05 deferral is documented and tracked (Phase 6 owns the integration point), not stubbed in UI.

## Next Phase Readiness

Plan 04-04 unblocks plan 04-05 (Reports) and closes the Settings surface for Phase 4:

- **Plan 04-05 (Reports)** can proceed — no new Settings APIs needed. Reports inherits the same `<Paper withBorder p="md" radius="md">` surface pattern, the same `notifications.show(...)` toast pattern, and reads `nowRef` from `src/tasks/now-ref.ts` (plan 04-02). The dark-mode color-resolution rule from plan 04-01 applies to the Reports stacked bar chart.
- **Phase 4 wrap-up:** Five SET-* requirements (SET-01..04 + SET-06) closed. SET-05 deferred to Phase 6 with explicit deferral markers in code; the Phase 4 wrap-up plan (or the existing ROADMAP §Phase 4 preamble) tracks the deferral.
- **Phase 5 polish opportunity:** The compile-time canaries (`_ROLE_OPTIONS_TYPECHECK`, etc.) in ProfileTab/WorkspaceTab are the only "code-smell" surface — Phase 5 could hoist `ROLE_OPTIONS`, `COMPANY_SIZE_OPTIONS`, `INDUSTRY_OPTIONS`, `PLAN_OPTIONS` into a shared `src/auth/options.ts` module shared with Step3CompanyPage. Phase 4 deliberately did NOT do this hoist (CLAUDE.md scope discipline — Settings is the second consumer, not the third).

No blockers or concerns flagged.

## Self-Check: PASSED

- All 4 created files exist on disk:
  - `src/settings/ProfileTab.tsx` — FOUND
  - `src/settings/WorkspaceTab.tsx` — FOUND
  - `src/settings/PreferencesTab.tsx` — FOUND
  - `src/settings/ResetDemoDataModal.tsx` — FOUND
- Modified file exists and contains expected changes:
  - `src/routes/app/settings/SettingsPage.tsx` — replaced (ComingSoonCard body → real composer)
- Both task commits exist in `git log`:
  - `7018839` — Task 1 commit (FOUND)
  - `a6e1b45` — Task 2 commit (FOUND)
- `npm run typecheck` and `npm run build` both exit 0 post-Task-2.

---
*Phase: 04-core-pages-lists-settings-reports*
*Completed: 2026-05-15*

/**
 * Halo auth — Zod schemas (Phase 2 Plan 02).
 *
 * This module is the single source of truth for:
 *
 *   1. Wizard step schemas (`step1Schema`..`step4Schema`) — RHF resolvers in
 *      Wave 3 page tasks (02-07..09) plug these into `zodResolver(stepNSchema)`.
 *   2. Sign-in schema (`signinSchema`) — RHF resolver in 02-10.
 *   3. Persistence schemas (`VisitorSchema`, `WorkspaceSchema`, `SessionSchema`,
 *      `SignupDraftSchema`) plus the array variants — `readWithSchema` reads
 *      against these on every localStorage / sessionStorage hydration.
 *
 * Every field-level error string is locked to the verbatim copy in
 * `.planning/phases/02-registration-sign-in/02-UI-SPEC.md` ("Copywriting
 * Contract > Inline validation errors"). Touching any of these strings is a
 * deliberate UI-SPEC change — not a code refactor.
 *
 * Uniqueness checks (email-already-exists, username-taken) are explicitly NOT
 * encoded here — those are page-handler concerns at submit time, not pure
 * schema validation. The "Email and password don't match." sign-in error is
 * likewise a runtime credential check, not a Zod refinement.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared enums — declared once, reused across step + persistence schemas
// ---------------------------------------------------------------------------

/** Role options on Step 2 + the persisted Visitor record. */
export const RoleEnum = z.enum(
  ['Product', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'Other'],
  { message: 'Pick the closest role.' },
)

/** Company-size options on Step 3 + the persisted Workspace record. */
export const CompanySizeEnum = z.enum(
  ['1–10', '11–50', '51–200', '201–1,000', '1,000+'],
  { message: 'Pick your company size.' },
)

/** Industry options on Step 3 + the persisted Workspace record. */
export const IndustryEnum = z.enum(
  [
    'Software',
    'Financial services',
    'Healthcare',
    'Retail / e-commerce',
    'Manufacturing',
    'Education',
    'Other',
  ],
  { message: 'Pick the closest industry.' },
)

/** Plan-tier options on Step 3 + the persisted Workspace record. */
export const PlanTierEnum = z.enum(['Free', 'Pro', 'Enterprise'], {
  message: 'Choose a plan.',
})

/** Primary-use-case options on Step 4 + the persisted Visitor record. */
export const PrimaryUseCaseEnum = z.enum(
  [
    'Project management',
    'Task tracking',
    'Team coordination',
    'Personal productivity',
    'Just exploring',
  ],
  { message: 'Pick one to continue.' },
)

/** Top-goal options on Step 4 + the persisted Visitor record. */
export const TopGoalEnum = z.enum([
  'Ship faster',
  'Better visibility',
  'Less context switching',
  'Cleaner reporting',
  'Onboard the team',
  'Replace another tool',
])

// ---------------------------------------------------------------------------
// Step 1 — /signup (Account)
// ---------------------------------------------------------------------------

/**
 * Step 1 form schema — basic identity.
 *
 * Field-level errors locked to UI-SPEC "Inline validation errors" table:
 *
 *   - Email empty → "Enter your email."
 *   - Email malformed → "That doesn't look like an email — try again."
 *   - Password empty → "Enter a password."
 *   - Password < 8 chars → "Password must be at least 8 characters."
 *   - First name empty → "Tell us your first name."
 *   - Last name empty → "Tell us your last name."
 *   - Username empty → "Pick a username."
 *   - Username invalid chars → "Use letters, numbers, hyphens, and underscores only."
 *
 * Uniqueness ("Sign in instead?" / "That username is taken — try another.") is
 * NOT enforced here — those are page-handler submit-time checks.
 */
export const step1Schema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email.')
    .email("That doesn't look like an email — try again."),
  password: z
    .string()
    .min(1, 'Enter a password.')
    .min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().min(1, 'Tell us your first name.'),
  lastName: z.string().min(1, 'Tell us your last name.'),
  username: z
    .string()
    .min(1, 'Pick a username.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, hyphens, and underscores only.'),
})

// ---------------------------------------------------------------------------
// Step 2 — /signup/details (About you)
// ---------------------------------------------------------------------------

/**
 * Step 2 form schema — personal details.
 *
 * Field-level errors locked to UI-SPEC:
 *
 *   - Job title empty → "What's your job title?"
 *   - Role empty (or not in enum) → "Pick the closest role."
 *   - Years of experience missing → "Enter a number — 0 if you're starting out."
 *   - Location empty → "Where are you based?"
 *
 * yearsExperience min/max use Zod's default messages — UI-SPEC does not lock
 * out-of-range copy (NumberInput min/max props enforce client-side clamping
 * anyway, so the schema check is a defense-in-depth fallback).
 */
export const step2Schema = z.object({
  jobTitle: z.string().min(1, "What's your job title?"),
  role: RoleEnum,
  yearsExperience: z
    .number({ message: "Enter a number — 0 if you're starting out." })
    .int()
    .min(0)
    .max(60),
  location: z.string().min(1, 'Where are you based?'),
})

// ---------------------------------------------------------------------------
// Step 3 — /signup/company (Company)
// ---------------------------------------------------------------------------

/**
 * Step 3 form schema — company info.
 *
 * Field-level errors locked to UI-SPEC:
 *
 *   - Company name empty → "What's your company called?"
 *   - Company size empty → "Pick your company size."
 *   - Industry empty → "Pick the closest industry."
 *   - Plan tier empty → "Choose a plan."
 */
export const step3Schema = z.object({
  companyName: z.string().min(1, "What's your company called?"),
  companySize: CompanySizeEnum,
  industry: IndustryEnum,
  planTier: PlanTierEnum,
})

// ---------------------------------------------------------------------------
// Step 4 — /signup/preferences (Setup)
// ---------------------------------------------------------------------------

/**
 * Step 4 form schema — onboarding preferences.
 *
 * Field-level errors locked to UI-SPEC:
 *
 *   - Primary use case empty → "Pick one to continue."
 *   - Team size missing → "Enter a number — 1 if it's just you."
 *   - Top goals empty → "Pick at least one goal."
 *   - Top goals > 3 → "Pick up to three."
 */
export const step4Schema = z.object({
  primaryUseCase: PrimaryUseCaseEnum,
  teamSize: z
    .number({ message: "Enter a number — 1 if it's just you." })
    .int()
    .min(1)
    .max(10000),
  topGoals: z
    .array(TopGoalEnum)
    .min(1, 'Pick at least one goal.')
    .max(3, 'Pick up to three.'),
})

// ---------------------------------------------------------------------------
// Sign-in — /signin
// ---------------------------------------------------------------------------

/**
 * Sign-in form schema — email + password.
 *
 * Note the DIFFERENT password copy from sign-up's "Enter a password." — the
 * UI-SPEC locks "Enter your password." here (returning user, possessive). The
 * "Email and password don't match. Try again." mismatch error is a runtime
 * credential check rendered as a form-level Alert by the page handler — NOT a
 * Zod refinement.
 */
export const signinSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email.')
    .email("That doesn't look like an email — try again."),
  password: z.string().min(1, 'Enter your password.'),
})

// ---------------------------------------------------------------------------
// Persistence schemas — validate localStorage / sessionStorage reads
// ---------------------------------------------------------------------------

/**
 * Visitor record stored at `K.visitors()` (array of visitors).
 *
 * The `passwordHash` field is the SHA-256 hex digest of the user's password —
 * the 64-char lowercase-hex regex defends against tampered values being read
 * back as if they were valid hashes. A tampered visitor falls through the
 * readWithSchema fallback (`[]`) so the auth flow degrades to "no users" rather
 * than crashing.
 */
export const VisitorSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().length(64).regex(/^[0-9a-f]+$/),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  jobTitle: z.string(),
  role: RoleEnum,
  yearsExperience: z.number().int().nonnegative(),
  location: z.string(),
  primaryUseCase: PrimaryUseCaseEnum,
  teamSize: z.number().int().positive(),
  topGoals: z.array(TopGoalEnum),
  createdAt: z.iso.datetime(),
})

/** Workspace record stored at `K.workspaces()` (array of workspaces). */
export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  ownerVisitorId: z.string().min(1),
  companyName: z.string(),
  companySize: CompanySizeEnum,
  industry: IndustryEnum,
  planTier: PlanTierEnum,
  createdAt: z.iso.datetime(),
})

/** Session record stored at `K.session()`. */
export const SessionSchema = z.object({
  visitorId: z.string().min(1),
  workspaceId: z.string().min(1),
  signedInAt: z.iso.datetime(),
})

/**
 * Signup draft stored at `K.signupDraft()` (in sessionStorage per Plan 02-04).
 *
 * Every step is `.partial().optional()` so refreshing mid-wizard never loses
 * typed-but-unsubmitted fields, and an absent / corrupt step doesn't reject
 * the whole draft (consumer treats a failed safeParse as "fresh start").
 */
export const SignupDraftSchema = z.object({
  step1: step1Schema.partial().optional(),
  step2: step2Schema.partial().optional(),
  step3: step3Schema.partial().optional(),
  step4: step4Schema.partial().optional(),
})

// ---------------------------------------------------------------------------
// Array schemas — multi-record localStorage entries
// ---------------------------------------------------------------------------

/** Array shape of `K.visitors()` localStorage value. */
export const VisitorsArraySchema = z.array(VisitorSchema)

/** Array shape of `K.workspaces()` localStorage value. */
export const WorkspacesArraySchema = z.array(WorkspaceSchema)

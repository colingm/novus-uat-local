/**
 * Halo auth — TypeScript types (Phase 2 Plan 02).
 *
 * Every type in this file is derived from a Zod schema in `./schemas` via
 * `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel
 * type declarations here. If a field shape changes, edit the schema; the type
 * follows automatically.
 *
 * `User` is an alias of `Visitor`, kept so `src/auth/AuthProvider.tsx`'s
 * existing inline-`User`-based context API continues to type-check. Plan 02-05
 * will rewrite `AuthProvider` to import `User` from this module and drop its
 * inline declaration.
 */

import type { z } from 'zod'
import type {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  signinSchema,
  VisitorSchema,
  WorkspaceSchema,
  SessionSchema,
  SignupDraftSchema,
} from './schemas'

// ---------------------------------------------------------------------------
// Form-step value types — what RHF holds at each wizard URL
// ---------------------------------------------------------------------------

export type Step1Values = z.infer<typeof step1Schema>
export type Step2Values = z.infer<typeof step2Schema>
export type Step3Values = z.infer<typeof step3Schema>
export type Step4Values = z.infer<typeof step4Schema>
export type SigninValues = z.infer<typeof signinSchema>

// ---------------------------------------------------------------------------
// Persistence record types — what lives in localStorage / sessionStorage
// ---------------------------------------------------------------------------

export type Visitor = z.infer<typeof VisitorSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
export type Session = z.infer<typeof SessionSchema>
export type SignupDraft = z.infer<typeof SignupDraftSchema>

/**
 * `User` is the AuthProvider-facing alias of `Visitor`.
 *
 * Phase 2 Plan 02 (this plan) introduces this alias so downstream Phase 2/3
 * code converges on a single canonical type without breaking the existing
 * AuthProvider stub that owns its own inline `User`. Plan 02-05 deletes
 * AuthProvider's inline `User` and switches it to `import type { User } from
 * './types'`.
 */
export type User = Visitor

// ---------------------------------------------------------------------------
// Convenience unions — kept DRY across Wave 3 page code
// ---------------------------------------------------------------------------

/** Role union — same set as the Step 2 Role select options. */
export type Role = Visitor['role']

/** Company-size union — same set as the Step 3 Company size select options. */
export type CompanySize = Workspace['companySize']

/** Industry union — same set as the Step 3 Industry select options. */
export type Industry = Workspace['industry']

/** Plan-tier union — same set as the Step 3 Plan select options. */
export type PlanTier = Workspace['planTier']

/** Primary-use-case union — same set as the Step 4 use-case select options. */
export type PrimaryUseCase = Visitor['primaryUseCase']

/** Top-goal union — same set as the Step 4 goals multi-select options. */
export type TopGoal = Visitor['topGoals'][number]

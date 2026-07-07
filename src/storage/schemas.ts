/**
 * Zod schemas for Halo's persisted data types.
 *
 * Only schemas that are needed at the storage envelope layer live here.
 * Domain schemas (tasks, users, workspaces, etc.) will live in their
 * respective feature modules in Phase 2+.
 */

import { z } from 'zod'

/**
 * Per-domain seed ledger stored inside the meta record.
 *
 * Each key records the ISO timestamp when that domain's seed completed.
 * Absence of a key means the domain has not been seeded for this install.
 * Both keys are optional (.partial()) so legacy records (pre-Plan 07) that
 * lack this field entirely can be extended incrementally without a schema
 * version bump. Introduced in Plan 07 to close UAT Gaps 1 + 4 (cold-start
 * seed reconciliation regression).
 */
export const SeededDomainsSchema = z
  .object({
    tasks: z.string().datetime(),
    teammates: z.string().datetime(),
  })
  .partial()

/**
 * Schema for the boot-time meta record stored at `K.meta()`.
 *
 * Fields:
 *  - schemaVersion: integer ≥ 0 — the schema version when this record was written
 *  - seededAt: ISO 8601 datetime string or null — null until Phase 2 seed data is written;
 *    retained as a legacy read-only field for backward-compat (Plan 07 — D-12 update:
 *    per-domain ledger replaces the single global gate; seededAt becomes a read-only
 *    fallback for backward-compat with pre-Phase-5 installs)
 *  - seededDomains: per-domain seed ledger (Plan 07) — optional; absent on legacy records
 *  - appVersion: semver string — app version at last write
 */
export const MetaSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  seededAt: z.string().datetime().nullable(),
  seededDomains: SeededDomainsSchema.optional(),
  appVersion: z.string(),
})

export type Meta = z.infer<typeof MetaSchema>

/**
 * Schema for the Pendo anonymous visitor ID stored at `K.pendoAnonId()`.
 * Defined here so Phase 6's `getOrCreateAnonymousVisitorId()` can import
 * it directly without a one-line schema module.
 */
export const AnonIdSchema = z.string().min(1)

// ---------------------------------------------------------------------------
// Auth persistence schemas — re-exported from src/auth/schemas.ts so
// `readWithSchema` callers and the storage barrel see a single import path:
//
//   import { VisitorSchema, SessionSchema } from './storage'
//
// We deliberately do NOT re-export the form-step / sign-in schemas
// (`step1Schema`..`step4Schema`, `signinSchema`) — those are RHF resolver
// inputs owned by the auth feature module and should not leak through the
// storage barrel.
// ---------------------------------------------------------------------------

export {
  VisitorSchema,
  WorkspaceSchema,
  SessionSchema,
  SignupDraftSchema,
  VisitorsArraySchema,
  WorkspacesArraySchema,
} from '../auth/schemas'

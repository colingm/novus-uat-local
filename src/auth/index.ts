/**
 * Halo auth barrel.
 *
 * Single import target for the entire Phase 2 auth surface — provider, hook,
 * Zustand store, route guards, repo functions, password hashing,
 * sessionStorage wizard-draft helpers, Zod schemas, and types.
 *
 * Wave 3 page plans (02-07..09, 02-10) import from this barrel via
 * `from '../../auth'` instead of poking into individual files. The barrel
 * is the sink, not a source — `src/auth/authStore.ts` imports from
 * `./authRepo`, `./wizardSession`, `./passwordHash`, `./types` directly,
 * so re-exporting all of those here introduces no circular dependency.
 *
 * Convention: named re-exports for the curated surface; `export *` for
 * schemas / types / authRepo where the file IS the surface (every symbol
 * is intended to be public).
 */

// Provider + context + hook
export { AuthProvider, AuthContext } from './AuthProvider'
export type { AuthContextValue } from './AuthProvider'
export { useAuth } from './useAuth'

// Zustand store + module-init hydration
export { useAuthStore, hydrateAuthFromStorage } from './authStore'
export type { SignInResult } from './authStore'

// Route guards
export { RequireAuth } from './RequireAuth'
export { RequireAnon } from './RequireAnon'

// Data layer — every symbol in authRepo is part of the public surface
export * from './authRepo'

// Password hashing
export { hashPassword, verifyPassword } from './passwordHash'

// Wizard sessionStorage helpers
export {
  readWizardDraft,
  writeWizardDraftStep,
  clearWizardDraft,
  hasStep,
  setWizardPassword,
  getWizardPassword,
} from './wizardSession'

// Schemas + types — IS the surface for these files
export * from './schemas'
export * from './types'

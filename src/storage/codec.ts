/**
 * Halo localStorage codec — read/write helpers with Zod validation.
 *
 * This is the ONLY module in the codebase allowed to call `localStorage.*` directly.
 * Per FND-04, every other persistent read/write MUST go through `readWithSchema` or
 * `writeJSON`. Direct localStorage usage outside this module bypasses Zod validation
 * and the migration runner.
 *
 * Exceptions:
 *  - `src/storage/migrations.ts` uses `peekRaw` (exported from here) to check for
 *    first-boot scenarios without triggering schema validation.
 */

import type { ZodType } from 'zod'

/**
 * Read a value from localStorage, validate against `schema`, and return the parsed
 * value on success or `fallback` on any failure.
 *
 * Failure modes that all return `fallback` (never throw):
 *  - Key not present in localStorage
 *  - localStorage unavailable (e.g. Safari private mode)
 *  - JSON.parse failure (corrupt stored value)
 *  - Zod schema validation failure (stale or malformed data)
 */
export function readWithSchema<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}

/**
 * Write a value to localStorage as JSON.
 *
 * Non-fatal: on QuotaExceededError or private-mode write block, logs a console warning
 * and continues. Never throws to the caller.
 */
export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[halo:storage] writeJSON failed for key "${key}":`, err)
  }
}

/**
 * Remove a key from localStorage.
 *
 * Non-fatal: errors are swallowed silently.
 */
export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // swallow — e.g. localStorage unavailable in some private mode contexts
  }
}

/**
 * Peek at the raw string value in localStorage without any JSON.parse or Zod validation.
 * Returns null if absent or unavailable.
 *
 * Used exclusively by `migrations.ts` for first-boot detection.
 */
export function peekRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

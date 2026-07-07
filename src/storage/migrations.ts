/**
 * Boot-time migration runner for Halo's localStorage schema.
 *
 * Called once from `src/main.tsx` BEFORE `ReactDOM.createRoot(...).render(<App />)`.
 * Safe to call multiple times — idempotent by design.
 *
 * Adding a migration in Phase 2+:
 *   migrations[1] = (_prev) => {
 *     // migrate data written by schema v1 to v2 shape
 *   }
 *   // then bump CURRENT_SCHEMA_VERSION to 2
 */

import { APP_VERSION, K, SCHEMA_VERSION } from './keys'
import { peekRaw, readWithSchema, writeJSON } from './codec'
import type { Meta } from './schemas'
import { MetaSchema } from './schemas'

/** The schema version this build of the app targets. */
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION

const DEFAULT_META: Meta = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  seededAt: null,
  appVersion: APP_VERSION,
}

/**
 * Migration registry.
 *
 * Keys are the source schema version (i.e. migrations[1] upgrades from v1 → v2).
 * Empty in Phase 1 — we are at v1 with nothing to migrate from.
 *
 * Phase 2+ adds entries here as breaking localStorage shape changes land.
 */
const migrations: Record<number, (prevVersion: number) => void> = {
  // Phase 2 example (do not enable until CURRENT_SCHEMA_VERSION bumped to 2):
  // 1: (_prev) => { /* migrate v1 → v2 */ },
}

/**
 * Run the schema migration runner.
 *
 * Execution path:
 *  1. First boot (no meta key): writes DEFAULT_META and returns.
 *  2. Current boot with matching version and appVersion: no-op (fast return).
 *  3. Older schema version: runs migration functions sequentially until
 *     CURRENT_SCHEMA_VERSION is reached, then writes updated meta.
 *  4. Unknown schema gap (migration handler missing): logs a warning, resets
 *     meta to DEFAULT_META, and returns.
 */
export function runMigrations(): void {
  // First-boot detection: peek at raw value without triggering Zod validation.
  // peekRaw is the only localStorage access exemption outside codec.ts.
  const rawMeta = peekRaw(K.meta())
  if (rawMeta === null) {
    writeJSON(K.meta(), DEFAULT_META)
    return
  }

  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)

  // Already at current version and appVersion — no-op.
  if (
    meta.schemaVersion === CURRENT_SCHEMA_VERSION &&
    meta.appVersion === APP_VERSION
  ) {
    return
  }

  // Need to migrate or update appVersion.
  let version = meta.schemaVersion

  while (version < CURRENT_SCHEMA_VERSION) {
    const fn = migrations[version]
    if (!fn) {
      console.warn(
        `[halo:migrations] No migration registered for v${version} → v${version + 1}; resetting meta.`,
      )
      writeJSON(K.meta(), DEFAULT_META)
      return
    }
    fn(version)
    version++
  }

  // Update meta to reflect current version + appVersion after successful migration.
  writeJSON(K.meta(), {
    ...meta,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: APP_VERSION,
  })
}

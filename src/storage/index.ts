/**
 * Public surface of the Halo storage module.
 *
 * Downstream code imports from here:
 *   import { K, readWithSchema, writeJSON, MetaSchema, runMigrations } from './storage'
 *
 * Direct imports from sub-modules (keys.ts, codec.ts, etc.) are also allowed
 * but the barrel is the recommended import path for consumer code.
 */

export * from './keys'
export * from './codec'
export * from './schemas'
export { runMigrations, CURRENT_SCHEMA_VERSION } from './migrations'

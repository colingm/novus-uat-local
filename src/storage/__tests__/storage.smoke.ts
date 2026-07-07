/**
 * Storage module smoke test.
 *
 * Verifies end-to-end behavior of the Halo localStorage envelope in a Node.js
 * environment using an in-memory localStorage polyfill. Run via:
 *
 *   npx tsx src/storage/__tests__/storage.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any assertion failure.
 * This file is excluded from the Vite production bundle (Vite skips __tests__ dirs).
 */

// ---------------------------------------------------------------------------
// 1. In-memory localStorage polyfill (must be set up before any storage imports)
// ---------------------------------------------------------------------------

const store: Record<string, string> = {}

const localStorageMock = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
  },
  setItem(key: string, value: string): void {
    store[key] = value
  },
  removeItem(key: string): void {
    delete store[key]
  },
  clear(): void {
    for (const key of Object.keys(store)) {
      delete store[key]
    }
  },
  get length(): number {
    return Object.keys(store).length
  },
  key(index: number): string | null {
    return Object.keys(store)[index] ?? null
  },
}

// Set on globalThis so the storage module picks it up
;(globalThis as unknown as Record<string, unknown>)['localStorage'] = localStorageMock

// ---------------------------------------------------------------------------
// 2. Now safe to import storage modules (they reference localStorage at call time)
// ---------------------------------------------------------------------------

import { K } from '../keys'
import { readWithSchema, writeJSON } from '../codec'
import { MetaSchema, AnonIdSchema } from '../schemas'
import { runMigrations } from '../migrations'

// ---------------------------------------------------------------------------
// 3. Assertion helpers
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`)
    passed++
  } else {
    console.error(`  FAIL: ${message}`)
    failed++
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ---------------------------------------------------------------------------
// 4. Test suite
// ---------------------------------------------------------------------------

console.log('\nstorage smoke test starting...\n')

// --- Test: first boot writes halo:v1:meta ---
console.log('Test: first boot writes halo:v1:meta')
localStorageMock.clear()
runMigrations()
const rawMeta = localStorageMock.getItem('halo:v1:meta')
assert(rawMeta !== null, 'halo:v1:meta key is present after first runMigrations()')
const expectedMeta = { schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }
assert(
  rawMeta !== null && deepEqual(JSON.parse(rawMeta), expectedMeta),
  `halo:v1:meta value equals ${JSON.stringify(expectedMeta)}`,
)

// --- Test: idempotency — second call is a no-op ---
console.log('\nTest: idempotency (second runMigrations() call)')
const metaBefore = localStorageMock.getItem('halo:v1:meta')
runMigrations()
const metaAfter = localStorageMock.getItem('halo:v1:meta')
assert(metaBefore === metaAfter, 'halo:v1:meta is unchanged after second runMigrations()')

// --- Test: readWithSchema returns valid parsed object ---
console.log('\nTest: readWithSchema returns valid parsed object')
const fallbackMeta = { schemaVersion: 0, seededAt: null, appVersion: 'fallback' }
const readResult = readWithSchema(K.meta(), MetaSchema, fallbackMeta)
const schemaParseResult = MetaSchema.safeParse(readResult)
assert(schemaParseResult.success, 'readWithSchema result satisfies MetaSchema')
assert(
  deepEqual(readResult, expectedMeta),
  `readWithSchema returned expected meta: ${JSON.stringify(readResult)}`,
)

// --- Test: round-trip write/read of pendoAnonId ---
console.log('\nTest: round-trip write/read of K.pendoAnonId()')
writeJSON(K.pendoAnonId(), 'test-anon-id')
const anonId = readWithSchema(K.pendoAnonId(), AnonIdSchema, '')
assert(anonId === 'test-anon-id', `K.pendoAnonId() round-trip: got "${anonId}"`)

// --- Test: corrupt JSON returns fallback ---
console.log('\nTest: corrupt JSON returns fallback')
localStorageMock.setItem('halo:v1:meta', '{ this is not json')
const corruptResult = readWithSchema(K.meta(), MetaSchema, fallbackMeta)
assert(
  deepEqual(corruptResult, fallbackMeta),
  'corrupt JSON triggers fallback return',
)

// --- Test: schema rejection returns fallback ---
console.log('\nTest: schema rejection returns fallback')
localStorageMock.setItem('halo:v1:meta', JSON.stringify({ schemaVersion: 'not-a-number' }))
const rejectedResult = readWithSchema(K.meta(), MetaSchema, fallbackMeta)
assert(
  deepEqual(rejectedResult, fallbackMeta),
  'schema mismatch triggers fallback return',
)

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`storage smoke: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('storage smoke: FAILED')
  process.exit(1)
} else {
  console.log('storage smoke: OK')
  process.exit(0)
}

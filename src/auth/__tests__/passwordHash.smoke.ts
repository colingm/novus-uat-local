/**
 * passwordHash smoke test (Plan 02-03 Task 1 — TDD RED then GREEN).
 *
 * Verifies hash determinism, output shape (64-char lowercase hex), and
 * tolerant verifyPassword behavior. Run via:
 *
 *   npx tsx src/auth/__tests__/passwordHash.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any failure.
 */

import { hashPassword, verifyPassword } from '../passwordHash'

// ---------------------------------------------------------------------------
// Assertion helpers (matches storage.smoke.ts pattern)
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

// ---------------------------------------------------------------------------
// Test body
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\npasswordHash smoke test starting...\n')

  // Canonical SHA-256 hex of 'hunter2' (verified via `echo -n 'hunter2' | shasum -a 256`)
  const HUNTER2_HASH =
    'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7'

  // --- shape ---
  console.log('Test: hashPassword output shape')
  const h1 = await hashPassword('hunter2')
  assert(h1.length === 64, `hash length is 64 (got ${h1.length})`)
  assert(/^[0-9a-f]+$/.test(h1), `hash matches /^[0-9a-f]+$/ (got "${h1}")`)
  assert(h1 === HUNTER2_HASH, `hash of "hunter2" equals canonical SHA-256 hex`)

  // --- determinism ---
  console.log('\nTest: hashPassword determinism')
  const h2 = await hashPassword('hunter2')
  assert(h1 === h2, 'hashPassword("hunter2") returns identical strings on repeated calls')

  // --- verifyPassword happy path ---
  console.log('\nTest: verifyPassword positive case')
  const ok = await verifyPassword('hunter2', h1)
  assert(ok === true, 'verifyPassword("hunter2", <correct hash>) === true')

  // --- verifyPassword negative case ---
  console.log('\nTest: verifyPassword negative case')
  const bad = await verifyPassword('hunter3', h1)
  assert(bad === false, 'verifyPassword("hunter3", <hash of hunter2>) === false')

  // --- verifyPassword tolerates malformed stored hash ---
  console.log('\nTest: verifyPassword tolerant of malformed stored hash')
  const noThrow = await verifyPassword('hunter2', 'not-a-hash')
  assert(noThrow === false, 'verifyPassword("hunter2", "not-a-hash") === false (no throw)')

  // --- summary ---
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`passwordHash smoke: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.error('passwordHash smoke: FAILED')
    process.exit(1)
  } else {
    console.log('passwordHash smoke: OK')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('passwordHash smoke: unexpected throw', err)
  process.exit(1)
})

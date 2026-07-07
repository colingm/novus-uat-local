/**
 * wizardSession smoke test (Plan 02-04).
 *
 * Verifies end-to-end behavior of `src/auth/wizardSession.ts` against an
 * in-memory `sessionStorage` polyfill. Run via:
 *
 *   npx tsx src/auth/__tests__/wizardSession.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any assertion failure.
 * Excluded from the Vite production bundle / tsc browser build via the
 * `src/**\/__tests__` glob in tsconfig.app.json.
 *
 * Coverage (13 assertions):
 *   1.  Fresh `readWizardDraft()` on empty sessionStorage returns `{}`
 *   2.  After write, raw sessionStorage at `K.signupDraft()` is non-null + valid JSON
 *   3.  Round-trip read returns the same shape
 *   4.  Second write to step1 MERGES (no field dropped)
 *   5.  Write to step2 PRESERVES step1
 *   6.  `clearWizardDraft()` empties storage; subsequent read returns `{}`
 *   7.  Non-JSON raw value falls through to `{}` (no throw)
 *   8.  JSON-valid but schema-invalid value falls through to `{}` (Zod fallback)
 *   9.  `hasStep({step1: {email: 'a@b.co'}}, 'step1') === true`
 *   10. `hasStep({}, 'step1') === false`
 *   11. `hasStep({step1: {}}, 'step1') === false` (empty object — no fields filled)
 *   12. `hasStep({step1: {email: ''}}, 'step1') === false` (empty string treated as not provided)
 *   13. `hasStep({step1: {topGoals: []}}, 'step1') === false` (empty array treated as not provided)
 */

// ---------------------------------------------------------------------------
// 1. In-memory sessionStorage + localStorage polyfills
//    (must be installed BEFORE importing any module that touches them)
// ---------------------------------------------------------------------------

function makeStorageMock() {
  const store: Record<string, string> = {}
  return {
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
}

const sessionStorageMock = makeStorageMock()
const localStorageMock = makeStorageMock()

// wizardSession.ts only reads/writes sessionStorage[K.signupDraft()], but the
// `K` import path drags in the rest of the storage barrel which references
// localStorage internally. Polyfill both for safety.
;(globalThis as unknown as Record<string, unknown>)['sessionStorage'] = sessionStorageMock
;(globalThis as unknown as Record<string, unknown>)['localStorage'] = localStorageMock

// ---------------------------------------------------------------------------
// 2. Now safe to import the module under test
// ---------------------------------------------------------------------------

import { K } from '../../storage'
import {
  readWizardDraft,
  writeWizardDraftStep,
  clearWizardDraft,
  hasStep,
} from '../wizardSession'

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

console.log('\nwizardSession smoke test starting...\n')

// ----- 1. Fresh read returns {} -----
console.log('Test 1: fresh sessionStorage → readWizardDraft() returns {}')
sessionStorageMock.clear()
assert(
  deepEqual(readWizardDraft(), {}),
  'readWizardDraft() on empty sessionStorage returns {}',
)

// ----- 2. After write, raw value at K.signupDraft() is non-null + valid JSON -----
console.log('\nTest 2: writeWizardDraftStep persists raw JSON at K.signupDraft()')
sessionStorageMock.clear()
writeWizardDraftStep('step1', { email: 'a@b.co' })
const rawAfterWrite = sessionStorageMock.getItem(K.signupDraft())
assert(
  rawAfterWrite !== null,
  `raw sessionStorage[K.signupDraft()] is non-null after write (got "${rawAfterWrite}")`,
)
let parsedOk = false
try {
  if (rawAfterWrite !== null) {
    JSON.parse(rawAfterWrite)
    parsedOk = true
  }
} catch {
  parsedOk = false
}
assert(parsedOk, 'raw sessionStorage value parses as JSON')

// ----- 3. Round-trip read returns same shape -----
console.log('\nTest 3: readWizardDraft round-trips the written value')
assert(
  deepEqual(readWizardDraft(), { step1: { email: 'a@b.co' } }),
  'readWizardDraft() returns { step1: { email: "a@b.co" } } after that write',
)

// ----- 4. Second write to step1 MERGES (both fields present) -----
console.log('\nTest 4: second writeWizardDraftStep("step1", ...) merges fields')
writeWizardDraftStep('step1', { firstName: 'Ada' })
const afterMerge = readWizardDraft()
assert(
  deepEqual(afterMerge, { step1: { email: 'a@b.co', firstName: 'Ada' } }),
  `merge preserves both email + firstName (got ${JSON.stringify(afterMerge)})`,
)

// ----- 5. Write to step2 preserves step1 -----
console.log('\nTest 5: writeWizardDraftStep("step2", ...) preserves step1')
writeWizardDraftStep('step2', { jobTitle: 'Dev' })
const afterStep2 = readWizardDraft()
assert(
  deepEqual(afterStep2, {
    step1: { email: 'a@b.co', firstName: 'Ada' },
    step2: { jobTitle: 'Dev' },
  }),
  `step1 preserved after step2 write (got ${JSON.stringify(afterStep2)})`,
)

// ----- 6. clearWizardDraft empties storage; subsequent read returns {} -----
console.log('\nTest 6: clearWizardDraft empties sessionStorage')
clearWizardDraft()
assert(
  sessionStorageMock.getItem(K.signupDraft()) === null,
  'sessionStorage[K.signupDraft()] is null after clearWizardDraft()',
)
assert(
  deepEqual(readWizardDraft(), {}),
  'readWizardDraft() returns {} after clearWizardDraft()',
)

// ----- 7. Non-JSON raw value falls through to {} (no throw) -----
console.log('\nTest 7: corrupt non-JSON raw value falls through to {}')
sessionStorageMock.setItem(K.signupDraft(), 'not-json')
assert(
  deepEqual(readWizardDraft(), {}),
  'readWizardDraft() returns {} when raw value is "not-json"',
)

// ----- 8. JSON-valid but schema-invalid value falls through to {} -----
console.log('\nTest 8: schema-invalid JSON value falls through to {} (Zod fallback)')
sessionStorageMock.setItem(K.signupDraft(), JSON.stringify({ step1: 'invalid-shape' }))
assert(
  deepEqual(readWizardDraft(), {}),
  'readWizardDraft() returns {} when step1 is a string (Zod expects object)',
)

// ----- 9. hasStep with one filled field returns true -----
console.log('\nTest 9: hasStep({step1: {email: "a@b.co"}}, "step1") === true')
assert(
  hasStep({ step1: { email: 'a@b.co' } }, 'step1') === true,
  'hasStep returns true when step has at least one truthy field',
)

// ----- 10. hasStep with absent step returns false -----
console.log('\nTest 10: hasStep({}, "step1") === false')
assert(
  hasStep({}, 'step1') === false,
  'hasStep returns false when step is undefined',
)

// ----- 11. hasStep with empty object returns false -----
console.log('\nTest 11: hasStep({step1: {}}, "step1") === false (no fields filled)')
assert(
  hasStep({ step1: {} }, 'step1') === false,
  'hasStep returns false when step is present but has zero fields',
)

// ----- 12. hasStep with empty string field returns false -----
console.log('\nTest 12: hasStep({step1: {email: ""}}, "step1") === false (empty string)')
assert(
  hasStep({ step1: { email: '' } }, 'step1') === false,
  'hasStep treats empty string as not provided',
)

// ----- 13. hasStep with empty array field returns false -----
console.log('\nTest 13: hasStep({step4: {topGoals: []}}, "step4") === false (empty array)')
assert(
  hasStep({ step4: { topGoals: [] } }, 'step4') === false,
  'hasStep treats empty array as not provided',
)

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`wizardSession smoke: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('wizardSession smoke: FAILED')
  process.exit(1)
} else {
  console.log('wizardSession smoke: OK')
  process.exit(0)
}

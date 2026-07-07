/**
 * Auth module smoke test (Plan 02-03).
 *
 * Verifies end-to-end behavior of `src/auth/passwordHash.ts` and
 * `src/auth/authRepo.ts` in a Node.js environment using an in-memory
 * localStorage polyfill. Run via:
 *
 *   npx tsx src/auth/__tests__/auth.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any failure.
 * Excluded from the Vite production bundle / tsc browser build via the
 * `src/**\/__tests__` glob in tsconfig.app.json.
 */

// ---------------------------------------------------------------------------
// 1. In-memory localStorage polyfill (must be installed before any storage imports)
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

;(globalThis as unknown as Record<string, unknown>)['localStorage'] = localStorageMock

// ---------------------------------------------------------------------------
// 2. Now safe to import modules under test
// ---------------------------------------------------------------------------

import { K } from '../../storage'
import { hashPassword, verifyPassword } from '../passwordHash'
import {
  createVisitor,
  createWorkspace,
  findVisitorByEmail,
  findVisitorByUsername,
  getVisitorById,
  getWorkspaceById,
  listVisitors,
  listWorkspaces,
} from '../authRepo'

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

const HEX_64_RE = /^[0-9a-f]{64}$/
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

// Canonical "complete" Visitor input. Override per-test as needed.
function makeVisitorInput(overrides: Partial<Parameters<typeof createVisitor>[0]> = {}) {
  return {
    email: 'ada@example.com',
    password: 'hunter2',
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    jobTitle: 'Engineer',
    role: 'Engineering' as const,
    yearsExperience: 5,
    location: 'London',
    primaryUseCase: 'Project management' as const,
    teamSize: 4,
    topGoals: ['Ship faster' as const],
    ...overrides,
  }
}

function makeWorkspaceInput(overrides: Partial<Parameters<typeof createWorkspace>[0]> = {}) {
  return {
    ownerVisitorId: 'visitor-id-here',
    companyName: 'Halo Industries',
    companySize: '11–50' as const,
    industry: 'Software' as const,
    planTier: 'Pro' as const,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 4. Test suite
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\nauth smoke test starting...\n')

  // ----- 1. hashPassword shape (64-char lowercase hex) -----
  console.log('Test 1: hashPassword output shape')
  localStorageMock.clear()
  const h1 = await hashPassword('hunter2')
  assert(
    h1.length === 64 && HEX_64_RE.test(h1),
    `hashPassword("hunter2") returns 64-char lowercase hex (got "${h1}")`,
  )

  // ----- 2. hashPassword determinism -----
  console.log('\nTest 2: hashPassword determinism')
  const h2 = await hashPassword('hunter2')
  assert(h1 === h2, 'hashPassword("hunter2") returns identical strings on repeated calls')

  // ----- 3. verifyPassword positive case -----
  console.log('\nTest 3: verifyPassword positive case')
  const ok = await verifyPassword('hunter2', h1)
  assert(ok === true, 'verifyPassword("hunter2", <correct hash>) === true')

  // ----- 4. verifyPassword negative case -----
  console.log('\nTest 4: verifyPassword negative case')
  const bad = await verifyPassword('hunter3', h1)
  assert(bad === false, 'verifyPassword("hunter3", <hash of hunter2>) === false')

  // ----- 5. verifyPassword tolerates malformed stored hash -----
  console.log('\nTest 5: verifyPassword tolerant of malformed stored hash')
  const noThrow = await verifyPassword('hunter2', 'not-a-hash')
  assert(
    noThrow === false,
    'verifyPassword("hunter2", "not-a-hash") === false (no throw)',
  )

  // ----- 6. createVisitor round-trip -----
  console.log('\nTest 6: createVisitor returns Visitor with id, hex passwordHash, ISO createdAt')
  localStorageMock.clear()
  const v = await createVisitor(makeVisitorInput())
  assert(
    typeof v.id === 'string' && v.id.length > 0,
    `created visitor has non-empty string id (got "${v.id}")`,
  )
  assert(
    HEX_64_RE.test(v.passwordHash),
    `created visitor passwordHash is 64-char lowercase hex (got "${v.passwordHash}")`,
  )
  assert(
    ISO_DATETIME_RE.test(v.createdAt),
    `created visitor createdAt is ISO datetime (got "${v.createdAt}")`,
  )

  // ----- 7. createVisitor returned object has NO plaintext password -----
  console.log('\nTest 7: created Visitor has no plaintext password')
  assert(
    !('password' in v),
    "'password' property is absent from the returned Visitor",
  )
  // Also confirm it's not loitering in the stored JSON.
  const rawVisitors = localStorageMock.getItem(K.visitors())
  assert(
    rawVisitors !== null && !rawVisitors.includes('hunter2'),
    'plaintext "hunter2" does not appear anywhere in the stored visitors JSON',
  )

  // ----- 8. distinct IDs from rapid successive createVisitor calls -----
  console.log('\nTest 8: distinct nanoid IDs across rapid createVisitor calls')
  localStorageMock.clear()
  const v1 = await createVisitor(
    makeVisitorInput({ email: 'one@example.com', username: 'one' }),
  )
  const v2 = await createVisitor(
    makeVisitorInput({ email: 'two@example.com', username: 'two' }),
  )
  assert(v1.id !== v2.id, `two rapid createVisitor calls produce distinct ids (${v1.id} != ${v2.id})`)

  // ----- 9. case-insensitive findVisitorByEmail -----
  console.log('\nTest 9: findVisitorByEmail is case-insensitive')
  localStorageMock.clear()
  await createVisitor(
    makeVisitorInput({ email: 'case@insensitive.com', username: 'casecheck' }),
  )
  const byEmail = findVisitorByEmail('CASE@INSENSITIVE.com')
  assert(
    byEmail !== undefined && byEmail.email === 'case@insensitive.com',
    'findVisitorByEmail("CASE@INSENSITIVE.com") matches lowercased-email record',
  )

  // ----- 10. case-insensitive findVisitorByUsername -----
  console.log('\nTest 10: findVisitorByUsername is case-insensitive')
  const byUsername = findVisitorByUsername('CASEcheck')
  assert(
    byUsername !== undefined && byUsername.username === 'casecheck',
    'findVisitorByUsername("CASEcheck") matches lowercased-username record',
  )

  // ----- 11. createWorkspace + getWorkspaceById round-trip -----
  console.log('\nTest 11: createWorkspace round-trip via getWorkspaceById')
  localStorageMock.clear()
  const w = createWorkspace(makeWorkspaceInput({ ownerVisitorId: 'owner-xyz' }))
  assert(
    typeof w.id === 'string' && w.id.length > 0,
    `created workspace has non-empty string id (got "${w.id}")`,
  )
  const wRead = getWorkspaceById(w.id)
  assert(
    wRead !== undefined && wRead.id === w.id && wRead.companyName === 'Halo Industries',
    'getWorkspaceById returns the workspace that was just created',
  )

  // ----- 12. corrupt JSON at K.visitors() falls through to [] -----
  console.log('\nTest 12: corrupt JSON at K.visitors() falls through to []')
  localStorageMock.clear()
  localStorageMock.setItem(K.visitors(), 'not-json')
  const corruptList = listVisitors()
  assert(
    Array.isArray(corruptList) && corruptList.length === 0,
    'listVisitors() returns [] when stored value is non-JSON',
  )
  const corruptFind = findVisitorByEmail('anyone@example.com')
  assert(
    corruptFind === undefined,
    'findVisitorByEmail returns undefined when stored value is non-JSON',
  )

  // ----- 13. schema-invalid JSON at K.visitors() falls through to [] -----
  console.log('\nTest 13: schema-invalid JSON at K.visitors() falls through to []')
  localStorageMock.clear()
  // Missing required fields (passwordHash, role, etc.) — VisitorsArraySchema rejects.
  localStorageMock.setItem(
    K.visitors(),
    JSON.stringify([{ id: 'x', email: 'a@b.co' }]),
  )
  const schemaInvalidList = listVisitors()
  assert(
    Array.isArray(schemaInvalidList) && schemaInvalidList.length === 0,
    'listVisitors() returns [] when stored value fails schema validation',
  )

  // ----- 14. listVisitors after seeding three visitors -----
  console.log('\nTest 14: listVisitors returns all seeded records')
  localStorageMock.clear()
  await createVisitor(makeVisitorInput({ email: 'a@a.co', username: 'a' }))
  await createVisitor(makeVisitorInput({ email: 'b@b.co', username: 'b' }))
  await createVisitor(makeVisitorInput({ email: 'c@c.co', username: 'c' }))
  assert(listVisitors().length === 3, 'listVisitors() returns 3 after three createVisitor calls')

  // ----- 15. getVisitorById round-trip -----
  console.log('\nTest 15: getVisitorById round-trip')
  const seeded = await createVisitor(
    makeVisitorInput({ email: 'd@d.co', username: 'd' }),
  )
  const fetched = getVisitorById(seeded.id)
  assert(
    fetched !== undefined && fetched.id === seeded.id && fetched.email === 'd@d.co',
    'getVisitorById returns the visitor that was just created',
  )

  // ----- 16. listWorkspaces returns array (smoke sanity for both list helpers) -----
  console.log('\nTest 16: listWorkspaces returns array')
  localStorageMock.clear()
  createWorkspace(makeWorkspaceInput({ ownerVisitorId: 'w1' }))
  createWorkspace(makeWorkspaceInput({ ownerVisitorId: 'w2' }))
  assert(
    listWorkspaces().length === 2,
    'listWorkspaces() returns 2 after two createWorkspace calls',
  )

  // ----- 17. createVisitor persists a verifyPassword-roundtrippable hash -----
  console.log('\nTest 17: persisted passwordHash verifies against original plaintext')
  localStorageMock.clear()
  const persisted = await createVisitor(
    makeVisitorInput({ email: 'verify@example.com', username: 'verifier', password: 'correct horse' }),
  )
  const verifyOk = await verifyPassword('correct horse', persisted.passwordHash)
  const verifyBad = await verifyPassword('wrong horse', persisted.passwordHash)
  assert(
    verifyOk === true && verifyBad === false,
    'verifyPassword round-trip works against the hash stored in the Visitor record',
  )

  // ---------------------------------------------------------------------------
  // 5. Summary
  // ---------------------------------------------------------------------------

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`auth smoke: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.error('auth smoke: FAILED')
    process.exit(1)
  } else {
    console.log('auth smoke: OK')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('auth smoke: unexpected throw', err)
  process.exit(1)
})

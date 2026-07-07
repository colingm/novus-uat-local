/**
 * Auth schemas smoke test.
 *
 * Verifies every Zod step / sign-in / persistence schema in `src/auth/schemas.ts` and the
 * derived TypeScript types in `src/auth/types.ts`. Exercises:
 *
 *   - All 24 UI-SPEC-locked inline-validation error messages fire on the right field/trigger
 *   - Persistence schemas accept valid records and reject malformed ones
 *   - Array + draft schemas behave as expected
 *
 * Run via:
 *   npx tsx src/auth/__tests__/auth.schemas.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any assertion failure.
 * Excluded from the Vite production bundle (Vite skips __tests__ dirs).
 */

import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  signinSchema,
  VisitorSchema,
  WorkspaceSchema,
  SessionSchema,
  SignupDraftSchema,
  VisitorsArraySchema,
  WorkspacesArraySchema,
} from '../schemas'
import type {
  Visitor,
  Workspace,
  Session,
  SignupDraft,
  User,
  Step1Values,
  Step2Values,
  Step3Values,
  Step4Values,
  SigninValues,
} from '../types'

// ---------------------------------------------------------------------------
// Assertion helpers
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

function issueMessages(result: { success: false; error: { issues: { message: string }[] } }): string[] {
  return result.error.issues.map((i) => i.message)
}

// ---------------------------------------------------------------------------
// Test: step1Schema — empty inputs
// ---------------------------------------------------------------------------

console.log('\nTest: step1Schema with all-empty input surfaces 5 required-field errors')
{
  const r = step1Schema.safeParse({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
  })
  assert(!r.success, 'step1Schema rejects all-empty input')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(msgs.includes('Enter your email.'), 'email empty → "Enter your email."')
    assert(msgs.includes('Enter a password.'), 'password empty → "Enter a password."')
    assert(msgs.includes('Tell us your first name.'), 'firstName empty → "Tell us your first name."')
    assert(msgs.includes('Tell us your last name.'), 'lastName empty → "Tell us your last name."')
    assert(msgs.includes('Pick a username.'), 'username empty → "Pick a username."')
  }
}

// ---------------------------------------------------------------------------
// Test: step1Schema — format errors
// ---------------------------------------------------------------------------

console.log('\nTest: step1Schema format errors fire correctly')
{
  const r = step1Schema.safeParse({
    email: 'not-an-email',
    password: 'a',
    firstName: 'a',
    lastName: 'a',
    username: '!!',
  })
  assert(!r.success, 'step1Schema rejects malformed inputs')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(
      msgs.includes("That doesn't look like an email — try again."),
      'bad email → "That doesn\'t look like an email — try again."',
    )
    assert(
      msgs.includes('Password must be at least 8 characters.'),
      'short password → "Password must be at least 8 characters."',
    )
    assert(
      msgs.includes('Use letters, numbers, hyphens, and underscores only.'),
      'bad username → "Use letters, numbers, hyphens, and underscores only."',
    )
  }
}

// ---------------------------------------------------------------------------
// Test: step1Schema — valid input passes
// ---------------------------------------------------------------------------

console.log('\nTest: step1Schema accepts a valid input')
{
  const r = step1Schema.safeParse({
    email: 'ada@example.com',
    password: 'a-good-password',
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada_lovelace-1',
  })
  assert(r.success, 'step1Schema accepts a valid step-1 payload')
}

// ---------------------------------------------------------------------------
// Test: step2Schema
// ---------------------------------------------------------------------------

console.log('\nTest: step2Schema rejects empty input with locked messages')
{
  const r = step2Schema.safeParse({
    jobTitle: '',
    role: '',
    yearsExperience: undefined,
    location: '',
  })
  assert(!r.success, 'step2Schema rejects empty input')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(msgs.includes("What's your job title?"), 'jobTitle empty → "What\'s your job title?"')
    assert(msgs.includes('Pick the closest role.'), 'role empty → "Pick the closest role."')
    assert(
      msgs.includes("Enter a number — 0 if you're starting out."),
      'yearsExperience missing → "Enter a number — 0 if you\'re starting out."',
    )
    assert(msgs.includes('Where are you based?'), 'location empty → "Where are you based?"')
  }
}

console.log('\nTest: step2Schema accepts a valid input')
{
  const r = step2Schema.safeParse({
    jobTitle: 'Engineer',
    role: 'Engineering',
    yearsExperience: 5,
    location: 'Berlin, Germany',
  })
  assert(r.success, 'step2Schema accepts a valid step-2 payload')
}

// ---------------------------------------------------------------------------
// Test: step3Schema
// ---------------------------------------------------------------------------

console.log('\nTest: step3Schema rejects empty input with locked messages')
{
  const r = step3Schema.safeParse({
    companyName: '',
    companySize: '',
    industry: '',
    planTier: '',
  })
  assert(!r.success, 'step3Schema rejects empty input')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(
      msgs.includes("What's your company called?"),
      'companyName empty → "What\'s your company called?"',
    )
    assert(msgs.includes('Pick your company size.'), 'companySize empty → "Pick your company size."')
    assert(msgs.includes('Pick the closest industry.'), 'industry empty → "Pick the closest industry."')
    assert(msgs.includes('Choose a plan.'), 'planTier empty → "Choose a plan."')
  }
}

console.log('\nTest: step3Schema accepts a valid input')
{
  const r = step3Schema.safeParse({
    companyName: 'Acme Inc.',
    companySize: '11–50',
    industry: 'Software',
    planTier: 'Pro',
  })
  assert(r.success, 'step3Schema accepts a valid step-3 payload')
}

// ---------------------------------------------------------------------------
// Test: step4Schema — required + min/max top goals
// ---------------------------------------------------------------------------

console.log('\nTest: step4Schema rejects empty input with locked messages incl. "Pick at least one goal."')
{
  const r = step4Schema.safeParse({
    primaryUseCase: '',
    teamSize: undefined,
    topGoals: [],
  })
  assert(!r.success, 'step4Schema rejects empty input')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(msgs.includes('Pick one to continue.'), 'primaryUseCase empty → "Pick one to continue."')
    assert(
      msgs.includes("Enter a number — 1 if it's just you."),
      'teamSize missing → "Enter a number — 1 if it\'s just you."',
    )
    assert(msgs.includes('Pick at least one goal.'), 'topGoals empty → "Pick at least one goal."')
  }
}

console.log('\nTest: step4Schema rejects > 3 selected goals with "Pick up to three."')
{
  const r = step4Schema.safeParse({
    primaryUseCase: 'Project management',
    teamSize: 5,
    topGoals: ['Ship faster', 'Better visibility', 'Less context switching', 'Cleaner reporting'],
  })
  assert(!r.success, 'step4Schema rejects 4 topGoals')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(msgs.includes('Pick up to three.'), '4 topGoals → "Pick up to three."')
  }
}

console.log('\nTest: step4Schema accepts a valid input')
{
  const r = step4Schema.safeParse({
    primaryUseCase: 'Project management',
    teamSize: 5,
    topGoals: ['Ship faster', 'Better visibility'],
  })
  assert(r.success, 'step4Schema accepts a valid step-4 payload')
}

// ---------------------------------------------------------------------------
// Test: signinSchema — separate "Enter your password." copy
// ---------------------------------------------------------------------------

console.log('\nTest: signinSchema empty input surfaces sign-in-specific copy')
{
  const r = signinSchema.safeParse({ email: '', password: '' })
  assert(!r.success, 'signinSchema rejects empty input')
  if (!r.success) {
    const msgs = issueMessages(r)
    assert(msgs.includes('Enter your email.'), 'signin email empty → "Enter your email."')
    assert(
      msgs.includes('Enter your password.'),
      'signin password empty → "Enter your password." (NOT "Enter a password.")',
    )
  }
}

console.log('\nTest: signinSchema accepts valid input')
{
  const r = signinSchema.safeParse({ email: 'ada@example.com', password: 'whatever' })
  assert(r.success, 'signinSchema accepts a valid sign-in payload')
}

// ---------------------------------------------------------------------------
// Test: VisitorSchema — full valid record
// ---------------------------------------------------------------------------

console.log('\nTest: VisitorSchema accepts a valid 14-field visitor record')
{
  const visitor: Visitor = {
    id: 'v_abc',
    email: 'ada@example.com',
    passwordHash:
      'a'.repeat(64), // 64-char lowercase hex
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    jobTitle: 'Engineer',
    role: 'Engineering',
    yearsExperience: 7,
    location: 'Berlin, Germany',
    primaryUseCase: 'Project management',
    teamSize: 5,
    topGoals: ['Ship faster'],
    createdAt: '2026-05-14T12:00:00.000Z',
  }
  const r = VisitorSchema.safeParse(visitor)
  assert(r.success, 'VisitorSchema accepts a valid visitor record')
}

console.log('\nTest: VisitorSchema rejects a non-hex passwordHash')
{
  const r = VisitorSchema.safeParse({
    id: 'v_abc',
    email: 'ada@example.com',
    passwordHash: 'NOT-HEX-VALUE-OF-WRONG-LENGTH',
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    jobTitle: 'Engineer',
    role: 'Engineering',
    yearsExperience: 7,
    location: 'Berlin, Germany',
    primaryUseCase: 'Project management',
    teamSize: 5,
    topGoals: ['Ship faster'],
    createdAt: '2026-05-14T12:00:00.000Z',
  })
  assert(!r.success, 'VisitorSchema rejects a non-hex/wrong-length passwordHash')
}

// ---------------------------------------------------------------------------
// Test: WorkspaceSchema
// ---------------------------------------------------------------------------

console.log('\nTest: WorkspaceSchema accepts a valid workspace record')
{
  const workspace: Workspace = {
    id: 'w_abc',
    ownerVisitorId: 'v_abc',
    companyName: 'Acme Inc.',
    companySize: '11–50',
    industry: 'Software',
    planTier: 'Pro',
    createdAt: '2026-05-14T12:00:00.000Z',
  }
  const r = WorkspaceSchema.safeParse(workspace)
  assert(r.success, 'WorkspaceSchema accepts a valid workspace record')
}

// ---------------------------------------------------------------------------
// Test: SessionSchema
// ---------------------------------------------------------------------------

console.log('\nTest: SessionSchema accepts a valid session record')
{
  const session: Session = {
    visitorId: 'v_x',
    workspaceId: 'w_x',
    signedInAt: '2026-05-14T12:00:00.000Z',
  }
  const r = SessionSchema.safeParse(session)
  assert(r.success, 'SessionSchema accepts a valid session record')
}

console.log('\nTest: SessionSchema rejects empty visitorId')
{
  const r = SessionSchema.safeParse({
    visitorId: '',
    workspaceId: 'w_x',
    signedInAt: '2026-05-14T12:00:00.000Z',
  })
  assert(!r.success, 'SessionSchema rejects empty visitorId')
}

// ---------------------------------------------------------------------------
// Test: SignupDraftSchema — empty object is valid
// ---------------------------------------------------------------------------

console.log('\nTest: SignupDraftSchema accepts an empty object')
{
  const draft: SignupDraft = {}
  const r = SignupDraftSchema.safeParse(draft)
  assert(r.success, 'SignupDraftSchema.parse({}) succeeds (empty draft is valid)')
}

console.log('\nTest: SignupDraftSchema accepts a partial step1 with one field')
{
  const draft: SignupDraft = { step1: { email: 'partial@example.com' } }
  const r = SignupDraftSchema.safeParse(draft)
  assert(r.success, 'SignupDraftSchema accepts a partial step1 (single field present)')
}

// ---------------------------------------------------------------------------
// Test: Array schemas
// ---------------------------------------------------------------------------

console.log('\nTest: VisitorsArraySchema accepts []')
{
  const r = VisitorsArraySchema.safeParse([])
  assert(r.success, 'VisitorsArraySchema accepts an empty array')
}

console.log('\nTest: WorkspacesArraySchema accepts []')
{
  const r = WorkspacesArraySchema.safeParse([])
  assert(r.success, 'WorkspacesArraySchema accepts an empty array')
}

// ---------------------------------------------------------------------------
// Test: types compile — `User = Visitor` alias
// ---------------------------------------------------------------------------

console.log('\nTest: types compile and User aliases Visitor')
{
  // Compile-time check: User must be assignable from a Visitor
  const v: Visitor = {
    id: 'v_x',
    email: 'a@b.co',
    passwordHash: 'a'.repeat(64),
    firstName: 'A',
    lastName: 'B',
    username: 'a',
    jobTitle: 'x',
    role: 'Engineering',
    yearsExperience: 0,
    location: 'x',
    primaryUseCase: 'Project management',
    teamSize: 1,
    topGoals: ['Ship faster'],
    createdAt: '2026-05-14T12:00:00.000Z',
  }
  const u: User = v
  assert(u.email === v.email, 'User is structurally Visitor (alias type)')
  // Touch all derived types so unused-import noise doesn't appear in builds
  const _s1: Step1Values | undefined = undefined
  const _s2: Step2Values | undefined = undefined
  const _s3: Step3Values | undefined = undefined
  const _s4: Step4Values | undefined = undefined
  const _si: SigninValues | undefined = undefined
  void _s1
  void _s2
  void _s3
  void _s4
  void _si
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`auth schemas smoke: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('auth schemas smoke: FAILED')
  process.exit(1)
} else {
  console.log('auth schemas smoke: OK')
  process.exit(0)
}

/**
 * Signup wizard — Step 3 (About your company).
 *
 * AUTH-04 + step-3 half of AUTH-06. Captures Company name / Company size /
 * Industry / Plan tier. Renders the locked UI-SPEC heading
 * `About your company`.
 *
 * Gates entry on prior steps: any missing step redirects to `/signup` (the
 * wizard root) silently. On valid submit, advances to `/signup/preferences`.
 * Back navigates to `/signup/details`, persisting current values (even
 * invalid) into the draft per UI-SPEC's `Back does NOT re-validate.` rule.
 *
 * Mirrors Plan 02-07's Step1AccountPage shape and Plan 02-08 Task 1's
 * Step2DetailsPage exactly: RHF + zodResolver(step3Schema) + sessionStorage
 * rehydration + wrapped Mantine primitives + PENDO_IDS leaves. Step 3
 * differs from Step 2 by:
 *   - 1 TextInput + 3 Selects (no NumberInput).
 *   - Prior-step gate checks BOTH step1 AND step2.
 *   - Plan Select carries a locked `description=` slot per UI-SPEC.
 *
 * The Plan Select's option strings include three Unicode hazards we preserve
 * verbatim (the Zod enum check is strict-equal against these exact strings):
 *   - en-dash (U+2013) in '1–10', '11–50', '51–200', '201–1,000'
 *   - comma + plus in '1,000+'
 *   - spaced slash in 'Retail / e-commerce'
 *
 * The bottom-of-form `Sign in` footer anchor is rendered by `SignupShell` for
 * every step — DO NOT re-render it here.
 *
 * No `pendo.*` runtime is invoked; `data-pendo-id` markup is inert until
 * Phase 6 retrofits the agent.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router'
import { Stack, Group, Title } from '@mantine/core'
import { TextInput, Select, Button } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import {
  step3Schema,
  type Step3Values,
  readWizardDraft,
  writeWizardDraftStep,
  hasStep,
} from '../../../auth'

const COMPANY_SIZE_OPTIONS = [
  '1–10',
  '11–50',
  '51–200',
  '201–1,000',
  '1,000+',
] as const

const INDUSTRY_OPTIONS = [
  'Software',
  'Financial services',
  'Healthcare',
  'Retail / e-commerce',
  'Manufacturing',
  'Education',
  'Other',
] as const

const PLAN_OPTIONS = ['Free', 'Pro', 'Enterprise'] as const

export function Step3CompanyPage(): React.JSX.Element {
  const navigate = useNavigate()
  const draft = readWizardDraft()

  // Gate: must have completed steps 1 AND 2 first. Any prior-step miss
  // redirects silently to the wizard root.
  if (!hasStep(draft, 'step1') || !hasStep(draft, 'step2')) {
    return <Navigate to="/signup" replace />
  }

  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    // Validation fires on Continue click — matches UI-SPEC "validates on Next" rhythm.
    mode: 'onSubmit',
    defaultValues: {
      companyName: '',
      // Non-optional enum fields start undefined at form mount — surface the
      // hole locally via per-field casts rather than `Partial<X> as X`
      // double-casts that hide every other field's mismatch (WR-02).
      companySize: undefined as unknown as Step3Values['companySize'],
      industry: undefined as unknown as Step3Values['industry'],
      planTier: undefined as unknown as Step3Values['planTier'],
      ...(draft.step3 ?? {}),
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    writeWizardDraftStep('step3', values)
    if (typeof pendo !== 'undefined') {
      pendo.track('signup_step3_completed', {
        companyName: values.companyName,
        companySize: values.companySize,
        industry: values.industry,
        planTier: values.planTier,
      })
    }
    navigate('/signup/preferences')
  })

  const onBack = () => {
    // Per UI-SPEC: Back persists current values (even invalid) into the draft,
    // then navigates. `Back does NOT re-validate` — typed but unsubmitted
    // input is preserved across step navigation.
    writeWizardDraftStep('step3', form.getValues() as Partial<Step3Values>)
    navigate('/signup/details')
  }

  return (
    <Stack gap="md">
      <Title order={2}>About your company</Title>
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            {...form.register('companyName')}
            label="Company name"
            placeholder="Acme Inc."
            error={form.formState.errors.companyName?.message}
            pendoId={PENDO_IDS.signup.step3.companyName}
          />
          <Select
            label="Company size"
            placeholder="Select team size"
            data={[...COMPANY_SIZE_OPTIONS]}
            value={form.watch('companySize') ?? null}
            onChange={(value) => {
              // Mantine's Select hands back `string | null`. On clear (null)
              // write undefined so the schema's enum mismatch fires the
              // locked "Pick your company size." copy. On non-null narrow
              // via the runtime enum-membership check (WR-02).
              if (value === null) {
                form.setValue(
                  'companySize',
                  undefined as unknown as Step3Values['companySize'],
                  { shouldValidate: false },
                )
                return
              }
              const isKnown = (COMPANY_SIZE_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'companySize',
                isKnown
                  ? (value as Step3Values['companySize'])
                  : (undefined as unknown as Step3Values['companySize']),
                { shouldValidate: false },
              )
            }}
            error={form.formState.errors.companySize?.message}
            pendoId={PENDO_IDS.signup.step3.companySize}
          />
          <Select
            label="Industry"
            placeholder="Select an industry"
            data={[...INDUSTRY_OPTIONS]}
            value={form.watch('industry') ?? null}
            onChange={(value) => {
              if (value === null) {
                form.setValue(
                  'industry',
                  undefined as unknown as Step3Values['industry'],
                  { shouldValidate: false },
                )
                return
              }
              const isKnown = (INDUSTRY_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'industry',
                isKnown
                  ? (value as Step3Values['industry'])
                  : (undefined as unknown as Step3Values['industry']),
                { shouldValidate: false },
              )
            }}
            error={form.formState.errors.industry?.message}
            pendoId={PENDO_IDS.signup.step3.industry}
          />
          <Select
            label="Plan"
            placeholder="Choose a plan"
            description="You can change this later in Settings."
            data={[...PLAN_OPTIONS]}
            value={form.watch('planTier') ?? null}
            onChange={(value) => {
              if (value === null) {
                form.setValue(
                  'planTier',
                  undefined as unknown as Step3Values['planTier'],
                  { shouldValidate: false },
                )
                return
              }
              const isKnown = (PLAN_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'planTier',
                isKnown
                  ? (value as Step3Values['planTier'])
                  : (undefined as unknown as Step3Values['planTier']),
                { shouldValidate: false },
              )
            }}
            error={form.formState.errors.planTier?.message}
            pendoId={PENDO_IDS.signup.step3.planTier}
          />
          <Group justify="space-between" mt="xl">
            <Button
              type="button"
              variant="default"
              onClick={onBack}
              pendoId={PENDO_IDS.signup.step3.back}
            >Back</Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              pendoId={PENDO_IDS.signup.step3.submit}
            >Continue</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}

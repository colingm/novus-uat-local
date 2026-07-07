import {
  DatePickerInput as MantineDatePickerInput,
  type DatePickerInputProps as MantineDatePickerInputProps,
} from '@mantine/dates'
import type { DatePickerType } from '@mantine/dates'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo DatePickerInput — wraps `@mantine/dates` DatePickerInput and forwards
 * the typed `pendoId` prop as the `data-pendo-id` DOM attribute. The `pendoId`
 * prop is REQUIRED: TypeScript will flag any usage that omits it at compile
 * time, enforcing the PEN-07 convention that every interactive element
 * carries a stable selector.
 *
 * The wrapper is generic over Mantine's `type` discriminant ('default' |
 * 'multiple' | 'range') so the controlled `value` and `onChange` types narrow
 * correctly for each variant. The Phase 4 Task form uses `type='default'`
 * (single date string); the Reports filter uses `type='range'` (tuple of two
 * date strings). Requires the `dayjs` peer dependency, installed in plan 04-01.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting; no Pendo
 * runtime is invoked here.
 */
export type DatePickerInputProps<Type extends DatePickerType = 'default'> =
  MantineDatePickerInputProps<Type> & {
    pendoId: PendoId
  }

export function DatePickerInput<Type extends DatePickerType = 'default'>({
  pendoId,
  ...rest
}: DatePickerInputProps<Type>) {
  return <MantineDatePickerInput data-pendo-id={pendoId} {...(rest as MantineDatePickerInputProps<Type>)} />
}

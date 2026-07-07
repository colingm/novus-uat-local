import {
  MultiSelect as MantineMultiSelect,
  type MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo MultiSelect — wraps Mantine's MultiSelect and forwards the typed
 * `pendoId` prop as the `data-pendo-id` DOM attribute. The `pendoId` prop is
 * REQUIRED: TypeScript will flag any usage that omits it at compile time,
 * enforcing the PEN-07 convention that every interactive element carries a
 * stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 */
export type MultiSelectProps = MantineMultiSelectProps & {
  pendoId: PendoId
}

export function MultiSelect({ pendoId, ...rest }: MultiSelectProps) {
  return <MantineMultiSelect data-pendo-id={pendoId} {...rest} />
}

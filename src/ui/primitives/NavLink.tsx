import {
  NavLink as MantineNavLink,
  type NavLinkProps as MantineNavLinkProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo NavLink — wraps Mantine's NavLink and forwards the typed `pendoId` prop
 * as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 *
 * Phase 3 caller: src/routes/app/AppLayout.tsx renders six instances inside
 * <AppShell.Navbar> with active-state derived from useLocation().pathname.
 */
export type NavLinkProps = MantineNavLinkProps & {
  pendoId: PendoId
}

export function NavLink({ pendoId, ...rest }: NavLinkProps) {
  return <MantineNavLink data-pendo-id={pendoId} {...rest} />
}

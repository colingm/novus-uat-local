import React from 'react'
import { Outlet } from 'react-router'
import { Container } from '@mantine/core'
import { DemoBanner } from '../../ui/DemoBanner'

/**
 * Public layout — renders the persistent DemoBanner above all public routes.
 *
 * Phase-specific notes:
 *   - Phase 2 adds child routes /signup, /signup/details, /signup/company,
 *     /signup/preferences, /signin as PublicLayout children in src/router.tsx
 *   - Phase 2 also wraps the Outlet in additional auth-guard logic
 *   - Phase 6 will mount <PendoRouteBridge /> here (and in AppLayout) to report
 *     SPA route changes to Pendo. Phase 1 deliberately does not include it.
 *
 * FND-06: DemoBanner must be visible on every public page with the literal text
 * "Demo data only — never enter real credentials".
 */
export function PublicLayout(): React.JSX.Element {
  return (
    <>
      <DemoBanner />
      <Container size="lg" py="md">
        <Outlet />
      </Container>
    </>
  )
}

/**
 * RequireAnon — route guard that redirects authenticated users to `/app`.
 *
 * Used to wrap the `/signup*` and `/signin` route segments in
 * `src/router.tsx`. A signed-in user attempting to revisit the registration
 * or sign-in surface is silently routed to their authenticated home — per
 * Phase 2 UI-SPEC, this redirect carries no flash message.
 *
 * Mirrors `<RequireAuth>` in structure (see that file's header for the
 * design rationale shared by both guards): single-slice subscription to
 * `useAuthStore((s) => s.isAuthenticated)`, `replace: true` on the
 * `<Navigate>` so back-button doesn't ping-pong, optional `children`
 * falling back to `<Outlet />`.
 *
 * UI-SPEC explicitly excludes `/` and `/sandbox` from this guard — signed-in
 * users can still visit the public landing and the primitive sandbox. The
 * router config in `src/router.tsx` reflects this by leaving those routes
 * OUTSIDE the `<RequireAnon>` wrapper-route children.
 */

import { Navigate, Outlet } from 'react-router'
import type { ReactNode } from 'react'
import { useAuthStore } from './authStore'

export function RequireAnon({ children }: { children?: ReactNode }): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }
  return <>{children ?? <Outlet />}</>
}

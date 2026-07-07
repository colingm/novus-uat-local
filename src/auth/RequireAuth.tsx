/**
 * RequireAuth — route guard that redirects unauthenticated users to `/signin`.
 *
 * Used to wrap the `/app/*` route segment in `src/router.tsx`. Per Phase 2
 * UI-SPEC ("Interaction Contracts > Route guards" and "Copywriting Contract >
 * State copy > Guard redirect"), the redirect is SILENT — no flash message,
 * no toast, no return-URL preservation. The destination `/signin` page's
 * "Welcome back" title is itself the implicit "you need to sign in" signal.
 *
 * Phase 2 boundary intentionally does NOT implement a return-URL query
 * parameter. If a future phase adds one, the threat model for that plan MUST
 * validate that the supplied value starts with `/app/` (path-only, no
 * protocol, no host) — reject anything else, fall back to `/app`. T-02-26
 * in Plan 02-06's threat register codifies this avoidance.
 *
 * Subscribes to `useAuthStore` DIRECTLY (not via `useAuth()`) so the guard
 * works even outside the AuthProvider context. In normal use the AuthProvider
 * is mounted in `src/App.tsx` so `useAuth()` would also work — direct store
 * access just avoids any context-Provider-ordering ambiguity and removes
 * one indirection.
 *
 * Selector pattern: subscribes to the single `isAuthenticated` boolean slice
 * so unrelated store changes (e.g. swapping `currentVisitor`) don't trigger
 * guard re-renders. Zustand re-renders only when the selected slice changes.
 *
 * Two render shapes for flexibility (matches Plan 02-06 router-wrapper
 * pattern):
 *   - With no `children` prop: renders `<Outlet />` so nested routes mount.
 *   - With `children`: renders them. Reserved for future inline-wrap usage.
 *
 * No loading state — auth hydration in `src/auth/authStore.ts` is synchronous
 * at module-init level (runs before React mounts), so `isAuthenticated` is
 * correct on the very first render. AUTH-10 (refresh-survives-auth) depends
 * on this ordering.
 */

import { Navigate, Outlet } from 'react-router'
import type { ReactNode } from 'react'
import { useAuthStore } from './authStore'

export function RequireAuth({ children }: { children?: ReactNode }): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }
  return <>{children ?? <Outlet />}</>
}

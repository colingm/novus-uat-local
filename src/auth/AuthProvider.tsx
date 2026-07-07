/**
 * AuthProvider — Phase 2 implementation. Bridges the Zustand `useAuthStore`
 * into React Context so existing `useAuth()` consumers (and the FND-07
 * provider position in `src/App.tsx`) keep working. The store itself owns
 * all state and side effects; the Provider just keeps the position in the
 * React tree and exposes the typed `AuthContextValue` via `useContext`.
 *
 * Phase 1 stub behavior (user=null, signIn throws, signOut no-op) is REMOVED.
 * The inline `User` type that lived here in Phase 1 is also REMOVED — `User`
 * (alias of `Visitor`) now lives in `./types` per Plan 02-02.
 *
 * The provider POSITION inside `src/App.tsx` is fixed per FND-07 — this
 * file's BODY is the only thing Phase 2 touches. App.tsx is not edited.
 *
 * Why `useMemo` around `value` (WR-08): without memoization, the context
 * value reference changes on every Provider render — fine for consumers
 * that ALSO call `useAuthStore(...)` (Zustand handles their diffing), but a
 * consumer that ONLY does `const { signOut } = useAuth()` would re-render on
 * every Provider commit (e.g. every time `currentVisitor` changes) even
 * though `signOut` itself is stable. Phase 3's top-bar will be one such
 * consumer. Keying the memo on the subscribed slices keeps the reference
 * stable across unrelated store updates.
 *
 * Why no loading state: hydration is synchronous (authStore's module-init
 * `hydrateAuthFromStorage()` runs before React mounts). There is no async
 * boot phase.
 */

import { createContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from './authStore'
import type { Visitor, Workspace } from './types'
import type { SignInResult } from './authStore'

/**
 * Public context-value shape. Seven fields:
 *  - `user` is an alias of `currentVisitor`, preserved for back-compat with
 *    the Plan 01-04 stub consumers.
 *  - `signInWithCredentials` is the credentials-checking entry point used by
 *    the `/signin` page (Plan 02-10).
 *  - `signInFromVisitor` is the post-wizard sign-in path used by the
 *    completion handler (Plan 02-09) — bypasses credential check because
 *    the caller just created the visitor + workspace via `authRepo`.
 *  - `signOut` is async (returns `Promise<void>`) for signature parity with
 *    the previous Phase 1 stub. Resolves after clearing store + session +
 *    wizard draft. Redirects (`navigate('/')`) are the calling page's job
 *    per UI-SPEC's "redirect is the confirmation" rule.
 */
export type AuthContextValue = {
  user: Visitor | null
  currentVisitor: Visitor | null
  currentWorkspace: Workspace | null
  isAuthenticated: boolean
  signInWithCredentials: (email: string, password: string) => Promise<SignInResult>
  signInFromVisitor: (visitor: Visitor, workspace: Workspace) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  // Subscribe to the slices we expose via context. Selecting individual
  // fields means context value only recomputes when those specific fields
  // change — Zustand handles the diffing.
  const currentVisitor = useAuthStore((s) => s.currentVisitor)
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Actions are stable across the store's lifetime — read them off the
  // vanilla `getState()` so we don't trigger a re-render every time the
  // store updates a non-action slice.
  const signInWithCredentials = useAuthStore.getState().signInWithCredentials
  const signInFromVisitor = useAuthStore.getState().signInFromVisitor
  const signOut = useAuthStore.getState().signOut

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentVisitor,
      currentVisitor,
      currentWorkspace,
      isAuthenticated,
      signInWithCredentials,
      signInFromVisitor,
      signOut,
    }),
    [
      currentVisitor,
      currentWorkspace,
      isAuthenticated,
      signInWithCredentials,
      signInFromVisitor,
      signOut,
    ],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Re-export context for the useAuth hook in ./useAuth.ts
export { AuthContext }

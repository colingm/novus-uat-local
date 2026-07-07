---
phase: 01-foundation-cross-cutting-contracts
plan: "04"
subsystem: provider-stack
tags: [providers, context, auth-stub, workspace-stub, pendo-bridge, fnd-07]
dependency_graph:
  requires: [01-02, 01-03]
  provides: [StorageProvider, AuthProvider, useAuth, WorkspaceProvider, useWorkspace, PendoBridge]
  affects: [src/App.tsx]
tech_stack:
  added: []
  patterns:
    - React Context with createContext<T | null>(null) + throw-on-null hooks
    - FND-07 provider-stack ordering (Storage → Auth → Workspace → PendoBridge → children)
    - Phase-scoped stub pattern (body-only replacement in downstream phases)
key_files:
  created:
    - src/storage/StorageProvider.tsx
    - src/auth/AuthProvider.tsx
    - src/auth/useAuth.ts
    - src/workspace/WorkspaceProvider.tsx
    - src/workspace/useWorkspace.ts
    - src/pendo/PendoBridge.tsx
  modified:
    - src/App.tsx
decisions:
  - FND-07 satisfied with thin Context stubs; real state deferred to Phase 2 (auth) and Phase 4 (workspace)
  - PendoBridge is a verified no-op pass-through; Phase 6 replaces body only — App.tsx never changes
  - signIn stub throws (loud fail) while signOut stub is silent no-op (safe for Phase 1 UI wiring)
  - Inline User and Workspace types defined in provider files; Phase 2/4 will promote to types.ts
metrics:
  duration: "~16 min (wall clock — checkpoint gap excluded)"
  completed: "2026-05-14"
  tasks_completed: 3
  files_created: 6
  files_modified: 1
---

# Phase 01 Plan 04: Provider Stack (FND-07) Summary

**One-liner:** Five React Context providers (StorageProvider, AuthProvider, WorkspaceProvider, PendoBridge) assembled in FND-07 order inside MantineProvider — each a no-op Phase 1 stub that downstream phases replace body-only.

## What Was Built

### Task 1 — Create StorageProvider, AuthProvider, WorkspaceProvider, PendoBridge stubs (commit: 8cb96b7)

Six files created:

**`src/storage/StorageProvider.tsx`**
- Thin Context wrapper re-exposing `{ K, readWithSchema, writeJSON, removeKey }` from `./index`
- `useStorage()` hook throws `Error('useStorage must be used inside <StorageProvider>')` when called outside provider
- Provider body does zero work — `runMigrations()` already ran in `main.tsx` before React mounted

**`src/auth/AuthProvider.tsx`**
- Defines inline `type User = { id: string; email: string; name: string }` (Phase 2 promotes to `src/auth/types.ts`)
- Phase 1 stub value: `{ user: null, signIn: async () => { throw Error(...) }, signOut: async () => {} }`
- `signIn` throws loudly so accidental Phase 1 calls fail immediately
- `signOut` is a silent no-op so future UI affordances can be wired safely without crashing

**`src/auth/useAuth.ts`**
- Reads `AuthContext`; throws `Error('useAuth must be used inside <AuthProvider>')` when context is null

**`src/workspace/WorkspaceProvider.tsx`**
- Defines inline `type Workspace = { id: string; name: string }` (Phase 4 promotes to `src/workspace/types.ts`)
- Phase 1 stub value: `{ workspace: null, switchWorkspace: async () => {} }` (silent no-op)

**`src/workspace/useWorkspace.ts`**
- Reads `WorkspaceContext`; throws `Error('useWorkspace must be used inside <WorkspaceProvider>')` when null

**`src/pendo/PendoBridge.tsx`**
- File-level JSDoc explicitly marked `PHASE 1 STUB`; lists every Phase 6 wiring item that must NOT appear before Phase 6
- Body: `return <>{children}</>` — pure pass-through, zero hooks, zero side effects
- Verified clean: no `window.pendo`, `pendo.initialize`, `VITE_PENDO_API_KEY`, `nanoid`, `useEffect`

### Task 2 — Assemble FND-07 provider stack in App.tsx (commit: 12102d7)

`src/App.tsx` rewritten to nest the four new providers inside `<MantineProvider>` in the exact FND-07 order:

```
MantineProvider
  StorageProvider
    AuthProvider
      WorkspaceProvider
        PendoBridge
          {/* Plan 05 replaces this with <RouterProvider router={router} /> */}
          <Container>…Halo placeholder…</Container>
```

- In-source comment `{/* Plan 05 replaces this with <RouterProvider router={router} /> */}` provides a literal anchor for the Plan 05 executor
- `npx tsc --noEmit` and `npm run build` both exit 0 after assembly

### Task 3 — Human verification (approved)

Developer verified in browser React DevTools:
- Provider hierarchy visible in documented order: App → MantineProvider → StorageProvider → AuthProvider → WorkspaceProvider → PendoBridge → body
- PendoBridge confirmed to have no hooks or state — pure pass-through with only a `children` prop visible
- Zero console errors
- Mantine-styled Halo title still renders

## Stub Return Values (for downstream phase reference)

| Hook | Phase 1 return value | Phase that fills it in |
|------|---------------------|------------------------|
| `useAuth()` | `{ user: null, signIn: throws, signOut: no-op }` | Phase 2 |
| `useWorkspace()` | `{ workspace: null, switchWorkspace: no-op }` | Phase 4 |
| `useStorage()` | `{ K, readWithSchema, writeJSON, removeKey }` (live, from storage/index.ts) | N/A — already functional |

## Provider Order Contract (FND-07)

```
MantineProvider           ← Mantine theming; always outermost
  StorageProvider         ← codec helpers; safe for any provider below to call
    AuthProvider          ← user identity; WorkspaceProvider may depend on user
      WorkspaceProvider   ← workspace context; depends on authenticated user
        PendoBridge       ← Pendo wiring slot; reads auth+workspace in Phase 6
          <children>      ← router slot; Plan 05 replaces placeholder with RouterProvider
```

Each provider may safely consume services from providers above it in the tree. This ordering contract is fixed — no downstream plan needs to edit `src/App.tsx`.

## Integration Points for Downstream Plans

**Plan 05 (Router):**
- Replace the `<Container>…</Container>` placeholder child of `<PendoBridge>` in `src/App.tsx`
- The in-source comment `{/* Plan 05 replaces this with <RouterProvider router={router} /> */}` marks the exact slot

**Phase 2 (Auth):**
- Replace the body of `src/auth/AuthProvider.tsx` with Zustand-backed localStorage auth
- `src/App.tsx` is not modified
- Promote inline `type User` from `AuthProvider.tsx` to `src/auth/types.ts`

**Phase 4 (Workspace):**
- Replace the body of `src/workspace/WorkspaceProvider.tsx` with real persistence
- Promote inline `type Workspace` from `WorkspaceProvider.tsx` to `src/workspace/types.ts`

**Phase 6 (Pendo):**
- Replace the body of `src/pendo/PendoBridge.tsx` with snippet load + `pendo.initialize` + `pendo.identify` wiring
- `src/App.tsx` is not modified

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The following stubs are intentional Phase 1 placeholders — they exist to satisfy FND-07's provider-order requirement. Each is documented in its file with explicit "Phase N replaces this" comments.

| File | Stub | Resolving Phase |
|------|------|-----------------|
| `src/auth/AuthProvider.tsx` | `user: null`, `signIn` throws, `signOut` no-op | Phase 2 |
| `src/workspace/WorkspaceProvider.tsx` | `workspace: null`, `switchWorkspace` no-op | Phase 4 |
| `src/pendo/PendoBridge.tsx` | Pure pass-through — no Pendo runtime | Phase 6 |
| `src/App.tsx` | `<Container>` placeholder inside PendoBridge | Plan 05 |

These stubs are intentional and do not prevent the plan's goal (FND-07 provider-stack ordering) from being achieved.

## Threat Flags

None — this plan adds only React Context providers with no network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- [x] `src/storage/StorageProvider.tsx` exists
- [x] `src/auth/AuthProvider.tsx` exists
- [x] `src/auth/useAuth.ts` exists
- [x] `src/workspace/WorkspaceProvider.tsx` exists
- [x] `src/workspace/useWorkspace.ts` exists
- [x] `src/pendo/PendoBridge.tsx` exists
- [x] `src/App.tsx` modified with FND-07 provider stack
- [x] Commit 8cb96b7 exists (Task 1 — provider stubs)
- [x] Commit 12102d7 exists (Task 2 — App.tsx provider stack)

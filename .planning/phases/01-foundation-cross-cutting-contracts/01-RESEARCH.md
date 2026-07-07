# Phase 1: Foundation & Cross-Cutting Contracts — Research

**Researched:** 2026-05-13
**Domain:** Vite + React 19 + TypeScript SPA scaffolding, Mantine theming, React Router 7, namespaced/versioned localStorage with Zod, Pendo Web SDK 2.324 install + anonymous bootstrap + SPA route bridge + selector registry
**Confidence:** HIGH for the Pendo API surface (verified verbatim from Pendo's own published `docs.json` and Pendo's own snippet repo) and the Vite/React 19/Mantine 9 install path (verified against npm registry); MEDIUM for the React Router 7 import surface (verified against the v7 docs but the v7 line is recent enough that public examples are still settling).

## Summary

Phase 1 is the bootstrap phase for an otherwise empty repo: it stands up Vite + React 19 + TypeScript, wires Mantine 9 with a Halo-branded theme, installs React Router 7 with a public/`/app/*` split, lays down the namespaced/versioned localStorage envelope with a Zod-validated read helper and a boot-time migration runner, mounts a strict provider stack (`Storage → Auth → Workspace → PendoBridge → Router`), embeds the canonical Pendo install snippet in `<head>` with the API key from `import.meta.env.VITE_PENDO_API_KEY`, calls `pendo.initialize` exactly once at boot with a *stable anonymous visitor ID* persisted in localStorage, mounts a `PendoRouteBridge` inside the router that calls `pendo.location.setUrl(window.location.href)` on every `useLocation` change, and exposes a typed `PENDO_IDS` registry plus UI primitive wrappers that forward `data-pendo-id` without baking values into the components.

The single most consequential research finding is that the latest stable versions of the locked stack (CLAUDE.md was written against React 18 / Vite 5 / Mantine 7 / Router 6 / Zod 3 / Zustand 4 / Recharts 2) have **all moved one or two major versions forward**, and Mantine 9 (the only Mantine line published today) **requires React 19**. CLAUDE.md left the door open ("React 18.x or 19.x if stable"), but the planner needs to know the *whole* stack is materially newer than the prose in CLAUDE.md and must lock versions explicitly.

**Primary recommendation:** Adopt the verified-current stack (React 19.2 / Vite 8 / TypeScript 5.x / Mantine 9 / Router 7 / Zod 4 / Zustand 5 / Recharts 3) — this is forced by Mantine 9's React 19 peer dep and is consistent with CLAUDE.md's "or 19.x if stable" allowance. Use the canonical Pendo snippet verbatim from `pendo-io/pendo-client/agent-install-snippet.js`. Generate a stable anonymous visitor ID with `nanoid`, persist it under `halo:v1:pendo:anonId`, and re-use it on every boot until `pendo.identify` is called in Phase 2. Split the Pendo concern into two bridges: a `PendoBridge` provider (post-router-mount, anonymous-init wrapper) and a `PendoRouteBridge` component (inside the router, calls `setUrl` on every route change via `useLocation`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vite/React/TS scaffold | Build tooling | Browser/client | Compiles the SPA; runtime lives entirely client-side |
| Mantine theme + ColorSchemeScript | Browser/client | — | UI library is client-only; `ColorSchemeScript` is a tiny `<script>` in `<head>` that runs pre-React to avoid FOUC |
| React Router 7 (browser router) | Browser/client | — | History API routing happens client-side; no server fallback exists in this project |
| `localStorage` envelope + Zod validation | Browser/client | — | All persistence is `localStorage`; no backend |
| Meta + migration runner | Browser/client | — | Runs at boot, before any UI mounts, against `localStorage` |
| Pendo Snippet | Browser/client (CDN-loaded) | — | Loads pre-React from Pendo CDN, attaches `window.pendo` |
| `pendo.initialize` (anonymous) | Browser/client | — | Fires once per page load; needs `window.pendo` to exist |
| `PendoRouteBridge` (`setUrl`) | Browser/client | — | Subscribes to React Router `useLocation`; pure client effect |
| `PENDO_IDS` registry | Build/type-time | Browser/client (DOM attribute) | Compile-time `as const` source of truth; renders as DOM `data-pendo-id` attribute |
| Provider stack (`Storage → Auth → Workspace → PendoBridge → Router`) | Browser/client | — | Strict ordering at React tree root |
| `.env` / API key loading | Build-time → client | — | Vite statically replaces `import.meta.env.VITE_*` at build time; key is public-by-design |

> **Note:** Halo has no server tier — all capabilities sit in the browser/client tier. This map exists so the planner can sanity-check that nothing in Phase 1 accidentally drifts toward a "we need a backend for this" framing.

## User Constraints (from CLAUDE.md — no CONTEXT.md exists for this phase)

CLAUDE.md is unusually detailed and is treated by this researcher with the same authority as a locked CONTEXT.md.

### Locked decisions (paraphrased from CLAUDE.md)

- **Framework:** React (not Svelte). `[CITED: CLAUDE.md "Framework Decision: React (not Svelte)"]`
- **UI library:** Mantine (primary). `[CITED: CLAUDE.md "Use as the base for everything"]`
- **Charts:** Recharts (SVG only — no canvas). `[CITED: CLAUDE.md "Pendo guides and Session Replay can't target canvas"]`
- **State:** Zustand for global state; `zustand/middleware/persist` for auth/UI prefs. `[CITED: CLAUDE.md "Use it for that"]`
- **Forms:** React Hook Form + Zod + `@hookform/resolvers/zod`. `[CITED: CLAUDE.md "The canonical trio"]`
- **Persistence:** Hand-rolled `JSON.stringify`/`JSON.parse` behind a typed module with **versioned keys** (`halo:v1:<domain>[:scopeId]`) and **Zod-validated reads** with safe fallback. `[CITED: CLAUDE.md "Recommended — total surface area is ~50 lines"]`
- **Pendo Snippet:** synchronous `<script>` in `<head>` before the React bundle; `pendo.initialize` exactly once per page load; subsequent identity changes via `identify` / `updateOptions`, **never another `initialize`**. `[CITED: CLAUDE.md "Pendo Integration"]`
- **`data-pendo-id` registry:** centralized `PENDO_IDS` TypeScript registry is the only source of values; UI primitive wrappers forward the attribute to the DOM. `[CITED: CLAUDE.md "Pattern 4"]`
- **Routing:** History API only — no hash routes. React Router 6 (or 7) data router APIs. `[CITED: CLAUDE.md "react-router v5 — Use react-router-dom v6 (or 7 if stable)"]`
- **API key:** loaded from `import.meta.env.VITE_PENDO_API_KEY`; `.env.example` checked in; `.env` gitignored. `[CITED: CLAUDE.md "What NOT to Use" — localStorage without versioned keys / hardcoded Pendo API key]`
- **Demo-data banner:** persistent "Demo data only — never enter real credentials" banner on the public layout. `[CITED: CLAUDE.md "demo-data banner"]`

### Claude's discretion (Phase 1 specific)

- **Stable version numbers** — CLAUDE.md says "React 18.3.x (or 19.x if stable)"; researcher locks React 19 because Mantine 9 requires it (peer dep `react: ^19.2.0`).
- **Brand color / font** — CLAUDE.md is silent; researcher recommends a neutral B2B SaaS palette and a modern sans-serif (`Inter`).
- **Anonymous visitor ID format** — Pendo accepts any string ID; researcher recommends `nanoid()` prefixed with `_PENDO_T_anon-` to mirror Pendo's own anonymous-ID convention.
- **`PENDO_IDS` registry shape** — CLAUDE.md sketches both an `as const` object literal and a TypeScript union type; researcher recommends nested `as const` for namespacing + a derived union for type safety.
- **Migration runner shape** — CLAUDE.md says "boot-time migration runner upgrades older schemas" but does not specify shape; researcher recommends a registered-handler pattern keyed by schemaVersion.

### Deferred (OUT OF SCOPE for Phase 1)

- Real auth (Phase 2) — passwords, sign-in/sign-out, RequireAuth/RequireAnon, registration funnel
- Real `pendo.identify` call (Phase 2) — Phase 1 only does anonymous `initialize`
- AppShell with side nav (Phase 3)
- Page-level UI (Phases 3–5)
- Recharts integration (Phase 3); Phase 1 only *establishes the SVG-charts convention* (PEN-08) — no chart code ships in Phase 1
- Real masked password fields (Phase 2); Phase 1 only *establishes the masked-input primitive* (PEN-09)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Vite + React 18 + TypeScript scaffold runs locally via `npm run dev` | "Vite + React + TypeScript Scaffold" section. Note: CLAUDE.md says React 18 *or* 19; researcher locks React 19 due to Mantine 9 requirement. |
| FND-02 | Mantine 7 wired in with Halo-branded theme | "Mantine Setup" section. Note: Mantine 7 is two majors behind current (Mantine 9). Researcher recommends Mantine 9 (only stable line). |
| FND-03 | React Router 6 with History API routing; public vs `/app/*` split | "Router Setup" section. Note: React Router 6 is a major behind current (7); v7 is recommended. |
| FND-04 | `localStorage` behind `halo:v1:<domain>[:scopeId]`; Zod-validated reads with safe fallback | "Storage Envelope" + "Zod-validated reads" sections |
| FND-05 | `halo:v1:meta` with `{ schemaVersion, seededAt, appVersion }` + boot-time migration runner | "Meta + Migrations" section |
| FND-06 | Visible "Demo data only — never enter real credentials" banner on public layout | "PublicLayout" file in file layout |
| FND-07 | Provider order `Storage → Auth → Workspace → PendoBridge → Router` | "Provider Stack" section |
| PEN-01 | Pendo Snippet synchronous in `<head>` before React bundle; API key from `import.meta.env.VITE_PENDO_API_KEY`; `.env.example` checked in, `.env` gitignored | "Pendo Snippet placement" + "Env var typing" sections |
| PEN-02 | `pendo.initialize` exactly once at boot with anonymous visitor ID | "Anonymous Bootstrap" section |
| PEN-06 | Every SPA route change emits `pendo.location.setUrl(window.location.href)` via `PendoRouteBridge` | "PendoRouteBridge" section |
| PEN-07 | Centralized `PENDO_IDS` TypeScript registry is only source of `data-pendo-id` values; UI primitive wrappers forward to DOM | "PENDO_IDS registry" + "UI primitives" sections |
| PEN-08 | Convention: charts will be SVG (Recharts) — no canvas (Phase 1 sets the convention) | Recharts is the chosen library (Phase 3+); Phase 1 documents the convention in `CONVENTIONS.md` or similar |
| PEN-09 | Convention: sensitive fields carry Session-Replay mask attribute (Phase 1 establishes the masked-input primitive) | "Masked input primitive" section — uses `.pendo-sr-ignore` CSS class (verified from Pendo SDK source) |

## Standard Stack

### Core

| Library | Version (verified `npm view` 2026-05-13) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | **19.2.6** `[VERIFIED: npm view]` | UI framework | Required by Mantine 9 (peer dep `^19.2.0`). CLAUDE.md explicitly allows React 19 "if stable" — it is. |
| `react-dom` | **19.2.6** `[VERIFIED: npm view]` | DOM renderer | Must match React major |
| `typescript` | **6.0.3** `[VERIFIED: npm view]` | Type safety | Latest stable; backward-compatible source of `.ts/.tsx` files |
| `vite` | **8.0.12** `[VERIFIED: npm view]` | Build tool / dev server | Latest stable; engine requirement is Node `^20.19.0 \|\| >=22.12.0` `[VERIFIED: npm view vite engines]` |
| `@vitejs/plugin-react` | **6.0.1** `[VERIFIED: npm view]` | Vite React plugin | Peer dep `vite: ^8.0.0` — must match Vite major `[VERIFIED: npm view peerDependencies]` |
| `react-router` | **7.15.0** `[VERIFIED: npm view]` | Client-side routing | v7 line; v6 not strictly needed but CLAUDE.md left room ("v6 or 7 if stable") |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@mantine/core` | **9.2.0** `[VERIFIED: npm view]` | UI primitives | All UI components. Peer dep: `react: ^19.2.0` `[VERIFIED: npm view peerDependencies]` |
| `@mantine/hooks` | **9.2.0** `[VERIFIED: npm view]` | Hooks (clipboard, hover, etc.) | Required by `@mantine/core` |
| `@mantine/form` | **9.2.0** `[VERIFIED: npm view]` | (Optional) Mantine form helpers | Phase 2 forms — researcher recommends RHF instead per CLAUDE.md, so this may be omitted from Phase 1 install |
| `@mantine/notifications` | **9.2.0** `[VERIFIED: npm view]` | Toasts | Phase 4+ (deferred); not installed in Phase 1 unless planner wants to install full Mantine suite up front |
| `@tabler/icons-react` | **3.44.0** `[VERIFIED: npm view]` | Icon set | Mantine's canonical icon library |
| `zustand` | **5.0.13** `[VERIFIED: npm view]` | Global state | Phase 2+ for auth; Phase 1 *installs but doesn't fully use* (provider scaffolding may use it for shape) |
| `zod` | **4.4.3** `[VERIFIED: npm view]` | Schema validation | Storage read validation; forms in Phase 2 |
| `react-hook-form` | **7.65.0** `[VERIFIED: npm view]` (peer dep `^7.55.0` for resolvers v5) | Form state | Phase 2 forms; installed in Phase 1 if planner wants the trio together; otherwise defer |
| `@hookform/resolvers` | **5.2.2** `[VERIFIED: npm view; supports zod v4]` `[CITED: https://github.com/react-hook-form/resolvers/releases]` | RHF ↔ Zod glue | Use when forms ship (Phase 2) |
| `nanoid` | **5.1.11** `[VERIFIED: npm view]` | ID generation | Anonymous visitor ID; future task/workspace IDs |
| `dayjs` | **1.11.20** `[VERIFIED: npm view]` | Date formatting | Phase 3+ (Dashboard charts); defer install to Phase 3 |
| `@faker-js/faker` | **10.4.0** `[VERIFIED: npm view]` | Fake data seeding | Phase 5 (seeder); defer install to Phase 5 |
| `recharts` | **3.8.1** `[VERIFIED: npm view]` | SVG charts | Phase 3+ (Dashboard); defer install to Phase 3 |
| `@tanstack/react-table` | **8.21.3** `[VERIFIED: npm view]` | Headless table | Phase 4 (Reports); defer install |

### Phase 1 install set (the *minimum* to satisfy Phase 1 requirements)

```bash
# Scaffolding (via the Vite scaffold itself)
npm create vite@latest halo-app -- --template react-ts

# Routing
npm install react-router

# UI library + icons
npm install @mantine/core @mantine/hooks @tabler/icons-react

# State (used by AuthProvider/WorkspaceProvider scaffolding even if mostly null in Phase 1)
npm install zustand

# Storage validation
npm install zod

# ID generation (anonymous visitor ID)
npm install nanoid
```

Defer until later phases: `react-hook-form`, `@hookform/resolvers`, `recharts`, `dayjs`, `@faker-js/faker`, `@tanstack/react-table`, `@mantine/form`, `@mantine/notifications`, `@mantine/dates`, `@mantine/charts`.

> **Version verification command (run again at install time to catch a newer patch):** `npm view <pkg> version`

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router 7 | React Router 6.x | RR6 still works; some import paths differ (`react-router-dom` vs `react-router`). RR7 is the active line and is what `npm view` returns today. |
| Mantine 9 (React 19 required) | Mantine 7 + React 18 | Would require pinning both *down* a major; Mantine 7 is no longer the published `latest`. Not worth the friction. |
| `react-router` (v7 unified package) | `react-router-dom` | Both still exist in v7. The official v7 guidance prefers `react-router`; `react-router-dom` is the legacy-named web-targeted variant. Pick one and stick — researcher recommends `react-router`. |
| Zod 4 | Zod 3 | `@hookform/resolvers@5.2.0+` supports Zod 4; new code shouldn't pin to Zod 3 in 2026. `[CITED: WebSearch — react-hook-form/resolvers releases]` |

## Architecture Patterns

### System architecture diagram

```
                          ┌───────────────────────────────────────────┐
                          │       index.html (served by Vite)         │
                          │                                           │
   ┌──────────────────────┤  <head>                                   │
   │  Pendo CDN           │    ┌──────────────────────────────────┐   │
   │  cdn.pendo.io/agent/ │ ◄──┤  Pendo install snippet (sync)    │   │
   │  static/<API_KEY>/   │    │  - Stubs window.pendo            │   │
   │  pendo.js            │    │  - Queues calls until agent loads│   │
   │                      │    │  - Async-loads pendo.js          │   │
   │                      │    └──────────────────────────────────┘   │
   │                      │    ┌──────────────────────────────────┐   │
   │                      │    │  Mantine ColorSchemeScript       │   │
   │                      │    │  (prevents dark-mode FOUC)       │   │
   │                      │    └──────────────────────────────────┘   │
   │                      │  </head>                                  │
   │                      │  <body>                                   │
   │                      │    <div id="root"></div>                  │
   │                      │    <script type="module" src="/src/main.tsx">
   │                      │  </body>                                  │
   └──────────────────────┴───────────────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────────────┐
                          │           main.tsx (entry)                │
                          │  1. import '@mantine/core/styles.css'     │
                          │  2. runMigrations()  ← boot-time, sync    │
                          │  3. ReactDOM.createRoot(...).render(<App/>) │
                          └───────────────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────────────┐
                          │              App.tsx                       │
                          │                                            │
                          │  <MantineProvider theme={haloTheme}>       │
                          │   <StorageProvider>            ┐           │
                          │    <AuthProvider>              ├ FND-07    │
                          │     <WorkspaceProvider>        │ provider  │
                          │      <PendoBridge>             ┘ stack     │
                          │       <RouterProvider          ◄─── outer  │
                          │         router={router}         │   UI     │
                          │       />                        │          │
                          │                                 ▼          │
                          │   inside RouterProvider:                   │
                          │     <PendoRouteBridge />     ◄── useLocation │
                          │     <Outlet />                              │
                          └───────────────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────────────┐
                          │  Routes (Phase 1 minimal — placeholders)  │
                          │                                            │
                          │   path: "/"      Component: PublicLayout   │
                          │   ├ index        Component: Landing        │
                          │   │              (placeholder Phase 1)     │
                          │   │                                        │
                          │   path: "/app"   Component: AppLayout      │
                          │   └ index        Component: AppPlaceholder │
                          │                  (placeholder Phase 1)     │
                          └───────────────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────────────┐
                          │  localStorage (envelope: halo:v1:*)       │
                          │                                            │
                          │   halo:v1:meta                             │
                          │     { schemaVersion: 1, seededAt: null,    │
                          │       appVersion: "0.1.0" }                │
                          │                                            │
                          │   halo:v1:pendo:anonId                     │
                          │     "_PENDO_T_anon-<nanoid>"               │
                          │                                            │
                          │  (other keys added Phase 2+)               │
                          └───────────────────────────────────────────┘
```

**Reading the diagram:**
- Anything outside the React tree (Pendo snippet, Mantine ColorSchemeScript, migrations runner) runs *before* React mounts.
- The provider stack is rendered *inside* `<MantineProvider>` so providers can use Mantine hooks if they need to (e.g. theme color-scheme awareness later).
- `PendoBridge` wraps `RouterProvider` (per FND-07) and is responsible for the `initialize(anonymous)` call. It can do this because it doesn't need router context — it just needs the `window.pendo` stub.
- `PendoRouteBridge` is a *separate* component rendered *inside* the router tree (so it can use `useLocation`). It is responsible for `setUrl()` on every route change. The two-bridge split is critical and documented in detail below.

### Recommended file layout

```
halo-app/
├── .env.example                           # NEW — checked in
├── .env                                   # NEW — gitignored
├── .gitignore                             # NEW — Vite default + .env
├── index.html                             # NEW — Pendo snippet in <head>
├── package.json                           # NEW
├── tsconfig.json                          # NEW (Vite-template)
├── tsconfig.node.json                     # NEW (Vite-template)
├── vite.config.ts                         # NEW
├── README.md                              # NEW — minimal "how to run"
└── src/
    ├── main.tsx                           # NEW — runMigrations + ReactDOM.createRoot
    ├── App.tsx                            # NEW — MantineProvider + provider stack + Router
    ├── vite-env.d.ts                      # NEW — ImportMetaEnv augmentation
    ├── theme.ts                           # NEW — haloTheme (Mantine MantineTheme)
    ├── router.tsx                         # NEW — createBrowserRouter config
    ├── pendo/
    │   ├── PENDO_IDS.ts                   # NEW — typed registry of data-pendo-id values
    │   ├── anon-id.ts                     # NEW — getOrCreateAnonymousVisitorId()
    │   ├── PendoBridge.tsx                # NEW — anonymous initialize on mount
    │   ├── PendoRouteBridge.tsx           # NEW — setUrl on useLocation change
    │   └── types.d.ts                     # NEW — declare global { Window { pendo? } }
    ├── storage/
    │   ├── keys.ts                        # NEW — KEY builder (halo:v1:<domain>[:scopeId])
    │   ├── codec.ts                       # NEW — readWithSchema + write helpers
    │   ├── schemas.ts                     # NEW — Zod schemas (MetaSchema, AnonIdSchema)
    │   ├── migrations.ts                  # NEW — runMigrations() + registry
    │   └── StorageProvider.tsx            # NEW — runs migrations on mount (Phase 1: thin)
    ├── auth/
    │   └── AuthProvider.tsx               # NEW — Phase 1 thin shell (always anonymous)
    ├── workspace/
    │   └── WorkspaceProvider.tsx          # NEW — Phase 1 thin shell (always no workspace)
    ├── routes/
    │   ├── public/
    │   │   ├── PublicLayout.tsx           # NEW — AppShell with DemoBanner + Outlet
    │   │   └── Landing.tsx                # NEW — Phase 1 placeholder
    │   └── app/
    │       ├── AppLayout.tsx              # NEW — Phase 1 minimal AppShell (placeholder)
    │       └── AppPlaceholder.tsx         # NEW — "Authenticated area (Phase 3)" stub
    └── ui/
        ├── primitives/
        │   ├── Button.tsx                 # NEW — wraps Mantine Button, forwards data-pendo-id
        │   ├── TextInput.tsx              # NEW — wraps Mantine TextInput, forwards data-pendo-id
        │   ├── PasswordInput.tsx          # NEW — wraps Mantine PasswordInput, adds .pendo-sr-ignore (PEN-09)
        │   ├── Anchor.tsx                 # NEW — wraps Mantine Anchor, forwards data-pendo-id
        │   └── index.ts                   # NEW — barrel
        └── DemoBanner.tsx                 # NEW — "Demo data only — never enter real credentials"
```

**Rationale for this layout:**

- `pendo/`, `storage/`, `auth/`, `workspace/` sit as siblings to enforce the dependency direction storage ← workspace ← auth ← pendo-bridge. (Matches `research/ARCHITECTURE.md`.)
- `routes/public/` and `routes/app/` are strictly separated. `PublicLayout` never imports anything from `routes/app/`.
- `ui/primitives/` is *the* file where the `data-pendo-id` forwarding pattern lives. Pages import these primitives instead of Mantine directly.
- `theme.ts` is its own file (not inlined in `App.tsx`) so future phases can add tokens cleanly.
- `router.tsx` is its own file so Phase 2 can add registration/signin routes without touching `App.tsx`.

### Pattern 1: Strict Provider Stack (FND-07)

**What:** Five components nested at the React tree root in a fixed order: `Storage → Auth → Workspace → PendoBridge → Router`.

**When to use:** Multi-tenant SPA where Pendo identity is derived from auth + workspace state. The order is load-bearing — see "Pitfall: Provider order matters" below.

**Why this order:**

| Provider | Why it sits where it does |
|----------|---------------------------|
| `StorageProvider` (outermost of the five) | Runs migrations on mount, hydrates from `localStorage`. Everything below depends on a known schema version. (In Phase 1, migrations run *before* `ReactDOM.createRoot` in `main.tsx`, so `StorageProvider` is mostly a typed Context provider — the work is already done. Future phases could push migrations into a `useState`/`useEffect` pattern if async migrations ever appear.) |
| `AuthProvider` | Reads `halo:v1:session` (Phase 2+) and exposes `{ user, workspace?, signIn, signOut }`. In Phase 1, always returns `{ user: null }` — the shell is here so Phase 2 can drop the real implementation in without changing `App.tsx`. |
| `WorkspaceProvider` | Reads `halo:v1:accounts` and exposes the *current* account scoped to the signed-in user. In Phase 1, always `null`. |
| `PendoBridge` | Reads `useAuth()` + `useWorkspace()` and calls `pendo.initialize` (anonymous) or `pendo.identify` (post-auth, Phase 2). In Phase 1, only the anonymous path fires. |
| `RouterProvider` (innermost) | Holds the route tree. `PendoRouteBridge` lives *inside* this — see Pattern 5. |

```tsx
// Source: file layout above; pattern derived from research/ARCHITECTURE.md "Pattern 2"
// src/App.tsx
import { MantineProvider } from '@mantine/core';
import { RouterProvider } from 'react-router';
import { haloTheme } from './theme';
import { router } from './router';
import { StorageProvider } from './storage/StorageProvider';
import { AuthProvider } from './auth/AuthProvider';
import { WorkspaceProvider } from './workspace/WorkspaceProvider';
import { PendoBridge } from './pendo/PendoBridge';

export default function App() {
  return (
    <MantineProvider theme={haloTheme} defaultColorScheme="light">
      <StorageProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <PendoBridge>
              <RouterProvider router={router} />
            </PendoBridge>
          </WorkspaceProvider>
        </AuthProvider>
      </StorageProvider>
    </MantineProvider>
  );
}
```

### Pattern 2: Versioned, Namespaced localStorage with Zod (FND-04, FND-05)

**What:** Every read goes through `readWithSchema<T>(key, schema, fallback)`. Every write goes through `writeJSON(key, value)`. Keys are built via `K.meta()`, `K.pendoAnonId()`, etc. — never hand-typed strings.

**When to use:** Any browser-only SPA where the schema will evolve. Phase 1 is the *only* time it's cheap to install this — retrofitting later is the canonical "looks done but isn't" failure.

**Trade-offs:**
- Pro: Refactor-friendly; schema migrations are 10-line functions.
- Pro: Corrupt JSON falls back to default instead of crashing the demo.
- Pro: Type safety end-to-end (Zod schema is the source of types, via `z.infer`).
- Con: Slight ceremony on every read/write — mitigated by the helper.

```ts
// Source: composed from CLAUDE.md "LocalStorage Persistence Pattern" + research/ARCHITECTURE.md "Pattern 3"
// src/storage/keys.ts
export const SCHEMA_VERSION = 1;
const NS = 'halo';
const V = `v${SCHEMA_VERSION}`;

export const K = {
  meta:           ()              => `${NS}:${V}:meta`,
  pendoAnonId:    ()              => `${NS}:${V}:pendo:anonId`,
  // Phase 2+ keys (sketched for context, NOT created in Phase 1):
  // session:     ()              => `${NS}:${V}:session`,
  // visitors:    ()              => `${NS}:${V}:visitors`,
  // accounts:    ()              => `${NS}:${V}:accounts`,
  // tasks:       (accountId)     => `${NS}:${V}:tasks:${accountId}`,
} as const;
```

```ts
// src/storage/codec.ts
import type { z } from 'zod';

export function readWithSchema<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    // JSON.parse threw, or localStorage unavailable (Safari private mode etc.)
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError or private-mode write failure — non-fatal in a demo
    console.warn(`[halo:storage] write failed for ${key}`, err);
  }
}

export function removeKey(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
```

```ts
// src/storage/schemas.ts
import { z } from 'zod';

export const MetaSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  seededAt: z.string().datetime().nullable(),  // ISO date or null until first seed (Phase 5)
  appVersion: z.string(),
});
export type Meta = z.infer<typeof MetaSchema>;

export const AnonIdSchema = z.string().min(1);  // simple — just a non-empty string
```

### Pattern 3: Boot-time Migration Runner (FND-05)

**What:** A `runMigrations()` function reads `halo:v1:meta.schemaVersion`, compares to the current `SCHEMA_VERSION`, and runs registered migration handlers in order. Handlers are pure functions `(prevVersion) => void` that read+rewrite `localStorage` keys.

**When to use:** Any app whose schema will evolve. In Phase 1 the migrations registry is *empty* (we're at v1 and there's nothing to migrate from), but the runner exists so Phase 2 can `register(2, migrateV1ToV2)` without re-architecting Phase 1.

```ts
// Source: composed from CLAUDE.md "Versioned every key" + Pitfall 6 in research/PITFALLS.md
// src/storage/migrations.ts
import { K } from './keys';
import { readWithSchema, writeJSON } from './codec';
import { MetaSchema, type Meta } from './schemas';

const APP_VERSION = '0.1.0'; // bump as the project advances; stored in meta for diagnostics
const CURRENT_SCHEMA_VERSION = 1;

// Registered migrations: from version N -> N+1
type Migration = (prevVersion: number) => void;
const migrations: Record<number, Migration> = {
  // Example (Phase 2 would add):
  // 1: (prev) => { /* migrate v1 → v2 here */ },
};

const DEFAULT_META: Meta = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  seededAt: null,
  appVersion: APP_VERSION,
};

export function runMigrations(): void {
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META);

  // First-boot case: meta absent or default returned
  if (meta.schemaVersion === CURRENT_SCHEMA_VERSION && meta.appVersion === APP_VERSION) {
    // Still write meta if it was the default fallback (first boot)
    const raw = localStorage.getItem(K.meta());
    if (raw == null) writeJSON(K.meta(), DEFAULT_META);
    return;
  }

  // Run sequential migrations
  let v = meta.schemaVersion;
  while (v < CURRENT_SCHEMA_VERSION) {
    const fn = migrations[v];
    if (!fn) {
      console.warn(`[halo:migrations] No migration registered for v${v} → v${v + 1}; resetting meta.`);
      writeJSON(K.meta(), DEFAULT_META);
      return;
    }
    fn(v);
    v++;
  }

  writeJSON(K.meta(), {
    ...meta,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: APP_VERSION,
  });
}
```

`runMigrations()` is called *once* from `main.tsx`, synchronously, *before* `ReactDOM.createRoot(...).render(<App/>)`. Synchronous is correct here — `localStorage` is synchronous, and we want migrations to have completed before any React component tries to read.

### Pattern 4: Centralized `PENDO_IDS` Registry (PEN-07)

**What:** A single `as const` nested object literal exports every `data-pendo-id` value the app uses. Pages and UI wrappers reference `PENDO_IDS.<area>.<element>`. Type system enforces that no raw `data-pendo-id="..."` string is used.

**When to use:** From line one. The whole project's guide-targeting depends on this discipline.

**Shape decision — nested-as-const vs flat-string-union:**

Two reasonable shapes. Researcher recommends **nested `as const` namespaced**, with a derived union type for the prop type:

```ts
// Source: composed from CLAUDE.md "Pattern 4" + research/ARCHITECTURE.md "Pattern 4"
// src/pendo/PENDO_IDS.ts
export const PENDO_IDS = {
  layout: {
    publicDemoBanner: 'layout.public.demo-banner',
    publicLanding:    'layout.public.landing',  // page-container marker
    appPlaceholder:   'layout.app.placeholder',
  },
  // Phase 2+ namespaces (sketched, not used in Phase 1):
  // signup: { stepIdentitySubmit: 'signup.step-identity.submit', ... },
  // nav:    { dashboard: 'nav.dashboard', ... },
} as const;

// Derive the union of all leaf values for prop typing
type Leaves<T> = T extends string
  ? T
  : T extends Record<string, unknown>
  ? Leaves<T[keyof T]>
  : never;

export type PendoId = Leaves<typeof PENDO_IDS>;
```

**Rationale for nested-as-const:**
- Pro: Reads at the call site as `PENDO_IDS.signup.stepIdentitySubmit` — namespace is obvious in the IDE.
- Pro: `PendoId` derived union forces UI primitives to accept *only* known values (refactor-safe).
- Pro: Easy to grep — `PENDO_IDS\.` finds every usage.
- Con: Adding a value requires editing one file (intentional — that's the registry pattern).

**Convention for the *string* values:** `<page-or-feature>.<subarea>.<element>`, dot-separated, kebab-case within segments. Example: `nav.sidebar.help`, `dashboard.charts.velocity`, `signup.step-identity.submit`.

### Pattern 5: Two-bridge split — `PendoBridge` (provider) + `PendoRouteBridge` (inside Router) (PEN-02, PEN-06, FND-07)

**This is the most subtle Phase 1 design decision and needs to be planned explicitly.**

FND-07 says the provider order is `Storage → Auth → Workspace → PendoBridge → Router`. PEN-06 says every route change must call `pendo.location.setUrl(window.location.href)`, which requires `useLocation()` — and `useLocation()` only works *inside* a `<RouterProvider>`.

**Reconciliation: Two components, two responsibilities.**

| Component | Lives where | Responsibility |
|-----------|------------|----------------|
| `PendoBridge` (the *identity* bridge in FND-07) | Wraps `<RouterProvider>` (provider stack) | Subscribes to `useAuth()` + `useWorkspace()`; calls `pendo.initialize` once on first mount (Phase 1: anonymous; Phase 2: with real visitor/account when auth resolves); calls `pendo.identify` on subsequent identity changes (Phase 2+). Does NOT use router context. |
| `PendoRouteBridge` (the *route* bridge in the success criteria) | Rendered inside the router tree (e.g. as a child of the root layout or as a sibling of `<Outlet/>` in `PublicLayout`/`AppLayout`) | Subscribes to `useLocation()`; calls `window.pendo.location.setUrl(window.location.href)` on every change. Does NOT touch auth/workspace. |

```tsx
// Source: PEN-02 + PEN-06; signature confirmed against Pendo SDK source (verified verbatim)
// src/pendo/PendoBridge.tsx
import { useEffect, useRef } from 'react';
import { getOrCreateAnonymousVisitorId } from './anon-id';

export function PendoBridge({ children }: { children: React.ReactNode }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;          // guard against StrictMode double-mount
    if (!window.pendo) return;            // snippet missing (e.g. no API key) — fail soft
    const visitorId = getOrCreateAnonymousVisitorId();
    window.pendo.initialize({ visitor: { id: visitorId } });
    initRef.current = true;
  }, []);

  return <>{children}</>;
}
```

```tsx
// src/pendo/PendoRouteBridge.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function PendoRouteBridge() {
  const location = useLocation();
  useEffect(() => {
    window.pendo?.location?.setUrl?.(window.location.href);
  }, [location.pathname, location.search, location.hash]);
  return null;
}
```

**Where does `PendoRouteBridge` actually mount?** Inside the router tree. Cleanest placement: as a child of the root route(s) so it survives across `PublicLayout`↔`AppLayout` transitions:

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router';
import { PublicLayout } from './routes/public/PublicLayout';
import { Landing } from './routes/public/Landing';
import { AppLayout } from './routes/app/AppLayout';
import { AppPlaceholder } from './routes/app/AppPlaceholder';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PublicLayout,           // renders <PendoRouteBridge/> + <DemoBanner/> + <Outlet/>
    children: [
      { index: true, Component: Landing },
      // Phase 2 adds /signup, /signin, etc.
    ],
  },
  {
    path: '/app',
    Component: AppLayout,              // renders <PendoRouteBridge/> + <Outlet/> (placeholder shell)
    children: [
      { index: true, Component: AppPlaceholder },
      // Phase 3 fleshes this out
    ],
  },
]);
```

Either layout mounts `<PendoRouteBridge/>` once. (A single shared layout at `path: '/'` could be used too, but separating public vs app from the top is closer to the FND-03 "hard split" requirement.)

### Pattern 6: UI primitive wrappers (PEN-07, PEN-09)

**What:** Thin wrappers around Mantine `Button`, `TextInput`, `PasswordInput`, `Anchor` that accept `pendoId: PendoId` and forward it as `data-pendo-id` to the rendered DOM element. The Mantine 9 components forward unknown DOM props to the underlying element (verified by usage convention — Mantine's polymorphic component system relies on rest-prop forwarding).

```tsx
// Source: PEN-07 / CLAUDE.md "Pendo Integration → Stable selectors"
// src/ui/primitives/Button.tsx
import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core';
import type { PendoId } from '../../pendo/PENDO_IDS';

export type ButtonProps = MantineButtonProps & {
  pendoId: PendoId;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
};

export function Button({ pendoId, children, ...rest }: ButtonProps) {
  return (
    <MantineButton data-pendo-id={pendoId} {...rest}>
      {children}
    </MantineButton>
  );
}
```

**PasswordInput primitive (PEN-09 — masked-input convention):**

Pendo Session Replay **auto-masks** `input[type="password"]`, `input[type="email"]`, and `input[type="tel"]` by default (verified verbatim from `/dist/replay.js`: `maskInputOptions.password: true`, `email: true`, `tel: true` — "these 3 types of inputs should never be able to be unmasked by the customer"). So for password inputs the default is already correct.

The *additional* PEN-09 lever is `.pendo-sr-ignore` — a CSS class on any element that **blocks recording** of that element's subtree (verified verbatim: `blockedSelectors = ['.pendo-ignore', '.pendo-sr-ignore'].concat(...)`). For Phase 1 the masked-input primitive sets this class — belt-and-suspenders for the password input.

```tsx
// src/ui/primitives/PasswordInput.tsx
import { PasswordInput as MantinePasswordInput, type PasswordInputProps as MPI } from '@mantine/core';
import type { PendoId } from '../../pendo/PENDO_IDS';

export type PasswordInputProps = MPI & { pendoId: PendoId };

export function PasswordInput({ pendoId, className, ...rest }: PasswordInputProps) {
  // .pendo-sr-ignore tells Pendo Session Replay to block this element entirely
  const cls = ['pendo-sr-ignore', className].filter(Boolean).join(' ');
  return <MantinePasswordInput data-pendo-id={pendoId} className={cls} {...rest} />;
}
```

> **Note for the planner:** PEN-09's exact phrasing is "sensitive fields (password inputs) carry a Session-Replay mask attribute." The Pendo SDK uses a *CSS class* (`.pendo-sr-ignore`) — not a data attribute — for blocking recording. This is a known evolution; CLAUDE.md says "verify with current Pendo Replay docs for the exact attribute name in your agent version" and the verified answer in 2026 is *class*, not attribute. The `PasswordInput` primitive applies it via `className`. Recommend documenting this evolution in the masked-input primitive's JSDoc so future engineers understand why it's a class, not an attribute.

### Pattern 7: Pendo install snippet — verbatim from Pendo's repo (PEN-01)

**What:** The canonical Pendo install snippet, copied verbatim from `pendo-io/pendo-client/agent-install-snippet.js` (Pendo's own source).

```html
<!-- index.html — placed in <head>, BEFORE the React module script -->
<script>
  /* eslint-disable */
  (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];
  v=['initialize','identify','updateOptions','pageLoad', 'track'];for(w=0,x=v.length;w<x;++w)(function(m){
  o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
  y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+'%VITE_PENDO_API_KEY%'+'/pendo.js';
  z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
  /* eslint-enable */
</script>
```

**Snippet shape — what it does** `[VERIFIED: pendo-io/pendo-client/agent-install-snippet.js]`:
1. Creates `window.pendo` as an empty object (`o = p[d] = p[d] || {}`)
2. Initializes a call queue `o._q = []`
3. Stubs the methods `initialize`, `identify`, `updateOptions`, `pageLoad`, `track` — each pushes its call into the queue
4. Creates an `<script async src="https://cdn.pendo.io/agent/static/<API_KEY>/pendo.js">` and inserts it before the first existing `<script>` (which will be the same `<script>` block in `<head>` — so it inserts itself adjacent)
5. The real agent loads asynchronously and flushes the queue when it boots

**Verified properties (from reading the snippet):**
- `y.async = !0` — the agent fetch is **async by default**. Synchronous placement of the *snippet itself* in `<head>` does NOT block first paint, because the snippet only stubs methods (microsecond-scale work) and the actual `pendo.js` download is async.
- Calling `pendo.initialize(...)` *before* the agent loads is safe — the call is queued, then replayed when the agent boots.

**API key injection in Vite (PEN-01):** Vite supports `%VITE_*%` placeholders directly in `index.html` — Vite's HTML processing replaces them at build/serve time. `[CITED: vite.dev/guide/env-and-mode — "HTML env replacement"]`

```html
<!-- Vite resolves %VITE_PENDO_API_KEY% at build time from .env (or runtime in dev) -->
y.src='https://cdn.pendo.io/agent/static/'+'%VITE_PENDO_API_KEY%'+'/pendo.js';
```

Alternative (also works): use a `vite.config.ts` `transformIndexHtml` plugin. But the `%VAR%` syntax is the path of least resistance.

**`.env.example` checked in:**
```
# Public Pendo subscription key — replace with your dev subscription
# (Pendo keys are not secret — they're visible in every page source — but we treat them as env vars
#  to keep them out of the repo and to make the swap easy when sharing the demo with a different sub.)
VITE_PENDO_API_KEY=your-pendo-subscription-key-here
```

**`.env` gitignored** (the project's `.gitignore` should contain `.env` plus the standard Vite ignores: `node_modules`, `dist`, `.DS_Store`, `*.local`).

**Behavior when key is absent (`.env` missing entirely):**

If `VITE_PENDO_API_KEY` is empty/undefined, `%VITE_PENDO_API_KEY%` is replaced with an empty string and the snippet attempts to load `https://cdn.pendo.io/agent/static//pendo.js` — which 404s. The `window.pendo` stub still exists (the snippet's IIFE always runs), so `window.pendo.initialize(...)` still queues the call without throwing — it just never flushes. **The app must still boot.** Recommend the planner add a guard in `PendoBridge` that logs a console warning when `import.meta.env.VITE_PENDO_API_KEY` is falsy.

### Pattern 8: Anonymous visitor ID — stable across reloads (PEN-02, Success Criterion 2)

**What:** On first boot, generate a `nanoid`, store it in `localStorage` at `halo:v1:pendo:anonId`, and reuse on every subsequent boot until Phase 2 calls `pendo.identify` with a real visitor.

**Why a stable ID is required:** Success Criterion 2 says `window.pendo.getVisitorId()` must return *the same anonymous ID across reloads*. Pendo's own anonymous ID generation also persists (in its own cookie/localStorage), but tying our own anonymous ID to `localStorage` gives us a single source of truth that Phase 2's `identify` call can promote to a real visitor with continuity.

```ts
// Source: PEN-02 success criterion 2 ("stable anonymous ID across reloads"); nanoid is locked stack
// src/pendo/anon-id.ts
import { nanoid } from 'nanoid';
import { K } from '../storage/keys';
import { readWithSchema, writeJSON } from '../storage/codec';
import { AnonIdSchema } from '../storage/schemas';

const ANON_PREFIX = '_PENDO_T_anon-';  // mirrors Pendo's own anonymous-ID convention

export function getOrCreateAnonymousVisitorId(): string {
  const existing = readWithSchema(K.pendoAnonId(), AnonIdSchema, '');
  if (existing) return existing;
  const fresh = `${ANON_PREFIX}${nanoid()}`;
  writeJSON(K.pendoAnonId(), fresh);
  return fresh;
}
```

**Multi-tab note:** Two tabs of Halo share `localStorage`, so the second tab will read the existing anonymous ID and pass the same ID to `pendo.initialize`. Pendo's idempotency (`Any subsequent calls, without first having called teardown, will be ignored` — verified verbatim from `pendo.esm.js`) means tab 2's `initialize` is a no-op, but the visitor ID is consistent across tabs. No additional work required.

### Pattern 9: `index.html` shape (PEN-01, FND-02 ColorSchemeScript)

```html
<!-- index.html (Vite-template scaffold + Pendo snippet + Mantine ColorSchemeScript) -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Halo</title>

    <!-- Mantine: prevents dark-mode FOUC. Must be before the React bundle. -->
    <script>
      // ColorSchemeScript is normally a component; for SPA-only it's also fine to inline.
      // Mantine 9 also ships a ColorSchemeScript component which we'll inject from React via Vite's
      // HTML pipeline; the inline form is the simpler path for Phase 1.
    </script>

    <!-- Pendo Snippet — synchronous in <head>, BEFORE the React bundle (PEN-01) -->
    <script>
      /* eslint-disable */
      (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];
      v=['initialize','identify','updateOptions','pageLoad', 'track'];for(w=0,x=v.length;w<x;++w)(function(m){
      o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
      y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+'%VITE_PENDO_API_KEY%'+'/pendo.js';
      z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
      /* eslint-enable */
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

> **On Mantine `ColorSchemeScript`:** Mantine 9 docs show `ColorSchemeScript` rendered inside React on the server (for SSR contexts like Next.js). For pure-SPA Vite there's no SSR pre-render, so the practical FOUC mitigation is to set `defaultColorScheme="light"` on `MantineProvider` and skip `ColorSchemeScript` entirely *unless* Phase 4's theme toggle (SET-04) makes the FOUC visible. Researcher recommends starting without `ColorSchemeScript`; revisit in Phase 4 if dark-mode flicker shows up. `[CITED: mantine.dev/theming/color-schemes]`

### Pattern 10: `vite-env.d.ts` ImportMetaEnv augmentation (PEN-01)

```ts
// Source: PEN-01 success criterion 5 ("API key is loaded from import.meta.env.VITE_PENDO_API_KEY")
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PENDO_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Critical: **do NOT add import statements to `vite-env.d.ts`** — any import turns the file into a module and breaks global augmentation. `[CITED: WebSearch — "If the ImportMetaEnv augmentation does not work, make sure you do not have any import statements in vite-env.d.ts"]`

### Anti-patterns to avoid

- **Don't initialize Pendo in `main.tsx` synchronously, before React mounts.** The snippet's stubs queue the call, but doing it from `main.tsx` separates the call from the auth context that Phase 2 needs. Initialize from `PendoBridge` once the provider stack is mounted. Idempotency makes this safe.
- **Don't put `data-pendo-id` on `ui/primitives/`-internal elements.** The primitives *forward* the attribute they receive; they don't define their own. Page-level code is where the identity of the element ("save settings button" vs "create task button") is known.
- **Don't call `pendo.initialize` twice.** Verified: Pendo will ignore the second call ("Any subsequent calls, without first having called `teardown`, will be ignored"). But silent no-ops mask bugs. Use the `initRef.current` guard.
- **Don't store the Pendo API key in `localStorage` or any runtime config.** It's a build-time `import.meta.env` constant.
- **Don't target Pendo guides on Mantine's hashed class names.** Every Mantine release potentially rehashes them. Use `[data-pendo-id="..."]` exclusively.
- **Don't read `localStorage` directly from feature code.** Always go through `readWithSchema`/`writeJSON`. This is what makes migrations possible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ID generation (visitor IDs, future task/workspace IDs) | Custom UUID logic | `nanoid` | URL-safe, collision-resistant, 30 lines of code is a known-buggy reimplementation |
| Multi-step form state (Phase 2) | Custom form library | `react-hook-form` + `zod` | Multi-step funnel with validation maps directly; minimal re-renders |
| Form validation schemas | Custom validators | `zod` | Same library validates localStorage reads — one source of types |
| Global state (auth, workspace, UI prefs) | Custom Context machinery | `zustand` | `zustand/middleware/persist` handles localStorage hydration for you |
| Date formatting (Phase 3+) | `Intl.DateTimeFormat` directly | `dayjs` | Quoted minimum bundle weight and ergonomics — `dayjs.format('MMM D, YYYY')` |
| Tables (Phase 4) | Custom sorting/filtering | `@tanstack/react-table` | Headless = full DOM control = stable Pendo selectors |
| SVG charts (Phase 3) | Hand-rolled SVG | `recharts` | SVG-rendered (Pendo-targetable), React-native API |
| Pendo snippet shape | Copy-pasted from a blog post | Pendo's own `agent-install-snippet.js` | Pendo updates the snippet between agent versions; using *their* copy guarantees current shape |
| Anonymous visitor ID generation | `Math.random()` or rolling your own | `nanoid()` with a stable prefix | Stability + readability + zero deps over what we already have |

**Key insight:** Phase 1 is the *bootstrap* phase. The standard reflex is "I'll just write a tiny helper" for things like localStorage CRUD or ID generation. Don't. The helpers here are 3 lines apart from a typed wrapper, and the wrapper is what makes the rest of the project safe. Hand-rolling at this layer makes every later phase brittle.

## Common Pitfalls

### Pitfall 1: Pendo snippet loads before `import.meta.env.VITE_PENDO_API_KEY` is replaced

**What goes wrong:** Developer puts the snippet in a runtime-rendered React component instead of `index.html`. Or uses `process.env.VITE_PENDO_API_KEY` (Node-style) which is `undefined` in the browser. Pendo agent fails to load (404 on `pendo.js`), `window.pendo` stays as the stub forever, no events flow.

**Why it happens:** Engineers familiar with CRA reach for `process.env`; engineers unfamiliar with Vite's HTML replacement think they need a build plugin.

**How to avoid:**
- Place the snippet in `index.html` literally — Vite's HTML processing replaces `%VITE_PENDO_API_KEY%` automatically.
- Use `import.meta.env.VITE_PENDO_API_KEY` (NOT `process.env`) in any *TypeScript* code that needs the key. `[CITED: vite.dev/guide/env-and-mode]`
- Type the env var in `vite-env.d.ts` (see Pattern 10) so TypeScript flags typos.

**Warning signs:** Network tab shows `cdn.pendo.io/agent/static//pendo.js` (note the double slash — empty key). `window.pendo` exists but `window.pendo.getVisitorId()` returns `undefined` because the agent never replaced the stub.

### Pitfall 2: React 19 StrictMode double-mount triggers `pendo.initialize` twice

**What goes wrong:** In dev mode with `<StrictMode>`, React mounts components, unmounts them, then remounts. A naive `useEffect(() => pendo.initialize(...), [])` runs *twice*. Pendo's docs guarantee the second call is ignored — but defensive code is cheaper than relying on undocumented agent internals not changing.

**Why it happens:** React 19 retains React 18's StrictMode behavior — intentional double-invocation to expose race conditions. `[CITED: dev.to "Why is useEffect Running Twice? — React 19 Strict Mode"]`

**How to avoid:** Use a module-level boolean *or* `useRef(false)` flag in `PendoBridge`. The Pattern 5 example already includes this.

**Warning signs:** Two `data?` requests fired to Pendo on first paint instead of one.

### Pitfall 3: Provider order matters — `PendoBridge` outside the Router gets no `useLocation`

**What goes wrong:** Engineer puts `pendo.location.setUrl` inside `PendoBridge` itself. Because `PendoBridge` is *outside* the Router, `useLocation()` either throws ("must be used within a Router") or returns `undefined` on first render, breaking the bridge.

**Why it happens:** FND-07 says `PendoBridge → Router` (PendoBridge wraps Router). The success criterion 3 says `setUrl` on every nav. Engineer tries to put both in the same component.

**How to avoid:** **Two bridges, two responsibilities.** `PendoBridge` handles identity (initialize/identify) and lives *outside* the router. `PendoRouteBridge` handles route changes and lives *inside* the router tree (e.g. mounted in `PublicLayout` and `AppLayout`). See Pattern 5.

**Warning signs:** Error in console: `useLocation() may be used only in the context of a <Router> component.` Or `setUrl` is never called.

### Pitfall 4: `pendo.location.setUrl` disconnects Pendo from the browser URL

**What goes wrong:** After calling `setUrl()`, Pendo stops detecting browser URL changes and only uses the URL we provide (verified verbatim from Pendo docs: *"Using setUrl disconnects the web SDK from the browser's URL and prevents the web SDK from detecting URL changes in the browser. To keep functionality consistent, a 0.5 second poll is used to check the value of setUrl for changes"*). If `PendoRouteBridge`'s effect ever fails to fire (e.g. because of a future routing refactor that bypasses React Router), Pendo will be stuck on the *previous* URL.

**Why it happens:** Pendo's auto-detection of History API changes is on by default; calling `setUrl(window.location.href)` *replaces* that with a manual signal. The user requirement (PEN-06) is firm about emitting `setUrl`, so we comply — but we need to know what we're trading.

**How to avoid:**
- Always pass `window.location.href` (not a stale captured value) so the manual signal matches the browser.
- The `PendoRouteBridge` effect depends on `[location.pathname, location.search, location.hash]` — covers every URL change a router can produce.
- If a future phase needs different behavior, `pendo.location.useBrowserUrl()` reverses this (re-enables auto-detection).

**Warning signs:** Pendo's recorded URL drifts from the actual URL bar; events show stale page paths.

### Pitfall 5: Anonymous visitor ID is regenerated on every reload (no persistence)

**What goes wrong:** Engineer writes `pendo.initialize({ visitor: { id: nanoid() } })` directly. Every page reload is a new visitor. Funnel from "registration step 1" to "registration step 4" shows zero conversions because the four steps are four different visitors.

**Why it happens:** Easy to miss the "persist the anonymous ID" detail. The CLAUDE.md research mentions it but the planner needs to surface it as an explicit task.

**How to avoid:** Use `getOrCreateAnonymousVisitorId()` from Pattern 8. Verify in dev tools: reload three times, `window.pendo.getVisitorId()` returns the same ID each time. (Success Criterion 2.)

**Warning signs:** Visitor count in Pendo dashboard equals page load count, not unique browser count.

### Pitfall 6: Mantine 9 + React 19 peer-dep mismatch

**What goes wrong:** Engineer follows CLAUDE.md literally and installs React 18 + Mantine 9. npm install warns/errors on peer dependency mismatch (`@mantine/core` requires `react: ^19.2.0`).

**Why it happens:** CLAUDE.md was written when React 18 was current; Mantine 9 dropped React 18.

**How to avoid:** Install React 19 from line one. The `npm create vite@latest` template already produces React 19 with the current Vite plugin-react.

**Warning signs:** `npm install` warnings about peer-dep mismatches; runtime errors from Mantine components.

### Pitfall 7: Reading `localStorage` from feature code without going through `readWithSchema`

**What goes wrong:** Engineer adds a quick `localStorage.getItem('halo:tasks')` in a page component because "the storage module isn't ready yet." That key bypasses validation, the version prefix, and the migration runner. Six months later a schema change breaks every reader except this one, which silently returns stale data.

**Why it happens:** "I'll wire it up properly later." Phase 1 is the *only* time it's easy to enforce the discipline; every page added after Phase 1 takes the existing patterns for granted.

**How to avoid:**
- The `storage/` module is built in Phase 1 and is the *only* file allowed to call `localStorage.*` directly. Document this in `storage/codec.ts`'s file-level JSDoc.
- Optionally: an ESLint rule banning raw `localStorage` references outside `src/storage/`. (Not required for Phase 1 but cheap to add.)

**Warning signs:** Grep for `localStorage\.` finds matches outside `src/storage/`. Run it as a code-review check.

### Pitfall 8: Vite path aliases — present in some templates, absent in others

**What goes wrong:** Vite-react-ts template does not enable `@/` path aliases by default. Engineer assumes they exist and writes `import { foo } from '@/storage/codec'` and the build fails.

**Why it happens:** Different scaffolds (Next.js, Vite-template, custom) have different conventions.

**How to avoid:** Either (a) accept relative imports (`../storage/codec`) — fine for Phase 1's scope — or (b) configure `resolve.alias` in `vite.config.ts` AND `paths` in `tsconfig.json` (both required; setting only one breaks the other tool). Researcher recommends (a) for Phase 1 — relative imports are unambiguous in a freshly-scaffolded tree — and revisiting if/when import depth becomes painful.

### Pitfall 9: `.env` accidentally committed

**What goes wrong:** Engineer creates `.env`, forgets `.gitignore`, commits. The Pendo key is in the repo history forever.

**Why it happens:** Vite scaffold's default `.gitignore` covers `.env.local`, `.env.development.local`, `.env.production.local`, and the wildcard `*.local` — but NOT bare `.env` in all template versions. Verify.

**How to avoid:** Explicitly add `.env` and `.env.*` (with `!.env.example` exception) to `.gitignore` in Phase 1, before `.env` is created. Run `git status` after creating `.env` to confirm it's not staged. Pendo keys are public-by-design (they appear in page source), but treat them as env vars anyway for hygiene.

**Recovery:** If committed, rotate the Pendo subscription key (Pendo settings → subscription) — fast and consequence-free since the key is public.

### Pitfall 10: Pendo agent fails to load — app crashes instead of degrading gracefully

**What goes wrong:** Snippet template assumes `window.pendo.initialize` works synchronously. If the API key is empty or `cdn.pendo.io` is blocked (ad-blocker, corporate proxy, offline dev), the *snippet stub* still exists but the agent never loads, so `pendo.getVisitorId()` returns `undefined`.

**Why it happens:** Engineers don't test offline; ad-blockers commonly block analytics CDNs.

**How to avoid:**
- The snippet stub guarantees `window.pendo.initialize`, `identify`, etc. exist as functions — they just queue calls forever. Calling them is *safe* even if the agent never loads.
- In `PendoBridge`, guard `window.pendo?.location?.setUrl?.(...)` — optional-chain every call so failures degrade silently.
- In `vite-env.d.ts`, type `window.pendo` as `Pendo | undefined` so TypeScript forces the guards.

```ts
// src/pendo/types.d.ts
type PendoVisitor = { id: string; [k: string]: unknown };
type PendoAccount = { id: string; [k: string]: unknown };

interface Pendo {
  initialize: (opts: { visitor: PendoVisitor; account?: PendoAccount }) => void;
  identify: (opts: { visitor: PendoVisitor; account?: PendoAccount }) => void;
  updateOptions: (opts: Partial<{ visitor: PendoVisitor; account: PendoAccount }>) => void;
  getVisitorId: () => string | undefined;
  getAccountId: () => string | null | undefined;
  clearSession: () => void;
  pageLoad: (url?: string) => void;
  location: {
    setUrl: (url: string | (() => string)) => void;
    useBrowserUrl: () => void;
    getHref: () => string;
  };
  isReady: () => boolean;
  isAnonymousVisitor: (id?: string) => boolean;
}

declare global {
  interface Window {
    pendo?: Pendo;
  }
}

export {};  // make this a module so the `declare global` works
```

**Warning signs:** Console errors `Cannot read property 'initialize' of undefined` (means the snippet didn't run at all — usually a `<head>` placement bug).

## Runtime State Inventory

> Not applicable — Phase 1 is greenfield. No existing runtime state to migrate.

## Code Examples

Verified patterns referenced above. Repeated here as a quick-reference for the planner.

### 1. Pendo install snippet (verbatim from `pendo-io/pendo-client`)

```html
<!-- index.html — in <head>, BEFORE the React module script -->
<script>
  (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];
  v=['initialize','identify','updateOptions','pageLoad', 'track'];for(w=0,x=v.length;w<x;++w)(function(m){
  o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
  y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+'%VITE_PENDO_API_KEY%'+'/pendo.js';
  z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
</script>
```
Source: `https://github.com/pendo-io/pendo-client/agent-install-snippet.js` (verified via `gh api` 2026-05-13)

### 2. `pendo.initialize` anonymous (verified API shape)

```ts
window.pendo.initialize({
  visitor: { id: '_PENDO_T_anon-<nanoid>' }
});
```
Source: Pendo `docs.json` `Identity` category (verified verbatim from `@pendo/web-sdk@2.324.0/dist/docs.json`)

### 3. `PendoRouteBridge`

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function PendoRouteBridge() {
  const location = useLocation();
  useEffect(() => {
    window.pendo?.location?.setUrl?.(window.location.href);
  }, [location.pathname, location.search, location.hash]);
  return null;
}
```

### 4. `readWithSchema` (Zod-validated storage read)

```ts
export function readWithSchema<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch { return fallback; }
}
```

### 5. `PENDO_IDS` registry (nested-`as const` shape)

```ts
export const PENDO_IDS = {
  layout: {
    publicDemoBanner: 'layout.public.demo-banner',
    publicLanding:    'layout.public.landing',
    appPlaceholder:   'layout.app.placeholder',
  },
} as const;

type Leaves<T> = T extends string ? T : T extends Record<string, unknown> ? Leaves<T[keyof T]> : never;
export type PendoId = Leaves<typeof PENDO_IDS>;
```

### 6. `ImportMetaEnv` augmentation

```ts
// src/vite-env.d.ts — no imports!
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_PENDO_API_KEY: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
```

### 7. Provider stack (App.tsx)

```tsx
<MantineProvider theme={haloTheme} defaultColorScheme="light">
  <StorageProvider>
    <AuthProvider>
      <WorkspaceProvider>
        <PendoBridge>
          <RouterProvider router={router} />
        </PendoBridge>
      </WorkspaceProvider>
    </AuthProvider>
  </StorageProvider>
</MantineProvider>
```

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|------------------------|--------------|--------|
| `react-router-dom` v6 imports | `react-router` v7 unified package | v7 release (~2024) | Imports change from `'react-router-dom'` to `'react-router'`. `react-router-dom` still works as an alias for v7-line web targets. |
| `pendo.location.setUrl(url)` as the *only* SPA route hook | `setUrl` still works; Pendo also auto-detects History API in modern agents | Stable since 2.108.0 | Calling `setUrl` is belt-and-suspenders; auto-detection covers the common case. PEN-06 requires explicit `setUrl` so we comply, but be aware `setUrl` disables the auto-poll. |
| `Pendo Session Replay` mask via `data-pendo-mask` attribute (older convention) | `.pendo-sr-ignore` / `.pendo-ignore` CSS classes | Current agent (2.324.0) | PEN-09 asks for a "mask attribute" — the current canonical lever is a CSS class, not an attribute. Document this divergence in the masked-input primitive. |
| `process.env.REACT_APP_*` (CRA) | `import.meta.env.VITE_*` (Vite) | Vite adoption | Different syntax, different build-time substitution mechanism, no `process.env` fallback in browser. |

**Deprecated/outdated:**
- React 18 — superseded by React 19 (stable as of 2026). CLAUDE.md leaves this open.
- React Router 6 — superseded by RR 7. Still maintained, but RR 7 is the active line.
- Mantine 7/8 — Mantine 9 is current and is the only line that supports React 19.
- Zod 3 — Zod 4 is current; `@hookform/resolvers` 5.2+ supports both.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mantine components forward `data-*` props to the underlying DOM element (so `data-pendo-id` reaches the rendered `<button>`, `<input>`, etc.) | Pattern 6 (UI primitives) | If Mantine 9 ever changes its prop-forwarding behavior, every `data-pendo-id` becomes invisible. Mitigation: visual smoke test — render a `<Button pendoId="test">` and inspect the DOM. Easy to verify in Phase 1's first task. |
| A2 | Pendo's agent (`pendo.js`) reads `_q` queue and replays calls in order after async load — so calling `initialize` before the agent boots is safe | Pattern 7 (Snippet) | If the agent has a race condition that drops early calls, anonymous initialize may not fire. Very low risk — this is the entire point of the snippet's queue. Mitigation: smoke test in dev tools — `window.pendo.getVisitorId()` after first paint should return the anon ID. |
| A3 | Vite's `%VITE_*%` HTML replacement works for arbitrary string positions inside `<script>` blocks (not just `src="..."`) | Pattern 7 (Snippet API key injection) | If the placeholder isn't replaced inside JS string literals, `pendo.js` 404s. Mitigation: Phase 1 smoke test — after `npm run dev`, View Source on the page and confirm the API key is interpolated into the snippet. |
| A4 | React 19's StrictMode double-mount affects `useEffect(() => ..., [])` but Pendo's idempotency + our `initRef` guard handle it cleanly | Pitfall 2 | If the guard pattern has a subtle bug (e.g. ref reset on remount), pendo init could fire twice. Pendo logs but doesn't fail; minor. Mitigation: counter in dev tools — `window.pendo._initializeCount` if Pendo exposes one, or just observe Network tab. |

## Open Questions

1. **Where exactly to mount `PendoRouteBridge` inside the router tree.**
   - What we know: It must be inside the router (uses `useLocation`). It only needs to mount once globally.
   - What's unclear: Options are (a) inside *both* `PublicLayout` and `AppLayout` (mounts and unmounts when crossing the boundary — fine but slightly noisy), (b) inside a single shared "RootLayout" at `path: '/'` with both layouts nested below (cleaner but conflicts with FND-03's "hard split" framing), (c) directly inside `RouterProvider`'s child via a top-level wrapper.
   - Recommendation: Mount in *both* `PublicLayout` and `AppLayout`. This gives a clean "hard split" per FND-03, and the bridge's setup/teardown cost is negligible (one `useEffect`).

2. **`@mantine/notifications` and other Mantine sub-packages in Phase 1 vs deferred.**
   - What we know: Phase 1 doesn't ship toasts, modals, or other features that need those subpackages.
   - What's unclear: Is it worth installing the full Mantine suite up front to avoid package.json churn later, or stricter "minimum to satisfy Phase 1 requirements" install set?
   - Recommendation: Minimum install set in Phase 1 (`@mantine/core` + `@mantine/hooks` + `@tabler/icons-react`). Phase 2 installs `@mantine/form` (or skips entirely in favor of RHF). Phase 3+ adds `@mantine/notifications`. Less churn risk than installing everything.

3. **Storage `StorageProvider` component vs pure module.**
   - What we know: FND-07 names a `Storage` provider as the outermost of five.
   - What's unclear: `storage/` is mostly pure functions (`readWithSchema`, `writeJSON`, `runMigrations`). A `StorageProvider` Context isn't strictly needed in Phase 1.
   - Recommendation: Create a *thin* `StorageProvider` shell that does nothing in Phase 1 but exists to satisfy FND-07's provider-order requirement *and* to give Phase 2+ a place to hang things like `window.storage` event listeners (for multi-tab sync — Pitfall 8 in `research/PITFALLS.md`).

4. **Should Phase 1 add an ESLint rule banning `localStorage.*` outside `src/storage/`?**
   - What we know: Pitfall 7 is real; the rule would prevent regressions.
   - What's unclear: ESLint setup in the Vite-React-TS template is light; adding a custom rule is a small but real cost.
   - Recommendation: Defer. Document the discipline in `src/storage/codec.ts`'s file-level JSDoc and rely on code review. Revisit if a regression actually occurs.

5. **Halo brand color and font.**
   - What we know: CLAUDE.md is silent.
   - What's unclear: What color/typography reads as "B2B SaaS" without being generic.
   - Recommendation: Primary color `indigo` (Mantine's built-in palette — modern, professional, distinct from default blue), font family `Inter` (free, modern, ubiquitous in SaaS — load via `@fontsource/inter` or Google Fonts), border radius `md`. Easy to revisit in Phase 5's polish pass (UI-04).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | Vite 8 dev server, build | ✓ (researcher assumes; planner should verify on target machine) | needs `^20.19.0 \|\| >=22.12.0` `[VERIFIED: npm view vite engines]` | Install via `nvm install --lts` if missing |
| `npm` | Package install | ✓ (ships with Node) | ≥10 (typical with Node 20+) | — |
| `git` | `gsd-sdk query commit` flows | ✓ (researcher assumes — already initialized: `.git/` exists in repo) | any modern | — |
| Pendo subscription API key | Phase 1 PEN-01 smoke test (key replaced into snippet at build) | ✗ — researcher cannot supply | — | Phase 1 *must* boot with `VITE_PENDO_API_KEY` unset (empty string). Document the fallback behavior in README. Engineer can supply their own key via `.env` for live verification. |
| Internet access at dev time | Pendo agent fetch from `cdn.pendo.io` | ✗ if offline | — | Snippet stub allows app to boot offline; `window.pendo.getVisitorId()` returns `undefined`. Document this in the PendoBridge JSDoc. |

**Missing dependencies with no fallback:**
- A *valid* Pendo API key is needed to verify Success Criterion 2 (`window.pendo.getVisitorId()` returns a stable anon ID after agent load). Without one, the snippet stub queues the `initialize` call forever and `getVisitorId()` returns `undefined`. The planner should:
  - Either supply a dev/sandbox key in `.env` for the verification task, OR
  - Note in the verification block that Success Criterion 2 requires "a valid Pendo subscription key in `.env`" as a precondition.

**Missing dependencies with fallback:**
- Offline dev: app boots, Pendo is silently no-op, route bridge silently no-ops (all calls optional-chained). Acceptable for FND-01 ("`npm run dev` boots a Halo-branded app with no console errors").

## Sources

### Primary (HIGH confidence)

- **Pendo Web SDK `docs.json`** — extracted from `@pendo/web-sdk@2.324.0` tarball; canonical public API surface (`initialize`, `identify`, `updateOptions`, `clearSession`, `getVisitorId`, `getAccountId`, `pageLoad`, `isAnonymousVisitor`, `isReady`, `teardown`). Verified verbatim.
- **Pendo install snippet** — `github.com/pendo-io/pendo-client/agent-install-snippet.js` — Pendo's own source-of-truth snippet template. Verified verbatim via `gh api`.
- **Pendo `location.md`** — `github.com/pendo-io/agent-documentation/docs/advanced/location.md` — official Pendo location API docs, including `pendo.location.setUrl` semantics ("disconnects the web SDK from the browser's URL", 0.5s poll). Verified verbatim.
- **Pendo `replay.js`** — extracted from `@pendo/web-sdk@2.324.0/dist/replay.js`; verified that `.pendo-ignore` and `.pendo-sr-ignore` are the canonical Session Replay block selectors, and that `password`, `email`, `tel` inputs are auto-masked by default.
- **npm registry** — `npm view <pkg> version` and `npm view <pkg> peerDependencies` — verified all stack versions on 2026-05-13. Mantine 9 peer-dep on React 19 verified directly.

### Secondary (MEDIUM confidence)

- **Mantine 9 docs** — `mantine.dev/getting-started/`, `mantine.dev/theming/mantine-provider/`, `mantine.dev/theming/color-schemes/` — verified `MantineProvider` + `ColorSchemeScript` pattern via WebSearch summary. (Could not WebFetch directly; relied on aggregated search content.)
- **React Router 7 docs** — `reactrouter.com/start/modes`, `reactrouter.com/how-to/spa` — verified `createBrowserRouter` + `RouterProvider` library-mode/data-mode pattern via WebFetch. v7 prefers `react-router` package over `react-router-dom`; both still ship.
- **Vite env docs** — `vite.dev/guide/env-and-mode` — verified `import.meta.env` + `%VITE_*%` HTML replacement pattern via WebSearch.
- **`@hookform/resolvers` Zod 4 compatibility** — `github.com/react-hook-form/resolvers/releases` — verified Zod 4 support added in v5.2.0 via WebSearch.

### Tertiary (LOW confidence — flagged for planner verification)

- **React 19 StrictMode double-mount behavior in 2026** — verified via WebSearch summary (`dev.to`, `react.dev`); training-data-consistent. No reason to expect a change, but planner should sanity-check at first dev run.

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — verified via `npm view` on 2026-05-13.
- Pendo API surface: HIGH — verified verbatim from `@pendo/web-sdk@2.324.0/dist/docs.json` and Pendo's own snippet source.
- Pendo SPA `setUrl` semantics: HIGH — verified verbatim from `pendo-io/agent-documentation/docs/advanced/location.md`.
- Session Replay masking convention: HIGH — verified verbatim from `dist/replay.js` (`.pendo-sr-ignore`, `.pendo-ignore`, auto-mask on password/email/tel).
- Mantine 9 + React 19 + Vite 8 install path: HIGH — verified via `npm view peerDependencies`.
- React Router 7 import path: MEDIUM — verified against v7 docs but the community is still settling between `react-router` and `react-router-dom` imports; either works.
- ImportMetaEnv augmentation pattern: HIGH — well-established Vite pattern.
- Provider stack ordering rationale: HIGH — matches `research/ARCHITECTURE.md` Pattern 2 verbatim.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days) for the version pins; longer for the Pendo API surface and architectural patterns (these change on the order of years, not months).

## RESEARCH COMPLETE

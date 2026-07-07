<!-- GSD:project-start source:PROJECT.md -->
## Project

**Halo**

Halo is a fake multi-tenant SaaS project/task management app, built to demonstrate and experiment with the full Pendo product suite. It looks and behaves like a real SaaS — registration flow, side-nav layout, charts, lists, settings, reports, team management, and help — but every piece of data is fabricated and persisted only in browser local storage.

The audience is the builder (and other Pendo folks) who need a realistic, instrumentable app to exercise Pendo capabilities end-to-end without standing up a real product.

**Core Value:** A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.

### Constraints

- **Tech stack**: Frontend-only SPA — no backend, no API server, no database. All persistence is `localStorage` (or `sessionStorage` where appropriate).
- **Tech stack**: Framework is React or Svelte, decided based on ecosystem fit for SaaS UI + charting.
- **Data**: All data is fabricated. Registration data is captured into local storage; charts/lists are seeded with fake data and mutated locally.
- **Pendo readiness**: Markup must include stable identifiers / data attributes on key UI so Pendo guides can target them reliably. Pendo Snippet must be initialized with visitor + account IDs from the registration flow.
- **Polish**: App must look like a real SaaS — clean component library, consistent layout, branded as "Halo." Plain/unstyled is not acceptable.
- **Scope discipline**: This is a demo surface, not a product. Resist adding features that don't serve a clear Pendo demo purpose.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Framework Decision: React (not Svelte)
### Why React wins for *this* project
### When Svelte *would* be the right call (and isn't here)
- If bundle size were a hard constraint (it isn't — this is a demo running locally).
- If the app were content-driven SSR/SSG (it isn't — it's a client-only SPA).
- If reactivity ergonomics were the dominant value (they aren't — SaaS-shell polish is).
### Confidence
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React** | 18.3.x (or 19.x if stable) | UI framework | De facto SaaS frontend standard; deepest component + charting ecosystem; matches Pendo's customer base | HIGH |
| **TypeScript** | 5.4+ | Type safety | Catches the kinds of bugs that ruin demo days; required to make `data-pendo-id` patterns enforceable via component props | HIGH |
| **Vite** | 5.x | Build tool / dev server | Fast HMR, zero-config TS+JSX, the default modern SPA toolchain. No reason to deviate. | HIGH |
| **React Router** | 6.x (data router APIs) | Client-side routing | Standard for React SPAs; nested routes match the SaaS "shell + page" layout perfectly; loaders integrate cleanly with localStorage seeding | HIGH |
### Supporting Libraries
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Mantine** | 7.x | UI component library (primary recommendation) | Use as the base for *everything* — AppShell for the side-nav layout, forms, tables, modals, notifications, charts wrapper. Most "complete SaaS in a box" of the major React libs. | HIGH |
| **shadcn/ui + Tailwind** | latest | Alternative UI approach | Use *instead of* Mantine if you want to own component source and prefer Tailwind-first styling. Trade-off: more polish work, more flexibility. | HIGH |
| **Recharts** | 2.x | Charting (primary recommendation) | Bar / line / area / pie out of the box; SVG-rendered (selectable, Pendo-targetable); React-native API. Best balance of variety + simplicity for this project. | HIGH |
| **Tremor** | 3.x | Alternative charting + dashboard primitives | Consider if Mantine is *not* chosen — Tremor pairs well with shadcn/Tailwind and gives you dashboard cards + KPIs as components, not just raw charts. | MEDIUM |
| **React Hook Form** | 7.x | Form state + validation | Multi-step registration; minimal re-renders; integrates cleanly with Zod | HIGH |
| **Zod** | 3.x | Schema validation | Pairs with RHF via `@hookform/resolvers/zod`; also good for validating localStorage reads (untrusted data on disk) | HIGH |
| **Zustand** | 4.x | Lightweight global state | Auth/session, current workspace, sidebar collapsed state, theme. Don't reach for Redux — Zustand is the right size. | HIGH |
| **TanStack Table** | 8.x | Headless table primitives | Reports page (sortable, filterable tabular data with export buttons). Headless = full control over markup = stable Pendo selectors. | HIGH |
| **dayjs** | 1.x | Date formatting | Smaller than moment, simpler API than date-fns for this scope. (date-fns is also fine — pick one and stick.) | MEDIUM |
| **clsx** or **tailwind-merge** | latest | Class composition | Only if going the shadcn/Tailwind route. Skip if using Mantine. | HIGH |
| **nanoid** | 5.x | ID generation | Generating stable IDs for tasks, lists, workspaces in localStorage seed/CRUD. Don't roll your own. | HIGH |
| **@faker-js/faker** | 8.x | Fake data seeding | Realistic-looking task titles, user names, project names for demos. Critical for "looks like a real SaaS" feel. | HIGH |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| **Vite** | Dev server + build | `npm create vite@latest halo-app -- --template react-ts` is the starting line |
| **ESLint** | Linting | Use `eslint-plugin-react-hooks` + `@typescript-eslint`; skip a11y plugin per project Out-of-Scope (a11y is explicitly deferred) |
| **Prettier** | Formatting | Default config is fine for a demo; don't bikeshed |
| **Vitest** (optional) | Testing | Only if/when tests are added — not required for a demo-surface project |
## Installation
# Scaffold
# Routing + state
# UI library (pick ONE — Mantine recommended)
# ...OR the shadcn/Tailwind path (run separately, not both):
# npm install -D tailwindcss postcss autoprefixer
# npx tailwindcss init -p
# npx shadcn@latest init
# (then `npx shadcn@latest add button card table dialog ...` as needed)
# Charts (skip @mantine/charts above if going Recharts directly)
# Forms + validation
# Tables (reports page)
# Utilities
## Pendo Integration
### Snippet placement
### When to call `pendo.initialize`
- **Call `initialize` exactly once per page load.** Subsequent identity changes go through `identify` or `updateOptions`, not another `initialize`.
- **Visitor + account IDs must be strings.** Generate them with `nanoid` at registration time and persist them in the localStorage user/workspace records.
- **React Router SPA route changes** are auto-detected by Pendo via History API hooks — no manual `pageLoad` calls needed unless you want explicit page boundaries. Document this assumption explicitly in code.
### Stable selectors for Pendo guides
- Build a thin wrapper around Mantine's `Button`, `TextInput`, `Anchor`, etc. that accepts `data-pendo-id` as a required prop (or a typed enum) and forwards it to the underlying DOM. Optional but recommended: a TypeScript union type listing every valid ID so refactors are catchable.
- For chart elements (where Recharts renders SVG `<rect>` / `<path>` per data point), wrap charts in a container `<div data-pendo-id="dashboard.charts.velocity">` and rely on stable axis labels for sub-targeting. Don't try to target individual chart bars — they're recomputed on every render.
- For dynamic lists (tasks, team members), parameterize: `data-pendo-id="lists.row.complete"` plus `data-pendo-item-id={task.id}` — Pendo can target the class of rows, and Session Replay still captures the specific row interacted with.
### Page Categorization
### Confidence
## LocalStorage Persistence Pattern
| Option | Verdict |
|--------|---------|
| Hand-rolled `JSON.stringify` + `JSON.parse` behind a typed module | **Recommended** — total surface area is ~50 lines, zero deps, full control |
| `zustand/middleware/persist` | Excellent for the *Zustand store itself* (auth, UI prefs). Use it for that. |
| `idb-keyval` / Dexie / IndexedDB | Overkill — data volumes are trivial (a few hundred fake tasks max) |
| `localforage` | Adds async API surface for no benefit at this scale |
### Confidence
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **React** | Svelte 5 | If a future variant of this project is content/marketing-heavy with SSR; or if the developer is specifically practicing Svelte. For this Halo, no. |
| **Mantine** | shadcn/ui + Tailwind | If you want to own component source code, prefer utility-first styling, or want the app to look more visually distinctive. Higher polish-effort budget. |
| **Mantine** | Chakra UI v3 | Valid but smaller dashboard-specific surface than Mantine. Pick Mantine over Chakra for *this* project. |
| **Mantine** | MUI (Material UI) | MUI works but Material design language reads as "Google product" not "modern SaaS." Mantine looks more like a real B2B SaaS. |
| **Mantine** | Ant Design | Reads as "enterprise Chinese SaaS." Fine if that's the vibe; Mantine is more neutral. |
| **Recharts** | Apache ECharts (`echarts-for-react`) | If you need exotic chart types (gauges, radar, sankey, treemap, geo). For dashboard basics, Recharts wins on API ergonomics. |
| **Recharts** | Visx / Nivo | Both excellent but more code per chart. Use if you want to demonstrate bespoke visualizations. |
| **Recharts** | Tremor | Strong contender if you go shadcn/Tailwind — Tremor is specifically built for dashboards and is shadcn-aesthetic-compatible. With Mantine, stick with Recharts (or `@mantine/charts` which is a Recharts wrapper). |
| **Zustand** | Redux Toolkit | Overkill for this scope. Redux is for large teams needing time-travel debugging and middleware ecosystems. |
| **Zustand** | Jotai / Valtio | Both are fine choices. Zustand has the broadest community familiarity, which matters for a demo project that other people might read. |
| **Zustand** | React Context only | Workable for *just* auth, but you'll want a real store as soon as you need persistence middleware and selective subscriptions for the lists page. |
| **React Hook Form** | Formik | Formik is in maintenance mode; RHF is the active standard. Don't use Formik in 2026. |
| **React Hook Form** | TanStack Form | New, promising, but smaller community. Pick RHF for stability. |
| **React Router** | TanStack Router | Genuinely good and type-safe. React Router has the wider community/familiarity. Either works. |
| **Hand-rolled localStorage** | Dexie / IndexedDB | Only if data volume grows beyond ~5MB or you need indexing. For a few hundred fake tasks, localStorage is correct. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App (CRA)** | Officially deprecated; no longer maintained | Vite |
| **Next.js** | This is a client-only SPA, not an SSR app; Next.js adds a server runtime that doesn't fit "no backend" constraint | Vite + React Router |
| **Formik** | Maintenance mode for several years | React Hook Form |
| **Redux (classic) / Redux Saga** | Way too much ceremony for this scope; saga is rarely the right tool now | Zustand (or Redux Toolkit if you genuinely need it, which you don't here) |
| **moment.js** | Mutable API, large bundle, in maintenance mode | dayjs or date-fns |
| **Chart.js (vanilla)** | Renders to canvas — Pendo *cannot* target individual chart elements in a canvas, and Session Replay captures canvas as a flat image. SVG-based charting is materially better for Pendo demos. | Recharts (SVG) or Visx (SVG) |
| **Highcharts** | Commercial license restrictions; overkill | Recharts |
| **react-router v5** | Old API; v6 data-router APIs are materially better | react-router-dom v6 (or 7 if stable) |
| **CSS-in-JS at runtime (Emotion, styled-components) as the *primary* styling system** | Class-name hashes change between builds, which breaks Pendo selectors if you ever try to target on class. Use data attributes anyway — but also prefer libraries (Mantine, Tailwind) whose stable structures don't tempt you to target classes in the first place. | Mantine's styles API (resolved at build time) or Tailwind |
| **localStorage without versioned keys** | A schema change silently corrupts old demo state | Versioned keys (`halo.tasks.v1`) + Zod-validated reads |
| **Targeting Pendo guides on auto-generated CSS classes** | They break on the next build | Always target `[data-pendo-id="..."]` |
| **Initializing Pendo inside `useEffect` of every route component** | Causes multiple `initialize` calls, breaks Session Replay | Initialize once at app root; use `identify` for subsequent identity changes |
## Stack Patterns by Variant
- Add a thin BFF (e.g. an Express server or Cloudflare Worker) behind the existing `tasksRepo` interface.
- Because the repo module is the only thing that touches `localStorage`, swapping in a fetch-based implementation is a contained change.
- This is *why* the repo pattern is recommended over scattered direct `localStorage` calls.
- Same — swap repo implementations. The pattern survives.
- Take the shadcn/ui + Tailwind + Tremor path instead of Mantine.
- Expect 2–3x more component work but a more distinctive look.
- Don't. Pendo's agent targets light DOM. If shadow DOM ever comes up, that's a red flag, not a feature.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 18.x | react-router-dom 6.x | Stable, well-trodden pairing |
| React 18.x | Mantine 7.x | Mantine 7 requires React 18; do not use Mantine 6 (older API) |
| React 18.x | Recharts 2.x | Stable |
| React 18.x | React Hook Form 7.x + Zod 3.x + @hookform/resolvers 3.x | The canonical trio |
| Vite 5.x | React 18 plugin (`@vitejs/plugin-react`) | Default for React-TS template |
| Zustand 4.x | `zustand/middleware/persist` for localStorage | Included in the package; no separate install |
| TypeScript 5.x | All above | All libraries above ship types |
## Sources
- React / Vite / TypeScript versions — `npm view <pkg> version` and `react.dev` / `vitejs.dev` release notes
- Mantine — `mantine.dev` (verify v7 is still current line)
- Recharts — `recharts.org` and GitHub releases (verify v2 line and React 18+ support)
- React Hook Form — `react-hook-form.com`
- Zustand — `github.com/pmndrs/zustand` (verify v4 line)
- **Pendo install / initialize patterns** — `support.pendo.io` "Installing the Pendo install script" and "Initializing the Pendo install script" articles (these are the canonical references for snippet placement, initialize vs identify, and visitor/account ID shape). Verify the snippet code in this doc against the current Pendo article — Pendo occasionally updates the loader.
- **Pendo guide targeting** — `support.pendo.io` "Best practices for guide targeting" / "Using CSS selectors in guides" articles. Verify the data-attribute pattern recommendation is still current Pendo guidance.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

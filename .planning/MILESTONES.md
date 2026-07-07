# Milestones

## v1.0 MVP (Shipped: 2026-05-18)

**Phases completed:** 5 phases, 37 plans, 44 tasks
**Timeline:** 6 days (2026-05-13 → 2026-05-18)
**Codebase:** ~10,800 lines of TypeScript/CSS across ~105 files in `src/`
**Git range:** 208 commits

**Delivered:** A multi-page Halo SaaS demo surface — registration funnel, authenticated AppShell, Dashboard, Lists (task CRUD), Settings, Reports (with CSV export), Team, and Help — built on React 19 + Mantine 9 + Vite 8, with versioned localStorage persistence and Pendo-ready markup (registry + masking + SVG-only charts) throughout.

**Key accomplishments:**

1. **Foundation contracts** — Vite 8 + React 19 + TypeScript 6 + Mantine 9 scaffold with a Halo-branded theme, namespaced versioned localStorage envelope with Zod-validated codec + idempotent migration runner, and a `Storage → Auth → Workspace → PendoBridge → Router` provider stack ordered for clean future Pendo integration.
2. **Auth & registration funnel** — Four-URL signup wizard (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`) with RHF+Zod validation, sessionStorage draft persistence, SHA-256 password hashing, sign-in/sign-out, and `RequireAuth`/`RequireAnon` route guards.
3. **Authenticated shell + dashboard** — Mantine AppShell (240px side nav + 56px top bar + user menu), post-sign-in Dashboard with 5 KPI cards, a Recharts SVG area chart and donut, time-range selector (7/30/90 days), and a recent-activity feed.
4. **Core pages** — Lists (TanStack Table + modal CRUD + sort/filter/empty states), Settings (3 tabs: Profile / Workspace / Preferences with Mantine v9 dark-mode toggle and Reset Demo Data), and Reports (date-range + assignee + status filters, Recharts stacked bar, read-only table, hand-rolled RFC 4180 CSV export).
5. **Team & Help** — `/app/team` with owner-gated inline role select + invite-modal flow, `/app/help` with searchable seeded articles + detail pages + persistent "?" anchor for the Pendo Resource Center, all wired into idempotent demo-data seeding gated by `meta.seededAt`.
6. **Pendo-ready throughout** — `PENDO_IDS` typed registry as the only source of `data-pendo-id` values, `.pendo-sr-ignore` on password inputs, SVG-only charting (no canvas anywhere), and per-row `data-pendo-*-id` parameterization on dynamic lists.
7. **Branding polish** — Halo favicon + header lockup with light/dark mode variants swapped via `useComputedColorScheme`.

**Scope changes during the milestone:**

- **2026-05-18:** Phase 6 (Pendo Install & Wiring) removed from v1.0 scope. PEN-01..06 (snippet load, initialize, identify, clearSession, setUrl) and SET-05 (Pendo identify on Settings save) marked as dropped. Pendo-ready markup (PEN-07..09) still ships; the live Pendo runtime is a future-milestone concern.

**Known deferred items at close:** 8 (4 phase HUMAN-UAT manual walkthroughs + 4 phase VERIFICATION human-needed items — see STATE.md Deferred Items)

---

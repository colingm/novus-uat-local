# Halo

## What This Is

Halo is a fake multi-tenant SaaS project/task management app, built to demonstrate and experiment with the full Pendo product suite. It looks and behaves like a real SaaS — registration flow, side-nav layout, charts, lists, settings, reports, team management, and help — but every piece of data is fabricated and persisted only in browser local storage.

The audience is the builder (and other Pendo folks) who need a realistic, instrumentable app to exercise Pendo capabilities end-to-end without standing up a real product.

## Core Value

A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Multi-step registration flow capturing basic identity, personal details, company info, and onboarding preferences — *v1.0 (Phase 2)*
- ✓ Fake email/password sign-in backed by local storage (no real auth, no backend) — *v1.0 (Phase 2)*
- ✓ Multi-tenant model: every visitor belongs to a workspace/company — *v1.0 (Phase 2)*
- ✓ Authenticated SaaS shell with persistent side navigation across all pages — *v1.0 (Phase 3)*
- ✓ Dashboard with charts/graphs over fabricated project/task data — *v1.0 (Phase 3: Recharts SVG AreaChart + PieChart, 5 KPIs, time-range selector, activity timeline)*
- ✓ Lists page (create, edit, complete/incomplete, delete, sort, filter, empty state) — *v1.0 (Phase 4)*
- ✓ Settings page (Profile / Workspace / Preferences tabs + theme toggle + Reset demo data) — *v1.0 (Phase 4)*
- ✓ Reports page (date/assignee/status filters + Recharts stacked bar + TanStack table + CSV export) — *v1.0 (Phase 4)*
- ✓ Team page (seeded members + invite modal + inline role select) — *v1.0 (Phase 5)*
- ✓ Help page (searchable articles + detail view + persistent "?" anchor for Pendo Resource Center) — *v1.0 (Phase 5)*
- ✓ SaaS-grade visual polish (Mantine 9 + Halo theme + light/dark mode + branded logo) — *v1.0 (Phase 5 polish pass + branding follow-ups)*
- ✓ Stable DOM identifiers / data attributes on every interactive element — *v1.0 (PENDO_IDS registry, PEN-07..09)*

### Active

<!-- Current scope. Building toward these. -->

- Agent chat surface wired to the real Claude API, for exercising Pendo agent/AI analytics — *targeted for v1.1*

## Current Milestone: v1.1 Agent Chat

**Goal:** Add an in-app AI assistant chat surface wired to the real Claude API so Pendo agent analytics (track events, funnels, session replay, feature adoption) can be exercised against a genuine LLM conversation instead of scripted/fabricated exchanges.

**Target features:**
- Chat UI (open/close panel or dedicated page) styled to match the Halo shell
- Real Claude API calls from the browser using a build-time Anthropic API key (`.env`, gitignored, read via `import.meta.env`)
- Message history persisted to localStorage (versioned, consistent with existing storage pattern)
- `data-pendo-id` selectors on all key chat elements
- Track events for key chat actions (open chat, send message, receive response, error/failure)

### Dropped

<!-- Originally planned, then dropped with reason. -->

- Pendo Snippet wired in (load + initialize + identify + clearSession + setUrl) — *Dropped 2026-05-18 with Phase 6 removal. The app ships Pendo-*ready* (markup, registry, masking, SVG charts) but not Pendo-*wired*. A future milestone can add the runtime if needed.*

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real backend / database — fake app, local storage only is the whole point
- Real authentication or password security — fake app; storing email+password in local storage is intentional
- Real third-party integrations (OAuth, SSO, payments) — would distract from the Pendo demo surface
- Multi-device sync — local storage is per-browser; demos run in one browser session
- Mobile-native apps — SPA only
- Production deployment / CI / CD — local dev server is sufficient for demos
- Accessibility / i18n compliance — demo app, not a shipping product
- Pendo Snippet account/key management — leave the key as a configurable constant, don't build a settings UI for it

## Context

- **Audience:** Built by a Pendo employee (`colin.maxfield@pendo.io`) for internal Pendo experimentation and demos. Likely viewers are other Pendo employees, customers, and pre-sales engineers.
- **Pendo surface coverage:** All four major Pendo capability areas should be exercisable in this app: (1) event tracking & funnels, (2) guides & in-app messaging, (3) feature adoption analytics, (4) Session Replay & Listen.
- **Why a fake SaaS:** Real customer apps can't always be safely re-instrumented or shared in demos. A fake but convincing SaaS lets the user demonstrate Pendo against a familiar-looking surface.
- **Why project/task management:** Familiar vertical to most viewers, gives natural shape to lists (tasks), charts (velocity / status), reports (project performance), and team (collaborators).
- **Pendo-conscious construction:** Pages, forms, and interactions should be built with Pendo instrumentation in mind from day one — stable selectors, meaningful event names, multi-step flows that make good funnels, and varied interaction patterns that exercise replay.
- **Framework chosen:** React 19 + Mantine 9 + Vite 8 + TypeScript 6 (settled in Phase 1 research).

## Current State (v1.0 shipped)

- **Codebase:** ~10,800 lines of TypeScript/CSS across ~105 files in `src/`.
- **Stack:** React 19.2 + Mantine 9.2 + Vite 8 + TypeScript 6 + Zustand 5 + RHF 7 + Zod 4 + Recharts 3 + TanStack Table 8 + Mantine notifications/dates + nanoid + faker.
- **Persistence:** Versioned namespaced localStorage envelope (`halo:v1:*`) with Zod-validated reads, `meta` key, idempotent demo seeding gated by `meta.seededAt`.
- **Routing:** React Router 7 (createBrowserRouter), History API, deep-link-safe.
- **Theming:** Mantine v9 dark mode via `defaultColorScheme="auto"` + Settings toggle; logo swaps on color scheme via `useComputedColorScheme`.
- **Pendo readiness:** `PENDO_IDS` typed registry is the only source of `data-pendo-id` values; `.pendo-sr-ignore` on password inputs; SVG-only charts; per-row `data-pendo-*-id` parameterization on dynamic lists.

## Next Milestone Goals

(None defined yet. Possible v1.1 directions if a future version is planned: live Pendo runtime wiring (snippet load, identify, setUrl), accessibility pass, additional demo flows like Kanban or Calendar views on Lists.)

## Constraints

- **Tech stack**: Frontend-only SPA — no backend, no API server, no database. All persistence is `localStorage` (or `sessionStorage` where appropriate). Exception (v1.1): direct browser-to-Anthropic-API calls for the agent chat feature are allowed — this is a third-party API call, not a backend/API server the app hosts itself.
- **Tech stack**: Framework is React or Svelte, decided based on ecosystem fit for SaaS UI + charting.
- **Data**: All data is fabricated. Registration data is captured into local storage; charts/lists are seeded with fake data and mutated locally.
- **Pendo readiness**: Markup must include stable identifiers / data attributes on key UI so Pendo guides can target them reliably. Pendo Snippet must be initialized with visitor + account IDs from the registration flow.
- **Polish**: App must look like a real SaaS — clean component library, consistent layout, branded as "Halo." Plain/unstyled is not acceptable.
- **Scope discipline**: This is a demo surface, not a product. Resist adding features that don't serve a clear Pendo demo purpose.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a fake SaaS instead of instrumenting an existing app | Avoids contamination of real customer/internal apps; lets Pendo features be exercised in a controlled surface | ✓ Good — v1.0 ships a believable, controlled demo surface |
| Project/task management as the fake vertical | Familiar to most viewers; naturally yields lists, charts, reports, teams | ✓ Good — every Pendo capability has natural anchors in this vertical |
| Multi-tenant (workspace) model | Lets Pendo init demonstrate both visitor and account IDs, which mirrors real customer setups | ✓ Good — visitor + workspace pair shipped end-to-end (auth, signup, settings) |
| Persist everything in local storage; no backend | Keeps the app fully client-side and trivially deployable; sufficient for a demo | ✓ Good — versioned envelope + Zod-validated reads + migration runner shipped, zero backend |
| Brand the app as "Halo" | Matches the directory name; generic-enough fake SaaS brand | ✓ Good — branding extended with Mantine theme + favicon + light/dark logo |
| SaaS-grade visual polish via a real UI library | Convincing demos require a real-looking surface | ✓ Good — Mantine 9 chosen, dark mode wired, all pages pass the "screenshot test" |
| React over Svelte (settled in Phase 1 research) | Deepest SaaS + charting ecosystem; matches Pendo's customer base | ✓ Good — React 19 + Mantine 9 + Recharts shipped without ecosystem friction |
| Phase 6 (Pendo Install & Wiring) removed from v1.0 scope (2026-05-18) | Pendo runtime wiring not needed for v1.0 demo target; markup affordances are enough | — Pending — revisit if a future milestone wants live Pendo |
| Agent chat calls the real Claude API directly from the browser, key supplied via build-time `.env` (2026-07-22) | Real LLM responses give authentic agent analytics signal (varied timing, content, errors) that scripted fake responses can't; build-time env var was chosen over runtime key entry since this app is never deployed publicly | — Pending — key is visible in the compiled bundle; acceptable only because this build stays local/internal |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-22 — started milestone v1.1 (Agent Chat), scoping a Claude-API-backed chat surface for Pendo agent analytics testing.*

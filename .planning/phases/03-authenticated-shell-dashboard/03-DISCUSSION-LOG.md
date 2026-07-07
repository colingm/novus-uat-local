# Phase 3: Authenticated Shell & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 03-authenticated-shell-dashboard
**Areas discussed:** Side-nav target routes; Seed task data + Task schema lock; AppShell shape & active-route indicator; Dashboard content + time-range semantics

---

## Side-nav target routes for unbuilt pages

### Sub-Q1: Where do non-Dashboard nav items navigate?

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 land on real placeholder routes | Build /app/lists, /app/reports, /app/team, /app/settings, /app/help — each renders a phase-appropriate "Coming in Phase X" placeholder. Active-route indicator works everywhere; refresh+deep-link works (SHELL-04). Phase 4/5 replace the placeholder body, never touch router.tsx. | ✓ |
| One shared /app/coming-soon route with ?from=lists query | Single page reading query param. Fewer files, but active-route collapses and Phase 4/5 must re-split later. | |
| Links disabled (no navigation) | Honest about what's built, but breaks 'real SaaS' feel. | |

**User's choice:** Real placeholder routes.
**Notes:** Recommendation taken; cleanest demo + smallest Phase 4/5 churn.

### Sub-Q2: Placeholder component structure

| Option | Description | Selected |
|--------|-------------|----------|
| One per route, named PlaceholderLists / PlaceholderReports / etc. | src/routes/app/lists/ListsPage.tsx etc., each rendering a shared `<ComingSoonCard />`. Same directory shape Phase 4 will use — zero router churn when Phase 4 swaps the body. | ✓ |
| Single shared `<ComingSoonCard>` imported by each placeholder file | Per-route file as one-liner re-export. Slightly less content; same outcome. | |
| Inline `<ComingSoonCard>` in router.tsx | Phase 4 must add a new file AND edit router.tsx. Conflicts with the 'Phase X never edits router.tsx' pattern Phase 1 set up. | |

**User's choice:** One per route.
**Notes:** Matches the directory shape Phase 4 will already need.

---

## Seed task data + Task schema lock

### Sub-Q1: Seed strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Pull @faker-js/faker forward to Phase 3 | Install faker now, build tasksRepo + tasksSeed idempotently gated by meta.seededAt. Phase 4's LIST CRUD reads/writes through tasksRepo; Phase 5's DATA-01 generalizes the seed to also cover team/help/activity. | ✓ |
| Hardcoded fixture set (15–30 tasks) | Inline fixtures, no faker. Phase 5 replaces. Cheaper now but throwaway. | |
| Mostly empty state | Honors the literal phase boundary but breaks 'prove SVG charting works' goal. | |

**User's choice:** Pull faker forward.
**Notes:** Honest about needs; reusable; Dashboard actually looks alive.

### Sub-Q2: Status enum

| Option | Description | Selected |
|--------|-------------|----------|
| `'todo' \| 'in_progress' \| 'done'` (3 values) | Snake_case identifiers; labels mapped at UI layer. Simplest KPI math. | ✓ |
| `'todo' \| 'in_progress' \| 'blocked' \| 'done'` (4 values) | Adds 'blocked' — more realistic, extra filter row. | |
| `'Open' \| 'In Progress' \| 'Completed'` (display strings stored) | Mirrors Phase 2 RoleEnum pattern but rename later = data migration. | |

**User's choice:** 3-value snake_case.
**Notes:** Cleanest contract for Phase 4 inheritance.

### Sub-Q3: Priority + assignee shape

| Option | Description | Selected |
|--------|-------------|----------|
| Priority 4 levels + assignee embedded `{id, name, avatar?}` | Standard SaaS priority depth. Embedding snapshot means Phase 3 renders names without pulling TEAM-01 forward. Phase 5 backfills canonical teammates store; tasks reference by id. | ✓ |
| Priority 3 levels + assignee visitor-id only | Forces Phase 3 to also build teammates store now. More coupling. | |
| Priority numeric 1–4 + assignee name-string only | Cheapest but Phase 4 filter UI is awkward; Phase 5 can't backfill cleanly. | |

**User's choice:** 4 priority levels + embedded assignee snapshot.
**Notes:** Forward-compatible with Phase 5's canonical teammates store.

### Sub-Q4: Task dates

| Option | Description | Selected |
|--------|-------------|----------|
| createdAt + updatedAt + dueDate + completedAt | All four ISO 8601 strings. Drives bar chart (createdAt), Completed KPI (completedAt), Overdue KPI (dueDate), activity feed sort (updatedAt). | ✓ |
| createdAt + dueDate + completedAt (no updatedAt) | Activity feed sorts by max(createdAt, completedAt). Smaller; loses 'task edited' as distinct event. | |
| createdAt + dueDate only (infer completedAt) | Cleanest schema; can't compute 'completed this week' without timestamp. | |

**User's choice:** All four timestamps.
**Notes:** Activity feed needs updatedAt to distinguish 'edited' from 'created/completed' events.

---

## AppShell shape & active-route indicator

### Sub-Q1: AppShell geometry

| Option | Description | Selected |
|--------|-------------|----------|
| Navbar 240px / header 56px / desktop-only | Classic B2B SaaS proportions. No mobile burger — matches 'demo app, not shipping product' scope. | ✓ |
| Navbar 260px / header 60px / mobile-collapse to drawer | Mobile burger + collapsed state. Extra polish work; only worth it if mobile demos matter. | |
| Navbar 220px / header 52px / no header (Linear-style) | Compact, distinctive. Less 'familiar SaaS' — brief leans on familiarity. | |

**User's choice:** 240/56 desktop-only.
**Notes:** Aligns with Phase 2's light-only / scope-discipline pattern.

### Sub-Q2: Active-route indicator style

| Option | Description | Selected |
|--------|-------------|----------|
| Mantine NavLink default (indigo-tinted background, `variant='light'`) | Zero custom CSS, perfectly themed; respects the Phase 2 accent rule extended to current-route. | ✓ |
| Custom 3px left border + indigo.0 bg | Linear/Notion look; requires Box wrappers + more selectors. | |
| Bold weight + indigo text only | Conflicts with Phase 2 'no fw=700' lockdown. | |

**User's choice:** Mantine NavLink default.
**Notes:** Documented in CONTEXT.md as the one Phase 3 extension to Phase 2's accent rule.

### Sub-Q3: Top-bar contents

| Option | Description | Selected |
|--------|-------------|----------|
| Halo wordmark (left) + workspace name (dimmed) + user-menu (right) | Wordmark inside the navbar column; rest right-aligned. Clean classic SaaS. | ✓ |
| Workspace name prominent (left) + user-menu (right); logo only in navbar | Multi-tenant feel; heavy treatment for a read-only field is weird. | |
| Search input (left) + user-menu (right) | Linear command-bar look; no real search surface = scope creep. | |

**User's choice:** Wordmark left + workspace dimmed right.
**Notes:** Matches the most common SaaS chrome.

### Sub-Q4: User menu links

| Option | Description | Selected |
|--------|-------------|----------|
| Profile → /app/settings?tab=profile / Settings → /app/settings / Sign Out → signOut() | Profile deep-links to Settings tab 1; Phase 4 reads `?tab=` via useSearchParams. | ✓ |
| Profile and Settings both → /app/settings | Simpler; undifferentiated Profile target is unusual UX. | |
| Profile → /app/profile (own route) | Invents scope not in REQUIREMENTS.md. Rejected. | |

**User's choice:** Profile deep-linked via query param.
**Notes:** Wiring exists in Phase 3; consumer lands in Phase 4.

---

## Dashboard content + time-range semantics

### Sub-Q1: KPI set

| Option | Description | Selected |
|--------|-------------|----------|
| 5 KPIs: Active / Completed in range / Overdue / Completion rate / Avg cycle time | Five = middle of 4–6 range; balanced 5-col grid. Avg cycle time gives the most 'analytics-y' card for funnel/replay demos. | ✓ |
| 4 KPIs (drop Avg cycle time) | Cleanest 4-col grid; loses the analytics edge. | |
| 6 KPIs (add Created in range) | Created+Completed adjacent can look like trying too hard. | |

**User's choice:** 5 KPIs.

### Sub-Q2: Chart pair

| Option | Description | Selected |
|--------|-------------|----------|
| Bar 'Tasks completed per day' (area-spline) + Donut 'Tasks by status' (3 slices) | Easy to read at a glance, reliable Pendo targets, proves SVG end-to-end. | ✓ |
| Grouped bars 'Created vs completed' + Pie 'Tasks by priority' (4 slices) | More analytical noise; priority slices < 5% become awkward to label. | |
| Cumulative area + Donut 'Tasks by assignee' | Cumulative is hard to interpret with filtered range; assignee donut has variable slice count. | |

**User's choice:** Bar/area + donut by status.

### Sub-Q3: Time-range control + 'now' anchor

| Option | Description | Selected |
|--------|-------------|----------|
| SegmentedControl 7/30/90d + 'now' = max(timestamp across all tasks) | Reads as a real dashboard filter; moving reference keeps demo coherent forever without re-seeding. Default 30d. | ✓ |
| SegmentedControl 7/30/90d + 'now' = `new Date()` | Honest; faker dates become stale within a week → empty charts → bad demo. | |
| Select dropdown + 'now' anchored to seed time | Dropdown less 'dashboard'; doesn't auto-drift forward as user adds tasks in Phase 4. | |

**User's choice:** SegmentedControl + moving reference.
**Notes:** Critical for the demo never looking stale.

### Sub-Q4: Activity feed + empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Mantine Timeline (8 events, color-coded by type) + Empty state with IconClipboardCheck + Title + dimmed copy + 'Go to Lists' CTA Button | Timeline density feels live without noise; empty state is the named guide-anchor surface. | ✓ |
| Simple List (5 one-liner rows) + minimalist centered text empty state | Fewer Pendo guide anchors — works against the empty-state guide goal. | |
| Card stack activity + heavy illustrated empty state | Cards-of-activity sits awkwardly between feed and list. | |

**User's choice:** Timeline + CTA empty state.
**Notes:** Empty state is explicitly the phase's named guide-anchor surface.

---

## Claude's Discretion

- Per-route `<ComingSoonCard>` copy (one line each)
- Specific Tabler icon picks where multiple are reasonable
- Optional small `<ThemeIcon>` accent inside each KPI card
- Faker locale + whether to call `faker.seed(N)` for deterministic seeds
- Recharts tooltip styling (defaults acceptable; planner may add a Mantine-themed override if a Phase 3-wide helper makes sense)
- Whether the user-menu trigger goes through a new `MenuTrigger` primitive or forwards `data-pendo-id` via `<Menu.Target>` directly — both meet the PENDO_IDS contract

## Deferred Ideas

- Workspace switcher (WS2-01) — v2
- Notifications bell + panel (UX2-02) — v2
- Command-bar Cmd+K (UX2-01) — v2
- Mobile-responsive AppShell — Out of Scope (PROJECT.md "Mobile-native apps" → no mobile breakpoint work for SPA)
- Dark-mode toggle — Phase 4 (SET-04)
- URL persistence for time-range filter (`?range=30`) — possibly Phase 4
- Polished chart tooltips beyond Recharts defaults — Phase 5 polish
- 'Learn more' anchor inside `<ComingSoonCard>` — rejected; placeholders are not guide-anchor surfaces

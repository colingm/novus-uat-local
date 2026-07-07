# Phase 3: Authenticated Shell & Dashboard - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Every authenticated route (`/app/*`) lives inside a real SaaS chrome — a Mantine 9 `AppShell` with a persistent left side-nav (240px) and a 56px top bar — and the post-sign-in landing at `/app` is a believable Dashboard that proves SVG charting and empty-state guide anchors work.

**In scope (Phase 3 ships):**
- `AppLayout` rewrite: Mantine `AppShell` with `navbar={{ width: 240 }}` + `header={{ height: 56 }}`. Replaces the Phase 1 placeholder `AppLayout`.
- Side-nav with six links: Dashboard, Lists, Reports, Team, Settings, Help. Active route uses Mantine `NavLink` default active styling (indigo-tinted background).
- Five placeholder routes (`/app/lists`, `/app/reports`, `/app/team`, `/app/settings`, `/app/help`) — each its own per-route file, all rendering a shared `<ComingSoonCard featureName phase />` so Phase 4/5 swap implementations without touching `router.tsx`.
- Top bar: Halo wordmark (left, inside navbar column footprint) → spacer → workspace name (`Text size="sm" c="dimmed"`) + user-menu button (`Avatar + Text + chevron`) on the right.
- User menu dropdown: Profile (→ `/app/settings?tab=profile`), Settings (→ `/app/settings`), Sign Out (→ `useAuthStore.getState().signOut()` then `<Navigate to="/" replace />`).
- Deep-linking on every `/app/*` route survives refresh (SHELL-04) — already structurally satisfied by Phase 1's `createBrowserRouter` + Vite SPA fallback; verified via manual refresh test on each new placeholder route.
- Task data layer: install `@faker-js/faker`, add `src/tasks/{schemas,types,tasksRepo,tasksSeed,index}.ts` + storage keys `K.tasks(workspaceId)` (per-workspace bucket), seed ~40–60 fake tasks idempotently gated by `meta.seededAt` (FND-05 contract). `Task` schema becomes the contract Phase 4 inherits verbatim.
- Dashboard page at `/app` (index of `AppLayout`): 5 KPI stat cards, one bar/area chart, one donut chart, time-range `SegmentedControl` (7/30/90d), recent-activity `Timeline` (8 events), empty state with "Go to Lists" CTA.
- Install `recharts` for the two SVG charts (docs/CONVENTIONS.md §2 — approved).
- Extend `PENDO_IDS` with `nav.*`, `topbar.*`, `dashboard.*` namespaces. Every interactive nav item, menu item, KPI card, chart container, segmented-control segment, timeline item, and empty-state CTA carries an ID from the registry (SHELL-05 / PEN-07).
- `WorkspaceProvider` stays a Phase 1 stub; the topbar reads the workspace name from `useAuthStore((s) => s.currentWorkspace?.companyName)` directly. Multi-workspace switching is v2.

**Out of scope (deferred — see `<deferred>`):**
- Real workspace switcher (WS2-01, v2).
- Mobile-responsive AppShell (hamburger + drawer). Desktop-only is intentional per "demo app, not shipping product."
- Notification bell / command-bar / search input in top bar (UX2-* are v2).
- Dark-mode toggle (Phase 4's SET-04 owns it).
- Real task CRUD UI — Phase 4 (`LIST-*`). Phase 3 only writes the data layer + seed; no create/edit/delete UI surface ships yet.
- Real Settings page contents — Phase 4 (`SET-*`). The user-menu deep-link `?tab=profile` is wired, but the consumer (`useSearchParams`) lands in Phase 4.
- Real Pendo runtime (PEN-01..06) — Phase 6. Phase 3 only adds `data-pendo-id` markup affordances and PENDO_IDS leaves.

</domain>

<decisions>
## Implementation Decisions

### Sidebar routes & placeholders
- **D-01:** All five non-Dashboard nav items (Lists, Reports, Team, Settings, Help) navigate to real routes: `/app/lists`, `/app/reports`, `/app/team`, `/app/settings`, `/app/help`. No `/app/coming-soon` collapse; no disabled links. Each placeholder route gets its own per-route file (e.g., `src/routes/app/lists/ListsPage.tsx`) that renders a shared `<ComingSoonCard featureName="Lists" phase={4} />`. Phase 4/5 replace the body of these files in place — `router.tsx` is not edited.
- **D-02:** `<ComingSoonCard>` is a new component at `src/ui/ComingSoonCard.tsx`. Props: `featureName: string`, `phase: number`. Visual: Mantine `<Center>` + `<Paper withBorder p="xl" radius="md">` + appropriate Tabler icon (size 48, `c="gray.4"`), `<Title order={3}>` "Lists is coming in Phase 4", `<Text c="dimmed">` one-line copy, no CTA (these are not guide-anchor surfaces — empty-state Dashboard is).

### Seed task data & idempotency
- **D-03:** Install `@faker-js/faker` at `^8.x` (verify latest at install time per project blocker note) as a runtime dependency (not dev) — it ships with the demo bundle so a fresh workspace seeds in-browser. Build `src/tasks/tasksSeed.ts` that generates ~40–60 fake tasks for the current workspace.
- **D-04:** Seeding is idempotent and gated by `meta.seededAt`: on app boot, after auth hydration (or on first workspace sign-in), if `meta.seededAt === null` AND `K.tasks(workspaceId)` is empty, run the seeder and stamp `meta.seededAt` to `new Date().toISOString()`. Subsequent reloads check the stamp and skip seeding so user mutations from Phase 4 are never clobbered. This is the FND-05 contract — Phase 3 is the first writer of `meta.seededAt`.
- **D-05:** Faker date distribution: spread task `createdAt` across the last 90 days from `new Date()` at seed time so all three time-range buckets (7/30/90d) have meaningful data on first demo load. `completedAt` set on ~55% of tasks (status='done'), distributed across the same window with completedAt >= createdAt. `dueDate` set on ~80% of tasks, with ~15% in the past (drives Overdue KPI).

### Task schema lock (Phase 4 inherits verbatim)
- **D-06:** `Task` schema fields:
  - `id: string` (nanoid; matches Visitor/Workspace id convention from Phase 2)
  - `title: string` (min 1)
  - `description: string` (may be empty)
  - `status: 'todo' | 'in_progress' | 'done'` (Zod enum; display labels mapped at UI layer)
  - `priority: 'low' | 'medium' | 'high' | 'urgent'` (Zod enum)
  - `assignee: { id: string; name: string; avatar?: string }` (embedded teammate snapshot — Phase 5 TEAM-01 introduces the canonical `K.teammates(workspaceId)` store; until then the embedded `name`/`avatar` is the source of truth and `id` is forward-compatible with the future teammates store)
  - `createdAt: string` (ISO 8601, `z.iso.datetime()`)
  - `updatedAt: string` (ISO 8601 — mirrors createdAt at seed; mutated on Phase 4 edits)
  - `dueDate: string | null` (ISO 8601 or null)
  - `completedAt: string | null` (ISO 8601 or null; set when status transitions to 'done')
- **D-07:** Schemas live at `src/tasks/schemas.ts` (mirroring `src/auth/schemas.ts` layout): `TaskSchema`, `TasksArraySchema`, plus `TaskStatusEnum`, `TaskPriorityEnum`, `AssigneeSchema`. Types derived via `z.infer` per Phase 2 convention.
- **D-08:** Storage key: `K.tasks(workspaceId)` returns `halo:v${SCHEMA_VERSION}:tasks:${workspaceId}` — per-workspace bucket so the schema is forward-compatible with v2's multi-workspace switching.
- **D-09:** Display-label map (UI layer, NOT in schema): `'todo' → 'To do'`, `'in_progress' → 'In progress'`, `'done' → 'Done'`; `'low' → 'Low'`, `'medium' → 'Medium'`, `'high' → 'High'`, `'urgent' → 'Urgent'`. Exported from `src/tasks/labels.ts` so Phase 3 chart legends and Phase 4 filter chips share a single source of truth.
- **D-10:** `tasksRepo` exposes: `listTasks(workspaceId): Task[]`, `getTaskById(workspaceId, id): Task | undefined`, `createTask(workspaceId, partial): Task`, `updateTask(workspaceId, id, patch): Task | undefined`, `deleteTask(workspaceId, id): boolean`. Phase 3 only calls `listTasks` for the Dashboard; the other methods are stubbed/exported now so Phase 4 doesn't have to extend the repo signature. Every persistent read goes through `readWithSchema(K.tasks(wsId), TasksArraySchema, [])` per FND-04.

### AppShell shape & active-route indicator
- **D-11:** `AppShell` config: `navbar={{ width: 240, breakpoint: 'sm' }}`, `header={{ height: 56 }}`, `padding="md"`. Desktop-only — we accept that the demo doesn't render at xs/sm widths. Mantine's `<Burger>` is intentionally NOT added.
- **D-12:** Side-nav uses Mantine `<NavLink>` for each item. Active state via `active` prop derived from `useLocation().pathname` start-with check (`pathname === '/app'` for Dashboard since `/app` is the index; `pathname.startsWith('/app/lists')` for Lists; etc.). `variant="light"` (the indigo.0 tinted background with indigo.7 text). Icons via `@tabler/icons-react` (already installed): `IconLayoutDashboard`, `IconChecklist`, `IconChartBar`, `IconUsers`, `IconSettings`, `IconHelpCircle`. Icon size 18, `stroke={1.6}` for the modern look.
- **D-13:** Each `NavLink` carries `data-pendo-id` from the registry: `PENDO_IDS.nav.dashboard`, `PENDO_IDS.nav.lists`, `PENDO_IDS.nav.reports`, `PENDO_IDS.nav.team`, `PENDO_IDS.nav.settings`, `PENDO_IDS.nav.help`. Since Mantine `<NavLink>` is not yet in `src/ui/primitives/`, Phase 3 adds a thin wrapper `src/ui/primitives/NavLink.tsx` that requires `pendoId: PendoId` and forwards to the underlying `<NavLink>` — same contract as `Button`/`Anchor`/`TextInput`.

### Top bar contents & user menu
- **D-14:** Top-bar layout (left → right): `<Group h="100%" px="md" justify="space-between">` containing: (left) Halo wordmark — `<Text fw={600} size="lg" c="indigo.7">Halo</Text>` inside a sub-Group that aligns with the 240px navbar column; (right) `<Group gap="md">` with `<Text size="sm" c="dimmed">{workspace.companyName}</Text>` + the user-menu trigger.
- **D-15:** User-menu trigger: Mantine `<Menu>` wrapping a `<UnstyledButton>` containing `<Avatar size="sm" color="indigo" radius="xl">{initials}</Avatar>` + `<Text size="sm" fw={500}>{visitor.firstName} {visitor.lastName}</Text>` + `<IconChevronDown size={14} />`. Initials = first letter of firstName + first letter of lastName, uppercased. The trigger carries `data-pendo-id={PENDO_IDS.topbar.userMenu.button}`. The button itself goes through a new primitive wrapper `src/ui/primitives/MenuTrigger.tsx` (or reuses the existing pattern via `pendoId` forwarding) — to be decided by the planner; either path is acceptable as long as the `data-pendo-id` lands on the actual clickable element.
- **D-16:** `<Menu>` items: `Profile` → `useNavigate()('/app/settings?tab=profile')`, `Settings` → `useNavigate()('/app/settings')`, `<Menu.Divider />`, `Sign out` → `await useAuthStore.getState().signOut(); navigate('/', { replace: true })`. Each item carries an ID: `PENDO_IDS.topbar.userMenu.profile`, `.settings`, `.signout`. Tabler icons: `IconUser`, `IconSettings`, `IconLogout` (size 16).

### Dashboard: KPIs, charts, time-range, activity, empty
- **D-17:** Five KPI cards in a Mantine `<SimpleGrid cols={{ base: 1, sm: 2, md: 5 }}>`: **Active tasks** (count where `status !== 'done'`, no time filter — current state), **Completed in range** (count where `completedAt` within selected window), **Overdue** (count where `status !== 'done'` AND `dueDate < now`, no time filter), **Completion rate** (completedInRange / (completedInRange + createdInRange that are still in todo/in_progress), as percentage; "—" if denominator is 0), **Avg cycle time** (mean `completedAt - createdAt` in days for tasks completed in range; formatted to 1 decimal place like "2.3d"; "—" if no completed-in-range tasks). Each card is a `<Paper withBorder p="md" radius="md">` containing `<Text size="xs" c="dimmed" tt="uppercase">{label}</Text>` + `<Title order={2}>{value}</Title>`. Cards carry `data-pendo-id={PENDO_IDS.dashboard.kpi.active}` etc.
- **D-18:** Bar/area chart: **"Tasks completed per day"** — Recharts `<AreaChart>` (area-spline, `type="monotone"`), X axis = day buckets across the selected window (7/30/90 ticks), Y axis = completed count per bucket. Stroke `indigo.8` (`#3b5bdb`), fill `indigo.6` at 60% opacity. Wrapped in `<Paper withBorder p="md" radius="md">` with title `<Text fw={600}>Completed per day</Text>` and `data-pendo-id={PENDO_IDS.dashboard.chart.completedPerDay}` on the wrapping div (per CLAUDE.md chart-wrapper rule — never on individual `<rect>` paths).
- **D-19:** Donut chart: **"Tasks by status"** — Recharts `<PieChart>` with `<Pie innerRadius={60} outerRadius={90}>`, three segments: To do (`indigo.3`), In progress (`indigo.6`), Done (`gray.5`). Color order matches the display-label sequence. Center label (Recharts `<Label>` via `position="center"`) shows the total task count. Wrapped same as bar chart, `data-pendo-id={PENDO_IDS.dashboard.chart.byStatus}`.
- **D-20:** Time-range control: Mantine `<SegmentedControl>` with three options: `{ value: '7', label: '7d' }`, `{ value: '30', label: '30d' }`, `{ value: '90', label: '90d' }`. Default value: `'30'`. Stored in component state (no URL persistence in Phase 3 — Phase 4 may add `?range=30`). Carries `data-pendo-id={PENDO_IDS.dashboard.timeRange}` on the wrapping element (SegmentedControl segments themselves can be sub-targeted via Mantine's internal `aria-label` per the existing `signup.stepper` precedent).
- **D-21:** "Now" reference for all date math: `nowRef = max(task.createdAt, task.updatedAt, task.completedAt)` across the full task array, defaulting to `new Date()` if the array is empty. Computed once per render in the Dashboard component (memoized on `tasks` array). This anchors the moving reference so the demo never goes stale: the latest task is always treated as "today," giving the 7/30/90d buckets meaningful data on every viewing.
- **D-22:** Recent-activity feed: Mantine `<Timeline active={-1} bulletSize={24} lineWidth={2}>` with `<Timeline.Item>` for each of the 8 most recent events. Events = sorted tasks by `max(task.completedAt ?? '', task.updatedAt, task.createdAt)` desc; for each task pick the event type that produced the latest timestamp: completed (icon `IconCheck`, color `green.6`), updated (icon `IconEdit`, color `gray.6`), created (icon `IconPlus`, color `indigo.6`). Item title: `<Text size="sm">` "{assignee.name} {verb} '{task.title}'", body: `<Text size="xs" c="dimmed">{relative time}</Text>` ("2h ago", "Yesterday", "3d ago" — a small `formatRelative()` helper in `src/dashboard/relative-time.ts`, no dayjs needed). Each item carries `data-pendo-id={PENDO_IDS.dashboard.activity.item}` and a static `data-pendo-task-id={task.id}` (parameterized — per CLAUDE.md "lists.row.complete" precedent).
- **D-23:** Empty state: triggered when `listTasks(workspaceId).length === 0`. Renders instead of KPIs + charts + activity. Layout: `<Center mih={400}>` + `<Stack align="center" gap="md">` + `<IconClipboardCheck size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />` + `<Title order={3}>` "No tasks yet" + `<Text c="dimmed" ta="center" maw={420}>` "Looks like your workspace is fresh. Head over to Lists to create your first task and see this dashboard come to life." + `<Button variant="filled" pendoId={PENDO_IDS.dashboard.emptyState.cta} onClick={() => navigate('/app/lists')}>` Go to Lists `</Button>`. The whole `<Center>` carries `data-pendo-id={PENDO_IDS.dashboard.emptyState.container}` — this surface is the guide-anchor target the phase goal calls out.

### PENDO_IDS extensions
- **D-24:** Phase 3 adds three namespaces to `src/pendo/PENDO_IDS.ts`:
  - `nav: { dashboard, lists, reports, team, settings, help }` (leaf values like `'nav.dashboard'`)
  - `topbar: { logo, workspaceName, userMenu: { button, profile, settings, signout } }`
  - `dashboard: { timeRange, kpi: { active, completedInRange, overdue, completionRate, avgCycleTime }, chart: { completedPerDay, byStatus }, activity: { container, item }, emptyState: { container, cta } }`
  - `comingSoon: { card }` — single ID on the shared `<ComingSoonCard>` wrapper so guide targeting can find any placeholder page generically.
- **D-25:** Leaf string convention is unchanged from Phase 1/2: dotted, kebab-case (`'dashboard.kpi.completed-in-range'`). The hand-typed-string ban (CONVENTIONS.md §1) still applies — every consumer references `PENDO_IDS.dashboard.kpi.completedInRange` (camelCase key, kebab-case value) and never inlines the string.

### Provider stack & workspace identity
- **D-26:** `App.tsx` is NOT edited — provider stack stays `Storage → Auth → Workspace → PendoBridge → Router` per FND-07. The `WorkspaceProvider` body stays a stub. Topbar reads the workspace identity directly: `const workspace = useAuthStore((s) => s.currentWorkspace)`; the workspace name display is `{workspace?.companyName ?? ''}` (the AppShell only ever renders for authenticated users, so `currentWorkspace` is guaranteed non-null in practice — narrow it with a type assertion or fallback once verified by `RequireAuth`).

### Storage schema bump
- **D-27:** Phase 3 does NOT bump `SCHEMA_VERSION` (still 1). Adding `K.tasks(workspaceId)` and writing `meta.seededAt` are non-breaking additions to a v1 schema. The migrations runner (`src/storage/migrations.ts`) gets no new handler. Phase 4's LIST CRUD continues against the same v1 keys. A future v2 bump would happen if (e.g.) the Task shape ever changes incompatibly — which the schema lock here is designed to prevent.

### Claude's Discretion
- Exact `<ComingSoonCard>` copy per route ("Lists is coming in Phase 4" vs "Coming in Phase 4: full task CRUD"). Planner writes one-line copy per route at compose time.
- Specific Tabler icon picks where multiple choices apply (e.g., dashboard nav icon: `IconLayoutDashboard` vs `IconHome` — D-12 picks the former but the planner can swap if a more accurate icon exists in current `@tabler/icons-react`).
- KPI card icon (small icon next to each card title) — not required by spec, planner may add a small dimmed `<ThemeIcon>` per card if it improves scanability.
- Faker locale and seed determinism (whether `faker.seed(N)` is called for reproducible task sets). Planner can either fix a seed for deterministic demos or leave it random for variety on every fresh workspace.
- Default chart tooltip styling — Recharts defaults are acceptable; planner may add a Mantine-themed `<Tooltip>` override if a Phase 3-wide chart-style helper makes sense.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level locks
- `CLAUDE.md` — Technology stack, Pendo integration patterns, "What NOT to Use" list, Recharts SVG mandate, PENDO_IDS pattern
- `.planning/PROJECT.md` — Core value, Out of Scope items (esp. "Real authentication" + "Pendo Snippet settings UI" + "Mobile-native apps"), Key Decisions table
- `.planning/REQUIREMENTS.md` — SHELL-01..04, DASH-01..06 (Phase 3 owns these). Inherited contracts: FND-04 (`readWithSchema` envelope), FND-05 (`meta.seededAt` idempotency), FND-07 (provider stack order), PEN-07 (PENDO_IDS), PEN-08 (SVG-only charts)
- `.planning/STATE.md` — Decisions list (esp. "01-05 react-router@7.15 + two-layout split", "Phase 02-06 router two-level nesting", "Plan 02-06 RequireAnon skips / and /sandbox")
- `.planning/ROADMAP.md` §"Phase 3" — Goal + Success Criteria are the verification anchors; §"Phase 4" + §"Phase 5" document the contracts Phase 3 must NOT break

### Markup conventions & Pendo readiness
- `docs/CONVENTIONS.md` §1 — PENDO_IDS is the only source of `data-pendo-id` (hand-typed string ban)
- `docs/CONVENTIONS.md` §2 — SVG-only chart rule; Recharts approved; canvas forbidden
- `docs/CONVENTIONS.md` §3 — `.pendo-sr-ignore` policy (irrelevant to Phase 3 but enforces the no-scatter rule)
- `src/pendo/PENDO_IDS.ts` — Registry to extend with `nav`, `topbar`, `dashboard`, `comingSoon` namespaces. Existing `layout` + `sandbox` + `signup` + `signin` namespaces are NOT touched.
- `src/ui/primitives/` (entire dir) — Wrapper contract (`pendoId: PendoId` required, forwarded to DOM as `data-pendo-id`). Phase 3 adds at least one new wrapper (`NavLink`), possibly a `MenuTrigger` wrapper.

### Auth & workspace state
- `src/auth/authStore.ts` — `useAuthStore` selectors: `currentVisitor`, `currentWorkspace`, `isAuthenticated`, `signOut`. AUTH-10 module-init hydration ordering is load-bearing (the topbar can read `currentWorkspace` on first render without effect-hook gymnastics).
- `src/auth/types.ts` — `Visitor`, `Workspace`, `User` types. `Workspace.companyName` is the field rendered in the topbar.
- `src/auth/RequireAuth.tsx` — Already wraps `/app/*`; Phase 3 doesn't touch the guard, only the children.

### Storage envelope (FND-04 / FND-05)
- `src/storage/keys.ts` — `K` builder + `SCHEMA_VERSION`. Phase 3 adds `K.tasks(workspaceId)` here (NOT in a new file).
- `src/storage/codec.ts` — `readWithSchema` / `writeJSON` / `removeKey`. Every Task read flows through `readWithSchema`.
- `src/storage/schemas.ts` — `MetaSchema` is consumed at boot for the `seededAt` stamp. Phase 3's `TaskSchema` lives in `src/tasks/schemas.ts`, NOT re-exported from the storage barrel (mirrors the Phase 2 auth-schema split — the storage barrel only re-exports persistence schemas, not feature schemas).
- `src/storage/migrations.ts` — Unchanged in Phase 3 (no SCHEMA_VERSION bump).

### Router & layouts (Phase 1/2 lock)
- `src/router.tsx` — Two-level `RequireAuth → pathless AppLayout → children` structure. Phase 3 adds five new children under the existing `AppLayout` block; the existing `AppPlaceholder` index route is REPLACED by the new Dashboard component.
- `src/routes/app/AppLayout.tsx` — Phase 1 placeholder; Phase 3 replaces the body with the Mantine `AppShell` (navbar + header + outlet). Provider stack and route wrapping are untouched.
- `src/routes/app/AppPlaceholder.tsx` — Deleted by Phase 3 (replaced by `Dashboard.tsx`).
- `src/routes/public/PublicLayout.tsx` — Untouched (DemoBanner stays public-only, FND-06).

### Phase 2 design system reference (DO inherit)
- `.planning/phases/02-registration-sign-in/02-UI-SPEC.md` — Spacing scale (Mantine xs..xl tokens), typography (4 roles, 2 weights, no `fw={700}`), color (indigo accent reserved, raw hex banned), `<Paper withBorder radius="md" p="lg/xl">` surface pattern. Phase 3 inherits ALL of these except the "no shadows" rule — AppShell may introduce a subtle `box-shadow` on the navbar/header edge IF Mantine's `AppShell` defaults need it; document the deviation in the phase plan if so.

### Reference for Recharts integration
- `recharts` docs (https://recharts.org) — `<AreaChart>` + `<PieChart>` API. Pin a 2.x version at install time (`npm view recharts version`). React 19 compatibility verification is part of Plan 01 (install) — if recharts 2.x has React 19 peer-dep warnings, document and proceed only if the runtime smoke renders correctly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/ui/primitives/{Button,Anchor,TextInput,PasswordInput,Select,MultiSelect,NumberInput}.tsx`** — The wrapped-with-`pendoId` pattern. Phase 3 adds at least `NavLink.tsx` here following the same contract; possibly `MenuTrigger.tsx` if `<UnstyledButton>` inside a `<Menu>` needs the wrapper treatment (alternative: forward `data-pendo-id` via `<Menu.Target>` props).
- **`useAuthStore` selectors** — `currentVisitor`, `currentWorkspace`, `isAuthenticated`, `signOut`. Module-init hydration means selectors return populated values on first render — no loading state needed in the topbar.
- **`src/storage/codec.ts`** — `readWithSchema(key, Schema, fallback)` and `writeJSON(key, value)` are the only allowed access path to storage (FND-04). `tasksRepo` calls these directly.
- **`src/auth/wizardSession.ts`** — Reference implementation of a per-key feature module that pairs schema + codec + thin API. `src/tasks/tasksRepo.ts` follows the same shape (one module per persistent collection, never `localStorage.*` directly).
- **`@tabler/icons-react` 3.44.0** — Already installed; provides every nav icon, user-menu icon, KPI accent icon, timeline event icon needed in Phase 3.
- **`PENDO_IDS.layout.appPlaceholder`** — Existing; reused inside the dashboard empty state OR retired with the placeholder removal. Recommendation: retire it cleanly in Phase 3 since `appPlaceholder` is no longer a meaningful target (the placeholder is replaced by the real Dashboard).

### Established Patterns
- **Two-level pathless layout** (`router.tsx` Phase 2 lock): `RequireAuth → AppLayout (pathless) → children`. Phase 3 adds index (Dashboard) + five named children under the SAME `children: [...]` block; no new wrappers.
- **`pendoId: PendoId` required prop with `Leaves<typeof PENDO_IDS>` type** (`src/pendo/PENDO_IDS.ts`): TypeScript flags any hand-typed string at compile time. Phase 3's new namespaces extend the registry; the `PendoId` type updates automatically.
- **Schemas-as-source-of-truth** (`src/auth/schemas.ts` + `src/auth/types.ts`): Zod schemas first, types via `z.infer`. `src/tasks/schemas.ts` + `src/tasks/types.ts` mirror this. No hand-written parallel type declarations.
- **Module-init hydration** (`src/auth/authStore.ts`): Synchronous bootstrap reads at module load, NOT in a React effect. `src/tasks/tasksSeed.ts` follows the same model — invoke once at module init (inside a `seedIfNeeded(workspaceId)` function called from `AppLayout` mount OR from a new `TasksProvider` thin wrapper; planner picks the cleanest integration point).
- **Per-storage-key feature module ownership** (`src/auth/authRepo.ts`, `src/auth/wizardSession.ts`): Each persistent collection has exactly one module that touches it. `src/tasks/tasksRepo.ts` owns `K.tasks(workspaceId)` end-to-end — no other file may read or write it.
- **Idempotent seeding gate** (FND-05 contract; first writer is Phase 3): Read `meta` via `readWithSchema(K.meta(), MetaSchema, fallback)`, check `seededAt === null`, write seed + stamp atomically. Future phases (Phase 5 DATA-01) extend the same gate to seed teammates + activity + help articles.

### Integration Points
- **`src/App.tsx`** — UNTOUCHED. Provider stack is FND-07-locked.
- **`src/router.tsx`** — One block edited: the `/app` branch's `children` array gains five new entries + the index changes from `AppPlaceholder` to `Dashboard`. The `/` branch is untouched.
- **`src/routes/app/AppLayout.tsx`** — Body replaced with Mantine `AppShell` (navbar + header + main+Outlet). The exported component name `AppLayout` stays the same.
- **`src/routes/app/AppPlaceholder.tsx`** — Deleted.
- **`src/pendo/PENDO_IDS.ts`** — Three new namespaces appended to the object literal; `Leaves` type derivation is automatic.
- **`src/storage/keys.ts`** — One new `K.tasks(workspaceId)` builder added; existing keys untouched.
- **`package.json`** — Two new runtime deps: `recharts` (^2.x) + `@faker-js/faker` (^8.x or latest). Pin exact versions via `npm view` at install time.
- **New directories created by Phase 3:** `src/tasks/`, `src/dashboard/`, `src/routes/app/lists/`, `src/routes/app/reports/`, `src/routes/app/team/`, `src/routes/app/settings/`, `src/routes/app/help/`.
- **New shared UI component:** `src/ui/ComingSoonCard.tsx` — used by all five placeholder routes.

</code_context>

<specifics>
## Specific Ideas

- Recharts integration pattern from CLAUDE.md (verbatim): "For chart elements (where Recharts renders SVG `<rect>` / `<path>` per data point), wrap charts in a container `<div data-pendo-id="dashboard.charts.velocity">` and rely on stable axis labels for sub-targeting. Don't try to target individual chart bars — they're recomputed on every render." This is the implementation contract for D-18 and D-19.
- Dynamic list parameterization from CLAUDE.md: "For dynamic lists (tasks, team members), parameterize: `data-pendo-id="lists.row.complete"` plus `data-pendo-item-id={task.id}` — Pendo can target the class of rows, and Session Replay still captures the specific row interacted with." Phase 3 applies this to the Timeline items in D-22.
- Phase 2 UI-SPEC §"Color" "Forbidden uses of indigo (the accent rule)" — Phase 3's introduction of indigo-tinted NavLink active states is the ONE NEW exception the rule must accommodate. Document this in the phase plan as an explicit "Phase 3 extension to the accent rule: active-nav-link" so Phase 4/5 don't read it as a precedent for arbitrary indigo backgrounds.

</specifics>

<deferred>
## Deferred Ideas

- **Workspace switcher in the top bar** (WS2-01) — v2 capability. Phase 3 displays the workspace name read-only.
- **Notifications bell + panel in top bar** (UX2-02) — v2.
- **Command-bar (Cmd+K)** (UX2-01) — v2.
- **Mobile-responsive AppShell (hamburger + drawer)** — Out of Scope per PROJECT.md "Mobile-native apps" — extended to "no mobile breakpoint work for SPA." Demos are desktop.
- **Dark-mode toggle** — Phase 4 owns (SET-04). Phase 3 ships light-only.
- **URL persistence for the time-range filter** (`?range=30`) — Phase 4 may add when Lists/Reports filters introduce the same pattern. Phase 3 keeps it in component state.
- **Real chart tooltips beyond Recharts defaults** — Phase 5 polish may upgrade if needed.
- **Per-step tooltip / nav-link badges (e.g. "New" pill on Help)** — UI-04 polish surface; Phase 5.
- **Faker `seed(N)` for fully reproducible task sets** — Discretion item for Phase 3 planner; if it's not added now, it can land as a one-line change in any future phase.
- **`ComingSoonCard` "Learn more" anchor** — Considered and rejected (D-02): placeholders are NOT the guide-anchor surface; the empty-state Dashboard IS.

</deferred>

---

*Phase: 03-authenticated-shell-dashboard*
*Context gathered: 2026-05-14*

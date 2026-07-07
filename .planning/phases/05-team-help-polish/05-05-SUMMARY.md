---
phase: 05-team-help-polish
plan: "05"
subsystem: help
tags: [help, search, debounce, router, pendo-ids, static-module]
dependency_graph:
  requires: ["05-02", "05-04"]
  provides:
    - src/pendo/PENDO_IDS.ts (help namespace)
    - src/help/components/HelpSearchInput.tsx
    - src/help/components/HelpList.tsx
    - src/help/components/HelpNoResultsState.tsx
    - src/routes/app/help/HelpPage.tsx (body replaced)
    - src/routes/app/help/HelpArticlePage.tsx
    - src/router.tsx (help/:slug flat sibling route)
  affects:
    - /app/help (list surface now live)
    - /app/help/:slug (detail surface now live)
tech_stack:
  added: []
  patterns:
    - useDebouncedValue (150ms, @mantine/hooks) for search debounce
    - polymorphic Anchor S3-exception (raw MantineAnchor with component={Link} or component="button")
    - flat sibling router shape (no nested children, no <Outlet />)
    - topic-grouping via Map preserving insertion order
    - dynamic-list parameterization (data-pendo-article-slug per CLAUDE.md + D-14)
key_files:
  created:
    - src/help/components/HelpSearchInput.tsx
    - src/help/components/HelpList.tsx
    - src/help/components/HelpNoResultsState.tsx
    - src/routes/app/help/HelpArticlePage.tsx
  modified:
    - src/pendo/PENDO_IDS.ts
    - src/routes/app/help/HelpPage.tsx
    - src/router.tsx
    - src/team/components/InviteTeammateModal.tsx (Rule-1 bug fix)
decisions:
  - "Flat sibling router shape chosen over nested children: HelpPage has no <Outlet /> so nesting would render both list and detail simultaneously; UI-SPEC line 840 explicitly accepts either shape"
  - "Article row treatment: Treatment A (flat anchor list per UI-SPEC default, polished-list aesthetic)"
  - "No-results condition uses explicit && debouncedQuery.trim() !== '' guard for clarity"
  - "HelpNoResultsState uses py=xl (compact in-flow) NOT mih=400 (full-page hero)"
  - "PENDO_IDS.help namespace appended after team namespace; all 7 leaves present"
  - "InviteTeammateModal Rule-1 fix: replaced WorkspaceRole cast with explicit equality guards to resolve TS2345"
metrics:
  duration: "~12min"
  completed_date: "2026-05-15"
  tasks_completed: 2
  files_created: 4
  files_modified: 4
---

# Phase 5 Plan 05: Help UI + Router Summary

**One-liner:** Help article list with 150ms debounced search (title/keywords/summary), topic-grouped HelpList, compact HelpNoResultsState, HelpArticlePage detail with not-found state, and flat-sibling router edit for /app/help/:slug.

## What Was Built

Seven file changes implementing the complete /app/help surface:

- **`src/pendo/PENDO_IDS.ts`** — Appended `help` namespace after existing `team` namespace with 7 leaves: `search`, `topic.container`, `article.row`, `article.detailBackLink`, `emptyState.container`, `noResults.container`, `noResults.clearLink`. Article row leaf includes comment noting consumers must add `data-pendo-article-slug={article.slug}` per CLAUDE.md dynamic-list rule + D-14.

- **`src/help/components/HelpSearchInput.tsx`** — Thin controlled TextInput wrapper with `IconSearch size={16}` left section and `pendoId={PENDO_IDS.help.search}`. Debounce is intentionally NOT here — it's a page-level concern in HelpPage per D-08.

- **`src/help/components/HelpList.tsx`** — Topic-grouped article anchor list. `groupByTopic` helper uses a Map to preserve first-seen insertion order (stable since HELP_ARTICLES is faker.seed(42)-pinned). Each article row is a `MantineAnchor component={Link}` carrying both `data-pendo-id={PENDO_IDS.help.article.row}` and `data-pendo-article-slug={article.slug}` (S3 polymorphic-Anchor exception; dynamic-list parameterization mandatory per CLAUDE.md).

- **`src/help/components/HelpNoResultsState.tsx`** — Compact in-flow `Center py="xl"` no-results state mirroring `FilteredEmptyState.tsx`. Copy locked at 'No articles match "{query}". Try a different keyword.' The "Clear search" anchor uses `MantineAnchor component="button"` (S3 exception) with `data-pendo-id={PENDO_IDS.help.noResults.clearLink}`.

- **`src/routes/app/help/HelpPage.tsx`** — ComingSoonCard placeholder replaced with composer. Uses `useDebouncedValue(query, 150)` from `@mantine/hooks` (D-08). Filter logic: `${a.title} ${a.keywords.join(' ')} ${a.summary}` haystack (body excluded per D-08). Guard: `filtered.length === 0 && debouncedQuery.trim() !== ''` triggers HelpNoResultsState; otherwise renders HelpList.

- **`src/routes/app/help/HelpArticlePage.tsx`** — NEW file. Reads `:slug` via `useParams<{ slug: string }>()`, looks up via `getHelpArticleBySlug`. Article-found branch: topic + title + `body.split('\n\n').map(paragraph => <Text>)` + back link. Article-not-found branch: hero `Center mih={400}` with 'Article not found' title + body + same `PENDO_IDS.help.article.detailBackLink`. Both branches use the same leaf so Phase 6 guides can target one ID for "return to help list" intent.

- **`src/router.tsx`** — First edit since Phase 3 D-01 lock. Added import for `HelpArticlePage` and a flat sibling route `{ path: 'help/:slug', Component: HelpArticlePage }` alongside existing `{ path: 'help', Component: HelpPage }`. Flat shape chosen (not nested children) because `HelpPage` has no `<Outlet />` — nesting would render list above detail simultaneously. UI-SPEC line 840 explicitly accepts either shape.

## Key Design Choices

| Choice | Value | Rationale |
|--------|-------|-----------|
| Router shape | Flat sibling (not nested children) | HelpPage has no `<Outlet />`; nesting breaks the layout per React Router v7 semantics |
| Article row treatment | Treatment A (flat anchor list) | Preferred by UI-SPEC for polished-list aesthetic over Treatment B card-style |
| No-results guard | `filtered.length === 0 && debouncedQuery.trim() !== ''` | Explicit guard for clarity; prevents no-results flash on empty query |
| Back-link PENDO_IDS | Same leaf for found + not-found | Phase 6 guide targets one ID for "return to list" regardless of article existence |
| Debounce wait | 150ms | D-08 lock; `@mantine/hooks` already installed (9.2.0) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript TS2345 in InviteTeammateModal (pre-existing from Plan 04)**
- **Found during:** Task 1 typecheck run
- **Issue:** `InviteTeammateModal.tsx` line 134 used `(['Admin', 'Member', 'Viewer'] as const).includes(value as WorkspaceRole)` which fails TS2345 because `WorkspaceRole` includes `'Owner'` but the array does not
- **Fix:** Replaced cast-based approach with explicit equality guards (`value === 'Admin' || value === 'Member' || value === 'Viewer'`); removed now-unused `WorkspaceRole` import
- **Files modified:** `src/team/components/InviteTeammateModal.tsx`
- **Commit:** b46c6e1

### Router Shape Decision

The plan preferred nested children but explicitly authorized the flat sibling shape (UI-SPEC line 840). Flat sibling was chosen because `HelpPage` renders article list content directly (no `<Outlet />`), so nesting under a parent with no outlet would render both surfaces simultaneously when navigating to `/app/help/:slug`. This is documented in the router comment.

## Verification Results

- `npm run typecheck` — PASS (0 errors)
- `npm run build` — PASS (chunk size warning is pre-existing, not a regression)
- No hand-typed `data-pendo-id` strings in help components — PASS (0 matches)
- No `IconHelp`/`floatingFab`/`helpFab`/`Resource Center` in src/ — PASS (D-10 satisfied)
- `PENDO_IDS.nav.help` in AppLayout — PASS (existing side-nav anchor satisfies HELP-04)
- All 7 PENDO_IDS.help leaves present — PASS
- Article rows carry both static + dynamic pendo attributes — PASS

## Known Stubs

None — the help article content is faker-generated lorem ipsum (intentional per D-09 + `<deferred>` tradeoff accepted in 05-CONTEXT.md). All routing, search, and detail rendering is fully functional.

## Threat Flags

None — this plan adds no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. Help articles are read-only static module data; the router additions are client-side only.

## Self-Check: PASSED

Files created:
- [x] src/help/components/HelpSearchInput.tsx — FOUND
- [x] src/help/components/HelpList.tsx — FOUND
- [x] src/help/components/HelpNoResultsState.tsx — FOUND
- [x] src/routes/app/help/HelpArticlePage.tsx — FOUND

Commits:
- [x] b46c6e1 — feat(05-05): PENDO_IDS help namespace + HelpSearchInput + HelpNoResultsState + HelpList — FOUND
- [x] 63a8655 — feat(05-05): HelpPage composer + HelpArticlePage + router flat-sibling edit — FOUND

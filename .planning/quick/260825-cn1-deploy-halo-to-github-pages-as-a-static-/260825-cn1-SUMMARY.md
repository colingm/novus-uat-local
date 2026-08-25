---
phase: quick-260825-cn1
plan: 01
subsystem: infra
tags: [vite, react-router, github-actions, github-pages, static-deploy]

requires: []
provides:
  - Base-path-aware Vite build (`base` gated on `GITHUB_ACTIONS` env var)
  - `dist/404.html` deep-link fallback, byte-identical to `dist/index.html`
  - Router mounted under `import.meta.env.BASE_URL` via `createBrowserRouter`
  - Six route/asset literals rebased off the origin root onto `BASE_URL`
  - `.github/workflows/deploy-pages.yml` — first-party Actions Pages deploy
affects: [pages-deploy, ci]

tech-stack:
  added: []
  patterns:
    - "base-path single source of truth: vite.config.ts `base` -> router basename -> every asset/href literal via import.meta.env.BASE_URL"
    - "build-only Vite plugin (closeBundle hook) for the 404.html deep-link fallback instead of a postbuild npm script"

key-files:
  created:
    - .github/workflows/deploy-pages.yml
  modified:
    - vite.config.ts
    - src/router.tsx
    - src/routes/app/AppLayout.tsx
    - src/routes/public/Landing.tsx
    - src/routes/public/SignInPage.tsx
    - src/routes/public/PrimitivesSandbox.tsx
    - src/routes/public/signup/Step1AccountPage.tsx
    - src/routes/public/signup/SignupShell.tsx

key-decisions:
  - "base gated on process.env.GITHUB_ACTIONS (not loadEnv's merged env object) so the deployment base depends only on the real CI environment, never a local .env file"
  - "404.html fallback implemented as a build-only Vite plugin (closeBundle copy) rather than a package.json postbuild script — cross-platform, fires for bare `vite build`, lives beside the base value it's coupled to"
  - "Six <Anchor href> full-page navigations kept as raw href with a BASE_URL template-literal prefix rather than converted to React Router <Link> — behavior-preserving one-line change per site; <Link> conversion deferred (see below)"
  - "Repo Pages source = 'GitHub Actions' left as a manual operator step — no CLI/API path the executor can safely run for the user"

patterns-established:
  - "Any future change to the deployment subpath requires editing vite.config.ts only — router basename and every src/ literal derive from import.meta.env.BASE_URL"

requirements-completed: [QUICK-260825-cn1]

coverage:
  - id: D1
    description: "CI-flavored build (GITHUB_ACTIONS=true) emits base-prefixed asset/favicon URLs plus a byte-identical dist/404.html"
    requirement: "QUICK-260825-cn1"
    verification:
      - kind: other
        ref: "rm -rf dist && GITHUB_ACTIONS=true npm run build && grep -q '/novus-uat-local/assets/' dist/index.html && grep -q '/novus-uat-local/favicon.png' dist/index.html && cmp -s dist/index.html dist/404.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "Plain (non-CI) build emits origin-root asset URLs and the same 404 fallback; router mounts under BASE_URL with createBrowserRouter (not createHashRouter)"
    requirement: "QUICK-260825-cn1"
    verification:
      - kind: other
        ref: "rm -rf dist && npm run build && grep -q 'src=\"/assets/' dist/index.html && cmp -s dist/index.html dist/404.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zero origin-root asset/href literals remain in src/; all six touched files reference BASE_URL"
    requirement: "QUICK-260825-cn1"
    verification:
      - kind: other
        ref: "grep -rnE \"['\\\"\\`]/(halo-logo|halo-logo-dark|favicon|vite)\\.(png|svg|ico)\" src/ ; grep -rnE 'href=\\{?[\"'\"'\"'`]/' src/ -- both empty"
        status: pass
    human_judgment: false
  - id: D4
    description: ".github/workflows/deploy-pages.yml deploys via first-party Actions Pages path, exactly three permissions, concurrency group, no repository secrets, no gh-pages branch reference"
    requirement: "QUICK-260825-cn1"
    verification:
      - kind: other
        ref: "grep-gated checklist in Task 3 <verify>: all first-party actions present, gh-pages=0, secrets.=0, VITE_ leak=0, no tab indentation"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm run dev still serves on port 3030 with zero dev-behavior change"
    verification:
      - kind: other
        ref: "curl -s -o /dev/null -w '%{http_code}' http://localhost:3030/ -> 200"
        status: pass
    human_judgment: false
  - id: D6
    description: "Repo Pages source switched to 'GitHub Actions' and a live deploy from main succeeds"
    verification: []
    human_judgment: true
    rationale: "Requires a manual dashboard change (Settings -> Pages -> Source) that the executor cannot safely perform on the user's behalf, plus a real push to main and a live Actions run to observe."

duration: ~15min
completed: 2026-08-25
status: complete
---

# Quick Task 260825-cn1: Deploy Halo to GitHub Pages as a Static SPA Summary

**Base-path-aware Vite build (`base` gated on `GITHUB_ACTIONS`), a `dist/404.html` deep-link fallback plugin, `createBrowserRouter` basename wiring, nine rebased URL literals, and a first-party GitHub Actions Pages deploy workflow — Halo now builds and serves correctly under `/novus-uat-local/`.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-08-25T13:18:52Z
- **Tasks:** 3
- **Files modified:** 8 (7 modified, 1 created)

## Accomplishments
- `vite.config.ts` now sets `base: '/novus-uat-local/'` under `GITHUB_ACTIONS`, `'/'` otherwise, and a new `pagesFallbackPlugin` copies `index.html` to `404.html` on every build (`closeBundle` hook), verified byte-identical in both build flavors.
- `src/router.tsx` mounts `createBrowserRouter` with `{ basename: import.meta.env.BASE_URL }`, keeping History API routing intact (FND-03); its doc comment now describes the production fallback mechanism instead of the now-inaccurate dev-server-only claim.
- Nine origin-root literals across six files (two logo `<Image src>` ternaries, six `<Anchor href>` full-page navigations to `/signin`, `/signup`, `/`) now resolve relative to `import.meta.env.BASE_URL`, so the deployed subpath doesn't break logo loading or public link navigation.
- `.github/workflows/deploy-pages.yml` added: push-to-`main` + `workflow_dispatch` triggers, `contents: read` / `pages: write` / `id-token: write` permissions only, `concurrency: pages` group, and the five first-party `actions/*` steps (checkout, setup-node@22, configure-pages, upload-pages-artifact, deploy-pages) with zero repository secrets referenced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Serve the whole app from /novus-uat-local/ — build config + router basename + 404 fallback** - `ea425fb` (feat)
2. **Task 2: Rebase every origin-root URL literal in src/ onto import.meta.env.BASE_URL** - `5696a9c` (fix)
3. **Task 3: Add the GitHub Actions Pages deployment workflow** - `81fea4d` (chore)

_This was a `type="tracer"` first task; its `<verify>` was re-run end-to-end and passed before Task 2/3 proceeded (auto mode active)._

## Files Created/Modified
- `vite.config.ts` - `base` gate + `pagesFallbackPlugin` (build-only 404.html emit)
- `src/router.tsx` - `createBrowserRouter` basename + updated FND-03 doc comment
- `src/routes/app/AppLayout.tsx` - logo `<Image src>` ternary rebased onto `BASE_URL`
- `src/routes/public/Landing.tsx` - logo `<Image src>` ternary + two `<Anchor href>` sites rebased
- `src/routes/public/SignInPage.tsx` - one `<Anchor href>` rebased
- `src/routes/public/PrimitivesSandbox.tsx` - one `<Anchor href>` rebased (root link, no trailing segment)
- `src/routes/public/signup/Step1AccountPage.tsx` - one `<Anchor href>` rebased
- `src/routes/public/signup/SignupShell.tsx` - one `<Anchor href>` rebased
- `.github/workflows/deploy-pages.yml` (new) - Actions-native Pages deploy workflow

## Decisions Made
- `base` reads `process.env.GITHUB_ACTIONS` directly, not the `loadEnv`-merged `env` object, so a local `.env` file can never accidentally flip the deployment base.
- 404 fallback is a build-only Vite plugin, not an npm `postbuild` script — cross-platform, fires for a bare `vite build`, and stays coupled next to the `base` value it depends on.
- **Deferred: `<Link>` conversion for the six `href` sites.** Kept as raw `<a href>` with a `BASE_URL`-prefixed template literal instead of converting to React Router `<Link>`. Converting would change navigation semantics (client-side transition vs. full document load), touch the `Anchor` primitive's polymorphic typing, and risk shifting the Pendo markup contract — out of scope for a quick task. Revisit if/when these links are folded into a broader `Anchor`/routing refactor.

## Deviations from Plan

None - plan executed exactly as written. All three tasks matched their `<action>` specs and every `<verify>` gate passed on first run.

## Issues Encountered
None.

## Known Caveats (recorded per plan `<output>` spec)

- **Agent chat is knowingly broken on the deployed site.** `src/chat/claudeClient.ts` still fetches `/api/chat/stream`, a Vite dev-server-only proxy with no production equivalent (untouched per hard boundary). `ChatLauncher` remains mounted and visible; it will render its error state when used on the deployed Pages site. This is user-accepted, not a regression. The future path to fix it, if desired, is a serverless/Worker proxy in front of the Anthropic API — explicitly out of scope for this task.
- **GitHub Pages serves `404.html` with an HTTP 404 status code.** Deep links (e.g. a hard refresh on `/novus-uat-local/app/reports`) will boot and render the SPA correctly, but the network response status stays 404. Cosmetic only — does not affect the client-side Pendo agent. Not attempted to be worked around (Pages has no rewrite mechanism).

## User Setup Required

**One manual dashboard step required — see plan frontmatter `user_setup`.** After merge to `main`:
1. `github.com/colingm/novus-uat-local` -> Settings -> Pages -> Build and deployment -> Source: set to **"GitHub Actions"**. `actions/deploy-pages` will fail silently (green run, nothing published) if this is still "Deploy from a branch."
2. Confirm the repo is **Public** — project Pages on a private repo requires a paid GitHub plan.

Neither step can be performed by the executor (no CLI/API path from within this environment).

## Next Phase Readiness

- The build/router/workflow changes are complete and independently verified; the only remaining step is the manual Pages-source dashboard toggle plus a first real push to `main` to observe a live Actions run.
- Human follow-up checklist after that push (from the plan's `<human-check>`): confirm the Actions run goes green with a `github-pages` environment URL; load `https://colingm.github.io/novus-uat-local/` and confirm the landing page + logo render; sign up and hard-refresh on `/novus-uat-local/app/reports` to confirm the 404 fallback boots the SPA; confirm the chat launcher is visible and fails as expected (not a regression).

## Self-Check: PASSED

All created/modified files confirmed on disk (`.github/workflows/deploy-pages.yml`, `vite.config.ts`, `src/router.tsx`); all three task commits (`ea425fb`, `5696a9c`, `81fea4d`) confirmed in `git log`.

---
*Phase: quick-260825-cn1*
*Completed: 2026-08-25*

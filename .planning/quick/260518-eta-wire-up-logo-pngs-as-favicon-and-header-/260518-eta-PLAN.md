---
phase: quick-260518-eta
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/favicon.png
  - public/halo-logo.png
  - index.html
  - src/routes/app/AppLayout.tsx
  - src/routes/public/Landing.tsx
  - full-logo.png
  - small-logo.png
autonomous: true
requirements:
  - QUICK-LOGO-01
must_haves:
  truths:
    - "Browser tab shows the Halo favicon (small-logo PNG), not the Vite logo"
    - "Authenticated app header (AppShell.Header) renders the full Halo logo image instead of the 'Halo' text title"
    - "Public landing page (/) renders the full Halo logo image instead of the 'Halo' Title"
    - "Pendo guide targeting on the header logo continues to work (the same data-pendo-id value resolves to a single DOM element)"
    - "The two logo PNGs live under public/ and are no longer present at the repo root"
  artifacts:
    - path: "public/favicon.png"
      provides: "Favicon source (square Halo icon)"
    - path: "public/halo-logo.png"
      provides: "Full horizontal Halo lockup, used in app header and landing page"
    - path: "index.html"
      provides: "<link rel=\"icon\"> pointing at /favicon.png"
      contains: "/favicon.png"
    - path: "src/routes/app/AppLayout.tsx"
      provides: "Header logo <img> with preserved data-pendo-id={PENDO_IDS.topbar.logo}"
      contains: "src=\"/halo-logo.png\""
    - path: "src/routes/public/Landing.tsx"
      provides: "Landing hero logo <img>"
      contains: "src=\"/halo-logo.png\""
  key_links:
    - from: "index.html"
      to: "public/favicon.png"
      via: "<link rel=\"icon\" type=\"image/png\" href=\"/favicon.png\" />"
      pattern: "rel=\"icon\"[^>]*href=\"/favicon\\.png\""
    - from: "src/routes/app/AppLayout.tsx"
      to: "PENDO_IDS.topbar.logo"
      via: "data-pendo-id attribute on the new <img> (or its immediate wrapper)"
      pattern: "data-pendo-id=\\{PENDO_IDS\\.topbar\\.logo\\}"
    - from: "src/routes/app/AppLayout.tsx"
      to: "public/halo-logo.png"
      via: "<img src=\"/halo-logo.png\" alt=\"Halo\" />"
      pattern: "src=\"/halo-logo\\.png\""
    - from: "src/routes/public/Landing.tsx"
      to: "public/halo-logo.png"
      via: "<img src=\"/halo-logo.png\" alt=\"Halo\" />"
      pattern: "src=\"/halo-logo\\.png\""
---

<objective>
Wire up the two existing logo PNGs at the repo root as Halo's favicon and as the
header/landing branding image.

Purpose: Replace placeholder Vite favicon and plain "Halo" text titles with the
actual Halo branding artwork so the demo surface looks intentional. Branding
polish is explicitly called out in CLAUDE.md ("App must look like a real SaaS").

Output:
  - small-logo.png → public/favicon.png (wired into index.html)
  - full-logo.png → public/halo-logo.png (used in AppLayout header + Landing hero)
  - Originals removed from repo root after the move
  - Pendo data-pendo-id={PENDO_IDS.topbar.logo} preserved on the header logo element
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

@index.html
@src/routes/app/AppLayout.tsx
@src/routes/public/Landing.tsx
@src/pendo/PENDO_IDS.ts

<interfaces>
<!-- Key facts the executor needs without re-reading the codebase. -->

From src/pendo/PENDO_IDS.ts:
```typescript
// The header-logo Pendo ID — MUST be preserved on the new <img> element (or a
// wrapping element). String value resolves to 'topbar.logo'.
PENDO_IDS.topbar.logo
```

From src/routes/app/AppLayout.tsx (current header logo block, lines 105-112):
```tsx
<AppShell.Header>
  <Group h="100%" px="md" justify="space-between">
    {/* Left: wordmark aligned to navbar column width */}
    <Box w={208}>
      <Title order={3} c="indigo.7" data-pendo-id={PENDO_IDS.topbar.logo}>
        Halo
      </Title>
    </Box>
```
Header height is 56px (AppShell `header={{ height: 56 }}`), Box wrapper width
must remain `w={208}` for navbar-column alignment.

From src/routes/public/Landing.tsx (current header title, line 17):
```tsx
<Title order={1}>Halo</Title>
```
No Pendo ID currently — none required by task context, but adding a sensible
one (e.g. layout.publicLanding is already present on the wrapper) is fine.

From index.html (current favicon line, line 5):
```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

Vite static-asset convention: anything under `public/` is served from the site
root, so `public/halo-logo.png` is requested as `/halo-logo.png` in markup.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move logo PNGs into public/ and rewire index.html favicon</name>
  <files>public/favicon.png, public/halo-logo.png, index.html, full-logo.png, small-logo.png</files>
  <action>
Move the two logo files from the repo root into `public/` using `git mv` so the
move is recorded as a rename (the files are currently untracked per the
gitStatus snapshot — use `git mv` if git treats them as added; otherwise use
plain `mv`. If `git mv` errors with "not under version control", fall back to
`mv` and then `rm` is unnecessary because the source is gone). Rename in the
move:

  - `small-logo.png` → `public/favicon.png`
  - `full-logo.png`  → `public/halo-logo.png`

After the move, verify with `ls public/` that both new files exist and `ls
full-logo.png small-logo.png` errors (files no longer at root).

Then edit `index.html` and replace the single existing favicon link line:

  Before: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`
  After:  `<link rel="icon" type="image/png" href="/favicon.png" />`

Do NOT add `apple-touch-icon`, `manifest`, or any other resolution variants —
explicitly out of scope per task context. Do NOT modify the `<title>Halo</title>`
line (already correct). Do NOT touch the inline ColorSchemeScript IIFE (lines
8-31) — unrelated to this change.

Leave `/vite.svg` under `public/` alone (still present, just no longer linked).
Removing it is out of scope; the task is wiring the new favicon, not cleaning
up Vite scaffold.
  </action>
  <verify>
    <automated>test -f public/favicon.png && test -f public/halo-logo.png && ! test -f full-logo.png && ! test -f small-logo.png && grep -q 'href="/favicon.png"' index.html && ! grep -q '/vite.svg' index.html</automated>
  </verify>
  <done>Both PNGs exist under public/ with the renamed filenames, both originals are gone from the repo root, and index.html links the new favicon (no remaining reference to /vite.svg).</done>
</task>

<task type="auto">
  <name>Task 2: Replace text titles with the Halo logo image in AppLayout and Landing</name>
  <files>src/routes/app/AppLayout.tsx, src/routes/public/Landing.tsx</files>
  <action>
Edit `src/routes/app/AppLayout.tsx`:

Replace the existing header-left wordmark block:

```tsx
<Box w={208}>
  <Title order={3} c="indigo.7" data-pendo-id={PENDO_IDS.topbar.logo}>
    Halo
  </Title>
</Box>
```

with an Mantine `Image` element (preferred — the file already imports from
`@mantine/core`; add `Image` to the existing named import on line 3-13). The
Box wrapper keeps `w={208}` (navbar-column alignment, called out in task
context). CRITICAL: preserve `data-pendo-id={PENDO_IDS.topbar.logo}` on the
Image element itself so Pendo guide targeting continues to resolve. Mantine's
`Image` forwards arbitrary DOM attributes to the underlying `<img>`.

Sizing: `h={32}` (within the 32–36px range called out by task context, fits
under the 56-px AppShell.Header with comfortable vertical padding). Width
auto by default with Mantine Image when only `h` is set; also pass
`fit="contain"` and `w="auto"` to be explicit so no aspect-ratio surprises.
Set `alt="Halo"` and `src="/halo-logo.png"`.

If `Title` is no longer used in the file after this swap, remove it from the
`@mantine/core` import. If still used elsewhere (it isn't — grep confirms
this is the only `<Title>` in AppLayout.tsx), drop it from the import to
keep the unused-import lint clean.

Resulting block:

```tsx
<Box w={208}>
  <Image
    src="/halo-logo.png"
    alt="Halo"
    h={32}
    w="auto"
    fit="contain"
    data-pendo-id={PENDO_IDS.topbar.logo}
  />
</Box>
```

Then edit `src/routes/public/Landing.tsx`:

Replace `<Title order={1}>Halo</Title>` (line 17) with a Mantine `Image`
displayed at a hero-appropriate size — `h={56}` lands inside the 48–64px
range in task context. Use `src="/halo-logo.png"`, `alt="Halo"`,
`w="auto"`, `fit="contain"`. No Pendo ID required (`layout.publicLanding`
already markers the wrapper at a higher level if anything ever needs it).

Add `Image` to the named import from `@mantine/core` (line 2). If `Title`
becomes unused after the swap, remove it from the import.

Do NOT touch the surrounding `<Stack>`, `<Text>`, or `<Anchor>` elements —
this is a one-line element swap on the wordmark only.
  </action>
  <verify>
    <automated>grep -q 'src="/halo-logo.png"' src/routes/app/AppLayout.tsx && grep -q 'src="/halo-logo.png"' src/routes/public/Landing.tsx && grep -q 'data-pendo-id={PENDO_IDS.topbar.logo}' src/routes/app/AppLayout.tsx && ! grep -E '&lt;Title[^&gt;]*&gt;Halo&lt;/Title&gt;' src/routes/app/AppLayout.tsx src/routes/public/Landing.tsx && npx tsc --noEmit</automated>
  </verify>
  <done>AppLayout renders the full logo as a 32-px-tall Mantine Image with the topbar.logo data-pendo-id preserved; Landing renders the full logo at hero size; both files type-check; no `<Title>Halo</Title>` string remains in either file.</done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `ls public/favicon.png public/halo-logo.png` — both files exist
2. `ls full-logo.png small-logo.png 2>&1 | grep -q "No such file"` — originals gone
3. `grep -n 'href="/favicon.png"' index.html` — favicon wired
4. `grep -n '/vite.svg' index.html` — returns nothing (Vite scaffold favicon link gone)
5. `grep -n 'src="/halo-logo.png"' src/routes/app/AppLayout.tsx src/routes/public/Landing.tsx` — both files reference the logo
6. `grep -n 'data-pendo-id={PENDO_IDS.topbar.logo}' src/routes/app/AppLayout.tsx` — Pendo target preserved
7. `npx tsc --noEmit` — no type errors introduced
8. Manual: `npm run dev` and confirm: browser tab shows Halo icon, `/` landing renders the full logo, `/app` header renders the full logo, header logo has `data-pendo-id="topbar.logo"` in DevTools
</verification>

<success_criteria>
- Favicon in the browser tab is the Halo small-logo, not the Vite SVG
- AppLayout header shows the full Halo logo image at ~32px tall, aligned to the navbar column (Box w={208} preserved)
- Landing page hero shows the full Halo logo image at hero size
- DevTools shows `data-pendo-id="topbar.logo"` on the header logo `<img>` (Mantine Image renders an `<img>` under the hood)
- No occurrences of `vite.svg` remain in `index.html`
- Both source PNGs live under `public/` and not at the repo root
- TypeScript compiles cleanly (`npx tsc --noEmit`)
</success_criteria>

<output>
After completion, create `.planning/quick/260518-eta-wire-up-logo-pngs-as-favicon-and-header-/260518-eta-SUMMARY.md` documenting:
- Final filenames chosen under `public/`
- Pixel sizes used in AppLayout and Landing
- Confirmation that PENDO_IDS.topbar.logo is preserved
- Any deviations from the plan (e.g. if plain `<img>` was used instead of Mantine `<Image>`)
</output>

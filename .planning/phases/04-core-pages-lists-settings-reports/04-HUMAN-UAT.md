---
status: partial
phase: 04-core-pages-lists-settings-reports
source: [04-VERIFICATION.md]
started: 2026-05-15T17:51:06Z
updated: 2026-05-15T17:51:06Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Lists form reset on create-mode reopen (CR-01 fix)
expected: Sign in, navigate to /app/lists. Click "New task" → type "ABC" in Title → submit. Click "New task" again. Form opens with blank Title and default Priority "Medium" — not "ABC". The CR-01 fix (`useEffect + prevOpenedRef` on false→true `opened` transition) is logically correct by inspection; the REVIEW-FIX report explicitly notes this needs a runtime smoke-test before phase sign-off.
result: [pending]

### 2. Checkbox off-toggle restores prior status
expected: Find a task with Status "In Progress". Click its checkbox (becomes Done). Click the checkbox again. Status badge shows "In Progress" (not "To Do"). The `prevStatus` field was captured at →done and read back at off-done via `task.prevStatus ?? 'todo'`. Legacy tasks without `prevStatus` will still fall back to 'todo' per the `?? 'todo'` fallback — that is expected.
result: [pending]

### 3. Settings save persists and top-bar updates instantly
expected: On /app/settings?tab=profile, edit First Name → Save. Observe top-bar name updates immediately. Hard refresh — edited First Name persists. Same test for Workspace tab (Company Name → Save → top bar updates → hard refresh persists).
result: [pending]

### 4. Reset demo data wipes all user data
expected: /app/settings?tab=preferences → "Reset demo data" → confirm. Check DevTools > Application > localStorage. Zero `halo:v1:*` keys with user data remain. `halo:v1:meta` with `seededAt: null` is acceptable (storage envelope boot record, documented in JSDoc). `mantine-color-scheme-value` preserved. Re-registering works fresh.
result: [pending]

### 5. Reports CSV is well-formed
expected: /app/reports with tasks visible → "Export CSV". Downloads `halo-tasks-YYYY-MM-DD.csv` with 6 columns. RFC 4180 quoting correct for fields with commas/quotes. Date columns in YYYY-MM-DD format.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

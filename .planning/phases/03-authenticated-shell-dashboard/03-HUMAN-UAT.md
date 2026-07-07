---
status: partial
phase: 03-authenticated-shell-dashboard
source: [03-VERIFICATION.md]
started: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Sign-out landing destination
expected: After clicking Sign out from the user menu, the user lands directly on the public landing page (/) with no visible flash through /signin
result: [pending]

### 2. SVG-only chart rendering
expected: DevTools Elements panel shows SVG elements (<svg>, <path>, <rect>) for both Dashboard charts; `document.querySelectorAll('canvas').length === 0`
result: [pending]

### 3. SegmentedControl re-filters scope
expected: Switching 7d/30d/90d re-filters Completed-in-range, Completion rate, Avg cycle time, and the area chart. Active tasks, Overdue count, and donut chart remain unchanged.
result: [pending]

### 4. Empty state then seeded state transition
expected: Sign in with a new workspace — Dashboard renders empty state (IconClipboardCheck + "No tasks yet" + "Go to Lists" button) on first frame, then KPI cards and charts populate after seedIfNeeded runs on mount.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

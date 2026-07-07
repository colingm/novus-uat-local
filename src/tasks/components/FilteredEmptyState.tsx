/**
 * Halo Lists — Compact in-table empty state (Phase 4, plan 04-03 Task 1.F).
 *
 * Renders when tasks exist but the active filter combination yields zero
 * rows (D-06). Distinct from `ListsEmptyState` (hero) — compact, no
 * `mih={400}`, no big icon, no heading. The "Clear filters" Anchor resets all
 * three Selects to "All".
 *
 * Markup verbatim from 04-UI-SPEC §"Lists empty states" lines 293-307.
 * `data-pendo-id` lands on the outer Center + the Clear filters Anchor.
 */

import { Center, Stack, Text, Anchor as MantineAnchor } from '@mantine/core'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type FilteredEmptyStateProps = {
  onClearFilters: () => void
}

export function FilteredEmptyState({
  onClearFilters,
}: FilteredEmptyStateProps): React.JSX.Element {
  return (
    <Center py="xl" data-pendo-id={PENDO_IDS.lists.filteredEmpty.container}>
      <Stack align="center" gap="sm">
        <Text c="dimmed">No tasks match these filters.</Text>
        {/*
         * Polymorphic <Anchor component="button"> needs Mantine's polymorphic
         * typing which the Halo Anchor wrapper doesn't currently expose. Use
         * raw Mantine Anchor with explicit `data-pendo-id` — same S3-exception
         * idiom as `<Menu.Item data-pendo-id=...>` / `<Tabs.Tab data-pendo-id=...>`.
         * The value still flows from `PENDO_IDS.*` — no hand-typed string.
         */}
        <MantineAnchor
          component="button"
          type="button"
          size="sm"
          data-pendo-id={PENDO_IDS.lists.filteredEmpty.clearLink}
          onClick={onClearFilters}
        >
          Clear filters
        </MantineAnchor>
      </Stack>
    </Center>
  )
}

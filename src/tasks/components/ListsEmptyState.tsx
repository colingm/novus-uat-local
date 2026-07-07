/**
 * Halo Lists — Hero empty state (Phase 4, plan 04-03 Task 1.E).
 *
 * Renders when `listTasks(workspaceId).length === 0` (LIST-08). Layout mirrors
 * Dashboard.tsx's `EmptyState` (lines 245-261) but with company-name-interpolated
 * body copy + `IconChecklist` + "Create your first task" CTA per 04-UI-SPEC
 * §"Lists empty states" lines 269-287 and §"Copywriting Contract > Empty state
 * copy".
 *
 * Carries `data-pendo-id={PENDO_IDS.lists.emptyState.container}` on the outer
 * <Center> and `PENDO_IDS.lists.emptyState.cta` on the Button — this is the
 * LIST-08 guide-anchor surface.
 */

import { Center, Stack, Title, Text } from '@mantine/core'
import { IconChecklist } from '@tabler/icons-react'
import { Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type ListsEmptyStateProps = {
  workspaceName: string
  onCreateClick: () => void
}

export function ListsEmptyState({
  workspaceName,
  onCreateClick,
}: ListsEmptyStateProps): React.JSX.Element {
  return (
    <Center mih={400} data-pendo-id={PENDO_IDS.lists.emptyState.container}>
      <Stack align="center" gap="md">
        <IconChecklist
          size={64}
          stroke={1.2}
          color="var(--mantine-color-gray-4)"
        />
        <Title order={3}>No tasks yet</Title>
        <Text c="dimmed" ta="center" maw={420}>
          {workspaceName} doesn&apos;t have any tasks yet. Create your first task
          to get started.
        </Text>
        <Button
          variant="filled"
          pendoId={PENDO_IDS.lists.emptyState.cta}
          onClick={onCreateClick}
        >
          Create your first task
        </Button>
      </Stack>
    </Center>
  )
}

import React from 'react'
import { Center, Paper, Stack, Title, Text } from '@mantine/core'
import { PENDO_IDS } from '../pendo/PENDO_IDS'

/**
 * ComingSoonCard — shared placeholder card used by the five Phase 3 placeholder
 * routes (Lists, Reports, Team, Settings, Help). Phase 4/5 replace the body of
 * each route file without touching router.tsx (D-01).
 *
 * The wrapping Paper carries `data-pendo-id={PENDO_IDS.comingSoon.card}` — a
 * single ID covers all five surfaces (D-24) so guide targeting can find any
 * placeholder generically. The icon (per-route) is dimmed gray to keep
 * placeholders visually subordinate to real surfaces.
 */
export type ComingSoonCardProps = {
  featureName: string
  phase: number
  icon: React.ReactNode
  description: string
}

export function ComingSoonCard({
  featureName,
  phase,
  icon,
  description,
}: ComingSoonCardProps): React.JSX.Element {
  return (
    <Center mih={400}>
      <Paper withBorder p="xl" radius="md" data-pendo-id={PENDO_IDS.comingSoon.card}>
        <Stack align="center" gap="md">
          {icon}
          <Title order={3}>{featureName} is coming in Phase {phase}</Title>
          <Text c="dimmed" ta="center" maw={360}>{description}</Text>
        </Stack>
      </Paper>
    </Center>
  )
}

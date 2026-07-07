import React from 'react'
import { Alert } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

/**
 * Persistent demo banner rendered at the top of every public layout page.
 *
 * The literal text "Demo data only — never enter real credentials" is an FND-06
 * requirement — do not alter or abbreviate it.
 *
 * Note: This component intentionally does NOT carry a data-pendo-id attribute.
 * Plan 06 (UI primitives) only wraps interactive components. If Phase 6 wants to
 * instrument the banner, that is a Phase 6 task.
 */
export function DemoBanner(): React.JSX.Element {
  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color="orange"
      variant="filled"
      radius={0}
      style={{ borderRadius: 0 }}
    >
      Demo data only — never enter real credentials
    </Alert>
  )
}

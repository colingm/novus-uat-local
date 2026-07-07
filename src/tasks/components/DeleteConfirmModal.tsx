/**
 * Halo Lists — Delete confirm modal (Phase 4, plan 04-03 Task 1.D).
 *
 * Single canonical destructive flow per LIST-05 + D-11. Triggered from BOTH:
 *
 *   1. Row kebab → "Delete" (TaskTable kebab item).
 *   2. Edit modal footer's left "Delete task" button (which closes the edit
 *      modal first, then asks the parent to open this confirm).
 *
 * Markup verbatim from 04-UI-SPEC §"Delete confirmation modal" lines 399-419:
 *   - Modal size="sm", centered.
 *   - Title: plain string "Delete this task?" passed via Modal's `title` prop
 *     (no nested <Title> JSX — avoids the heading-nesting defect closed by
 *     plan 04-07 UAT 1a).
 *   - Body `Delete "{taskTitle}"? This cannot be undone.` (double-quotes,
 *     no italics).
 *   - Footer: Cancel (variant="default") + Delete task (color="red"
 *     variant="filled").
 *
 * No `data-pendo-id` on the Modal container itself — the wrapped Button
 * pendoIds on the confirm + cancel buttons are sufficient for Pendo guide
 * targeting (per planner discretion: deleteConfirm namespace only ships the
 * two button leaves, no `.container` leaf).
 */

import { Modal, Stack, Text, Group } from '@mantine/core'
import { Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type DeleteConfirmModalProps = {
  opened: boolean
  onClose: () => void
  /** Parent calls `tasksRepo.deleteTask` + toast + refresh, then closes. */
  onConfirm: () => void
  taskTitle: string
}

export function DeleteConfirmModal({
  opened,
  onClose,
  onConfirm,
  taskTitle,
}: DeleteConfirmModalProps): React.JSX.Element {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete this task?"
      size="sm"
      centered
    >
      <Stack gap="lg">
        <Text size="md">Delete &quot;{taskTitle}&quot;? This cannot be undone.</Text>
        <Group justify="flex-end" gap="md">
          <Button
            variant="default"
            type="button"
            pendoId={PENDO_IDS.lists.deleteConfirm.cancel}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="red"
            variant="filled"
            type="button"
            pendoId={PENDO_IDS.lists.deleteConfirm.confirm}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            Delete task
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

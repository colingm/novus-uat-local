/**
 * Halo Reports — Filter bar (Phase 4, plan 04-05 Task 1.A).
 *
 * Three filter controls per UI-SPEC §"Reports page" lines 653-681 + D-19:
 *
 *   - Date range: `<DatePickerInput type='range'>` with `valueFormat='MMM D, YYYY'`,
 *     clearable; default range set by parent (`[nowRef - 30d, nowRef]` per D-22).
 *   - Assignee:   `<Select>` (single-pick), data = `[All, ...workspace-assignees]`,
 *     clearable={false}, w=200.
 *   - Status:     `<MultiSelect>` over `[To do, In progress, Done]`, w=240.
 *
 * Controlled-only — state lives in the parent (`ReportsPage`); this component
 * is a pure render of the three controls. Mirrors the Phase 3 Dashboard
 * SegmentedControl filter idiom (Group of controls above the main surface),
 * extended to three controls + the new `DatePickerInput` and `MultiSelect`
 * primitives wired in plan 04-02.
 *
 * Mantine v9 DatePickerInput `type='range'` returns `[string | null, string | null]`
 * (DateStringValue tuple, YYYY-MM-DD). The parent owns `Date | null` values so
 * the chart and table can do day-arithmetic; the bridge happens inside the
 * onChange handler (string → Date via `new Date(value)`; passthrough null).
 */

import { Group } from '@mantine/core'
import { Select, MultiSelect, DatePickerInput } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { TASK_STATUS_LABELS } from '../tasks/labels'
import { getAssigneeOptions } from '../tasks/assigneeOptions'
import type { TaskStatus } from '../tasks/types'
import type { Visitor } from '../auth/types'

export type ReportsFiltersBarProps = {
  workspaceId: string
  visitor: Visitor
  dateRange: [Date | null, Date | null]
  assignee: string // 'all' or Assignee.id
  statusFilter: TaskStatus[] // subset of TaskStatusEnum.options
  onDateRangeChange: (next: [Date | null, Date | null]) => void
  onAssigneeChange: (next: string) => void
  onStatusChange: (next: TaskStatus[]) => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: TASK_STATUS_LABELS.todo },
  { value: 'in_progress', label: TASK_STATUS_LABELS.in_progress },
  { value: 'done', label: TASK_STATUS_LABELS.done },
]

export function ReportsFiltersBar({
  workspaceId,
  visitor,
  dateRange,
  assignee,
  statusFilter,
  onDateRangeChange,
  onAssigneeChange,
  onStatusChange,
}: ReportsFiltersBarProps): React.JSX.Element {
  const assigneeOptions = [
    { value: 'all', label: 'All' },
    ...getAssigneeOptions(workspaceId, visitor),
  ]

  // Mantine v9 DatePickerInput type='range' returns DateStringValue tuple
  // ([string | null, string | null], YYYY-MM-DD). Convert to [Date | null, Date | null]
  // for the parent which does day-arithmetic on the chart and table.
  const dateRangeValue: [string | null, string | null] = [
    dateRange[0] ? formatYmd(dateRange[0]) : null,
    dateRange[1] ? formatYmd(dateRange[1]) : null,
  ]

  const handleDateRangeChange = (value: [string | null, string | null]) => {
    const next: [Date | null, Date | null] = [
      value[0] ? new Date(value[0]) : null,
      value[1] ? new Date(value[1]) : null,
    ]
    onDateRangeChange(next)
  }

  return (
    <Group gap="md" align="flex-end">
      <DatePickerInput
        type="range"
        label="Date range"
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        valueFormat="MMM D, YYYY"
        clearable
        pendoId={PENDO_IDS.reports.filter.dateRange}
      />
      <Select
        label="Assignee"
        value={assignee}
        onChange={(v) => onAssigneeChange(v ?? 'all')}
        data={assigneeOptions}
        clearable={false}
        w={200}
        pendoId={PENDO_IDS.reports.filter.assignee}
      />
      <MultiSelect
        label="Status"
        value={statusFilter}
        onChange={(v) => onStatusChange(v as TaskStatus[])}
        data={STATUS_OPTIONS}
        w={240}
        pendoId={PENDO_IDS.reports.filter.status}
      />
    </Group>
  )
}

/** Format a Date as YYYY-MM-DD (local) for the DatePickerInput controlled value. */
function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

import type { ReactNode } from 'react'

import { PRIORITY_LABELS, STATUS_LABELS, UNASSIGNED } from '@/lib/tickets'
import type { Person } from '@/types/person'
import { TICKET_PRIORITIES, TICKET_STATUSES, type TicketPriority, type TicketStatus } from '@/types/ticket'

import { AssigneeAvatar, PriorityIcon, StatusIcon } from './components/TicketIcons'

export type PropertyOption<T extends string> = { value: T; label: string; icon: ReactNode }

export const STATUS_OPTIONS: PropertyOption<TicketStatus>[] = TICKET_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
  icon: <StatusIcon status={status} />,
}))

export const PRIORITY_OPTIONS: PropertyOption<TicketPriority>[] = TICKET_PRIORITIES.map((priority) => ({
  value: priority,
  label: PRIORITY_LABELS[priority],
  icon: <PriorityIcon priority={priority} />,
}))

/** "Unassigned" first, then every teammate from the directory. */
export function assigneeOptions(people: readonly Person[]): PropertyOption<string>[] {
  return [
    { value: UNASSIGNED, label: 'Unassigned', icon: <AssigneeAvatar person={undefined} /> },
    ...people.map((person) => ({ value: person.id, label: person.name, icon: <AssigneeAvatar person={person} /> })),
  ]
}

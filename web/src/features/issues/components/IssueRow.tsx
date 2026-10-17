import { findAssignee, UNASSIGNED } from '@/lib/tickets'
import type { Person } from '@/types/person'
import type { Ticket, TicketPatch } from '@/types/ticket'

import { assigneeOptions, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../property-options'
import { PropertyMenu } from './PropertyMenu'
import { AssigneeAvatar, PriorityIcon, StatusIcon } from './TicketIcons'

type IssueRowProps = {
  ticket: Ticket
  people: readonly Person[]
  onOpen: (id: string) => void
  onUpdate: (id: string, patch: TicketPatch) => void
}

export function IssueRow({ ticket, people, onOpen, onUpdate }: IssueRowProps) {
  const assignee = findAssignee(people, ticket.assigneeId)

  return (
    <li className="flex items-center gap-1 px-1 py-1 sm:px-2">
      <PropertyMenu
        label="Priority"
        value={ticket.priority}
        options={PRIORITY_OPTIONS}
        onChange={(priority) => onUpdate(ticket.id, { priority })}
        trigger={<PriorityIcon priority={ticket.priority} />}
      />
      <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{ticket.id}</span>
      <PropertyMenu
        label="Status"
        value={ticket.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onUpdate(ticket.id, { status })}
        trigger={<StatusIcon status={ticket.status} />}
      />
      <button
        type="button"
        onClick={() => onOpen(ticket.id)}
        className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* Two lines on phones, where one line cut most titles to a few words. */}
        <span className="line-clamp-2 break-words sm:line-clamp-1">{ticket.title}</span>
      </button>
      <PropertyMenu
        label="Assignee"
        value={assignee?.id ?? UNASSIGNED}
        options={assigneeOptions(people)}
        onChange={(value) => onUpdate(ticket.id, { assigneeId: value === UNASSIGNED ? null : value })}
        trigger={<AssigneeAvatar person={assignee} />}
      />
    </li>
  )
}

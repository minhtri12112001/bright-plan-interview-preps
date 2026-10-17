import { useId } from 'react'

import { STATUS_LABELS } from '@/lib/tickets'
import type { Person } from '@/types/person'
import type { Ticket, TicketPatch, TicketStatus } from '@/types/ticket'

import { IssueRow } from './IssueRow'
import { StatusIcon } from './TicketIcons'

type IssueGroupProps = {
  status: TicketStatus
  tickets: readonly Ticket[]
  people: readonly Person[]
  onOpen: (id: string) => void
  onUpdate: (id: string, patch: TicketPatch) => void
}

export function IssueGroup({ status, tickets, people, onOpen, onUpdate }: IssueGroupProps) {
  const headingId = useId()
  const label = STATUS_LABELS[status]

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1">
      <h2 id={headingId} className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-sm font-medium">
        <StatusIcon status={status} />
        {label}
        <span className="font-normal text-muted-foreground">{tickets.length}</span>
      </h2>
      <ul aria-label={`${label} issues`} className="divide-y">
        {tickets.map((ticket) => (
          <IssueRow key={ticket.id} ticket={ticket} people={people} onOpen={onOpen} onUpdate={onUpdate} />
        ))}
      </ul>
    </section>
  )
}

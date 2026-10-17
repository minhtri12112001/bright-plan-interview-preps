/** Workflow order, used by menus and selects. */
export const TICKET_STATUSES = ['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

/** Menu order, as in Linear: "No priority" first. Sorting uses a separate rank. */
export const TICKET_PRIORITIES = ['none', 'urgent', 'high', 'medium', 'low'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export type Ticket = {
  /** "ENG-7". Unique, so it doubles as the React key. */
  id: string
  /** Never reused, even after a delete. */
  number: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  /** A Person['id'] from the team directory, or null when unassigned. */
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}

/** Fields a user can set. Only the title is required when creating. */
export type TicketFields = Pick<Ticket, 'title' | 'description' | 'status' | 'priority' | 'assigneeId'>
export type TicketInput = Pick<TicketFields, 'title'> & Partial<TicketFields>
export type TicketPatch = Partial<TicketFields>

/** 'all', 'unassigned' or a person id. */
export type AssigneeFilter = 'all' | 'unassigned' | (string & {})

export type TicketFilters = {
  /** Raw input value, like the directory query. */
  query: string
  assignee: AssigneeFilter
}

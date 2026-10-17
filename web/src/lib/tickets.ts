import { normalizeText } from '@/lib/text'
import type { Person } from '@/types/person'
import type {
  Ticket,
  TicketFields,
  TicketFilters,
  TicketInput,
  TicketPatch,
  TicketPriority,
  TicketStatus,
} from '@/types/ticket'

export const TEAM_KEY = 'ENG'
export const MAX_TITLE_LENGTH = 120
/** Menu and filter value for "no assignee". Person ids look like "p-1", so they can't collide. */
export const UNASSIGNED = 'unassigned'

export const STATUS_LABELS: Record<TicketStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  none: 'No priority',
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Group order on the page: active work first, closed work last. */
export const STATUS_DISPLAY_ORDER: readonly TicketStatus[] = [
  'in_progress',
  'todo',
  'backlog',
  'done',
  'canceled',
]

const PRIORITY_RANK: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
}

export function formatTicketId(number: number): string {
  return `${TEAM_KEY}-${number}`
}

/** Returns an error message, or null when the title is valid. */
export function validateTicketTitle(title: string): string | null {
  const trimmed = title.trim()
  if (trimmed === '') return 'Title is required'
  if (trimmed.length > MAX_TITLE_LENGTH) return `Title must be ${MAX_TITLE_LENGTH} characters or fewer`
  return null
}

function assertValidTitle(title: string): void {
  const error = validateTicketTitle(title)
  if (error !== null) throw new Error(error)
}

export function buildTicket(input: TicketInput, options: { number: number; now: Date }): Ticket {
  assertValidTitle(input.title)
  const timestamp = options.now.toISOString()
  return {
    id: formatTicketId(options.number),
    number: options.number,
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    status: input.status ?? 'todo',
    priority: input.priority ?? 'none',
    assigneeId: input.assigneeId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** The user-editable fields only, e.g. to prefill the edit form without leaking id or timestamps into a patch. */
export function pickTicketFields(ticket: Ticket): TicketFields {
  const { title, description, status, priority, assigneeId } = ticket
  return { title, description, status, priority, assigneeId }
}

/** Returns the same object when the patch changes nothing, so callers can skip a store update. */
export function applyTicketPatch(ticket: Ticket, patch: TicketPatch, now: Date): Ticket {
  if (patch.title !== undefined) assertValidTitle(patch.title)

  // `{ status: undefined }` means "leave it", not "clear it".
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as TicketPatch
  const next: Ticket = {
    ...ticket,
    ...defined,
    title: defined.title?.trim() ?? ticket.title,
    description: defined.description?.trim() ?? ticket.description,
  }
  const changed = (Object.keys(defined) as (keyof TicketPatch)[]).some((key) => next[key] !== ticket[key])
  return changed ? { ...next, updatedAt: now.toISOString() } : ticket
}

export function filterTickets(tickets: readonly Ticket[], filters: TicketFilters): Ticket[] {
  const needle = normalizeText(filters.query)
  return tickets.filter((ticket) => {
    if (filters.assignee === UNASSIGNED && ticket.assigneeId !== null) return false
    if (filters.assignee !== 'all' && filters.assignee !== UNASSIGNED && ticket.assigneeId !== filters.assignee) {
      return false
    }
    if (needle === '') return true
    return normalizeText(ticket.title).includes(needle) || normalizeText(ticket.id).includes(needle)
  })
}

/** Urgent → High → Medium → Low → No priority, then newest first. */
export function sortTickets(tickets: readonly Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.number - a.number,
  )
}

export type TicketGroup = { status: TicketStatus; tickets: Ticket[] }

/** Every status, in display order, even when empty. */
export function groupTicketsByStatus(tickets: readonly Ticket[]): TicketGroup[] {
  return STATUS_DISPLAY_ORDER.map((status) => ({
    status,
    tickets: tickets.filter((ticket) => ticket.status === status),
  }))
}

export function findAssignee(people: readonly Person[], assigneeId: string | null): Person | undefined {
  if (assigneeId === null) return undefined
  return people.find((person) => person.id === assigneeId)
}

export function hasActiveFilters(filters: TicketFilters): boolean {
  return filters.query.trim() !== '' || filters.assignee !== 'all'
}

/** "1 issue" / "3 issues". */
export function formatIssueCount(count: number): string {
  return `${count} ${count === 1 ? 'issue' : 'issues'}`
}

const SHORTCUT_BLOCKERS = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="menu"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
].join(', ')

/** True when a single-key shortcut would get in the way of typing or of an open menu or dialog. */
export function shouldIgnoreShortcut(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(SHORTCUT_BLOCKERS) !== null
}

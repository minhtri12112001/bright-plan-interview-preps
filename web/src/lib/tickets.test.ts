import { describe, expect, it } from 'vitest'

import { PEOPLE } from '@/data/people'
import { SEED_TICKETS } from '@/data/tickets'
import type { Ticket, TicketFilters } from '@/types/ticket'

import {
  applyTicketPatch,
  buildTicket,
  filterTickets,
  findAssignee,
  formatIssueCount,
  formatTicketId,
  groupTicketsByStatus,
  hasActiveFilters,
  MAX_TITLE_LENGTH,
  pickTicketFields,
  shouldIgnoreShortcut,
  sortTickets,
  STATUS_DISPLAY_ORDER,
  UNASSIGNED,
  validateTicketTitle,
} from './tickets'

const NOW = new Date('2026-10-17T12:00:00.000Z')
const LATER = new Date('2026-10-18T08:30:00.000Z')

function ticket(overrides: Partial<Ticket> & Pick<Ticket, 'number'>): Ticket {
  return {
    id: formatTicketId(overrides.number),
    title: `Issue ${overrides.number}`,
    description: '',
    status: 'todo',
    priority: 'none',
    assigneeId: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

const filters = (overrides: Partial<TicketFilters> = {}): TicketFilters => ({ query: '', assignee: 'all', ...overrides })
const ids = (tickets: readonly Ticket[]) => tickets.map((t) => t.id)

describe('formatTicketId', () => {
  it('prefixes the number with the team key', () => {
    expect(formatTicketId(1)).toBe('ENG-1')
    expect(formatTicketId(42)).toBe('ENG-42')
  })
})

describe('validateTicketTitle (T1)', () => {
  it.each(['', '   ', '\n\t'])('requires a title (%j)', (title) => {
    expect(validateTicketTitle(title)).toBe('Title is required')
  })

  it('accepts a title at the length limit, counting the trimmed value', () => {
    expect(validateTicketTitle('a'.repeat(MAX_TITLE_LENGTH))).toBeNull()
    expect(validateTicketTitle(`  ${'a'.repeat(MAX_TITLE_LENGTH)}  `)).toBeNull()
  })

  it('rejects a title over the limit', () => {
    expect(validateTicketTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).toBe('Title must be 120 characters or fewer')
  })
})

describe('buildTicket (T2)', () => {
  it('fills in defaults: Todo, no priority, unassigned, empty description', () => {
    expect(buildTicket({ title: 'Fix login' }, { number: 8, now: NOW })).toEqual({
      id: 'ENG-8',
      number: 8,
      title: 'Fix login',
      description: '',
      status: 'todo',
      priority: 'none',
      assigneeId: null,
      createdAt: '2026-10-17T12:00:00.000Z',
      updatedAt: '2026-10-17T12:00:00.000Z',
    })
  })

  it('keeps the given fields and trims title and description', () => {
    const created = buildTicket(
      { title: '  Fix login  ', description: '  Steps to reproduce  ', status: 'in_progress', priority: 'high', assigneeId: 'p-4' },
      { number: 9, now: NOW },
    )

    expect(created).toMatchObject({
      title: 'Fix login',
      description: 'Steps to reproduce',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'p-4',
    })
  })

  it('throws on an invalid title instead of creating a broken issue', () => {
    expect(() => buildTicket({ title: '   ' }, { number: 1, now: NOW })).toThrow('Title is required')
  })
})

describe('applyTicketPatch (T3)', () => {
  const original = ticket({ number: 1, title: 'Old title' })

  it('applies the patch and bumps updatedAt, leaving createdAt alone', () => {
    const updated = applyTicketPatch(original, { status: 'done', assigneeId: 'p-2' }, LATER)

    expect(updated).toMatchObject({ status: 'done', assigneeId: 'p-2', title: 'Old title' })
    expect(updated.updatedAt).toBe(LATER.toISOString())
    expect(updated.createdAt).toBe(original.createdAt)
  })

  it('trims an edited title and description', () => {
    const updated = applyTicketPatch(original, { title: '  New title ', description: ' notes ' }, LATER)
    expect(updated.title).toBe('New title')
    expect(updated.description).toBe('notes')
  })

  it('can unassign by setting assigneeId to null', () => {
    const assigned = ticket({ number: 2, assigneeId: 'p-1' })
    expect(applyTicketPatch(assigned, { assigneeId: null }, LATER).assigneeId).toBeNull()
  })

  it('treats an undefined field as "leave it", not "clear it"', () => {
    const updated = applyTicketPatch(original, { status: undefined, priority: 'low' }, LATER)
    expect(updated.status).toBe('todo')
    expect(updated.priority).toBe('low')
  })

  it('returns the same object when nothing changes', () => {
    expect(applyTicketPatch(original, {}, LATER)).toBe(original)
    expect(applyTicketPatch(original, { status: 'todo', title: ' Old title ' }, LATER)).toBe(original)
    expect(applyTicketPatch(original, pickTicketFields(original), LATER)).toBe(original)
  })

  it('never mutates the original', () => {
    const snapshot = structuredClone(original)
    applyTicketPatch(original, { title: 'Changed', status: 'done' }, LATER)
    expect(original).toEqual(snapshot)
  })

  it('rejects a blank title', () => {
    expect(() => applyTicketPatch(original, { title: '  ' }, LATER)).toThrow('Title is required')
  })
})

describe('pickTicketFields', () => {
  it('keeps only the user-editable fields', () => {
    expect(pickTicketFields(SEED_TICKETS[0])).toEqual({
      title: SEED_TICKETS[0].title,
      description: SEED_TICKETS[0].description,
      status: SEED_TICKETS[0].status,
      priority: SEED_TICKETS[0].priority,
      assigneeId: SEED_TICKETS[0].assigneeId,
    })
  })
})

describe('filterTickets (T4)', () => {
  const tickets = [
    ticket({ number: 1, title: 'Fix login button', assigneeId: 'p-1' }),
    ticket({ number: 2, title: 'Đổi màu nút', assigneeId: 'p-5' }),
    ticket({ number: 12, title: 'Write release notes', assigneeId: null }),
  ]

  it('returns everything with no filters', () => {
    expect(ids(filterTickets(tickets, filters()))).toEqual(['ENG-1', 'ENG-2', 'ENG-12'])
  })

  it('matches the title, ignoring case and surrounding whitespace', () => {
    expect(ids(filterTickets(tickets, filters({ query: '  LOGIN ' })))).toEqual(['ENG-1'])
  })

  it('matches the title ignoring diacritics, including đ', () => {
    expect(ids(filterTickets(tickets, filters({ query: 'doi mau' })))).toEqual(['ENG-2'])
  })

  it('matches the id, so "eng-12" and "12" find ENG-12', () => {
    expect(ids(filterTickets(tickets, filters({ query: 'eng-12' })))).toEqual(['ENG-12'])
    expect(ids(filterTickets(tickets, filters({ query: '12' })))).toEqual(['ENG-12'])
  })

  it('returns [] when nothing matches', () => {
    expect(filterTickets(tickets, filters({ query: 'xyz' }))).toEqual([])
  })

  it('filters to unassigned issues', () => {
    expect(ids(filterTickets(tickets, filters({ assignee: UNASSIGNED })))).toEqual(['ENG-12'])
  })

  it.each(PEOPLE.map((person) => [person.name, person.id]))('filters to one teammate: %s', (_name, personId) => {
    const assigned = PEOPLE.map((person, index) => ticket({ number: index + 1, assigneeId: person.id }))

    const result = filterTickets(assigned, filters({ assignee: personId }))

    expect(result).toHaveLength(1)
    expect(result[0].assigneeId).toBe(personId)
  })

  it('combines the query and the assignee (both must match)', () => {
    expect(ids(filterTickets(tickets, filters({ query: 'fix', assignee: 'p-1' })))).toEqual(['ENG-1'])
    expect(filterTickets(tickets, filters({ query: 'fix', assignee: 'p-5' }))).toEqual([])
  })

  it('does not mutate the input', () => {
    const snapshot = structuredClone(tickets)
    filterTickets(tickets, filters({ query: 'fix' }))
    expect(tickets).toEqual(snapshot)
  })
})

describe('sortTickets (T5)', () => {
  it('orders by priority: Urgent, High, Medium, Low, then No priority', () => {
    const tickets = [
      ticket({ number: 1, priority: 'none' }),
      ticket({ number: 2, priority: 'low' }),
      ticket({ number: 3, priority: 'urgent' }),
      ticket({ number: 4, priority: 'medium' }),
      ticket({ number: 5, priority: 'high' }),
    ]
    expect(sortTickets(tickets).map((t) => t.priority)).toEqual(['urgent', 'high', 'medium', 'low', 'none'])
  })

  it('puts newer issues first within the same priority', () => {
    const tickets = [ticket({ number: 1, priority: 'high' }), ticket({ number: 3, priority: 'high' }), ticket({ number: 2, priority: 'high' })]
    expect(ids(sortTickets(tickets))).toEqual(['ENG-3', 'ENG-2', 'ENG-1'])
  })

  it('returns a new array and leaves the input order alone', () => {
    const tickets = [ticket({ number: 1, priority: 'low' }), ticket({ number: 2, priority: 'urgent' })]
    const sorted = sortTickets(tickets)
    expect(sorted).not.toBe(tickets)
    expect(ids(tickets)).toEqual(['ENG-1', 'ENG-2'])
  })
})

describe('groupTicketsByStatus (T6)', () => {
  it('returns every status in display order, even when empty', () => {
    expect(groupTicketsByStatus([]).map((group) => group.status)).toEqual([
      'in_progress',
      'todo',
      'backlog',
      'done',
      'canceled',
    ])
    expect(groupTicketsByStatus([]).every((group) => group.tickets.length === 0)).toBe(true)
  })

  it('puts each issue in its status group and keeps the order inside a group', () => {
    const tickets = [
      ticket({ number: 3, status: 'done' }),
      ticket({ number: 1, status: 'todo' }),
      ticket({ number: 2, status: 'done' }),
    ]
    const groups = groupTicketsByStatus(tickets)
    const byStatus = Object.fromEntries(groups.map((group) => [group.status, ids(group.tickets)]))

    expect(byStatus).toMatchObject({ todo: ['ENG-1'], done: ['ENG-3', 'ENG-2'], backlog: [] })
  })

  it('covers every status the app knows about', () => {
    expect(STATUS_DISPLAY_ORDER).toHaveLength(5)
    expect(new Set(STATUS_DISPLAY_ORDER).size).toBe(5)
  })
})

describe('findAssignee (T7)', () => {
  it.each(PEOPLE)('finds $name by id', (person) => {
    expect(findAssignee(PEOPLE, person.id)).toBe(person)
  })

  it('returns undefined for null or an id that is not on the team', () => {
    expect(findAssignee(PEOPLE, null)).toBeUndefined()
    expect(findAssignee(PEOPLE, 'p-999')).toBeUndefined()
  })
})

describe('hasActiveFilters', () => {
  it('is false for the default filters and a whitespace-only query', () => {
    expect(hasActiveFilters(filters())).toBe(false)
    expect(hasActiveFilters(filters({ query: '   ' }))).toBe(false)
  })

  it('is true for a query or an assignee filter', () => {
    expect(hasActiveFilters(filters({ query: 'x' }))).toBe(true)
    expect(hasActiveFilters(filters({ assignee: UNASSIGNED }))).toBe(true)
    expect(hasActiveFilters(filters({ assignee: 'p-1' }))).toBe(true)
  })
})

describe('formatIssueCount (T8)', () => {
  it.each([
    [0, '0 issues'],
    [1, '1 issue'],
    [7, '7 issues'],
  ])('%i -> %s', (count, expected) => {
    expect(formatIssueCount(count)).toBe(expected)
  })
})

describe('shouldIgnoreShortcut (T9)', () => {
  function mount(html: string): HTMLElement {
    document.body.innerHTML = html
    return document.querySelector<HTMLElement>('[data-target]')!
  }

  it.each([
    ['an input', '<input data-target />'],
    ['a textarea', '<textarea data-target></textarea>'],
    ['a select', '<select data-target></select>'],
    ['a contenteditable element', '<div contenteditable="true"><span data-target>x</span></div>'],
    ['an open menu', '<div role="menu"><div role="menuitem" data-target>Done</div></div>'],
    ['a dialog', '<div role="dialog"><button data-target>OK</button></div>'],
    ['an alert dialog', '<div role="alertdialog"><button data-target>Delete</button></div>'],
  ])('ignores the shortcut inside %s', (_label, html) => {
    expect(shouldIgnoreShortcut(mount(html))).toBe(true)
  })

  it.each([
    ['the body', null],
    ['a plain button', '<button data-target>New issue</button>'],
    ['contenteditable="false"', '<div contenteditable="false"><span data-target>x</span></div>'],
  ])('allows the shortcut on %s', (_label, html) => {
    const target = html === null ? document.body : mount(html)
    expect(shouldIgnoreShortcut(target)).toBe(false)
  })

  it('allows the shortcut when the target is not an element', () => {
    expect(shouldIgnoreShortcut(null)).toBe(false)
    expect(shouldIgnoreShortcut(window)).toBe(false)
  })
})

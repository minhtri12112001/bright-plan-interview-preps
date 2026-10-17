import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PEOPLE } from '@/data/people'
import { SEED_TICKETS } from '@/data/tickets'

import { initialTicketState, TICKET_STORAGE_KEY, useTicketStore, useVisibleTickets } from './ticket-store'

const store = () => useTicketStore.getState()
const stored = () => JSON.parse(localStorage.getItem(TICKET_STORAGE_KEY) ?? 'null')

beforeEach(() => {
  localStorage.clear()
  useTicketStore.setState(initialTicketState)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-17T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ticket store', () => {
  it('starts with the seed issues, next number after them, and no filters', () => {
    expect(store().tickets).toBe(SEED_TICKETS)
    expect(store().nextNumber).toBe(SEED_TICKETS.length + 1)
    expect(store().filters).toEqual({ query: '', assignee: 'all' })
  })

  it('seed issues cover every teammate, every status and an unassigned issue', () => {
    const assignees = new Set(SEED_TICKETS.map((t) => t.assigneeId))
    for (const person of PEOPLE) expect(assignees).toContain(person.id)
    expect(assignees).toContain(null)
    expect(new Set(SEED_TICKETS.map((t) => t.status)).size).toBe(5)
    expect(new Set(SEED_TICKETS.map((t) => t.id)).size).toBe(SEED_TICKETS.length)
  })

  describe('createTicket', () => {
    it('adds an issue with the next number and returns it', () => {
      const created = store().createTicket({ title: 'Fix login', assigneeId: 'p-4' })

      expect(created).toMatchObject({ id: 'ENG-8', number: 8, title: 'Fix login', assigneeId: 'p-4' })
      expect(created.createdAt).toBe('2026-10-17T12:00:00.000Z')
      expect(store().tickets.at(-1)).toBe(created)
      expect(store().nextNumber).toBe(9)
    })

    it('never reuses a number after a delete', () => {
      const first = store().createTicket({ title: 'First' })
      store().deleteTicket(first.id)
      const second = store().createTicket({ title: 'Second' })

      expect(second.id).toBe('ENG-9')
      expect(store().tickets.some((t) => t.id === first.id)).toBe(false)
    })

    it('throws on a blank title and leaves the state unchanged', () => {
      const before = store()
      expect(() => store().createTicket({ title: '  ' })).toThrow('Title is required')
      expect(store().tickets).toBe(before.tickets)
      expect(store().nextNumber).toBe(before.nextNumber)
    })

    it.each(PEOPLE)('can assign a new issue to $name', (person) => {
      const created = store().createTicket({ title: `For ${person.name}`, assigneeId: person.id })
      expect(store().tickets.find((t) => t.id === created.id)?.assigneeId).toBe(person.id)
    })
  })

  describe('updateTicket', () => {
    it('patches one issue and bumps its updatedAt', () => {
      vi.setSystemTime(new Date('2026-10-18T09:00:00.000Z'))

      store().updateTicket('ENG-4', { status: 'in_progress', assigneeId: null })

      const updated = store().tickets.find((t) => t.id === 'ENG-4')
      expect(updated).toMatchObject({ status: 'in_progress', assigneeId: null, updatedAt: '2026-10-18T09:00:00.000Z' })
      // Other issues keep their identity, so their rows don't re-render.
      expect(store().tickets.find((t) => t.id === 'ENG-1')).toBe(SEED_TICKETS[0])
    })

    it('keeps the same state when nothing changes', () => {
      const before = store().tickets
      store().updateTicket('ENG-4', { status: 'todo' })
      store().updateTicket('ENG-404', { status: 'done' })
      expect(store().tickets).toBe(before)
    })
  })

  describe('deleteTicket', () => {
    it('removes only that issue', () => {
      store().deleteTicket('ENG-3')
      expect(store().tickets.map((t) => t.id)).toEqual(['ENG-1', 'ENG-2', 'ENG-4', 'ENG-5', 'ENG-6', 'ENG-7'])
    })
  })

  describe('filters', () => {
    it('sets the raw query, sets the assignee, and resets both', () => {
      store().setQuery('  Expo ')
      store().setAssigneeFilter('p-4')
      expect(store().filters).toEqual({ query: '  Expo ', assignee: 'p-4' })

      store().resetFilters()
      expect(store().filters).toEqual({ query: '', assignee: 'all' })
    })
  })

  describe('persistence', () => {
    it('saves issues and the next number to localStorage, but not the filters', () => {
      store().createTicket({ title: 'Saved' })
      store().setQuery('saved')

      const { state, version } = stored()
      expect(version).toBe(1)
      expect(Object.keys(state).sort()).toEqual(['nextNumber', 'tickets'])
      expect(state.nextNumber).toBe(9)
      expect(state.tickets.at(-1)).toMatchObject({ id: 'ENG-8', title: 'Saved' })
    })

    it('restores saved issues on rehydrate', async () => {
      const saved = { ...SEED_TICKETS[0], id: 'ENG-20', number: 20, title: 'From storage' }
      localStorage.setItem(
        TICKET_STORAGE_KEY,
        JSON.stringify({ state: { tickets: [saved], nextNumber: 21 }, version: 1 }),
      )

      await useTicketStore.persist.rehydrate()

      expect(store().tickets).toEqual([saved])
      expect(store().nextNumber).toBe(21)
      expect(store().filters).toEqual({ query: '', assignee: 'all' })
    })
  })
})

describe('useVisibleTickets', () => {
  it('groups the seed issues by status in display order, skipping nothing that has issues', () => {
    const { result } = renderHook(() => useVisibleTickets())

    expect(result.current.count).toBe(7)
    expect(result.current.groups.map((g) => g.status)).toEqual(['in_progress', 'todo', 'backlog', 'done', 'canceled'])
    // Backlog: ENG-5 (low) before ENG-6 (no priority)
    expect(result.current.groups[2].tickets.map((t) => t.id)).toEqual(['ENG-5', 'ENG-6'])
  })

  it('drops empty groups once filtered', () => {
    const { result } = renderHook(() => useVisibleTickets())

    act(() => store().setAssigneeFilter('p-2'))

    expect(result.current.count).toBe(2)
    expect(result.current.groups.map((g) => g.status)).toEqual(['done', 'canceled'])
  })

  it('keeps the same reference across re-renders when nothing changed', () => {
    const { result, rerender } = renderHook(() => useVisibleTickets())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

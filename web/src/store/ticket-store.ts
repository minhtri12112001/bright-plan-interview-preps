import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SEED_TICKETS } from '@/data/tickets'
import {
  applyTicketPatch,
  buildTicket,
  filterTickets,
  groupTicketsByStatus,
  sortTickets,
  type TicketGroup,
} from '@/lib/tickets'
import type { AssigneeFilter, Ticket, TicketFilters, TicketInput, TicketPatch } from '@/types/ticket'

export const TICKET_STORAGE_KEY = 'team-directory.issues'

type TicketState = {
  tickets: Ticket[]
  /** Only goes up, so a deleted issue's id is never handed out again. */
  nextNumber: number
  filters: TicketFilters
}

type TicketActions = {
  createTicket: (input: TicketInput) => Ticket
  updateTicket: (id: string, patch: TicketPatch) => void
  deleteTicket: (id: string) => void
  setQuery: (query: string) => void
  setAssigneeFilter: (assignee: AssigneeFilter) => void
  resetFilters: () => void
}

export type TicketStore = TicketState & TicketActions

export const initialFilters: TicketFilters = { query: '', assignee: 'all' }

export const initialTicketState: TicketState = {
  tickets: SEED_TICKETS,
  nextNumber: SEED_TICKETS.length + 1,
  filters: initialFilters,
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      ...initialTicketState,
      createTicket: (input) => {
        const ticket = buildTicket(input, { number: get().nextNumber, now: new Date() })
        set((state) => ({ tickets: [...state.tickets, ticket], nextNumber: state.nextNumber + 1 }))
        return ticket
      },
      updateTicket: (id, patch) => {
        const now = new Date()
        set((state) => {
          let changed = false
          const tickets = state.tickets.map((ticket) => {
            if (ticket.id !== id) return ticket
            const next = applyTicketPatch(ticket, patch, now)
            changed = next !== ticket
            return next
          })
          // Returning the same state skips the re-render and the storage write.
          return changed ? { tickets } : state
        })
      },
      deleteTicket: (id) => set((state) => ({ tickets: state.tickets.filter((ticket) => ticket.id !== id) })),
      setQuery: (query) => set((state) => ({ filters: { ...state.filters, query } })),
      setAssigneeFilter: (assignee) => set((state) => ({ filters: { ...state.filters, assignee } })),
      resetFilters: () => set({ filters: initialFilters }),
    }),
    {
      name: TICKET_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Filters are view state; only the data survives a reload.
      partialize: (state) => ({ tickets: state.tickets, nextNumber: state.nextNumber }),
    },
  ),
)

export type VisibleTickets = { groups: TicketGroup[]; count: number }

/** Filtered, sorted and grouped at render time, never stored. Same pattern as useFilteredPeople. */
export function useVisibleTickets(): VisibleTickets {
  const tickets = useTicketStore((state) => state.tickets)
  const filters = useTicketStore((state) => state.filters)
  return useMemo(() => {
    const visible = sortTickets(filterTickets(tickets, filters))
    return {
      groups: groupTicketsByStatus(visible).filter((group) => group.tickets.length > 0),
      count: visible.length,
    }
  }, [tickets, filters])
}

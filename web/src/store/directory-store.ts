import { useMemo } from 'react'
import { create } from 'zustand'

import { PEOPLE } from '@/data/people'
import { filterPeople } from '@/lib/filter-people'
import type { Person } from '@/types/person'

type DirectoryState = {
  people: Person[]
  /** Raw input value. Not trimmed, so the controlled input keeps the cursor where the user left it. */
  query: string
}

type DirectoryActions = {
  setQuery: (query: string) => void
  clearQuery: () => void
}

export type DirectoryStore = DirectoryState & DirectoryActions

export const initialDirectoryState: DirectoryState = {
  people: PEOPLE,
  query: '',
}

export const useDirectoryStore = create<DirectoryStore>()((set) => ({
  ...initialDirectoryState,
  setQuery: (query) => set({ query }),
  clearQuery: () => set({ query: '' }),
}))

/**
 * Filtered list derived at render time. Not computed inside the selector,
 * because a selector that returns a new array each call loops forever under useSyncExternalStore.
 */
export function useFilteredPeople(): Person[] {
  const people = useDirectoryStore((state) => state.people)
  const query = useDirectoryStore((state) => state.query)
  return useMemo(() => filterPeople(people, query), [people, query])
}

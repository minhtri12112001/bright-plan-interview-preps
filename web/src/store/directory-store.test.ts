import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { initialDirectoryState, useDirectoryStore, useFilteredPeople } from '@/store/directory-store'

beforeEach(() => {
  useDirectoryStore.setState(initialDirectoryState)
})

describe('directory store', () => {
  it('starts with an empty query and all people', () => {
    const state = useDirectoryStore.getState()
    expect(state.query).toBe('')
    expect(state.people).toHaveLength(5)
  })

  it('setQuery stores the raw (untrimmed) value', () => {
    useDirectoryStore.getState().setQuery('  ava ')
    expect(useDirectoryStore.getState().query).toBe('  ava ')
  })

  it('clearQuery resets the query', () => {
    useDirectoryStore.getState().setQuery('ava')
    useDirectoryStore.getState().clearQuery()
    expect(useDirectoryStore.getState().query).toBe('')
  })
})

describe('useFilteredPeople', () => {
  it('derives the filtered list from people + query', () => {
    const { result } = renderHook(() => useFilteredPeople())
    expect(result.current).toHaveLength(5)

    act(() => useDirectoryStore.getState().setQuery('ava'))
    expect(result.current.map((person) => person.name)).toEqual(['Ava Chen'])
  })

  it('returns the same array reference when nothing relevant changes', () => {
    const { result, rerender } = renderHook(() => useFilteredPeople())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('reacts to seeded people', () => {
    act(() =>
      useDirectoryStore.setState({
        people: [{ id: 'x', name: 'Zed Test', role: 'Tester' }],
        query: 'zed',
      }),
    )
    const { result } = renderHook(() => useFilteredPeople())
    expect(result.current).toEqual([{ id: 'x', name: 'Zed Test', role: 'Tester' }])
  })
})

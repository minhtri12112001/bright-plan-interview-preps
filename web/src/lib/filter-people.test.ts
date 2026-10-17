import { describe, expect, it } from 'vitest'

import { filterPeople } from '@/lib/filter-people'
import type { Person } from '@/types/person'

const people: Person[] = [
  { id: '1', name: 'Ava Chen', role: 'Frontend Engineer' },
  { id: '2', name: 'Olivia Park', role: 'Product Designer' },
  { id: '3', name: 'Marcus Bell', role: 'Engineering Manager' },
  { id: '4', name: 'Ân Nguyễn', role: 'Mobile Engineer' },
  { id: '5', name: 'Đức Trần', role: 'QA Analyst' },
]

const names = (result: Person[]) => result.map((person) => person.name)

describe('filterPeople', () => {
  it('matches part of a name anywhere in the string', () => {
    expect(names(filterPeople(people, 'li'))).toEqual(['Olivia Park'])
    expect(names(filterPeople(people, 'bell'))).toEqual(['Marcus Bell'])
  })

  it('ignores case', () => {
    expect(names(filterPeople(people, 'AVA'))).toEqual(['Ava Chen'])
    expect(names(filterPeople(people, 'oLiViA'))).toEqual(['Olivia Park'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterPeople(people, 'xyz')).toEqual([])
  })

  it('trims surrounding whitespace from the query', () => {
    expect(names(filterPeople(people, '  ava  '))).toEqual(['Ava Chen'])
  })

  it.each(['', '   ', '\t\n'])('returns everyone for a blank query (%j)', (query) => {
    expect(filterPeople(people, query)).toEqual(people)
  })

  it('matches on name only, not role', () => {
    expect(filterPeople(people, 'engineer')).toEqual([])
    expect(filterPeople(people, 'designer')).toEqual([])
  })

  it('ignores diacritics, including đ', () => {
    expect(names(filterPeople(people, 'nguyen'))).toEqual(['Ân Nguyễn'])
    expect(names(filterPeople(people, 'duc'))).toEqual(['Đức Trần'])
    expect(names(filterPeople(people, 'TRẦN'))).toEqual(['Đức Trần'])
  })

  it('collapses repeated inner whitespace in the query', () => {
    expect(names(filterPeople(people, 'ava    chen'))).toEqual(['Ava Chen'])
  })

  it('keeps the original order for multiple matches', () => {
    // "an" hits "Ân Nguyễn" (an) and "Đức Trần" (tran)
    expect(names(filterPeople(people, 'an'))).toEqual(['Ân Nguyễn', 'Đức Trần'])
  })

  it('does not mutate the input and returns a new array', () => {
    const snapshot = structuredClone(people)
    const all = filterPeople(people, '')
    filterPeople(people, 'ava')

    expect(people).toEqual(snapshot)
    expect(all).not.toBe(people)
  })

  it('handles an empty people list', () => {
    expect(filterPeople([], 'ava')).toEqual([])
    expect(filterPeople([], '')).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'

import { PEOPLE } from '@/data/people'

describe('PEOPLE', () => {
  it('has exactly five people', () => {
    expect(PEOPLE).toHaveLength(5)
  })

  it('has unique ids, so they are safe to use as React keys', () => {
    const ids = PEOPLE.map((person) => person.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a non-empty id, name and role for every person', () => {
    for (const person of PEOPLE) {
      expect(person.id.trim()).not.toBe('')
      expect(person.name.trim()).not.toBe('')
      expect(person.role.trim()).not.toBe('')
    }
  })
})

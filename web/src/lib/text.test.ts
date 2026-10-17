import { describe, expect, it } from 'vitest'

import { formatPeopleCount, getInitials, normalizeText } from '@/lib/text'

describe('normalizeText', () => {
  it.each([
    ['  Ava  ', 'ava'],
    ['Ava   Chen', 'ava chen'],
    ['Ân Nguyễn', 'an nguyen'],
    ['ĐỨC đức', 'duc duc'],
    ['', ''],
    ['   ', ''],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected)
  })
})

describe('getInitials', () => {
  it.each([
    ['Ava Chen', 'AC'],
    ['olivia park', 'OP'],
    ['Mary Jane Watson', 'MW'],
    ['Cher', 'C'],
    ['  Ava   Chen  ', 'AC'],
    ['Ân Nguyễn', 'ÂN'],
    ['', '?'],
    ['   ', '?'],
  ])('%j -> %j', (input, expected) => {
    expect(getInitials(input)).toBe(expected)
  })
})

describe('formatPeopleCount', () => {
  it.each([
    [0, '0 people'],
    [1, '1 person'],
    [5, '5 people'],
  ])('%i -> %j', (count, expected) => {
    expect(formatPeopleCount(count)).toBe(expected)
  })
})

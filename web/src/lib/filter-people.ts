import { normalizeText } from '@/lib/text'
import type { Person } from '@/types/person'

/**
 * Case-, whitespace- and diacritic-insensitive substring match on `name`.
 * An empty query returns every person. Pure: never mutates `people`.
 */
export function filterPeople(people: readonly Person[], query: string): Person[] {
  const needle = normalizeText(query)
  if (needle === '') return [...people]

  return people.filter((person) => normalizeText(person.name).includes(needle))
}

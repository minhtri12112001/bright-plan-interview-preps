import type { Person } from '@/types/person'

import { PersonCard } from './PersonCard'

type PeopleListProps = {
  people: Person[]
}

export function PeopleList({ people }: PeopleListProps) {
  return (
    <ul aria-label="Team members" className="flex flex-col gap-2">
      {people.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} />
        </li>
      ))}
    </ul>
  )
}

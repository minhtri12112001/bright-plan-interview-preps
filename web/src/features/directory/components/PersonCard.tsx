import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/text'
import type { Person } from '@/types/person'

type PersonCardProps = {
  person: Person
}

export function PersonCard({ person }: PersonCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <Avatar size="lg">
        <AvatarFallback aria-hidden="true">{getInitials(person.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate font-medium">{person.name}</p>
        <Badge variant="secondary">{person.role}</Badge>
      </div>
    </div>
  )
}

import { FunnelXIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { hasActiveFilters, UNASSIGNED } from '@/lib/tickets'
import type { Person } from '@/types/person'
import type { AssigneeFilter, TicketFilters } from '@/types/ticket'

type IssueToolbarProps = {
  filters: TicketFilters
  people: readonly Person[]
  onQueryChange: (query: string) => void
  onAssigneeChange: (assignee: AssigneeFilter) => void
  onClear: () => void
}

export function IssueToolbar({ filters, people, onQueryChange, onAssigneeChange, onClear }: IssueToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Label htmlFor="issue-search" className="sr-only">
          Search issues
        </Label>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="issue-search"
          type="search"
          autoComplete="off"
          placeholder="Search by title or ID"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-8"
        />
      </div>
      <Label htmlFor="assignee-filter" className="sr-only">
        Filter by assignee
      </Label>
      <NativeSelect
        id="assignee-filter"
        className="w-full sm:w-48"
        value={filters.assignee}
        onChange={(event) => onAssigneeChange(event.target.value)}
      >
        <NativeSelectOption value="all">All assignees</NativeSelectOption>
        <NativeSelectOption value={UNASSIGNED}>Unassigned</NativeSelectOption>
        {people.map((person) => (
          <NativeSelectOption key={person.id} value={person.id}>
            {person.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {hasActiveFilters(filters) && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="self-start sm:self-auto">
          <FunnelXIcon aria-hidden="true" />
          Clear filters
        </Button>
      )}
    </div>
  )
}

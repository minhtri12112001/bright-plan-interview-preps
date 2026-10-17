import { useRef } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPeopleCount } from '@/lib/text'
import { useDirectoryStore, useFilteredPeople } from '@/store/directory-store'

import { EmptyState } from './components/EmptyState'
import { PeopleList } from './components/PeopleList'
import { SearchInput } from './components/SearchInput'

export function TeamDirectory() {
  const query = useDirectoryStore((state) => state.query)
  const setQuery = useDirectoryStore((state) => state.setQuery)
  const clearQuery = useDirectoryStore((state) => state.clearQuery)
  const filteredPeople = useFilteredPeople()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    clearQuery()
    inputRef.current?.focus()
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>
          <h1 className="text-lg">Team Directory</h1>
        </CardTitle>
        <CardDescription>Find a teammate by name.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SearchInput ref={inputRef} value={query} onChange={setQuery} onClear={handleClear} />
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {formatPeopleCount(filteredPeople.length)}
        </p>
        {filteredPeople.length > 0 ? (
          <PeopleList people={filteredPeople} />
        ) : (
          <EmptyState query={query} onClear={handleClear} />
        )}
      </CardContent>
    </Card>
  )
}

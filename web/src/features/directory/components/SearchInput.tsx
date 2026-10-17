import type { Ref } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  ref?: Ref<HTMLInputElement>
}

export function SearchInput({ value, onChange, onClear, ref }: SearchInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="people-search" className="text-sm font-medium">
        Search by name
      </label>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={ref}
          id="people-search"
          type="search"
          autoComplete="off"
          placeholder="e.g. Ava"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 pr-9 pl-8 [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== '' && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={onClear}
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

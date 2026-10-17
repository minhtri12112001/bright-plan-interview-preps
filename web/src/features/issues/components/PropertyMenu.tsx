import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { PropertyOption } from '../property-options'

type PropertyMenuProps<T extends string> = {
  /** "Status", "Priority" or "Assignee". The trigger is announced as "<label>: <current value>". */
  label: string
  value: T
  options: readonly PropertyOption<T>[]
  onChange: (value: T) => void
  trigger: ReactNode
}

export function PropertyMenu<T extends string>({ label, value, options, onChange, trigger }: PropertyMenuProps<T>) {
  const current = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}: ${current?.label ?? value}`}>
          {trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.icon}
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

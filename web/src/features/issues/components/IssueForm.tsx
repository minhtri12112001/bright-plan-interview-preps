import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { UNASSIGNED, validateTicketTitle } from '@/lib/tickets'
import type { Person } from '@/types/person'
import type { TicketFields, TicketPriority, TicketStatus } from '@/types/ticket'

import { assigneeOptions, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../property-options'

type IssueFormProps = {
  initialValues: TicketFields
  people: readonly Person[]
  onSubmit: (values: TicketFields) => void
  /** Rendered inside the <form>, so a type="submit" button there submits it. */
  footer: ReactNode
}

/** Draft state stays local: it isn't shared, and it should vanish when the dialog closes. */
export function IssueForm({ initialValues, people, onSubmit, footer }: IssueFormProps) {
  const [values, setValues] = useState(initialValues)
  const [titleError, setTitleError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const fieldId = (name: string) => `${id}-${name}`

  const update = <K extends keyof TicketFields>(key: K, value: TicketFields[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const error = validateTicketTitle(values.title)
    setTitleError(error)
    if (error !== null) {
      titleRef.current?.focus()
      return
    }
    onSubmit(values)
  }

  // Cmd/Ctrl+Enter submits from anywhere in the form, including the description.
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId('title')}>Title</Label>
        <Input
          ref={titleRef}
          id={fieldId('title')}
          autoComplete="off"
          placeholder="Issue title"
          value={values.title}
          onChange={(event) => {
            update('title', event.target.value)
            // Once an error is showing, re-check on every keystroke so it clears as soon as it's fixed.
            if (titleError !== null) setTitleError(validateTicketTitle(event.target.value))
          }}
          aria-invalid={titleError !== null}
          aria-describedby={titleError !== null ? fieldId('title-error') : undefined}
        />
        {titleError !== null && (
          <p id={fieldId('title-error')} role="alert" className="text-sm text-destructive">
            {titleError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId('description')}>Description</Label>
        <Textarea
          id={fieldId('description')}
          rows={3}
          placeholder="Add a description (optional)"
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId('status')}>Status</Label>
          <NativeSelect
            id={fieldId('status')}
            className="w-full"
            value={values.status}
            onChange={(event) => update('status', event.target.value as TicketStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId('priority')}>Priority</Label>
          <NativeSelect
            id={fieldId('priority')}
            className="w-full"
            value={values.priority}
            onChange={(event) => update('priority', event.target.value as TicketPriority)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId('assignee')}>Assignee</Label>
          <NativeSelect
            id={fieldId('assignee')}
            className="w-full"
            value={values.assigneeId ?? UNASSIGNED}
            onChange={(event) => update('assigneeId', event.target.value === UNASSIGNED ? null : event.target.value)}
          >
            {assigneeOptions(people).map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {footer}
    </form>
  )
}

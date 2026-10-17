import { useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findAssignee, formatIssueCount, hasActiveFilters, shouldIgnoreShortcut } from '@/lib/tickets'
import { useDirectoryStore } from '@/store/directory-store'
import { useTicketStore, useVisibleTickets } from '@/store/ticket-store'
import type { TicketFields } from '@/types/ticket'

import { CreateIssueDialog } from './components/CreateIssueDialog'
import { EditIssueDialog } from './components/EditIssueDialog'
import { IssueGroup } from './components/IssueGroup'
import { IssuesEmptyState } from './components/IssuesEmptyState'
import { IssueToolbar } from './components/IssueToolbar'

export function IssuesPage() {
  // Assignees come from the directory store, so the team has one source.
  const people = useDirectoryStore((state) => state.people)
  const tickets = useTicketStore((state) => state.tickets)
  const filters = useTicketStore((state) => state.filters)
  const createTicket = useTicketStore((state) => state.createTicket)
  const updateTicket = useTicketStore((state) => state.updateTicket)
  const deleteTicket = useTicketStore((state) => state.deleteTicket)
  const setQuery = useTicketStore((state) => state.setQuery)
  const setAssigneeFilter = useTicketStore((state) => state.setAssigneeFilter)
  const resetFilters = useTicketStore((state) => state.resetFilters)
  const { groups, count } = useVisibleTickets()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = tickets.find((ticket) => ticket.id === editingId)
  // Filtering to a teammate and then creating an issue assigns it to them, as in Linear.
  const defaultAssigneeId = findAssignee(people, filters.assignee)?.id ?? null

  // "C" opens the create dialog, unless the user is typing or a menu or dialog is open.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'c' || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      if (shouldIgnoreShortcut(event.target)) return
      event.preventDefault()
      setCreateOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreate = (values: TicketFields) => {
    createTicket(values)
    setCreateOpen(false)
  }

  const handleSave = (values: TicketFields) => {
    if (editing !== undefined) updateTicket(editing.id, values)
    setEditingId(null)
  }

  const handleDelete = () => {
    if (editing !== undefined) deleteTicket(editing.id)
    setEditingId(null)
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>
          <h1 className="text-lg">Issues</h1>
        </CardTitle>
        <CardDescription>Track the team's work.</CardDescription>
        <CardAction>
          <Button type="button" onClick={() => setCreateOpen(true)} aria-keyshortcuts="c">
            <PlusIcon aria-hidden="true" />
            New issue
            <kbd aria-hidden="true" className="ml-1 hidden rounded border border-primary-foreground/30 px-1 font-sans text-xs sm:inline">
              C
            </kbd>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <IssueToolbar
          filters={filters}
          people={people}
          onQueryChange={setQuery}
          onAssigneeChange={setAssigneeFilter}
          onClear={resetFilters}
        />
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {formatIssueCount(count)}
        </p>
        {count > 0 ? (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <IssueGroup
                key={group.status}
                status={group.status}
                tickets={group.tickets}
                people={people}
                onOpen={setEditingId}
                onUpdate={updateTicket}
              />
            ))}
          </div>
        ) : (
          <IssuesEmptyState
            query={filters.query}
            filtered={hasActiveFilters(filters)}
            onShowAll={resetFilters}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </CardContent>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        people={people}
        defaultAssigneeId={defaultAssigneeId}
        onCreate={handleCreate}
      />
      {editing !== undefined && (
        <EditIssueDialog
          key={editing.id}
          ticket={editing}
          people={people}
          onClose={() => setEditingId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </Card>
  )
}

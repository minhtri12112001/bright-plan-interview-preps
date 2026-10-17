import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Person } from '@/types/person'
import type { TicketFields } from '@/types/ticket'

import { IssueForm } from './IssueForm'

type CreateIssueDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  people: readonly Person[]
  /** Pre-selected when the list is filtered to one teammate. */
  defaultAssigneeId: string | null
  onCreate: (values: TicketFields) => void
}

export function CreateIssueDialog({ open, onOpenChange, people, defaultAssigneeId, onCreate }: CreateIssueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New issue</DialogTitle>
          <DialogDescription>Only the title is required. Press Ctrl+Enter (⌘+Enter on Mac) to create.</DialogDescription>
        </DialogHeader>
        {/* The content unmounts on close, so the form starts empty each time it opens. */}
        <IssueForm
          initialValues={{ title: '', description: '', status: 'todo', priority: 'none', assigneeId: defaultAssigneeId }}
          people={people}
          onSubmit={onCreate}
          footer={
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Create issue</Button>
            </DialogFooter>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

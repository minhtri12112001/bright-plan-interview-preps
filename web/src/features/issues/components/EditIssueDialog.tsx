import { Trash2Icon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { pickTicketFields } from '@/lib/tickets'
import type { Person } from '@/types/person'
import type { Ticket, TicketFields } from '@/types/ticket'

import { IssueForm } from './IssueForm'

type EditIssueDialogProps = {
  ticket: Ticket
  people: readonly Person[]
  onClose: () => void
  onSave: (values: TicketFields) => void
  onDelete: () => void
}

/** Mounted only while an issue is being edited, so it is always open. */
export function EditIssueDialog({ ticket, people, onClose, onSave, onDelete }: EditIssueDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {ticket.id}</DialogTitle>
          <DialogDescription>Changes are saved when you press "Save changes".</DialogDescription>
        </DialogHeader>
        <IssueForm
          initialValues={pickTicketFields(ticket)}
          people={people}
          onSubmit={onSave}
          footer={
            <DialogFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="sm:mr-auto">
                    <Trash2Icon aria-hidden="true" />
                    Delete issue
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {ticket.id}?</AlertDialogTitle>
                    <AlertDialogDescription>"{ticket.title}" will be removed. This can't be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep issue</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

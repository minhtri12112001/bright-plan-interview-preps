import { InboxIcon, SearchXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type IssuesEmptyStateProps = {
  query: string
  /** True when a filter is hiding issues; false when there are no issues at all. */
  filtered: boolean
  onShowAll: () => void
  onCreate: () => void
}

export function IssuesEmptyState({ query, filtered, onShowAll, onCreate }: IssuesEmptyStateProps) {
  const trimmed = query.trim()
  const Icon = filtered ? SearchXIcon : InboxIcon

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
      <Icon aria-hidden="true" className="size-8 text-muted-foreground" />
      {filtered ? (
        <>
          <p className="font-medium">{trimmed !== '' ? `No issues match "${trimmed}"` : 'No issues match these filters'}</p>
          {/* Labelled differently from the toolbar's "Clear filters" so the two buttons can be told apart. */}
          <Button type="button" variant="outline" size="sm" onClick={onShowAll}>
            Show all issues
          </Button>
        </>
      ) : (
        <>
          <p className="font-medium">No issues yet</p>
          <Button type="button" variant="outline" size="sm" onClick={onCreate}>
            Create an issue
          </Button>
        </>
      )}
    </div>
  )
}

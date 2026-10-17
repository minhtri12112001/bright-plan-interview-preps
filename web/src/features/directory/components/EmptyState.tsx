import { SearchXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  query: string
  onClear: () => void
}

export function EmptyState({ query, onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
      <SearchXIcon aria-hidden="true" className="size-8 text-muted-foreground" />
      <p className="text-sm">
        No one matches <span className="font-medium">"{query.trim()}"</span>
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Show everyone
      </Button>
    </div>
  )
}

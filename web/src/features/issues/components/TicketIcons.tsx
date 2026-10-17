import { cn } from '@/lib/utils'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  CircleXIcon,
  EllipsisIcon,
  OctagonAlertIcon,
  UserRoundIcon,
  type LucideIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/text'
import type { Person } from '@/types/person'
import type { TicketPriority, TicketStatus } from '@/types/ticket'

type IconStyle = { icon: LucideIcon; tone: string }

const STATUS_ICONS: Record<TicketStatus, IconStyle> = {
  backlog: { icon: CircleDashedIcon, tone: 'text-muted-foreground' },
  todo: { icon: CircleIcon, tone: 'text-foreground/70' },
  in_progress: { icon: CircleDotIcon, tone: 'text-amber-500' },
  done: { icon: CircleCheckIcon, tone: 'text-indigo-500' },
  canceled: { icon: CircleXIcon, tone: 'text-muted-foreground' },
}

const PRIORITY_BARS = { high: 3, medium: 2, low: 1 } as const

export function StatusIcon({ status, className }: { status: TicketStatus; className?: string }) {
  const { icon: Icon, tone } = STATUS_ICONS[status]
  return <Icon aria-hidden="true" className={cn('size-4', tone, className)} />
}

export function PriorityIcon({ priority, className }: { priority: TicketPriority; className?: string }) {
  if (priority === 'urgent') {
    return <OctagonAlertIcon aria-hidden="true" className={cn('size-4 text-orange-600', className)} />
  }
  if (priority === 'none') {
    return <EllipsisIcon aria-hidden="true" className={cn('size-4 text-muted-foreground', className)} />
  }
  return <PriorityBars lit={PRIORITY_BARS[priority]} className={className} />
}

/**
 * Three bars with the unlit ones dimmed, as in Linear. Lucide's signal icons draw only
 * the lit bars, so "Low" looked like a stray mark.
 */
function PriorityBars({ lit, className }: { lit: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      data-lit-bars={lit}
      className={cn('size-4 text-foreground/80', className)}
    >
      {[0, 1, 2].map((bar) => (
        <rect key={bar} x={1.5 + bar * 5} y={10 - bar * 4} width={3} height={4 + bar * 4} rx={1} opacity={bar < lit ? 1 : 0.25} />
      ))}
    </svg>
  )
}

/** Initials for a teammate, or an outline icon when unassigned. Decorative: callers provide the label. */
export function AssigneeAvatar({ person }: { person: Person | undefined }) {
  if (person === undefined) {
    return <UserRoundIcon aria-hidden="true" className="size-4 text-muted-foreground" />
  }
  return (
    <Avatar size="sm" aria-hidden="true">
      <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
    </Avatar>
  )
}

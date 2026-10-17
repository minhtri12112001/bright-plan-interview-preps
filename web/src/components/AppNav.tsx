import { ListTodoIcon, UsersIcon, type LucideIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { routeHref, type Route } from '@/lib/routes'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'team', label: 'Team', icon: UsersIcon },
  { route: 'issues', label: 'Issues', icon: ListTodoIcon },
]

export function AppNav({ route }: { route: Route }) {
  return (
    <header className="border-b bg-background">
      <nav aria-label="Main" className="mx-auto flex h-12 max-w-3xl items-center gap-1 px-4">
        {NAV_ITEMS.map(({ route: itemRoute, label, icon: Icon }) => (
          <a
            key={itemRoute}
            href={routeHref(itemRoute)}
            aria-current={route === itemRoute ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
            )}
          >
            <Icon aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}

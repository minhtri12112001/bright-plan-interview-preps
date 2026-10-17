import { useEffect } from 'react'

import { AppNav } from '@/components/AppNav'
import { TeamDirectory } from '@/features/directory/TeamDirectory'
import { IssuesPage } from '@/features/issues/IssuesPage'
import { useHashRoute } from '@/hooks/use-hash-route'
import { ROUTE_TITLES } from '@/lib/routes'

export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    document.title = ROUTE_TITLES[route]
  }, [route])

  return (
    <div className="min-h-svh bg-muted/40">
      <AppNav route={route} />
      <main className="flex items-start justify-center px-4 py-8 sm:py-12">
        {route === 'issues' ? <IssuesPage /> : <TeamDirectory />}
      </main>
    </div>
  )
}

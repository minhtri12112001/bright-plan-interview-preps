export const ROUTES = ['team', 'issues'] as const
export type Route = (typeof ROUTES)[number]

export const DEFAULT_ROUTE: Route = 'team'

export const ROUTE_TITLES: Record<Route, string> = {
  team: 'Team Directory',
  issues: 'Issues',
}

export function routeHref(route: Route): string {
  return `#/${route}`
}

/** "#/issues" -> "issues". Anything unknown, including an empty hash, falls back to the team page. */
export function parseRoute(hash: string): Route {
  const segment = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTES as readonly string[]).includes(segment) ? (segment as Route) : DEFAULT_ROUTE
}

import { useSyncExternalStore } from 'react'

import { parseRoute, type Route } from '@/lib/routes'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

/** The current route from `location.hash`. No router library needed for two pages. */
export function useHashRoute(): Route {
  return parseRoute(useSyncExternalStore(subscribe, getHash))
}

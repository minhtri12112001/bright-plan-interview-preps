import { describe, expect, it } from 'vitest'

import { parseRoute, ROUTE_TITLES, routeHref, ROUTES } from './routes'

describe('parseRoute', () => {
  it.each([
    ['#/issues', 'issues'],
    ['#issues', 'issues'],
    ['#/issues/', 'issues'],
    ['#/issues?assignee=p-1', 'issues'],
    ['#/team', 'team'],
  ])('%s -> %s', (hash, route) => {
    expect(parseRoute(hash)).toBe(route)
  })

  it.each(['', '#', '#/', '#/nope', '#/ISSUES'])('falls back to the team page for %j', (hash) => {
    expect(parseRoute(hash)).toBe('team')
  })

  it('round-trips with routeHref', () => {
    for (const route of ROUTES) expect(parseRoute(routeHref(route))).toBe(route)
  })

  it('has a document title for every route', () => {
    expect(ROUTE_TITLES).toEqual({ team: 'Team Directory', issues: 'Issues' })
  })
})

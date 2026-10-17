import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useHashRoute } from './use-hash-route'

function navigate(hash: string) {
  act(() => {
    window.location.hash = hash
    // jsdom fires hashchange asynchronously; dispatch it so the update lands inside act().
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

afterEach(() => {
  window.location.hash = ''
})

describe('useHashRoute', () => {
  it('starts on the team page when there is no hash', () => {
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('team')
  })

  it('follows hashchange events', () => {
    const { result } = renderHook(() => useHashRoute())

    navigate('#/issues')
    expect(result.current).toBe('issues')

    navigate('#/team')
    expect(result.current).toBe('team')
  })

  it('stops listening after unmount', () => {
    const { result, unmount } = renderHook(() => useHashRoute())
    unmount()

    navigate('#/issues')
    expect(result.current).toBe('team')
  })
})

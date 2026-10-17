import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { initialDirectoryState, useDirectoryStore } from '@/store/directory-store'

import { TeamDirectory } from './TeamDirectory'

function setup() {
  const user = userEvent.setup()
  render(<TeamDirectory />)
  const input = screen.getByRole('searchbox', { name: /search by name/i })
  const listItems = () =>
    within(screen.getByRole('list', { name: /team members/i })).getAllByRole('listitem')
  return { user, input, listItems }
}

beforeEach(() => {
  useDirectoryStore.setState(initialDirectoryState)
})

describe('TeamDirectory', () => {
  it('shows all five people with name and role on first render', () => {
    const { listItems } = setup()

    expect(listItems()).toHaveLength(5)
    expect(screen.getByText('Ava Chen')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('5 people')).toBeInTheDocument()
  })

  it('filters as the user types (controlled input)', async () => {
    const { user, input, listItems } = setup()

    await user.type(input, 'OLI')

    expect(input).toHaveValue('OLI')
    expect(listItems()).toHaveLength(1)
    expect(screen.getByText('Olivia Park')).toBeInTheDocument()
    expect(screen.getByText('1 person')).toBeInTheDocument()
  })

  it('shows the empty state with the trimmed query when nothing matches', async () => {
    const { user, input } = setup()

    await user.type(input, '  xyz ')

    expect(screen.queryByRole('list', { name: /team members/i })).not.toBeInTheDocument()
    expect(screen.getByText(/no one matches/i)).toHaveTextContent('No one matches "xyz"')
    expect(screen.getByText('0 people')).toBeInTheDocument()
  })

  it('"Show everyone" in the empty state restores everyone and focuses the input', async () => {
    const { user, input, listItems } = setup()

    await user.type(input, 'xyz')
    await user.click(screen.getByRole('button', { name: 'Show everyone' }))

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(listItems()).toHaveLength(5)
  })

  it('shows the inline clear button only while there is a query', async () => {
    const { user, input, listItems } = setup()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await user.type(input, 'ava')
    const clearButton = screen.getByRole('button', { name: 'Clear search' })
    await user.click(clearButton)

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(listItems()).toHaveLength(5)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('reflects store changes made outside the input', () => {
    const { input, listItems } = setup()

    act(() => useDirectoryStore.getState().setQuery('marcus'))

    expect(input).toHaveValue('marcus')
    expect(listItems()).toHaveLength(1)
  })
})

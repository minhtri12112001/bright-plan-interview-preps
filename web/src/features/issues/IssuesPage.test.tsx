import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { PEOPLE } from '@/data/people'
import { SEED_TICKETS } from '@/data/tickets'
import { initialDirectoryState, useDirectoryStore } from '@/store/directory-store'
import { initialTicketState, useTicketStore } from '@/store/ticket-store'

import { IssuesPage } from './IssuesPage'

function setup() {
  const user = userEvent.setup()
  render(<IssuesPage />)
  return { user }
}

/** The <ul> for one status group, e.g. "Todo issues". */
const group = (label: string) => screen.getByRole('list', { name: `${label} issues` })
const queryGroup = (label: string) => screen.queryByRole('list', { name: `${label} issues` })
const groupIds = (label: string) =>
  within(group(label))
    .getAllByRole('listitem')
    .map((item) => item.textContent?.match(/ENG-\d+/)?.[0])
/** The row for one issue, found by its id. */
const row = (id: string) => screen.getByText(id, { exact: true }).closest('li')!
const allRows = () => screen.queryAllByText(/^ENG-\d+$/).map((idCell) => idCell.closest('li')!)
const searchBox = () => screen.getByRole('searchbox', { name: 'Search issues' })
const assigneeFilter = () => screen.getByRole('combobox', { name: 'Filter by assignee' })
const dialog = () => screen.getByRole('dialog')

beforeEach(() => {
  localStorage.clear()
  useDirectoryStore.setState(initialDirectoryState)
  useTicketStore.setState(initialTicketState)
})

describe('IssuesPage', () => {
  it('I1: groups the seed issues by status, active work first, with counts', () => {
    setup()

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['In Progress1', 'Todo1', 'Backlog2', 'Done2', 'Canceled1'])
    expect(groupIds('Backlog')).toEqual(['ENG-5', 'ENG-6'])
    expect(groupIds('Done')).toEqual(['ENG-1', 'ENG-2'])
    expect(screen.getByText('7 issues')).toBeInTheDocument()
  })

  it('I1: each row shows priority, id, status, title and assignee', () => {
    setup()

    const ava = within(row('ENG-1'))
    expect(ava.getByRole('button', { name: 'Priority: High' })).toBeInTheDocument()
    expect(ava.getByRole('button', { name: 'Status: Done' })).toBeInTheDocument()
    expect(ava.getByRole('button', { name: 'Match Vietnamese names without diacritics' })).toBeInTheDocument()
    expect(ava.getByRole('button', { name: 'Assignee: Ava Chen' })).toHaveTextContent('AC')

    expect(within(row('ENG-6')).getByRole('button', { name: 'Assignee: Unassigned' })).toBeInTheDocument()
  })

  it('I8: the count is announced politely', () => {
    setup()
    expect(screen.getByText('7 issues')).toHaveAttribute('aria-live', 'polite')
  })

  describe('creating', () => {
    it('I2: "New issue" opens the dialog with the title focused', async () => {
      const { user } = setup()

      await user.click(screen.getByRole('button', { name: 'New issue' }))

      expect(dialog()).toHaveAccessibleName('New issue')
      expect(within(dialog()).getByRole('textbox', { name: 'Title' })).toHaveFocus()
    })

    it('I2: a blank title shows an error and creates nothing', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'New issue' }))
      const title = within(dialog()).getByRole('textbox', { name: 'Title' })

      await user.type(title, '   ')
      await user.click(within(dialog()).getByRole('button', { name: 'Create issue' }))

      expect(within(dialog()).getByRole('alert')).toHaveTextContent('Title is required')
      expect(title).toHaveAttribute('aria-invalid', 'true')
      expect(title).toHaveAccessibleDescription('Title is required')
      expect(title).toHaveFocus()
      expect(useTicketStore.getState().tickets).toHaveLength(7)

      // The error clears as soon as the title is valid.
      await user.type(title, 'Fixed')
      expect(within(dialog()).queryByRole('alert')).not.toBeInTheDocument()
    })

    it('I2/I3: creates an issue with every field, assigned to a teammate', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'New issue' }))
      const form = within(dialog())

      await user.type(form.getByRole('textbox', { name: 'Title' }), '  Add offline mode  ')
      await user.type(form.getByRole('textbox', { name: 'Description' }), 'Cache the team list')
      await user.selectOptions(form.getByRole('combobox', { name: 'Status' }), 'In Progress')
      await user.selectOptions(form.getByRole('combobox', { name: 'Priority' }), 'Urgent')
      await user.selectOptions(form.getByRole('combobox', { name: 'Assignee' }), 'Ân Nguyễn')
      await user.click(form.getByRole('button', { name: 'Create issue' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(groupIds('In Progress')).toEqual(['ENG-8', 'ENG-3'])
      const created = within(row('ENG-8'))
      expect(created.getByRole('button', { name: 'Add offline mode' })).toBeInTheDocument()
      expect(created.getByRole('button', { name: 'Priority: Urgent' })).toBeInTheDocument()
      expect(created.getByRole('button', { name: 'Assignee: Ân Nguyễn' })).toHaveTextContent('ÂN')
      expect(screen.getByText('8 issues')).toBeInTheDocument()
      expect(useTicketStore.getState().tickets.at(-1)?.description).toBe('Cache the team list')
    })

    it('I2: defaults to Todo, no priority and unassigned', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'New issue' }))

      await user.type(within(dialog()).getByRole('textbox', { name: 'Title' }), 'Plain issue{Enter}')

      expect(groupIds('Todo')).toEqual(['ENG-4', 'ENG-8'])
      expect(within(row('ENG-8')).getByRole('button', { name: 'Priority: No priority' })).toBeInTheDocument()
      expect(within(row('ENG-8')).getByRole('button', { name: 'Assignee: Unassigned' })).toBeInTheDocument()
    })

    it('I2: Ctrl+Enter in the description submits the form', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'New issue' }))
      const form = within(dialog())

      await user.type(form.getByRole('textbox', { name: 'Title' }), 'From the keyboard')
      await user.type(form.getByRole('textbox', { name: 'Description' }), 'Line one{Control>}{Enter}{/Control}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'From the keyboard' })).toBeInTheDocument()
    })

    it('Cancel closes the dialog without creating, and the next open starts empty', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'New issue' }))
      await user.type(within(dialog()).getByRole('textbox', { name: 'Title' }), 'Draft')

      await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(useTicketStore.getState().tickets).toHaveLength(7)

      await user.click(screen.getByRole('button', { name: 'New issue' }))
      expect(within(dialog()).getByRole('textbox', { name: 'Title' })).toHaveValue('')
    })

    it('I2: pressing C opens the dialog, and the "c" is not typed into the title', async () => {
      const { user } = setup()

      await user.keyboard('c')

      expect(dialog()).toHaveAccessibleName('New issue')
      expect(within(dialog()).getByRole('textbox', { name: 'Title' })).toHaveValue('')
    })

    it('I2: typing "c" in the search box does not open the dialog', async () => {
      const { user } = setup()

      await user.type(searchBox(), 'cache')

      expect(searchBox()).toHaveValue('cache')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('I2: Ctrl+C is left alone (copy, not create)', async () => {
      const { user } = setup()
      await user.keyboard('{Control>}c{/Control}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('team members', () => {
    it.each(PEOPLE)('I3/I6: filtering to $name shows only their issues and pre-assigns new ones', async (person) => {
      const { user } = setup()
      const expected = SEED_TICKETS.filter((t) => t.assigneeId === person.id).map((t) => t.id)

      await user.selectOptions(assigneeFilter(), person.name)

      const rows = allRows()
      expect(rows.map((r) => r.textContent?.match(/ENG-\d+/)?.[0]).sort()).toEqual([...expected].sort())
      for (const r of rows) {
        expect(within(r).getByRole('button', { name: `Assignee: ${person.name}` })).toBeInTheDocument()
      }

      await user.click(screen.getByRole('button', { name: 'New issue' }))
      expect(within(dialog()).getByRole('combobox', { name: 'Assignee' })).toHaveDisplayValue(person.name)
    })

    it('the assignee filter lists everyone from the directory, plus All and Unassigned', () => {
      setup()
      const options = within(assigneeFilter())
        .getAllByRole('option')
        .map((option) => option.textContent)
      expect(options).toEqual(['All assignees', 'Unassigned', ...PEOPLE.map((p) => p.name)])
    })

    it('"Unassigned" shows only issues with no assignee, and new issues stay unassigned', async () => {
      const { user } = setup()

      await user.selectOptions(assigneeFilter(), 'Unassigned')

      expect(allRows()).toHaveLength(1)
      expect(within(row('ENG-6')).getByRole('button', { name: 'Assignee: Unassigned' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'New issue' }))
      expect(within(dialog()).getByRole('combobox', { name: 'Assignee' })).toHaveDisplayValue('Unassigned')
    })

    it('uses the team list from the directory store', () => {
      useDirectoryStore.setState({ people: [{ id: 'p-9', name: 'Zoe Lam', role: 'Data Analyst' }] })
      setup()

      const options = within(assigneeFilter())
        .getAllByRole('option')
        .map((option) => option.textContent)
      expect(options).toEqual(['All assignees', 'Unassigned', 'Zoe Lam'])
      // ENG-1 points at p-1, who is not on this team, so it reads as unassigned instead of crashing.
      expect(within(row('ENG-1')).getByRole('button', { name: 'Assignee: Unassigned' })).toBeInTheDocument()
    })
  })

  describe('row menus (I4)', () => {
    it('changing the status moves the row to its new group', async () => {
      const { user } = setup()

      await user.click(within(row('ENG-4')).getByRole('button', { name: 'Status: Todo' }))
      const menu = screen.getByRole('menu')
      expect(within(menu).getByRole('menuitemradio', { name: 'Todo' })).toBeChecked()
      await user.click(within(menu).getByRole('menuitemradio', { name: 'Done' }))

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(queryGroup('Todo')).not.toBeInTheDocument()
      expect(groupIds('Done')).toContain('ENG-4')
      expect(within(row('ENG-4')).getByRole('button', { name: 'Status: Done' })).toBeInTheDocument()
    })

    it('changes the priority and re-sorts the group', async () => {
      const { user } = setup()
      expect(groupIds('Backlog')).toEqual(['ENG-5', 'ENG-6'])

      await user.click(within(row('ENG-6')).getByRole('button', { name: 'Priority: No priority' }))
      await user.click(screen.getByRole('menuitemradio', { name: 'Urgent' }))

      expect(groupIds('Backlog')).toEqual(['ENG-6', 'ENG-5'])
    })

    it.each(PEOPLE)('assigns ENG-6 to $name, then unassigns', async (person) => {
      const { user } = setup()

      await user.click(within(row('ENG-6')).getByRole('button', { name: 'Assignee: Unassigned' }))
      await user.click(screen.getByRole('menuitemradio', { name: person.name }))
      expect(within(row('ENG-6')).getByRole('button', { name: `Assignee: ${person.name}` })).toBeInTheDocument()

      await user.click(within(row('ENG-6')).getByRole('button', { name: `Assignee: ${person.name}` }))
      await user.click(screen.getByRole('menuitemradio', { name: 'Unassigned' }))
      expect(useTicketStore.getState().tickets.find((t) => t.id === 'ENG-6')?.assigneeId).toBeNull()
    })
  })

  describe('editing and deleting (I5)', () => {
    it('opens the editor prefilled from the row title and saves changes', async () => {
      const { user } = setup()

      await user.click(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' }))
      expect(dialog()).toHaveAccessibleName('Edit ENG-5')
      const form = within(dialog())
      expect(form.getByRole('textbox', { name: 'Title' })).toHaveValue('Plan the Q4 roadmap review')
      expect(form.getByRole('combobox', { name: 'Assignee' })).toHaveDisplayValue('Marcus Bell')

      await user.clear(form.getByRole('textbox', { name: 'Title' }))
      await user.type(form.getByRole('textbox', { name: 'Title' }), 'Run the Q4 roadmap review')
      await user.selectOptions(form.getByRole('combobox', { name: 'Status' }), 'Todo')
      await user.click(form.getByRole('button', { name: 'Save changes' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(groupIds('Todo')).toEqual(['ENG-4', 'ENG-5'])
      expect(within(row('ENG-5')).getByRole('button', { name: 'Run the Q4 roadmap review' })).toBeInTheDocument()
    })

    it('Cancel discards edits', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' }))
      await user.type(within(dialog()).getByRole('textbox', { name: 'Title' }), ' (draft)')

      await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

      expect(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' })).toBeInTheDocument()
    })

    it('blocks saving a blank title', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' }))

      await user.clear(within(dialog()).getByRole('textbox', { name: 'Title' }))
      await user.click(within(dialog()).getByRole('button', { name: 'Save changes' }))

      expect(within(dialog()).getByRole('alert')).toHaveTextContent('Title is required')
      expect(useTicketStore.getState().tickets.find((t) => t.id === 'ENG-5')?.title).toBe('Plan the Q4 roadmap review')
    })

    it('asks before deleting; "Keep issue" keeps it', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' }))

      await user.click(within(dialog()).getByRole('button', { name: 'Delete issue' }))
      const confirm = screen.getByRole('alertdialog')
      expect(confirm).toHaveAccessibleName('Delete ENG-5?')
      await user.click(within(confirm).getByRole('button', { name: 'Keep issue' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(dialog()).toHaveAccessibleName('Edit ENG-5')
      expect(useTicketStore.getState().tickets).toHaveLength(7)
    })

    it('deletes after confirmation', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'Plan the Q4 roadmap review' }))

      await user.click(within(dialog()).getByRole('button', { name: 'Delete issue' }))
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByText('ENG-5', { exact: true })).not.toBeInTheDocument()
      expect(groupIds('Backlog')).toEqual(['ENG-6'])
      expect(screen.getByText('6 issues')).toBeInTheDocument()
    })
  })

  describe('search and empty states (I6)', () => {
    it('searches by title and by id', async () => {
      const { user } = setup()

      await user.type(searchBox(), 'expo')
      expect(allRows().map((r) => r.textContent?.match(/ENG-\d+/)?.[0])).toEqual(['ENG-4'])

      await user.clear(searchBox())
      await user.type(searchBox(), 'eng-7')
      expect(allRows().map((r) => r.textContent?.match(/ENG-\d+/)?.[0])).toEqual(['ENG-7'])
      expect(screen.getByText('1 issue')).toBeInTheDocument()
    })

    it('combines search with the assignee filter', async () => {
      const { user } = setup()

      await user.selectOptions(assigneeFilter(), 'Olivia Park')
      await user.type(searchBox(), 'design')

      expect(allRows().map((r) => r.textContent?.match(/ENG-\d+/)?.[0])).toEqual(['ENG-2'])
    })

    it('quotes the trimmed query when nothing matches; "Show all issues" resets everything', async () => {
      const { user } = setup()
      await user.selectOptions(assigneeFilter(), 'Ava Chen')
      await user.type(searchBox(), '  xyz ')

      expect(screen.getByText('No issues match "xyz"')).toBeInTheDocument()
      expect(screen.getByText('0 issues')).toBeInTheDocument()
      expect(screen.queryAllByRole('list')).toHaveLength(0)

      await user.click(screen.getByRole('button', { name: 'Show all issues' }))

      expect(searchBox()).toHaveValue('')
      expect(assigneeFilter()).toHaveValue('all')
      expect(screen.getByText('7 issues')).toBeInTheDocument()
    })

    it('says "No issues match these filters" when only the assignee filter hides everything', async () => {
      useTicketStore.setState({ tickets: SEED_TICKETS.filter((t) => t.assigneeId !== 'p-3') })
      const { user } = setup()

      await user.selectOptions(assigneeFilter(), 'Marcus Bell')

      expect(screen.getByText('No issues match these filters')).toBeInTheDocument()
    })

    it('"Clear filters" in the toolbar shows only while a filter is active', async () => {
      const { user } = setup()
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()

      await user.type(searchBox(), 'expo')
      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(searchBox()).toHaveValue('')
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
      expect(screen.getByText('7 issues')).toBeInTheDocument()
    })

    it('with no issues at all, offers to create one', async () => {
      useTicketStore.setState({ tickets: [] })
      const { user } = setup()

      expect(screen.getByText('No issues yet')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Create an issue' }))
      expect(dialog()).toHaveAccessibleName('New issue')
    })

    it('reflects store changes made outside the page', () => {
      setup()
      act(() => useTicketStore.getState().deleteTicket('ENG-1'))
      expect(screen.getByText('6 issues')).toBeInTheDocument()
    })
  })
})

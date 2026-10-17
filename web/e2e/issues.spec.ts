import { expect, test, type Locator, type Page } from '@playwright/test'

import { snap, trackConsoleProblems } from './helpers.ts'

/** The five teammates from the directory, and how many seed issues each one has. */
const TEAM = [
  { name: 'Ava Chen', slug: 'ava-chen', initials: 'AC', issues: ['ENG-1'] },
  { name: 'Olivia Park', slug: 'olivia-park', initials: 'OP', issues: ['ENG-2', 'ENG-7'] },
  { name: 'Marcus Bell', slug: 'marcus-bell', initials: 'MB', issues: ['ENG-5'] },
  { name: 'Ân Nguyễn', slug: 'an-nguyen', initials: 'ÂN', issues: ['ENG-4'] },
  { name: 'Đức Trần', slug: 'duc-tran', initials: 'ĐT', issues: ['ENG-3'] },
]

let consoleProblems: string[] = []

test.beforeEach(async ({ page }) => {
  consoleProblems = trackConsoleProblems(page)
  await page.goto('/#/issues')
})

test.afterEach(() => {
  expect(consoleProblems).toEqual([])
})

const group = (page: Page, label: string) => page.getByRole('list', { name: `${label} issues` })
const rows = (page: Page) => page.getByRole('listitem')
const row = (page: Page, id: string) => rows(page).filter({ has: page.getByText(id, { exact: true }) })
const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search issues' })
const assigneeFilter = (page: Page) => page.getByRole('combobox', { name: 'Filter by assignee' })
const dialog = (page: Page) => page.getByRole('dialog')
const titleField = (scope: Locator) => scope.getByRole('textbox', { name: 'Title' })

async function rowIds(page: Page): Promise<string[]> {
  const texts = await rows(page).allTextContents()
  return texts.map((text) => text.match(/ENG-\d+/)?.[0] ?? '?')
}

test('I1 shows the seed issues grouped by status, active work first', async ({ page }, testInfo) => {
  await expect(page).toHaveTitle('Issues')
  await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Issues' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'In Progress1',
    'Todo1',
    'Backlog2',
    'Done2',
    'Canceled1',
  ])
  await expect(rows(page)).toHaveCount(7)
  await expect(page.getByText('7 issues')).toBeVisible()
  await expect(row(page, 'ENG-1').getByRole('button', { name: 'Assignee: Ava Chen' })).toHaveText('AC')

  await snap(page, testInfo, 'initial')
})

test('I2 creates an issue assigned to a teammate, after rejecting a blank title', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'New issue' }).click()
  const form = dialog(page)
  await expect(titleField(form)).toBeFocused()

  await form.getByRole('button', { name: 'Create issue' }).click()
  await expect(form.getByRole('alert')).toHaveText('Title is required')
  await snap(page, testInfo, 'validation')

  await titleField(form).fill('Add offline mode')
  await form.getByRole('textbox', { name: 'Description' }).fill('Cache the team list for the subway.')
  await form.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'In Progress' })
  await form.getByRole('combobox', { name: 'Priority' }).selectOption({ label: 'Urgent' })
  await form.getByRole('combobox', { name: 'Assignee' }).selectOption({ label: 'Ân Nguyễn' })
  await snap(page, testInfo, 'filled')
  await form.getByRole('button', { name: 'Create issue' }).click()

  await expect(dialog(page)).toBeHidden()
  const created = row(page, 'ENG-8')
  await expect(created).toBeVisible()
  await expect(group(page, 'In Progress').getByRole('listitem').first()).toContainText('ENG-8')
  await expect(created.getByRole('button', { name: 'Priority: Urgent' })).toBeVisible()
  await expect(created.getByRole('button', { name: 'Assignee: Ân Nguyễn' })).toHaveText('ÂN')
  await expect(page.getByText('8 issues')).toBeVisible()
  await snap(page, testInfo, 'created')
})

test('I2s the C shortcut opens the dialog, but not while typing in search', async ({ page }) => {
  await searchBox(page).fill('cache')
  await searchBox(page).press('c')
  await expect(dialog(page)).toBeHidden()

  await searchBox(page).fill('')
  await page.getByRole('heading', { name: 'Issues', level: 1 }).click()
  await page.keyboard.press('c')
  await expect(dialog(page)).toBeVisible()
  await expect(titleField(dialog(page))).toHaveValue('')

  await titleField(dialog(page)).fill('Created from the keyboard')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(dialog(page)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Created from the keyboard' })).toBeVisible()
})

for (const person of TEAM) {
  test(`I3 filters to ${person.name} and pre-assigns new issues to them`, async ({ page }, testInfo) => {
    await assigneeFilter(page).selectOption({ label: person.name })

    await expect(rows(page)).toHaveCount(person.issues.length)
    expect((await rowIds(page)).sort()).toEqual([...person.issues].sort())
    for (const item of await rows(page).all()) {
      await expect(item.getByRole('button', { name: `Assignee: ${person.name}` })).toHaveText(person.initials)
    }
    await snap(page, testInfo, `filtered-${person.slug}`)

    await page.getByRole('button', { name: 'New issue' }).click()
    await expect(dialog(page).getByRole('combobox', { name: 'Assignee' }).locator('option:checked')).toHaveText(
      person.name,
    )
    await titleField(dialog(page)).fill(`Follow-up for ${person.name}`)
    await dialog(page).getByRole('button', { name: 'Create issue' }).click()

    await expect(rows(page)).toHaveCount(person.issues.length + 1)
    await expect(row(page, 'ENG-8').getByRole('button', { name: `Assignee: ${person.name}` })).toBeVisible()
  })
}

test('I4 row menus change status (moving the row), priority and assignee', async ({ page }, testInfo) => {
  await row(page, 'ENG-4').getByRole('button', { name: 'Status: Todo' }).click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitemradio', { name: 'Todo' })).toHaveAttribute('aria-checked', 'true')
  await snap(page, testInfo, 'status-menu')
  await menu.getByRole('menuitemradio', { name: 'Done' }).click()

  await expect(page.getByRole('menu')).toBeHidden()
  await expect(group(page, 'Todo')).toHaveCount(0)
  await expect(group(page, 'Done')).toContainText('ENG-4')

  await row(page, 'ENG-6').getByRole('button', { name: 'Priority: No priority' }).click()
  await page.getByRole('menuitemradio', { name: 'High' }).click()
  await expect(group(page, 'Backlog').getByRole('listitem').first()).toContainText('ENG-6')

  await row(page, 'ENG-6').getByRole('button', { name: 'Assignee: Unassigned' }).click()
  await page.getByRole('menuitemradio', { name: 'Đức Trần' }).click()
  await expect(row(page, 'ENG-6').getByRole('button', { name: 'Assignee: Đức Trần' })).toHaveText('ĐT')

  await snap(page, testInfo, 'after-changes')
})

test('I5 edits an issue, then deletes it after confirming', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Plan the Q4 roadmap review' }).click()
  const form = dialog(page)
  await expect(form.getByRole('heading', { name: 'Edit ENG-5' })).toBeVisible()
  await expect(form.getByRole('combobox', { name: 'Assignee' }).locator('option:checked')).toHaveText('Marcus Bell')
  await snap(page, testInfo, 'editor')

  await titleField(form).fill('Run the Q4 roadmap review')
  await form.getByRole('combobox', { name: 'Assignee' }).selectOption({ label: 'Olivia Park' })
  await form.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog(page)).toBeHidden()
  await expect(row(page, 'ENG-5').getByRole('button', { name: 'Assignee: Olivia Park' })).toBeVisible()

  await page.getByRole('button', { name: 'Run the Q4 roadmap review' }).click()
  await dialog(page).getByRole('button', { name: 'Delete issue' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm.getByRole('heading', { name: 'Delete ENG-5?' })).toBeVisible()
  await snap(page, testInfo, 'confirm-delete')
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(row(page, 'ENG-5')).toHaveCount(0)
  await expect(page.getByText('6 issues')).toBeVisible()
})

test('I6 search and the assignee filter combine; no match shows the empty state', async ({ page }, testInfo) => {
  await searchBox(page).fill('eng-7')
  expect(await rowIds(page)).toEqual(['ENG-7'])

  await searchBox(page).fill('design')
  await assigneeFilter(page).selectOption({ label: 'Olivia Park' })
  expect(await rowIds(page)).toEqual(['ENG-2'])

  await searchBox(page).fill('  xyz ')
  await expect(page.getByText('No issues match "xyz"')).toBeVisible()
  await expect(page.getByText('0 issues')).toBeVisible()
  await snap(page, testInfo, 'empty-state')

  await page.getByRole('button', { name: 'Show all issues' }).click()
  await expect(searchBox(page)).toHaveValue('')
  await expect(assigneeFilter(page)).toHaveValue('all')
  await expect(rows(page)).toHaveCount(7)
})

test('I7 created, edited and deleted issues survive a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'New issue' }).click()
  await titleField(dialog(page)).fill('Persist me')
  await dialog(page).getByRole('combobox', { name: 'Assignee' }).selectOption({ label: 'Ava Chen' })
  await dialog(page).getByRole('button', { name: 'Create issue' }).click()

  await row(page, 'ENG-4').getByRole('button', { name: 'Status: Todo' }).click()
  await page.getByRole('menuitemradio', { name: 'In Progress' }).click()

  await page.getByRole('button', { name: 'Drop the legacy color theme' }).click()
  await dialog(page).getByRole('button', { name: 'Delete issue' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()

  await assigneeFilter(page).selectOption({ label: 'Ava Chen' })
  await page.reload()

  await expect(row(page, 'ENG-8')).toContainText('Persist me')
  await expect(row(page, 'ENG-8').getByRole('button', { name: 'Assignee: Ava Chen' })).toBeVisible()
  await expect(group(page, 'In Progress')).toContainText('ENG-4')
  await expect(row(page, 'ENG-7')).toHaveCount(0)
  // Filters are view state, so they reset on reload.
  await expect(assigneeFilter(page)).toHaveValue('all')
  await expect(page.getByText('7 issues')).toBeVisible()
})

test('N1 the top nav switches pages and keeps each page state', async ({ page }, testInfo) => {
  await page.getByRole('link', { name: 'Team' }).click()
  await expect(page).toHaveURL(/#\/team$/)
  await expect(page).toHaveTitle('Team Directory')
  await expect(page.getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('searchbox', { name: 'Search by name' }).fill('ân')

  await page.getByRole('link', { name: 'Issues' }).click()
  await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
  await page.goBack()

  await expect(page.getByRole('searchbox', { name: 'Search by name' })).toHaveValue('ân')
  await expect(page.getByRole('list', { name: 'Team members' }).getByRole('listitem')).toHaveCount(2)
  await snap(page, testInfo, 'team-page')
})

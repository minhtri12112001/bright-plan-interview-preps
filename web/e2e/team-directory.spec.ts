import { expect, test, type Page } from '@playwright/test'

import { snap, trackConsoleProblems } from './helpers.ts'

let consoleProblems: string[] = []

test.beforeEach(async ({ page }) => {
  consoleProblems = trackConsoleProblems(page)
  await page.goto('/')
})

test.afterEach(() => {
  expect(consoleProblems).toEqual([])
})

const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search by name' })
const teamList = (page: Page) => page.getByRole('list', { name: 'Team members' })
const listItems = (page: Page) => teamList(page).getByRole('listitem')

test('U1 shows all five people with name and role on load', async ({ page }, testInfo) => {
  await expect(page).toHaveTitle('Team Directory')
  await expect(page.getByRole('heading', { name: 'Team Directory' })).toBeVisible()
  await expect(searchBox(page)).toHaveValue('')
  await expect(listItems(page)).toHaveCount(5)
  await expect(listItems(page).first()).toContainText('Ava Chen')
  await expect(listItems(page).first()).toContainText('Frontend Engineer')
  await expect(page.getByText('5 people')).toBeVisible()

  await snap(page, testInfo, 'initial')
})

test('U2 narrows the list on every keystroke (case-insensitive partial match)', async ({ page }, testInfo) => {
  const input = searchBox(page)

  await input.pressSequentially('A')
  await expect(listItems(page)).toHaveCount(5)

  // "an" matches "Ân Nguyễn" and the middle of "Đức Trần"
  await input.pressSequentially('N')
  await expect(input).toHaveValue('AN')
  await expect(listItems(page)).toHaveCount(2)
  await expect(page.getByText('2 people')).toBeVisible()
  await snap(page, testInfo, 'after-an')

  await input.pressSequentially(' N')
  await expect(listItems(page)).toHaveCount(1)
  await expect(listItems(page)).toContainText('Ân Nguyễn')
  await expect(page.getByText('1 person', { exact: true })).toBeVisible()
  await snap(page, testInfo, 'after-an-n')
})

test('R7 ignores Vietnamese diacritics, including đ', async ({ page }, testInfo) => {
  await searchBox(page).fill('duc tran')

  await expect(listItems(page)).toHaveCount(1)
  await expect(listItems(page)).toContainText('Đức Trần')
  await snap(page, testInfo, 'duc-tran')
})

test('U3 shows the empty state quoting the trimmed query', async ({ page }, testInfo) => {
  await searchBox(page).fill('  xyz ')

  await expect(page.getByText('No one matches "xyz"')).toBeVisible()
  await expect(teamList(page)).toHaveCount(0)
  await expect(page.getByText('0 people')).toBeVisible()
  await snap(page, testInfo, 'empty-state')
})

test('U4a inline "Clear search" resets the list and focuses the input', async ({ page }, testInfo) => {
  const input = searchBox(page)
  const clearButton = page.getByRole('button', { name: 'Clear search' })

  await expect(clearButton).toHaveCount(0)
  await input.fill('ava')
  await expect(clearButton).toBeVisible()
  await snap(page, testInfo, 'before-clear')

  await clearButton.click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(listItems(page)).toHaveCount(5)
  await expect(clearButton).toHaveCount(0)
  await snap(page, testInfo, 'after-clear')
})

test('U4b "Show everyone" in the empty state resets the list and focuses the input', async ({ page }, testInfo) => {
  const input = searchBox(page)

  await input.fill('xyz')
  await snap(page, testInfo, 'before-show-everyone')

  await page.getByRole('button', { name: 'Show everyone' }).click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(listItems(page)).toHaveCount(5)
  await snap(page, testInfo, 'after-show-everyone')
})

test('U5 announces the result count in a polite live region', async ({ page }, testInfo) => {
  const count = page.getByText('5 people')
  await expect(count).toHaveAttribute('aria-live', 'polite')

  await searchBox(page).fill('marcus')
  await expect(page.locator('[aria-live="polite"]')).toHaveText('1 person')
  await snap(page, testInfo, 'live-count')
})

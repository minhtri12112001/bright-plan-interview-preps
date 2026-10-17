import type { Page, TestInfo } from '@playwright/test'

/**
 * Saves a screenshot to e2e/screenshots/<project>/<test-id>--<step>.png
 * (committed so the PR can show them) and attaches it to the HTML report.
 */
export async function snap(page: Page, testInfo: TestInfo, step: string) {
  const testId = testInfo.title.split(' ')[0].toLowerCase()
  const path = `e2e/screenshots/${testInfo.project.name}/${testId}--${step}.png`
  const body = await page.screenshot({ path, fullPage: true, animations: 'disabled' })
  await testInfo.attach(step, { body, contentType: 'image/png' })
}

/**
 * Collects console errors and warnings (React and Radix report problems there, such as a dialog
 * without a title) plus uncaught page errors. Assert the list is empty after each test.
 */
export function trackConsoleProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

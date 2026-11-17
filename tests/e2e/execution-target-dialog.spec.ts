import { expect, test, type Page } from '@playwright/test'
import { prepareAuthenticatedPage } from './auth-fixture'

const getTargetDialog = (page: Page) => page.getByRole('dialog', { name: 'Setup runtime and application' })

test.describe('execution target dialog', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAuthenticatedPage(page)
  })

  test('asks for a runtime and app in a dialog that cannot be dismissed', async ({ page }) => {
    await page.goto('/executions')

    const dialog = getTargetDialog(page)

    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/\/executions$/)
    await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()

    await page.mouse.click(5, 5)
    await expect(dialog).toBeVisible()
  })

  test('keeps the requested page and adds the selected target to the URL', async ({ page }) => {
    await page.goto('/executions')

    await getTargetDialog(page).getByRole('button', { name: 'Use selected app' }).click()

    await expect(getTargetDialog(page)).toHaveCount(0)
    await expect(page).toHaveURL(/\/executions\?runtime=runtime-1&app=App\+1&targetUrl=/)
  })

  test('sends old selector links back to the requested page', async ({ page }) => {
    await page.goto('/select-runtime-application?returnTo=%2Fexecutions')

    await expect(page).toHaveURL(/\/executions$/)
    await expect(getTargetDialog(page)).toBeVisible()
  })
})

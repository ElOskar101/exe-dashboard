import { expect, test, type Page } from '@playwright/test'
import { e2eUser, prepareAuthenticatedPage } from './auth-fixture'

const settingsPathWithExecutionTarget =
  '/settings?runtime=runtime-1&app=App+1&targetUrl=https%3A%2F%2Fruntime.example.com%2Fapi%2Fv1'
const devCccApiUsersMeUrl = 'https://dev-carrier.dentalautomation.ai/api/users/me'

const chooseDevCccApi = async (page: Page) => {
  await page.goto(settingsPathWithExecutionTarget)
  await page.getByLabel('CCC API URL').click()
  await page.getByRole('option', { name: /dev/ }).click()
}

const getStoredCccApiUrl = (page: Page) => page.evaluate(() => window.localStorage.getItem('cccApiUrl'))

test.describe('CCC API switch', () => {
  test.beforeEach(async ({ page }) => {
    await prepareAuthenticatedPage(page)
  })

  test('keeps the current API and the session when the target API rejects the user', async ({ page }) => {
    await page.route(devCccApiUsersMeUrl, async (route) => {
      await route.fulfill({ status: 401, body: 'Profile not found with that access token' })
    })

    await chooseDevCccApi(page)

    await expect(page.getByText('Your account could not be verified in the dev environment')).toBeVisible()
    await expect(page).toHaveURL(/\/settings/)
    expect(await getStoredCccApiUrl(page)).toBeNull()
    expect(await page.evaluate(() => window.localStorage.getItem('token'))).toBe('e2e-token')
  })

  test('switches the API when the target API accepts the user', async ({ page }) => {
    await page.route(devCccApiUsersMeUrl, async (route) => {
      await route.fulfill({ json: e2eUser })
    })

    await chooseDevCccApi(page)

    await expect.poll(() => getStoredCccApiUrl(page)).toBe('https://dev-carrier.dentalautomation.ai')
  })
})

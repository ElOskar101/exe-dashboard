import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { loadEnv } from 'vite'

const authLoginUrl = 'https://dev-carrier.dentalautomation.ai/api/v2/auth/login'
const e2eEnv = loadEnv('e2e', process.cwd(), '')
const username = process.env.E2E_TEST_USERNAME || e2eEnv.E2E_TEST_USERNAME
const password = process.env.E2E_TEST_PASSWORD || e2eEnv.E2E_TEST_PASSWORD

const hasCredentials = Boolean(username && password)

async function login(request: APIRequestContext) {
  const response = await request.post(authLoginUrl, {
    data: {
      username,
      password,
    },
  })

  expect(response.ok()).toBeTruthy()

  const body = (await response.json()) as { token?: string }
  expect(body.token).toBeTruthy()

  return body.token as string
}

async function stubProtectedRouteDependencies(page: Page) {
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      json: {
        _id: 'e2e-user',
        username: 'e2e',
        fullName: 'E2E Test User',
        area: 'QA',
        roles: [{ name: 'admin', permission: [] }],
      },
    })
  })

  await page.route('**/api/v2/customers**', async (route) => {
    await route.fulfill({
      json: {
        customers: [],
      },
    })
  })
}

test.describe('protected home route', () => {
  test('redirects anonymous users to login', async ({ page }) => {
    await page.route(
      'https://auth.controlcentralcarrier.com/**',
      async (route) => {
        await route.fulfill({ body: 'Login' })
      },
    )

    await page.goto('/')

    await expect(page).toHaveURL(
      /https:\/\/auth\.controlcentralcarrier\.com\/\?url=.+&mode=dev/,
    )
  })

  test('allows logged in users to see the home route', async ({
    page,
    request,
  }) => {
    test.skip(
      !hasCredentials,
      'Set E2E_TEST_USERNAME and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Lastest executions')).toBeVisible()
    await expect(page.getByText('Execution data')).toBeVisible()
  })
})

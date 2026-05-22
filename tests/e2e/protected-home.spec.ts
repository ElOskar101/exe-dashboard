import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { loadEnv } from 'vite'

const e2eEnv = loadEnv('e2e', process.cwd(), '')
const authLoginUrl = process.env.E2E_AUTH_LOGIN_URL || e2eEnv.E2E_AUTH_LOGIN_URL
const username = process.env.E2E_TEST_USERNAME || e2eEnv.E2E_TEST_USERNAME
const password = process.env.E2E_TEST_PASSWORD || e2eEnv.E2E_TEST_PASSWORD

const canLogin = Boolean(authLoginUrl && username && password)

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
}

test.describe('protected executions route', () => {
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

  test('allows logged in users to see the execution wizard', async ({
    page,
    request,
  }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Create execution')).toBeVisible()
    await expect(
      page.getByText(
        'Build the POST /executions payload step by step and submit it when everything is ready.',
      ),
    ).toBeVisible()
  })

  test('validates invalid steps while navigating and supports back navigation', async ({
    page,
    request,
  }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Patient name')).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(
      page.getByText('This field is required.').first(),
    ).toBeVisible()
    await expect(page.getByLabel('Bot name')).toBeVisible()

    await page.getByLabel('Bot name').fill('Eligibility Runner')
    await page.getByLabel('Portal URL').fill('https://carrier.example.com')
    await page.getByLabel('Username').fill('qa.operator')
    await page.getByLabel('Password').fill('super-secret')
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByLabel('Patient name')).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()

    await expect(page.getByLabel('Bot name')).toBeVisible()
    await expect(page.getByLabel('Bot name')).toHaveValue('Eligibility Runner')
  })

  test('shows review content for an empty draft', async ({ page, request }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText('Not filled').first()).toBeVisible()
    await expect(page.getByText('No flags enabled')).toBeVisible()
    await expect(page.getByText('"numberOfThreads": ""')).toBeVisible()
  })

  test('submits the built payload with multiple patients', async ({
    page,
    request,
  }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)
    let submittedPayload: unknown = null

    await stubProtectedRouteDependencies(page)
    await page.route('**/executions', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      submittedPayload = route.request().postDataJSON()

      await route.fulfill({
        json: {
          _id: 'execution-e2e',
          createdBy: 'e2e-user',
          playwrightProject: 'chromium',
          status: 'process',
          note: [],
          attachments: [],
          client: 'qa-client',
          clinic: 'qa-clinic',
          execution: 'payload',
          bot: 'Eligibility Runner',
          createdAt: '2026-05-21T14:00:00.000Z',
          updatedAt: '2026-05-21T14:00:00.000Z',
          jobId: 'job-e2e',
          playwrightExecutionId: 'playwright-e2e',
          pid: 1234,
          startedAt: '2026-05-21T14:00:00.000Z',
          finishedAt: '',
        },
      })
    })
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await page.getByLabel('Bot name').fill('Eligibility Runner')
    await page.getByLabel('Portal URL').fill('https://carrier.example.com')
    await page.getByLabel('Username').fill('qa.operator')
    await page.getByLabel('Password').fill('super-secret')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Patient name').fill('Jane Doe')
    await page.getByLabel('Member ID').fill('111111')
    await page.getByLabel('Date of birth').fill('1990-01-01')
    await page.getByRole('button', { name: 'Add patient' }).click()
    await page.getByLabel('Patient name').nth(1).fill('John Doe')
    await page.getByLabel('Member ID').nth(1).fill('222222')
    await page.getByLabel('Date of birth').nth(1).fill('1992-02-02')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Number of threads').fill('4')
    await page.getByRole('button', { name: 'Parallel' }).click()
    await page.getByRole('button', { name: 'ELG' }).click()
    await page.getByRole('checkbox', { name: 'In network' }).click()
    await page.getByRole('checkbox', { name: 'Short form' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText('"numberOfThreads": 4')).toBeVisible()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText('Execution created')).toBeVisible()
    await expect(page.getByText('execution-e2e')).toBeVisible()
    expect(submittedPayload).toEqual({
      bot: {
        botName: 'Eligibility Runner',
        url: 'https://carrier.example.com',
        username: 'qa.operator',
        password: 'super-secret',
      },
      execution: {
        patients: [
          {
            patientName: 'Jane Doe',
            memberId: '111111',
            dateOfBirth: '1990-01-01',
          },
          {
            patientName: 'John Doe',
            memberId: '222222',
            dateOfBirth: '1992-02-02',
          },
        ],
        numberOfThreads: 4,
        mode: 'parallel',
        verificationType: 'ELG',
      },
      config: {
        'in-network': true,
        shortForm: true,
        claimsForm: false,
      },
    })
  })

  test('keeps the review state after a failed submission', async ({
    page,
    request,
  }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.route('**/executions', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 500,
        json: {
          message: 'Execution API is unavailable.',
        },
      })
    })
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/')

    await page.getByLabel('Bot name').fill('Retry Bot')
    await page.getByLabel('Portal URL').fill('https://retry.example.com')
    await page.getByLabel('Username').fill('retry.user')
    await page.getByLabel('Password').fill('retry-secret')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Patient name').fill('Retry Patient')
    await page.getByLabel('Member ID').fill('999999')
    await page.getByLabel('Date of birth').fill('1988-03-03')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Number of threads').fill('2')
    await page.getByRole('button', { name: 'Standard' }).click()
    await page.getByRole('button', { name: 'FBD' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText('Execution API is unavailable.')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create execution' }),
    ).toBeVisible()
    await expect(page.getByText('Retry Patient', { exact: true })).toBeVisible()
    await expect(page.getByText('"mode": ""')).toBeVisible()
  })
})

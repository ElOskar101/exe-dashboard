import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
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
  await page.route('**/users/me', async (route) => {
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
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/api/v2/customers/customer-1')) {
      await route.fulfill({
        json: {
          _id: 'customer-1',
          clientName: 'Legacy Dental Care',
          isActive: true,
          clinic: [
            {
              _id: 'clinic-1',
              clinicName: 'Downtown Clinic',
            },
          ],
        },
      })
      return
    }

    await route.fulfill({
      json: {
        totalDocs: 1,
        totalPages: 1,
        query: {},
        customers: [
          {
            _id: 'customer-1',
            clientName: 'Legacy Dental Care',
            isActive: true,
            createdAt: '2026-05-21T14:00:00.000Z',
          },
        ],
      },
    })
  })

  await page.route('**/api/v2/clinics/**/clinic-bots', async (route) => {
    await route.fulfill({
      json: [
        {
          _id: 'clinic-bot-1',
          status: {
            _id: 'clinic-bot-status-1',
            description: 'Active',
          },
          username: 'qa.operator',
          password: 'encrypted-secret',
          bot: {
            _id: 'bot-1',
            botName: 'Eligibility Runner',
            isActive: true,
            status: {
              _id: 'bot-status-1',
              description: 'Developed',
            },
            type: 'ELG',
            urlLogin: 'https://carrier.example.com',
          },
        },
      ],
    })
  })

  await page.route('**/api/v2/playwright-projects**', async (route) => {
    await route.fulfill({
      json: [
        {
          _id: 'project-1',
          name: 'liberty',
          associatedWith: [
            {
              _id: 'bot-1',
              botName: 'Eligibility Runner',
              isActive: true,
              type: 'ELG',
              urlLogin: 'https://carrier.example.com',
            },
          ],
        },
      ],
    })
  })

  await page.route('**/api/v1/stats', async (route) => {
    await route.fulfill({
      json: {
        status: 'ok',
        timestamp: '2026-05-21T14:00:00.000Z',
        uptime: 120,
        server: { status: 'up' },
        mongo: { status: 'up', readyState: 1, state: 'connected' },
        redis: { status: 'up' },
        jobs: {
          waiting: 1,
          active: 1,
          completed: 8,
          failed: 2,
          delayed: 0,
          paused: 0,
          prioritized: 0,
          waitingChildren: 0,
          queued: 1,
          running: 1,
        },
      },
    })
  })

  await page.route('**/api/v1/executions**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      json: [
        {
          _id: 'execution-home',
          createdBy: 'e2e-user',
          project: 'liberty',
          status: 'completed',
          client: 'Legacy Dental Care',
          clinic: 'Downtown Clinic',
          execution: '2026-04-27',
          botName: 'Eligibility Runner',
          createdAt: '2026-05-21T14:00:00.000Z',
          updatedAt: '2026-05-21T14:00:00.000Z',
          jobId: 'job-home',
          playwrightExecutionId: 'playwright-home',
        },
      ],
    })
  })

  await page.route('**/api/clinicbots/decrypt/**', async (route) => {
    await route.fulfill({
      body: '"super-secret"',
      contentType: 'text/plain',
    })
  })

  await page.route('**/api/v2/executions/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/api/v2/executions/clinic-1/days')) {
      await route.fulfill({
        json: [
          {
            _id: 'day-1',
            sheetName: '2026-04-27',
            trashed: false,
          },
          {
            _id: 'day-trashed',
            sheetName: '2026-05-09',
            trashed: true,
          },
        ],
      })
      return
    }

    if (url.pathname.endsWith('/api/v2/executions/day-1')) {
      await route.fulfill({
        json: {
          _id: 'day-1',
          sheetName: '2026-04-27',
          rows: [
            {
              _id: 'row-1',
              cells: [
                { key: 'practice', value: 'Downtown Clinic' },
                { key: 'memberid', value: '111111' },
                { key: 'subscriber_zip_code', value: '90001' },
                { key: 'subscriber_first_name', value: 'Jane' },
                { key: 'subscriber_last_name', value: 'Doe' },
                { key: 'subscriber_dob', value: '01/01/1980' },
                { key: 'patient_first_name', value: 'Jane' },
                { key: 'patient_last_name', value: 'Doe' },
                { key: 'patient_dob', value: '01/01/1990' },
                { key: 'relationship_to_subscriber', value: 'Self' },
                { key: 'type_of_verification', value: 'ELG' },
                { key: 'files_s_name', value: 'jane-doe.pdf' },
              ],
            },
            {
              _id: 'row-2',
              cells: [
                { key: 'practice', value: 'Downtown Clinic' },
                { key: 'memberid', value: '222222' },
                { key: 'subscriber_zip_code', value: '90002' },
                { key: 'subscriber_first_name', value: 'Janet' },
                { key: 'subscriber_last_name', value: 'Doe' },
                { key: 'subscriber_dob', value: '02/02/1980' },
                { key: 'patient_first_name', value: 'John' },
                { key: 'patient_last_name', value: 'Doe' },
                { key: 'patient_dob', value: '02/02/1992' },
                { key: 'relationship_to_subscriber', value: 'Child' },
                { key: 'type_of_verification', value: 'FBD' },
                { key: 'files_s_name', value: 'john-doe.pdf' },
              ],
            },
            {
              _id: 'row-blank',
              cells: [
                { key: 'patient_first_name', value: 'EMPTY' },
                { key: 'patient_last_name', value: ' ' },
                { key: 'memberid', value: 'Empty' },
              ],
            },
          ],
          trashed: false,
        },
      })
      return
    }

    await route.fallback()
  })
}

async function selectCustomerAndClinic(page: Page) {
  await page.getByLabel('Client').fill('Legacy')
  await page.getByRole('button', { name: /Legacy Dental Care/ }).click()
  await page.getByRole('combobox', { name: 'Clinic' }).click()
  await page.getByRole('option', { name: 'Downtown Clinic' }).click()
}

async function importPatientsFromCCC(page: Page) {
  await page.getByRole('combobox', { name: 'Execution' }).click()
  await page.getByRole('option', { name: '2026-04-27' }).click()
  await expect(page.getByRole('option', { name: '2026-05-09' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Get patients' }).click()
  await expect(page.getByText('Imported patients: 2')).toBeVisible()
  await expect(page.getByText('Jane', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('John', { exact: true }).first()).toBeVisible()
}

async function completeBotStep(
  page: Page,
  {
    projectName = 'liberty',
    associatedBotName = 'Eligibility Runner',
    botName = 'Eligibility Runner',
    portalUrl = 'https://carrier.example.com',
    username = 'qa.operator',
    password = 'super-secret',
  } = {},
) {
  const passwordInput = page.getByRole('textbox', { name: 'Password' })

  await page.getByRole('combobox', { name: 'Project' }).click()
  await page.getByRole('option', { name: projectName }).click()
  await page.getByRole('combobox', { name: 'Bot' }).click()
  await page.getByRole('option', { name: associatedBotName }).click()
  await expect(passwordInput).toBeEnabled()
  await expect(passwordInput).toHaveValue('super-secret')
  await expect(page.getByLabel('Bot name')).toHaveValue(botName)
  await expect(page.getByLabel('Bot name')).toHaveAttribute('readonly', '')
  await expect(page.getByLabel('Portal URL')).toHaveValue(portalUrl)
  await expect(page.getByLabel('Portal URL')).toHaveAttribute('readonly', '')
  await page.getByLabel('Username').fill(username)
  await passwordInput.fill(password)
  await page.getByRole('button', { name: 'Next' }).click()
}

test.describe('protected executions route', () => {
  test('redirects anonymous users to login', async ({ page }) => {
    await page.route('https://auth.controlcentralcarrier.com/**', async (route) => {
      await route.fulfill({ body: 'Login' })
    })

    await page.goto('/')

    await expect(page).toHaveURL(/https:\/\/auth\.controlcentralcarrier\.com\/\?url=.+&mode=dev/)
  })

  test('allows logged in users to see the home dashboard', async ({ page, request }) => {
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
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
    await expect(page.getByText('Latest executions')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Legacy Dental Care' })).toBeVisible()
  })

  test('minimizes the desktop sidebar from the header trigger', async ({ page, request }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/create')

    const sidebar = page.locator('[data-slot="sidebar-container"]')
    await expect(page.getByRole('button', { name: 'Minimize executions sidebar' })).toBeVisible()
    await expect(sidebar).toBeVisible()

    const expandedSidebarBox = await sidebar.boundingBox()
    expect(expandedSidebarBox?.width).toBeGreaterThan(200)

    await page.getByRole('button', { name: 'Minimize executions sidebar' }).click()
    await expect(page.getByRole('button', { name: 'Expand executions sidebar' })).toBeVisible()

    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBeLessThan(100)
  })

  test('validates invalid steps while navigating and supports back navigation', async ({ page, request }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)

    await stubProtectedRouteDependencies(page)
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/create')

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Select a client and clinic in the patients step before choosing a bot.')).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('This field is required.').first()).toBeVisible()
    await expect(page.getByLabel('Client')).toBeVisible()

    await selectCustomerAndClinic(page)
    await importPatientsFromCCC(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('combobox', { name: 'Project' })).toBeVisible()
    await expect(page.getByText('This field is required.').first()).toBeVisible()

    await completeBotStep(page)
    await expect(page.getByLabel('Workers')).toBeVisible()

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

    await page.goto('/create')

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText('Not filled').first()).toBeVisible()
    await expect(page.getByText('"workers": 2')).toBeVisible()
    await expect(page.getByText('"retries": 1')).toBeVisible()
  })

  test('submits the built payload with multiple patients', async ({ page, request }) => {
    test.skip(
      !canLogin,
      'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
    )

    const token = await login(request)
    let submittedPayload: unknown = null
    const createdExecution = {
      _id: 'execution-e2e',
      createdBy: 'e2e-user',
      project: 'chromium',
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
    }

    await stubProtectedRouteDependencies(page)
    await page.route('**/api/v1/executions/execution-e2e', async (route) => {
      await route.fulfill({ json: createdExecution })
    })
    await page.route('**/executions', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      submittedPayload = route.request().postDataJSON()

      await route.fulfill({
        json: createdExecution,
      })
    })
    await page.addInitScript((accessToken) => {
      window.localStorage.setItem('token', accessToken)
    }, token)

    await page.goto('/create')

    await selectCustomerAndClinic(page)
    await importPatientsFromCCC(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await completeBotStep(page)

    await page.getByLabel('Workers').fill('4')
    await page.getByLabel('Retries').fill('2')
    await page.getByLabel('Other config').fill('{ "parallel": true, "inNetwork": true }')
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText('"workers": 4')).toBeVisible()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page).toHaveURL('/create')
    await expect(page.getByText('Execution created')).toBeVisible()
    const viewExecutionButton = page.getByRole('button', { name: 'View execution' })
    await expect(viewExecutionButton).toBeVisible()
    expect(submittedPayload).toEqual({
      project: 'liberty',
      createdBy: 'E2E Test User',
      client: 'Legacy Dental Care',
      clinic: 'Downtown Clinic',
      execution: '2026-04-27',
      botName: 'Eligibility Runner',
      meta: {
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'qa.operator',
          password: 'super-secret',
          otherInformation: {
            specifyPayer: 'None',
          },
        },
        patients: [
          {
            patientName: 'Jane',
            patientLastName: 'Doe',
            patientMemberId: '111111',
            patientDob: '01/01/1990',
            policyHolderName: 'Jane',
            policyHolderLastName: 'Doe',
            policyHolderDob: '01/01/1980',
            relationship: 'Self',
            zipCode: '90001',
            clinic: 'Downtown Clinic',
            verificationType: 'elg',
            filenames: 'jane-doe.pdf',
            otherInformation: {},
          },
          {
            patientName: 'John',
            patientLastName: 'Doe',
            patientMemberId: '222222',
            patientDob: '02/02/1992',
            policyHolderName: 'Janet',
            policyHolderLastName: 'Doe',
            policyHolderDob: '02/02/1980',
            relationship: 'Child',
            zipCode: '90002',
            clinic: 'Downtown Clinic',
            verificationType: 'fbd',
            filenames: 'john-doe.pdf',
            otherInformation: {},
          },
        ],
        config: {
          parallel: true,
          inNetwork: true,
        },
        rv: {},
        workers: 4,
        retries: 2,
      },
    })

    await viewExecutionButton.click()
    await expect(page).toHaveURL('/execution/execution-e2e')
  })

  test('keeps the review state after a failed submission', async ({ page, request }) => {
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

    await page.goto('/create')

    await selectCustomerAndClinic(page)
    await importPatientsFromCCC(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await completeBotStep(page, {
      username: 'retry.user',
      password: 'retry-secret',
    })

    await page.getByLabel('Workers').fill('2')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText('Execution API is unavailable.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create execution' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Jane Doe' })).toBeVisible()
    await expect(page.getByText('"workers": 2')).toBeVisible()
  })
})

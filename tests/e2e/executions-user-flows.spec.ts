import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { loadEnv } from 'vite'

const e2eEnv = loadEnv('e2e', process.cwd(), '')
const authLoginUrl = process.env.E2E_AUTH_LOGIN_URL || e2eEnv.E2E_AUTH_LOGIN_URL
const username = process.env.E2E_TEST_USERNAME || e2eEnv.E2E_TEST_USERNAME
const password = process.env.E2E_TEST_PASSWORD || e2eEnv.E2E_TEST_PASSWORD

const canLogin = Boolean(authLoginUrl && username && password)
const executionTargetSearch = 'runtime=runtime-1&app=App+1&targetUrl=https%3A%2F%2Fruntime.example.com%2Fapi%2Fv1'

const withExecutionTarget = (path: string) => `${path}${path.includes('?') ? '&' : '?'}${executionTargetSearch}`

interface ExecutionFixture {
  _id: string
  createdBy: string
  project: string
  status: 'queued' | 'running' | 'completed' | 'cancelled' | 'failed' | 'process'
  client: string
  clinic: string
  execution: string
  botName: string
  createdAt: string
  updatedAt: string
  jobId: string
  playwrightExecutionId: string
  logs?: string
  meta?: {
    bot: {
      botName: string
      targetUrl: string
      username: string
      password: string
      otherInformation: Record<string, unknown>
    }
    patients: Array<{
      patientName: string
      patientLastName: string
      patientMemberId: string
      patientDob: string
      policyHolderName: string
      policyHolderLastName: string
      policyHolderDob: string
      relationship: string
      zipCode: string
      clinic: string
      verificationType: string
      filenames: string
      otherInformation: Record<string, unknown>
    }>
    config: Record<string, unknown>
    rv: Record<string, never>
    workers: number
    retries: number
  }
}

const createExecutionMeta = (): NonNullable<ExecutionFixture['meta']> => ({
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
  ],
  config: {
    parallel: true,
  },
  rv: {},
  workers: 4,
  retries: 2,
})

const createExecution = (overrides: Partial<ExecutionFixture> = {}): ExecutionFixture => ({
  _id: 'execution-1',
  createdBy: 'e2e-user',
  project: 'chromium',
  status: 'completed',
  client: 'Legacy Dental Care',
  clinic: 'Downtown Clinic',
  execution: '2026-05-25',
  botName: 'Eligibility Runner',
  createdAt: '2026-05-25T14:00:00.000Z',
  updatedAt: '2026-05-25T14:10:00.000Z',
  jobId: 'job-1',
  playwrightExecutionId: 'report-1',
  meta: createExecutionMeta(),
  ...overrides,
})

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

async function prepareAuthenticatedPage(page: Page, request: APIRequestContext) {
  test.skip(
    !canLogin,
    'Set E2E_AUTH_LOGIN_URL, E2E_TEST_USERNAME, and E2E_TEST_PASSWORD in .env.e2e.local or your shell to run authenticated e2e tests.',
  )

  const token = await login(request)

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
  await page.route('**/api/v1/stats', async (route) => {
    await route.fulfill({
      json: {
        status: 'ok',
        timestamp: '2026-05-25T14:00:00.000Z',
        uptime: 120,
        server: { status: 'up' },
        mongo: { status: 'up', readyState: 1, state: 'connected' },
        redis: { status: 'up' },
        jobs: {
          waiting: 0,
          active: 1,
          completed: 4,
          failed: 1,
          delayed: 0,
          paused: 0,
          prioritized: 0,
          waitingChildren: 0,
          queued: 0,
          running: 1,
        },
      },
    })
  })
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem('token', accessToken)
  }, token)
}

function isExecutionListRequest(urlString: string) {
  const url = new URL(urlString)

  return url.pathname.endsWith('/api/v1/executions')
}

async function stubExecutionList(page: Page, getExecutions: () => ExecutionFixture[]) {
  await stubPlaywrightProjects(page, getExecutions)

  await page.route('**/api/v1/executions**', async (route) => {
    const url = new URL(route.request().url())

    if (!isExecutionListRequest(url.toString()) || route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    const project = url.searchParams.get('project')
    const limit = Number(url.searchParams.get('limit'))
    const executions = getExecutions().filter((execution) => !project || execution.project === project)
    const limitedExecutions = Number.isInteger(limit) && limit > 0 ? executions.slice(0, limit) : executions

    await route.fulfill({ json: limitedExecutions })
  })
}

async function stubPlaywrightProjects(page: Page, getExecutions: () => ExecutionFixture[]) {
  await page.route('**/api/v2/playwright-projects**', async (route) => {
    const projects = Array.from(new Set(getExecutions().map((execution) => execution.project)))
      .filter(Boolean)
      .sort((leftProject, rightProject) => leftProject.localeCompare(rightProject))
      .map((project, index) => ({
        _id: `project-${index + 1}`,
        name: project,
        active: true,
        associatedWith: [],
      }))

    await route.fulfill({ json: projects })
  })
}

async function stubExecutionDetails(page: Page, executionId: string, getExecution: () => ExecutionFixture) {
  await page.route(`**/api/v1/executions/${executionId}`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({ json: getExecution() })
  })
}

async function stubExecutionCustomers(
  page: Page,
  customersById: Record<
    string,
    {
      _id: string
      clientName: string
      isActive?: boolean
      clinic: Array<{ _id: string; clinicName: string }>
    }
  >,
) {
  await page.route('**/api/v2/customers**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/api/v2/customers')) {
      await route.fulfill({
        json: {
          totalDocs: Object.keys(customersById).length,
          totalPages: 1,
          query: {},
          customers: Object.values(customersById).map((customer) => ({
            _id: customer._id,
            clientName: customer.clientName,
            isActive: customer.isActive ?? true,
            createdAt: '2026-05-21T14:00:00.000Z',
          })),
        },
      })
      return
    }

    const customerId = url.pathname.split('/').pop()

    if (!customerId || !(customerId in customersById)) {
      await route.fulfill({ status: 404, json: { message: 'Customer not found' } })
      return
    }

    await route.fulfill({
      json: {
        isActive: true,
        ...customersById[customerId],
      },
    })
  })
}

async function stubWizardDependencies(page: Page, incompletePatient = false) {
  await page.route('**/api/v2/customers**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/api/v2/customers/customer-1')) {
      await route.fulfill({
        json: {
          _id: 'customer-1',
          clientName: 'Legacy Dental Care',
          isActive: true,
          clinic: [{ _id: 'clinic-1', clinicName: 'Downtown Clinic' }],
        },
      })
      return
    }

    await route.fulfill({
      json: {
        totalDocs: 1,
        totalPages: 1,
        customers: [{ _id: 'customer-1', clientName: 'Legacy Dental Care', isActive: true }],
      },
    })
  })
  await page.route('**/api/v2/clinics/**/clinic-bots', async (route) => {
    await route.fulfill({
      json: [
        {
          _id: 'clinic-bot-1',
          status: { _id: 'status-1', description: 'Active' },
          username: 'qa.operator',
          password: 'encrypted',
          bot: {
            _id: 'bot-1',
            botName: 'Eligibility Runner',
            isActive: true,
            status: { _id: 'bot-status-1', description: 'Developed' },
            type: 'ELG',
            urlLogin: 'https://carrier.example.com',
          },
        },
      ],
    })
  })
  await page.route('**/api/clinicbots/decrypt/**', async (route) => {
    await route.fulfill({ body: '"super-secret"', contentType: 'text/plain' })
  })
  await page.route('**/api/v2/executions/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/api/v2/executions/clinic-1/days')) {
      await route.fulfill({ json: [{ _id: 'day-1', sheetName: '2026-04-27', trashed: false }] })
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
                { key: 'patient_first_name', value: incompletePatient ? '' : 'Jane' },
                { key: 'patient_last_name', value: 'Doe' },
                { key: 'memberid', value: '111111' },
                { key: 'patient_dob', value: '01/01/1990' },
                { key: 'subscriber_first_name', value: 'Jane' },
                { key: 'subscriber_last_name', value: 'Doe' },
                { key: 'subscriber_dob', value: '01/01/1980' },
                { key: 'relationship_to_subscriber', value: 'Self' },
                { key: 'subscriber_zip_code', value: '90001' },
                { key: 'practice', value: 'Downtown Clinic' },
                { key: 'type_of_verification', value: 'ELG' },
                { key: 'files_s_name', value: 'jane-doe.pdf' },
              ],
            },
          ],
        },
      })
      return
    }

    await route.fallback()
  })
}

async function selectExecutionPatients(page: Page) {
  await page.getByLabel('Client').fill('Legacy')
  await page.getByRole('button', { name: /Legacy Dental Care/ }).click()
  await page.getByRole('combobox', { name: 'Clinic' }).click()
  await page.getByRole('option', { name: 'Downtown Clinic' }).click()
  await page.getByRole('combobox', { name: 'Execution' }).click()
  await page.getByRole('option', { name: '2026-04-27' }).click()
  await page.getByRole('button', { name: 'Get patients' }).click()
}

test.describe('execution user flows', () => {
  test('shows the empty execution history state', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    await stubExecutionList(page, () => [])

    await page.goto(withExecutionTarget('/create'))

    await expect(page.getByText('No executions yet.')).toBeVisible()
  })

  test('renders the executions page table and opens the patients dialog from the summary cell', async ({
    page,
    request,
  }) => {
    await prepareAuthenticatedPage(page, request)
    const basePatient = createExecutionMeta().patients[0]
    const execution = createExecution({
      status: 'running',
      meta: {
        ...createExecutionMeta(),
        patients: [
          basePatient,
          {
            ...basePatient,
            patientName: 'John',
            patientLastName: 'Smith',
            patientMemberId: '222222',
            patientDob: '02/02/1992',
            policyHolderName: 'Janet',
            policyHolderLastName: 'Smith',
            policyHolderDob: '02/02/1982',
            relationship: 'Child',
            zipCode: '90002',
            filenames: 'john-smith.pdf',
          },
          {
            ...basePatient,
            patientName: 'Mary',
            patientLastName: 'Jones',
            patientMemberId: '333333',
            patientDob: '03/03/1993',
            policyHolderName: 'Mark',
            policyHolderLastName: 'Jones',
            policyHolderDob: '03/03/1983',
            relationship: 'Spouse',
            zipCode: '90003',
            filenames: 'mary-jones.pdf',
          },
          {
            ...basePatient,
            patientName: 'Alex',
            patientLastName: 'Taylor',
            patientMemberId: '444444',
            patientDob: '04/04/1994',
            policyHolderName: 'Avery',
            policyHolderLastName: 'Taylor',
            policyHolderDob: '04/04/1984',
            relationship: 'Dependent',
            zipCode: '90004',
            filenames: 'alex-taylor.pdf',
          },
        ],
      },
    })

    await stubExecutionList(page, () => [execution])
    await stubExecutionCustomers(page, {
      'customer-1': {
        _id: 'customer-1',
        clientName: 'Legacy Dental Care',
        clinic: [{ _id: 'clinic-1', clinicName: 'Downtown Clinic' }],
      },
    })

    await page.goto(withExecutionTarget('/executions'))

    await expect(page).toHaveURL(withExecutionTarget('/executions'))
    await expect(page.getByRole('heading', { name: 'All executions' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Patients' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Legacy Dental Care' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Downtown Clinic' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Running' })).toBeVisible()

    await expect(page.getByText('Jane Doe, John Smith, +2')).toBeVisible()

    const patientTrigger = page.getByRole('button', { name: 'View patients for execution 2026-05-25' })
    await patientTrigger.click()

    await expect(page.getByRole('heading', { name: 'Patients' })).toBeFocused()
    await expect(page.getByText('Review the patients stored for execution 2026-05-25.')).toBeVisible()
    await expect(page.getByText('Jane', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('John', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Mary', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Alex', { exact: true }).first()).toBeVisible()

    await page.getByRole('dialog', { name: 'Patients' }).getByRole('button', { name: 'Close' }).first().click()
    await expect(page.getByRole('heading', { name: 'Patients' })).not.toBeVisible()
  })

  test('navigates to execution details from the executions table details action', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({ status: 'queued' })

    await stubExecutionList(page, () => [execution])
    await stubExecutionCustomers(page, {
      'customer-1': {
        _id: 'customer-1',
        clientName: 'Legacy Dental Care',
        clinic: [{ _id: 'clinic-1', clinicName: 'Downtown Clinic' }],
      },
    })
    await stubExecutionDetails(page, execution._id, () => execution)

    await page.goto(withExecutionTarget('/executions'))
    await page
      .getByRole('row', { name: /2026-05-25 Queued Legacy Dental Care Downtown Clinic .* Details/ })
      .getByRole('button', { name: 'Details' })
      .click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
    await expect(page.getByText('Execution details')).toBeVisible()
  })

  test('loads execution history and opens an execution detail page', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({ status: 'queued' })

    await stubExecutionList(page, () => [
      execution,
      createExecution({ _id: 'execution-2', execution: '2026-05-26', status: 'running' }),
    ])
    await stubExecutionDetails(page, execution._id, () => execution)

    await page.goto(withExecutionTarget('/create'))

    await expect(page.getByText('chromium')).toBeVisible()
    await expect(page.getByText('2026-05-26')).toBeVisible()
    await expect(page.getByRole('link', { name: /2026-05-25/ })).toBeVisible()
    await expect(page.getByLabel('queued')).toBeVisible()
    await expect(page.getByLabel('running')).toBeVisible()
    await page.getByText('2026-05-25').click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
    await expect(page.getByText('Execution details')).toBeVisible()
  })

  test('shows project execution popovers in the minimized sidebar', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({ status: 'queued' })
    const secondExecution = createExecution({
      _id: 'execution-2',
      execution: '2026-05-26',
      project: 'firefox',
      status: 'running',
    })

    await stubExecutionList(page, () => [execution, secondExecution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await stubExecutionDetails(page, secondExecution._id, () => secondExecution)

    await page.goto(withExecutionTarget('/create'))

    await page.getByRole('button', { name: 'Minimize executions sidebar' }).click()
    await expect(page.getByRole('button', { name: 'Expand executions sidebar' })).toBeVisible()
    await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px')

    await expect(page.getByRole('button', { name: 'All executions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create execution' })).toBeVisible()
    await expect(page.getByText('No executions yet.')).not.toBeVisible()

    await page.getByRole('button', { name: 'chromium executions' }).click()

    await expect(page.getByRole('heading', { name: 'chromium' })).toBeVisible()
    await page.getByRole('link', { name: /2026-05-25/ }).click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
  })

  test('shows an executions load error and retries successfully', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    let shouldSucceed = false

    await stubPlaywrightProjects(page, () => [createExecution()])
    await page.route('**/api/v1/executions**', async (route) => {
      if (!isExecutionListRequest(route.request().url())) {
        await route.fallback()
        return
      }

      if (!shouldSucceed) {
        await route.fulfill({ status: 500, json: { message: 'Unable to load executions.' } })
        return
      }

      await route.fulfill({ json: [createExecution()] })
    })

    await page.goto(withExecutionTarget('/'))

    await expect(page.getByText('Executions could not be loaded')).toBeVisible({ timeout: 15_000 })
    shouldSucceed = true
    await page
      .getByRole('alert')
      .filter({ hasText: 'Executions could not be loaded' })
      .getByRole('button', { name: 'Retry' })
      .click()
    await expect(page.getByText('2026-05-25')).toBeVisible()
  })

  test('cancels deleting an execution from the sidebar', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    let deleteRequested = false

    await stubExecutionList(page, () => [createExecution()])
    await page.route('**/api/v1/executions/execution-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequested = true
      }

      await route.fulfill({ json: createExecution() })
    })

    await page.goto(withExecutionTarget('/'))

    await page.getByRole('button', { name: 'Delete 2026-05-25' }).click({ force: true })
    await expect(page.getByText('Delete execution?')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('link', { name: '2026-05-25', exact: true })).toBeVisible()
    expect(deleteRequested).toBe(false)
  })

  test('deletes the selected execution and returns to all executions', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    let executions = [createExecution()]
    let deletedExecutionId: string | null = null

    await stubExecutionList(page, () => executions)
    await stubExecutionDetails(page, 'execution-1', () => executions[0])
    await page.route('**/api/v1/executions/execution-1', async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback()
        return
      }

      deletedExecutionId = 'execution-1'
      executions = []
      await route.fulfill({ json: createExecution() })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await page.getByRole('button', { name: 'Delete 2026-05-25' }).click({ force: true })
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page).toHaveURL(withExecutionTarget('/executions'))
    await expect(page.getByRole('cell', { name: 'No executions yet.' })).toBeVisible()
    expect(deletedExecutionId).toBe('execution-1')
  })

  test('shows execution details with historical logs and debug payload', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({
      status: 'running',
      logs: 'Starting carrier login\nLoading patient Jane Doe\n',
    })

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await expect(page.getByText('Eligibility Runner - 2026-05-25')).toBeVisible()
    await expect(page.locator('[data-slot="card-title"]').getByText('Running')).toBeVisible()
    await expect(page.getByText('Starting carrier login')).toBeVisible()
    await page.getByRole('button', { name: 'Debug' }).click()
    await expect(page.getByText('Execution debug details')).toBeVisible()
    await expect(page.getByText('"jobId": "job-1"')).toBeVisible()
  })

  test('re-runs a finished execution after confirmation', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const originalExecution = createExecution()
    let recreatedPayload: unknown = null

    await stubExecutionList(page, () => [originalExecution])
    await page.route('**/api/v1/executions/execution-1', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }

      await route.fulfill({ json: originalExecution })
    })
    await page.route('**/api/v1/executions/execution-2', async (route) => {
      await route.fulfill({
        json: createExecution({
          _id: 'execution-2',
          execution: '2026-05-25 rerun',
          jobId: 'job-2',
          playwrightExecutionId: 'report-2',
          status: 'queued',
        }),
      })
    })
    await page.route('**/api/v1/executions**', async (route) => {
      if (!isExecutionListRequest(route.request().url()) || route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      recreatedPayload = route.request().postDataJSON()

      await route.fulfill({
        json: createExecution({
          _id: 'execution-2',
          execution: '2026-05-25 rerun',
          jobId: 'job-2',
          playwrightExecutionId: 'report-2',
          status: 'queued',
        }),
      })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await page.getByRole('button', { name: /^Re-run$/ }).click()
    await expect(page.getByText('Re-run this execution?')).toBeVisible()
    await expect(page.getByText('Execution summary')).toBeVisible()
    await expect(page.getByText('Patients')).toBeVisible()
    await page.getByRole('button', { name: /^Confirm Re-run$/ }).click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-2'))
    expect(recreatedPayload).toEqual({
      project: 'chromium',
      createdBy: 'e2e-user',
      client: 'Legacy Dental Care',
      clinic: 'Downtown Clinic',
      execution: '2026-05-25',
      botName: 'Eligibility Runner',
      meta: createExecutionMeta(),
    })
  })

  test('stops a running execution', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({ status: 'running' })

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/api/v1/executions/execution-1/stop', async (route) => {
      execution.status = 'cancelled'
      await route.fulfill({ json: execution })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await page.getByRole('button', { name: 'Stop execution' }).click()
    await expect(page.getByText('Stop execution?')).toBeVisible()
    await page.getByRole('button', { name: 'Stop execution', exact: true }).click()

    await expect(page.getByText('Cancelled')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stop execution' })).not.toBeVisible()
  })

  test('shows an error when stopping an execution fails', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution({ status: 'running' })

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/api/v1/executions/execution-1/stop', async (route) => {
      await route.fulfill({ status: 409, json: { message: 'Cannot stop execution.' } })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))
    await page.getByRole('button', { name: 'Stop execution' }).click()
    await expect(page.getByText('Stop execution?')).toBeVisible()
    await page.getByRole('button', { name: 'Stop execution', exact: true }).click()

    await expect(page.getByText('Execution could not be stopped')).toBeVisible()
  })

  test('displays the report for a completed execution', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution()

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/reports/report-1/index.html', async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1>Completed report</h1><p>Jane Doe passed.</p></body></html>',
      })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))
    await page.getByRole('tab', { name: 'Report' }).click()

    await expect(page.getByTitle('Execution report')).toBeVisible()
    await expect(page.frameLocator('iframe[title="Execution report"]').getByText('Completed report')).toBeVisible()
  })

  test('shows a report error when a completed execution report is unavailable', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    const execution = createExecution()

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/reports/report-1/index.html', async (route) => {
      await route.fulfill({ status: 404, body: 'Missing report' })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))
    await page.getByRole('tab', { name: 'Report' }).click()

    await expect(page.getByText('Execution report could not be loaded')).toBeVisible({ timeout: 15_000 })
  })

  test('keeps the logs view available when execution details fail to load', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)

    await stubExecutionList(page, () => [createExecution()])
    await page.route('**/api/v1/executions/execution-1', async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Unavailable' } })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await expect(page.getByText('Execution details could not be loaded')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Waiting for logs')).toBeVisible()
  })

  test('blocks submission when no patients have been imported', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    await stubExecutionList(page, () => [])

    await page.goto(withExecutionTarget('/create'))
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText(/Add at least one patient before continuing/)).toBeVisible()
  })

  test('shows incomplete imported patient validation before submission', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    await stubExecutionList(page, () => [])
    await stubWizardDependencies(page, true)

    await page.goto(withExecutionTarget('/create'))
    await selectExecutionPatients(page)
    await expect(page.getByText('Imported patients: 1')).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Back' }).click()

    await expect(page.getByText('Patient details are incomplete')).toBeVisible()
    await expect(
      page.getByText('Fill the missing imported fields before creating the execution: Patient name.'),
    ).toBeVisible()
  })

  test('surfaces invalid configuration before submission', async ({ page, request }) => {
    await prepareAuthenticatedPage(page, request)
    await stubExecutionList(page, () => [])

    await page.goto(withExecutionTarget('/create'))
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Other config').fill('[]')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText(/Other config/)).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Enter a valid JSON object.')).toBeVisible()
  })
})

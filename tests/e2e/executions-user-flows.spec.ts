import { expect, test, type Page } from '@playwright/test'
import { prepareAuthenticatedPage } from './auth-fixture'

const executionTargetSearch = 'runtime=runtime-1&app=App+1&targetUrl=https%3A%2F%2Fruntime.example.com%2Fapi%2Fv1'

const withExecutionTarget = (path: string) => `${path}${path.includes('?') ? '&' : '?'}${executionTargetSearch}`

const clinicConfig = {
  networkType: 'INN',
  defaultCharacter: '-',
  activePrint: true,
  onlyPrint: false,
  onlyElg: true,
  onlyForm: true,
  shortForm: false,
  claimForm: false,
  vouchers: true,
  planChecker: false,
  otherInformation: [{ npi: '1801501028' }],
  stateSetter: {
    _id: 'state-setter-1',
    createForm: true,
    createShortForm: true,
    createPrint: true,
    overwrite: true,
  },
  smartSearch: true,
  maxOutForm: false,
}

const clinicMacroConfig = {
  default_enable: true,
  default_characters: '-',
  data: {
    network_type: 'INN',
    instant_printer: true,
    nested_config: {
      remains_snake_case: true,
    },
  },
}

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
  context: {
    env: 'dev' | 'prod'
    bot: {
      botName: string
      targetUrl: string
      username: string
      password: string
      otherInformation: Record<string, unknown>
    }
    clinicConfig: Record<string, unknown>
    payloadConfigs: Array<Record<string, unknown>>
    patients: Array<{
      id?: string
      patientName?: string
      patientLastName?: string
      patientDob?: string
      subscriberDob?: string
      subscriberName?: string
      fileNames: {
        fullForm: string | null
        shortForm: string | null
        claimsForm: string | null
        eligibilityPrint: string | null
        historyPrint: string | null
        claimsPrint: string | null
        otherDocuments: string[]
      }
    }>
    executionId?: string
    workers: number
    retries: number
  }
}

const createExecutionContext = (): ExecutionFixture['context'] => ({
  env: 'dev',
  bot: {
    botName: 'Eligibility Runner',
    targetUrl: 'https://carrier.example.com',
    username: 'qa.operator',
    password: 'super-secret',
    otherInformation: {},
  },
  clinicConfig: {},
  payloadConfigs: [],
  patients: [
    {
      id: 'row-1',
      patientName: 'Jane',
      patientLastName: 'Doe',
      patientDob: '01/01/1990',
      subscriberDob: '01/01/1980',
      subscriberName: 'Jane',
      fileNames: {
        fullForm: null,
        shortForm: null,
        claimsForm: null,
        eligibilityPrint: 'jane-doe.pdf',
        historyPrint: null,
        claimsPrint: null,
        otherDocuments: [],
      },
    },
  ],
  executionId: 'execution-1',
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
  context: createExecutionContext(),
  ...overrides,
})

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
          instantPrinter: true,
          alerts: false,
          statusPrinter: true,
          isDiva: false,
          plans: true,
          twoFA: false,
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
  await page.route('**/api/v2/clinics/clinic-1', async (route) => {
    await route.fulfill({
      json: {
        _id: 'clinic-1',
        ...clinicConfig,
      },
    })
  })
  await page.route('**/api/v1/clinics/clinic-1/macro-config', async (route) => {
    await route.fulfill({
      json: {
        code: 200,
        data: [
          {
            shortConfig: clinicMacroConfig,
          },
        ],
        message: 'Clinic macro config loaded',
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
              executed: false,
              readyToReview: false,
              cells: {
                ...(incompletePatient ? {} : { patientName: 'Jane' }),
                patientLastName: 'Doe',
                patientDob: '01/01/1990',
                subscriberName: 'Jane',
                subscriberDob: '01/01/1980',
              },
              fileNames: {
                fullForm: null,
                shortForm: null,
                claimsForm: null,
                eligibilityPrint: 'jane-doe.pdf',
                historyPrint: null,
                claimsPrint: null,
                otherDocuments: [],
              },
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
  await page.getByLabel('Client').click()
  await page.getByRole('searchbox', { name: 'Search clients' }).fill('Legacy')
  await page.getByRole('option', { name: /Legacy Dental Care/ }).click()
  await page.getByRole('combobox', { name: 'Clinic' }).click()
  await page.getByRole('option', { name: 'Downtown Clinic' }).click()
  await page.getByRole('combobox', { name: 'Execution' }).click()
  await page.getByRole('option', { name: '2026-04-27' }).click()
}

test.describe('execution user flows', () => {
  test('shows the empty execution history state', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await stubExecutionList(page, () => [])

    await page.goto(withExecutionTarget('/'))

    await expect(page.locator('[data-slot="sidebar-container"]').getByText('No executions yet.')).toBeVisible()
  })

  test('renders the executions page table and opens the patients dialog from the summary cell', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    const basePatient = createExecutionContext().patients[0]
    const execution = createExecution({
      status: 'running',
      context: {
        ...createExecutionContext(),
        patients: [
          basePatient,
          {
            ...basePatient,
            id: 'row-2',
            patientName: 'John',
            patientLastName: 'Smith',
            patientDob: '02/02/1992',
            subscriberDob: '02/02/1982',
            subscriberName: 'Janet',
            fileNames: {
              ...basePatient.fileNames,
              eligibilityPrint: 'john-smith.pdf',
            },
          },
          {
            ...basePatient,
            id: 'row-3',
            patientName: 'Mary',
            patientLastName: 'Jones',
            patientDob: '03/03/1993',
            subscriberDob: '03/03/1983',
            subscriberName: 'Mark',
            fileNames: {
              ...basePatient.fileNames,
              eligibilityPrint: 'mary-jones.pdf',
            },
          },
          {
            ...basePatient,
            id: 'row-4',
            patientName: 'Alex',
            patientLastName: 'Taylor',
            patientDob: '04/04/1994',
            subscriberDob: '04/04/1984',
            subscriberName: 'Avery',
            fileNames: {
              ...basePatient.fileNames,
              eligibilityPrint: 'alex-taylor.pdf',
            },
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
    await expect(page.getByRole('columnheader', { name: 'Robot' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Legacy Dental Care' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Downtown Clinic' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Running' })).toBeVisible()

    await expect(page.getByText('Jane Doe, +3')).toBeVisible()
    await expect(page.getByRole('table').getByText('Eligibility Runner')).toBeVisible()

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

    const robotTrigger = page.getByRole('button', { name: 'View robot information for execution 2026-05-25' })
    await robotTrigger.click()

    await expect(page.getByRole('heading', { name: 'Robot' })).toBeFocused()
    await expect(page.getByText('Review the robot information stored for execution 2026-05-25.')).toBeVisible()
    await expect(page.getByText('https://carrier.example.com')).toBeVisible()
    await expect(page.getByText('qa.operator')).toBeVisible()

    await page.getByRole('dialog', { name: 'Robot' }).getByRole('button', { name: 'Close' }).first().click()
    await expect(page.getByRole('heading', { name: 'Robot' })).not.toBeVisible()
  })

  test('navigates to execution details from the executions table details action', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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
    await page.getByRole('link', { name: '2026-05-25', exact: true }).click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
    await expect(page.locator('[data-slot="card-title"]').getByText('chromium 2026-05-25')).toBeVisible()
  })

  test('loads execution history and opens an execution detail page', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    const execution = createExecution({ status: 'queued' })

    await stubExecutionList(page, () => [
      execution,
      createExecution({ _id: 'execution-2', execution: '2026-05-26', status: 'running' }),
    ])
    await stubExecutionDetails(page, execution._id, () => execution)

    await page.goto(withExecutionTarget('/'))

    const sidebar = page.locator('[data-slot="sidebar-container"]')

    await expect(sidebar.getByRole('button', { name: 'chromium' })).toBeVisible()
    await expect(sidebar.getByText('2026-05-26')).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /2026-05-25/ })).toBeVisible()
    await expect(page.getByLabel('queued')).toBeVisible()
    await expect(page.getByLabel('running')).toBeVisible()
    await sidebar.getByRole('link', { name: /2026-05-25/ }).click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
    await expect(page.locator('[data-slot="card-title"]').getByText('chromium 2026-05-25')).toBeVisible()
  })

  test('shows project execution popovers in the minimized sidebar', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

    await page.goto(withExecutionTarget('/'))

    await page.getByRole('button', { name: 'Minimize executions sidebar' }).click()
    await expect(page.getByRole('button', { name: 'Expand executions sidebar' })).toBeVisible()
    await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px')

    await expect(page.getByRole('button', { name: 'All executions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create execution' })).toBeVisible()
    await expect(page.getByText('No executions yet.')).not.toBeVisible()

    await page.getByRole('button', { name: 'chromium executions' }).click()

    await expect(page.getByRole('heading', { name: 'chromium' })).toBeVisible()
    await page.getByRole('link', { name: 'queued 2026-05-25 Eligibility' }).click()

    await expect(page).toHaveURL(withExecutionTarget('/execution/execution-1'))
  })

  test('shows an executions load error and retries successfully', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

  test('cancels deleting an execution from the sidebar', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

  test('deletes the selected execution and returns to all executions', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

  test('shows execution details with historical logs and debug payload', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    const execution = createExecution({
      status: 'running',
      logs: 'Starting carrier login\nLoading patient Jane Doe\n',
    })

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await expect(page.locator('[data-slot="card-title"]').getByText('chromium 2026-05-25')).toBeVisible()
    await expect(page.locator('[data-slot="card-title"]').getByText('Running')).toBeVisible()
    await expect(page.getByText('Starting carrier login')).toBeVisible()
    await page.getByRole('button', { name: 'Debug' }).click()
    await expect(page.getByText('Execution debug details')).toBeVisible()
    await expect(page.getByText('"jobId": "job-1"')).toBeVisible()
  })

  test('re-runs a finished execution after confirmation', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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
      context: createExecutionContext(),
    })
  })

  test('stops a running execution', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

  test('shows an error when stopping an execution fails', async ({ page }) => {
    await prepareAuthenticatedPage(page)
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

  test('displays the report for a completed execution', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    const execution = createExecution()

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/reports/execution-1/Report/index.html', async (route) => {
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

  test('shows a report error when a completed execution report is unavailable', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    const execution = createExecution()

    await stubExecutionList(page, () => [execution])
    await stubExecutionDetails(page, execution._id, () => execution)
    await page.route('**/reports/execution-1/Report/index.html', async (route) => {
      await route.fulfill({ status: 404, body: 'Missing report' })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))
    await page.getByRole('tab', { name: 'Report' }).click()

    await expect(page.getByText('Execution report could not be loaded')).toBeVisible({ timeout: 15_000 })
  })

  test('keeps the logs view available when execution details fail to load', async ({ page }) => {
    await prepareAuthenticatedPage(page)

    await stubExecutionList(page, () => [createExecution()])
    await page.route('**/api/v1/executions/execution-1', async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Unavailable' } })
    })

    await page.goto(withExecutionTarget('/execution/execution-1'))

    await expect(page.getByText('Execution details could not be loaded')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Waiting for logs')).toBeVisible()
  })

  test('blocks submission when no patients have been imported', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await stubExecutionList(page, () => [])
    await stubWizardDependencies(page)

    await page.goto(withExecutionTarget('/create'))
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create execution' }).click()

    await expect(page.getByText(/Add at least one patient before continuing/)).toBeVisible()
  })

  test('shows incomplete imported patient validation before submission', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await stubExecutionList(page, () => [])
    await stubWizardDependencies(page, true)

    await page.goto(withExecutionTarget('/create'))
    await selectExecutionPatients(page)
    await expect(page.getByLabel(/View details for Doe/)).toBeVisible()
    const warning = page.locator('[aria-label="This patient can\'t be used in an insurance verification."]')

    await expect(warning).toBeVisible()
    await warning.hover()
    await expect(page.getByText("This patient can't be used in an insurance verification.")).toBeVisible()

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Back' }).click()

    await expect(page.getByText('Patient details are incomplete')).not.toBeVisible()
    await expect(warning).toBeVisible()
  })

  test('keeps generated configuration read-only before submission', async ({ page }) => {
    await prepareAuthenticatedPage(page)
    await stubExecutionList(page, () => [])
    await stubWizardDependencies(page)

    await page.goto(withExecutionTarget('/create'))
    await selectExecutionPatients(page)
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByLabel('Other config')).not.toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('"clinicConfig": {}')).toBeVisible()
    await expect(page.getByText('"payloadConfigs": []')).toBeVisible()
  })
})

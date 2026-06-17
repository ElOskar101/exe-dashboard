import { expect, type Page } from '@playwright/test'

export const e2eUser = {
  twoFactor: { isEnabled: false, secret: '' },
  recovering: { code: '' },
  recoveringCode: '',
  _id: 'e2e-user',
  fullName: 'E2E Test User',
  username: 'e2e',
  studioAccess: true,
  urlImage: '',
  qaEmail: 'e2e@example.com',
  email: 'e2e@example.com',
  roles: [
    {
      _id: 'role-admin',
      name: 'admin',
      permission: [],
    },
  ],
  devices: [],
  settings: {
    _id: 'settings-e2e',
    theme: 'light',
    skypeNotification: false,
    emailNotification: false,
    silentNotification: false,
    autoDarkMode: false,
    startAutoMode: '08:00',
    endAutoMode: '17:00',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  area: 'QA',
  pushNotificationsSettings: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastLogin: '2026-01-01T00:00:00.000Z',
  loginCounter: 1,
}

const encodedE2eUser = Buffer.from(JSON.stringify(e2eUser)).toString('base64')

export async function prepareAuthenticatedPage(page: Page) {
  await page.route('**/users/me', async (route) => {
    await route.fulfill({ json: e2eUser })
  })

  await page.route('**/api/v2/playwright-runtimes**', async (route) => {
    await route.fulfill({
      json: [
        {
          _id: 'runtime-1',
          name: 'Runtime 1',
          accessInfo: { sharedWith: [], type: 'public' },
          applications: [
            {
              name: 'App 1',
              active: true,
              nonProduction: true,
              apiUrl: 'https://runtime.example.com/api/v1',
              accessInfo: { sharedWith: [], type: 'public' },
              config: { maxWorkers: 4, maxRetries: 2 },
            },
          ],
        },
      ],
    })
  })

  await page.route('**/api/rv', async (route) => {
    await route.fulfill({
      json: [
        {
          _id: 'rv-carrier-domain',
          key: 'carrierDomain',
          value: '"dev-carrier"',
          comment: 'Carrier domain',
          createdBy: 'e2e-user',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          _id: 'rv-tenant',
          key: 'tenant',
          value: '"e2e"',
          comment: 'Tenant',
          createdBy: 'e2e-user',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
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

  await page.context().addInitScript((user) => {
    window.localStorage.setItem('token', 'e2e-token')
    window.sessionStorage.setItem('me', window.btoa(JSON.stringify(user)))
  }, e2eUser)

  await page.goto('/under-construction')
  await page.evaluate((user) => {
    window.localStorage.setItem('token', 'e2e-token')
    window.sessionStorage.setItem('me', window.btoa(JSON.stringify(user)))
  }, e2eUser)
  await expect
    .poll(() => page.evaluate(() => [window.localStorage.getItem('token'), window.sessionStorage.getItem('me')]))
    .toEqual(['e2e-token', encodedE2eUser])
  await page.goto('about:blank')
}

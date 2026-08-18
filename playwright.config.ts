import { defineConfig, devices } from '@playwright/test'

const chromiumExecutablePath = process.env.PW_CHROMIUM_EXECUTABLE_PATH
const systemChromiumWorkerCount = 1

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  ...(chromiumExecutablePath ? { workers: systemChromiumWorkerCount } : {}),
  forbidOnly: true,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...(chromiumExecutablePath
      ? {
          launchOptions: {
            executablePath: chromiumExecutablePath,
            args: ['--disable-gpu'],
          },
        }
      : {}),
  },
  webServer: {
    command: 'pnpm exec vite build --mode development && pnpm exec vite preview --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

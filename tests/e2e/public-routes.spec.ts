import { expect, test } from '@playwright/test'

test.describe('public routes', () => {
  test('shows the under construction page', async ({ page }) => {
    await page.goto('/under-construction')

    await expect(page.getByText('Project Under Construction')).toBeVisible()
    await expect(
      page.getByText('This section of the platform is currently being built.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /go back home/i }),
    ).toBeVisible()
  })

  test('shows the not found page', async ({ page }) => {
    await page.goto('/404')

    await expect(page.getByText('Page Not Found')).toBeVisible()
    await expect(
      page.getByText(
        'The page you are looking for doesn’t exist or has been moved.',
      ),
    ).toBeVisible()
  })
})

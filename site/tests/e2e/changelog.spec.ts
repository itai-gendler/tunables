import { expect, test } from '@playwright/test'
import { expectNoAxeViolations } from '../support/axe'
import { waitForHydration } from '../support/hydration'

test('the changelog renders CHANGELOG.md, newest first', async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.abort())
  await page.goto('/changelog')
  await expect(page.getByRole('heading', { level: 1, name: 'Changelog' })).toBeVisible()
  const versions = page.locator('[data-changelog-versions]')
  await expect(versions.getByText('Settings declared once', { exact: false }).first()).toBeVisible()
  await waitForHydration(page)
  await expectNoAxeViolations(page)
})

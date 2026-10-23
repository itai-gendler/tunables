import { expect, test } from '@playwright/test'
import { waitForHydration } from '../support/hydration'

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.abort())
})

/** 320 is the narrowest width the site supports; 390 is the common phone. */
for (const path of ['/', '/docs/quickstart', '/changelog']) {
  test(`${path} never scrolls sideways on a phone`, async ({ page }) => {
    await page.goto(path)
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('the menu opens with the docs and the way in', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('button', { name: /open menu/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: 'Quickstart' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Get started' })).toBeVisible()
})

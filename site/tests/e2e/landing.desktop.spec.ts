import { expect, test } from '@playwright/test'
import { homeContent } from '../../app/utils/homeContent'
import { waitForHydration } from '../support/hydration'

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.abort())
})

test('the header links the docs, the quickstart, the changelog and GitHub', async ({ page }) => {
  await page.goto('/')
  const navigation = page.locator('[data-primary-navigation]')
  await expect(navigation.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  await expect(navigation.getByRole('link', { name: 'Quickstart' })).toHaveAttribute('href', '/docs/quickstart')
  await expect(navigation.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog')
  await expect(page.locator('[data-github-link]')).toHaveAttribute('href', 'https://github.com/itai-gendler/tunables')
})

test('the install command copies to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('button', { name: homeContent.hero.installCopyLabel }).click()
  await expect(page.getByRole('button', { name: `Copied ${homeContent.hero.install}` })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(homeContent.hero.install)
})

test('the hero puts the copy and the panel side by side', async ({ page }) => {
  await page.goto('/')
  const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
  const panel = await page.locator('[data-dial-demo]').boundingBox()
  expect(heading && panel && panel.x > heading.x + heading.width - 1).toBe(true)
})

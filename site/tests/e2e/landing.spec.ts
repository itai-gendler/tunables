import { expect, test } from '@playwright/test'
import { homeContent } from '../../app/utils/homeContent'
import { expectNoAxeViolations } from '../support/axe'
import { waitForHydration } from '../support/hydration'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://api.github.com/**', route => route.abort())
})

test('the hero states the tagline, the install command and the way in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: homeContent.hero.title })).toBeVisible()
  await expect(page.locator('[data-command-block] code').first()).toHaveText(homeContent.hero.install)
  const quickstart = page.getByRole('main').getByRole('link', { name: homeContent.hero.primary.label }).first()
  await expect(quickstart).toHaveAttribute('href', '/docs/quickstart')
})

test('every section is on the page, in order', async ({ page }) => {
  await page.goto('/')
  const titles = await page.locator('main h2').allTextContents()
  expect(titles.map(title => title.trim())).toEqual([
    homeContent.problem.title,
    homeContent.how.title,
    homeContent.guardrails.title,
    homeContent.agents.title,
    homeContent.attaches.title,
    homeContent.close.title
  ])
})

test('turning the Pro plan\'s Projects down past what a workspace keeps refuses the save, naming it', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  const slider = page.getByRole('slider', { name: 'Projects' })
  await slider.fill('30')
  const demo = page.locator('[data-dial-demo]')
  await expect(demo.getByText('Not saved')).toBeVisible()
  await expect(demo.getByText('Hobby club keeps Projects at 35, above 30.')).toBeVisible()
  await slider.fill('10')
  await expect(demo.getByText('Acme keeps Projects at 20, above 10.')).toBeVisible()
  await slider.fill('40')
  await expect(demo.getByText('Checks pass')).toBeVisible()
})

test('the home page has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await expectNoAxeViolations(page)
})

test('the home page has no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForHydration(page)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expectNoAxeViolations(page)
})

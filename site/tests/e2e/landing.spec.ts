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

test('turning the Story limit down past a Run Config refuses the save, naming it', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  const slider = page.getByRole('slider', { name: 'Story limit' })
  await slider.fill('12')
  const demo = page.locator('[data-dial-demo]')
  await expect(demo.getByText('Not saved')).toBeVisible()
  await expect(demo.getByText('Run Config "Weekly brief": its Story ceiling, 15, is above the Story limit of 12.')).toBeVisible()
  await slider.fill('20')
  await expect(demo.getByText('Checks pass')).toBeVisible()
  await slider.fill('28')
  await expect(demo.getByText(homeContent.demo.ceilingProblem)).toBeVisible()
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

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { expectNoAxeViolations } from '../support/axe'
import { waitForHydration } from '../support/hydration'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://api.github.com/**', route => route.abort())
})

const docsDir = fileURLToPath(new URL('../../../docs', import.meta.url))
const docs = readdirSync(docsDir).filter(name => name.endsWith('.md')).map((name) => {
  const source = readFileSync(`${docsDir}/${name}`, 'utf8')
  const title = /^title: (.+)$/m.exec(source)![1]!.trim()
  const heading = /^# (.+)$/m.exec(source)![1]!.trim()
  const slug = name.replace(/\.md$/, '')
  return { path: slug === 'index' ? '/docs' : `/docs/${slug}`, title, heading }
})

test('the docs open on the introduction, with the sidebar grouped', async ({ page }) => {
  await page.goto('/docs')
  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible()
  await expect(page).toHaveTitle('Introduction · tunables docs')
})

test('a reader moves from the introduction to the quickstart and sees its contents', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the sidebar folds into the menu on phones')
  await page.goto('/docs')
  const aside = page.locator('aside').first()
  for (const group of ['Get started', 'Concepts', 'Integrate', 'Screens', 'CLI', 'Skills', 'Reference']) {
    await expect(aside.getByRole('button', { name: group })).toBeVisible()
  }
  await aside.locator('a[href="/docs/quickstart"]').click()
  await expect(page).toHaveURL(/\/docs\/quickstart$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Quickstart' })).toBeVisible()
  await expect(page.getByText('On this page').filter({ visible: true })).toBeVisible()
})

test('every doc is generated, under its own title', async ({ page }) => {
  for (const doc of docs) {
    const response = await page.goto(doc.path)
    expect(response?.status(), doc.path).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: doc.heading, exact: true })).toBeVisible()
    await expect(page).toHaveTitle(`${doc.title} · tunables docs`)
  }
})

test('links between docs resolve inside the site', async ({ page }) => {
  await page.goto('/docs/quickstart')
  const hrefs = await page.locator('article a[href^="/docs"], .docs-prose a[href^="/docs"]').evaluateAll(links => links.map(link => link.getAttribute('href')!))
  expect(hrefs.length).toBeGreaterThan(3)
  for (const href of new Set(hrefs.map(href => href.split('#')[0]!))) {
    expect(href, href).not.toMatch(/\.md$/)
    const response = await page.request.get(href)
    expect(response.status(), href).toBe(200)
  }
})

for (const path of ['/docs', '/docs/quickstart', '/docs/checks-and-guards', '/docs/api']) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path)
    await waitForHydration(page)
    await expectNoAxeViolations(page)
  })
}

test('a docs page with code has no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/docs/checks-and-guards')
  await waitForHydration(page)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expectNoAxeViolations(page)
})

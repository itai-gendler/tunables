import { expect, test } from '@playwright/test'

test.describe('link previews', () => {
  // Sharing crawlers read the server-rendered head without running scripts.
  test.use({ javaScriptEnabled: false })

  test('every page names its canonical URL on tunables.dev and the social card', async ({ page }) => {
    for (const [path, canonical] of [['/', 'https://tunables.dev/'], ['/docs/quickstart', 'https://tunables.dev/docs/quickstart'], ['/changelog', 'https://tunables.dev/changelog']] as const) {
      await page.goto(path)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://tunables.dev/tunables-social-card.png')
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
    }
  })
})

test('the sitemap lists every page on tunables.dev', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of ['/', '/changelog', '/docs', '/docs/quickstart', '/docs/news-example']) {
    expect(sitemap).toContain(`<loc>https://tunables.dev${path === '/' ? '/' : path}</loc>`)
  }
})

test('an unknown address answers with the site\'s own not-found page', async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.abort())
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found · tunables')
})

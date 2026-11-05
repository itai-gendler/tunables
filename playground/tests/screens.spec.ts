import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

type Who = 'staff' | 'owner' | 'member'

/** Start every test from the seeded Tasklane, signed in as Sam on its staff. */
test.beforeEach(async ({ request, context, baseURL }) => {
  expect((await request.post('/api/playground/reset')).ok()).toBe(true)
  await signIn(context, baseURL!, 'staff')
})

async function signIn(context: BrowserContext, baseURL: string, who: Who) {
  await context.addCookies([{ name: 'playground-who', value: who, url: baseURL }])
}

async function open(page: Page, path: string, ready: string) {
  await page.goto(path)
  await expect(page.getByText(ready, { exact: false }).first()).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/** The docs project photographs only what the docs show; light and dark check every screen. */
const forDocs = () => test.info().project.name === 'docs'

/** A page at rest is photographed whole; a dialog over it, as the viewport shows it. */
async function photograph(page: Page, name: string, options: { dialog?: boolean } = {}) {
  if (forDocs()) return
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: !options.dialog, mask: [page.locator('[data-tunables-time]')] })
}

/**
 * A component as the docs show it, at the screen's own density, with its times
 * hidden: on the page with a margin around it, or a dialog on its own.
 * `pnpm --dir playground docs:images` copies the Linux baselines into
 * docs/images, and `pnpm check` keeps the two the same.
 */
async function document(locator: Locator, name: string, options: { dialog?: boolean } = {}) {
  if (!forDocs()) return
  const page = locator.page()
  const hide = await page.addStyleTag({ content: '[data-tunables-time] { visibility: hidden }' })
  try {
    if (options.dialog) {
      await expect(locator).toHaveScreenshot(`${name}.png`, { scale: 'device' })
      return
    }
    const margin = 24
    const box = await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height }
    })
    const x = Math.max(0, box.x - margin)
    const y = Math.max(0, box.y - margin)
    const clip = { x, y, width: box.x + box.width + margin - x, height: box.y + box.height + margin - y }
    await expect(page).toHaveScreenshot(`${name}.png`, { clip, fullPage: true, scale: 'device' })
  } finally {
    await hide.evaluate(node => node.remove())
  }
}

async function accessible(page: Page) {
  if (forDocs()) return
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click()
}

/** Each screen at rest, and the part of it the docs show: a component's own root, or Tasklane's page around it. */
const screens: { name: string, who: Who, path: string, ready: string, docs?: { name: string, selector: string } }[] = [
  { name: 'limits', who: 'staff', path: '/admin/limits', ready: 'Tasks per project', docs: { name: 'group-form', selector: '.tunables-group-form' } },
  { name: 'workspace-defaults', who: 'staff', path: '/admin/defaults', ready: 'Archive done tasks after' },
  { name: 'plans', who: 'staff', path: '/admin/plans', ready: 'Team', docs: { name: 'presets', selector: '.tunables-presets' } },
  { name: 'workspaces', who: 'staff', path: '/admin/workspaces', ready: 'Hobby club', docs: { name: 'assign', selector: 'main' } },
  { name: 'models', who: 'staff', path: '/admin/models', ready: 'Large and careful', docs: { name: 'catalog', selector: '.tunables-catalog' } },
  { name: 'all-settings', who: 'staff', path: '/admin/settings', ready: 'Attachment size', docs: { name: 'overview', selector: '.tunables-overview' } },
  { name: 'workspace-settings', who: 'owner', path: '/workspace', ready: 'Inherited from System' },
  { name: 'my-tasks', who: 'member', path: '/me', ready: 'Daily reminder', docs: { name: 'own-screen', selector: 'main' } }
]

for (const screen of screens) {
  test(`${screen.name} at rest`, async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!, screen.who)
    await open(page, screen.path, screen.ready)
    await accessible(page)
    await photograph(page, screen.name)
    if (screen.docs) await document(page.locator(screen.docs.selector), screen.docs.name)
  })
}

test.describe('a workspace owner', () => {
  test.beforeEach(async ({ context, baseURL }) => signIn(context, baseURL!, 'owner'))

  test('lowers a limit below the plan, is refused above it, and uses the plan\'s again', async ({ page }) => {
    await open(page, '/workspace', 'Inherited from System')
    await page.getByRole('tab', { name: 'Limits' }).click()
    const projects = page.getByRole('spinbutton', { name: 'Projects' })
    await expect(projects).toHaveValue('50')
    await expect(page.locator('[data-field="maxProjects"]')).toContainText('Inherited from Pro plan')
    await expect(page.locator('[data-field="maxProjects"]')).toContainText('At most 50')

    await projects.fill('80')
    await projects.blur()
    await save(page)
    await expect(page.getByText('Projects may be at most 50 for Acme, the value it inherits.')).toBeVisible()

    await projects.fill('20')
    await projects.blur()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await expect(page.locator('[data-field="maxProjects"]')).toContainText('Set here · inherits 50 from Pro plan')
    await accessible(page)
    await photograph(page, 'workspace-limits-overridden')
    await document(page.locator('.tunables-group-form').filter({ visible: true }), 'group-form-at-a-scope')

    await page.getByRole('button', { name: 'Use 50 from Pro plan' }).click()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await expect(projects).toHaveValue('50')
    await expect(page.locator('[data-field="maxProjects"]')).toContainText('Inherited from Pro plan')
  })

  test('confirms turning on guests, finds the change in Acme\'s history, and restores it', async ({ page }) => {
    await open(page, '/workspace', 'Inherited from System')
    await page.getByRole('switch', { name: 'Guests' }).click()
    await page.getByRole('textbox', { name: 'Reason for this change' }).first().fill('Working with an agency')
    await save(page)
    const dialog = page.getByRole('dialog', { name: 'Confirm this change' })
    await expect(dialog).toContainText('Guests will see every task')
    await photograph(page, 'workspace-confirm', { dialog: true })
    await document(dialog, 'group-form-confirm', { dialog: true })
    await dialog.getByRole('button', { name: 'Save anyway' }).click()
    await expect(page.getByRole('status')).toContainText('Saved')

    const dueSoon = page.getByRole('spinbutton', { name: 'Due soon' })
    await dueSoon.fill('3')
    await dueSoon.blur()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await page.getByRole('button', { name: 'History' }).first().click()
    const history = page.getByRole('dialog', { name: 'Workspace history' })
    await expect(history).toContainText('Working with an agency')
    await expect(history).toContainText('Olivia')
    await document(history.locator('.tunables-history'), 'history', { dialog: true })
    await history.getByRole('button', { name: 'Restore' }).first().click()
    const confirm = page.getByRole('dialog', { name: 'Restore this revision' })
    await confirm.getByRole('textbox').fill('Two days was right')
    await confirm.getByRole('button', { name: 'Restore' }).click()
    await expect(history).toContainText('Two days was right')
    await page.keyboard.press('Escape')
    await expect(dueSoon).toHaveValue('2')
  })

  test('is sent home from the administration, which its API refuses too', async ({ page }) => {
    await page.goto('/admin/limits')
    await expect(page).toHaveURL(/\/workspace$/)
    expect((await page.request.get('/api/tunables/groups/limits')).status()).toBe(404)
  })
})

test.describe('a member', () => {
  test.beforeEach(async ({ context, baseURL }) => signIn(context, baseURL!, 'member'))

  test('picks their own view and week over Acme\'s on Tasklane\'s own page, and follows Acme\'s again', async ({ page }) => {
    await page.request.put('/api/tunables/groups/workspace', { headers: { cookie: 'playground-who=owner' }, data: { values: { defaultView: 'board' }, scope: { workspace: 'acme' } } })
    await open(page, '/me', 'Daily reminder')
    const view = page.locator('[data-preference="defaultView"]')
    await expect(page.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true')
    await expect(view).toContainText('Same as Acme')

    await page.getByRole('tab', { name: 'Calendar' }).click()
    await expect(page.getByRole('status')).toContainText('Saved')
    await expect(view).toContainText('Your own')
    await page.getByRole('combobox', { name: 'Week starts on' }).click()
    await page.getByRole('option', { name: 'Sunday' }).click()
    await expect(page.getByRole('list', { name: 'This week' }).getByRole('listitem').first()).toContainText('Sun')

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'Use Acme\'s (Board)' }).click()
    await expect(page.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true')
    await expect(view).toContainText('Same as Acme')
  })

  test('is sent home from the workspace\'s settings, which its API refuses too', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/me$/)
    expect((await page.request.get('/api/tunables/groups/workspace?scope=workspace%3Dacme')).status()).toBe(404)
  })
})

test.describe('Tasklane staff', () => {
  test('is sent from a workspace\'s own page to the administration', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/admin\/limits$/)
  })

  test('cannot lower a plan below what a workspace on it keeps', async ({ page }) => {
    await page.request.put('/api/tunables/groups/limits', { headers: { cookie: 'playground-who=owner' }, data: { values: { maxProjects: 20 }, scope: { workspace: 'acme' } } })
    await open(page, '/admin/plans', 'Team')
    await page.getByRole('button', { name: 'Edit' }).nth(1).click()
    const panel = page.getByRole('dialog', { name: 'Edit Pro' })
    const projects = panel.getByRole('spinbutton', { name: 'Projects' })
    await expect(projects).toHaveValue('50')
    await projects.fill('10')
    await projects.blur()
    await panel.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(panel).toContainText('Acme keeps Projects at 20, above 10.')
    await accessible(page)
    await photograph(page, 'plan-refused', { dialog: true })
  })

  test('moves a workspace to another plan by reference', async ({ page }) => {
    await open(page, '/admin/workspaces', 'Hobby club')
    await page.getByRole('combobox', { name: 'Plan' }).nth(1).click()
    await page.getByRole('option', { name: 'Team' }).click()
    await expect(page.getByRole('combobox', { name: 'Plan' }).nth(1)).toContainText('Team')
  })

  test('a model a setting picks cannot be retired', async ({ page }) => {
    await open(page, '/admin/models', 'Large and careful')
    await expect(page.getByText('Used by Workspace › Suggestion model').first()).toBeVisible()
    // Small and quick is the system's suggestion model; Large and careful nothing picks.
    await expect(page.locator('button:disabled', { hasText: 'Retire' })).toHaveCount(1)
    await expect(page.locator('button:enabled', { hasText: 'Retire' })).toHaveCount(1)
  })

  test('a catalog entry shows its own history', async ({ page }) => {
    await open(page, '/admin/models', 'Large and careful')
    await page.getByRole('button', { name: 'Small and quick history' }).click()
    await expect(page.getByRole('dialog', { name: 'Small and quick history' })).toContainText('Seeded.')
  })
})

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'

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

/** A page at rest is photographed whole; a dialog over it, as the viewport shows it. */
async function photograph(page: Page, name: string, options: { dialog?: boolean } = {}) {
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: !options.dialog, mask: [page.locator('[data-tunables-time]')] })
}

async function accessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([])
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click()
}

const screens: { name: string, who: Who, path: string, ready: string }[] = [
  { name: 'limits', who: 'staff', path: '/admin/limits', ready: 'Tasks per project' },
  { name: 'workspace-defaults', who: 'staff', path: '/admin/defaults', ready: 'Archive done tasks after' },
  { name: 'plans', who: 'staff', path: '/admin/plans', ready: 'Team' },
  { name: 'workspaces', who: 'staff', path: '/admin/workspaces', ready: 'Hobby club' },
  { name: 'models', who: 'staff', path: '/admin/models', ready: 'Large and careful' },
  { name: 'all-settings', who: 'staff', path: '/admin/settings', ready: 'Attachment size' },
  { name: 'workspace-settings', who: 'owner', path: '/workspace', ready: 'Inherited from System' },
  { name: 'my-settings', who: 'member', path: '/me', ready: 'Reminder time' }
]

for (const screen of screens) {
  test(`${screen.name} at rest`, async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!, screen.who)
    await open(page, screen.path, screen.ready)
    await accessible(page)
    await photograph(page, screen.name)
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

    await page.getByRole('button', { name: 'Use 50 from Pro plan' }).click()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await expect(projects).toHaveValue('50')
    await expect(page.locator('[data-field="maxProjects"]')).toContainText('Inherited from Pro plan')
  })

  test('confirms turning on guests, and finds the change in Acme\'s history', async ({ page }) => {
    await open(page, '/workspace', 'Inherited from System')
    await page.getByRole('switch', { name: 'Guests' }).click()
    await page.getByRole('textbox', { name: 'Reason for this change' }).first().fill('Working with an agency')
    await save(page)
    const dialog = page.getByRole('dialog', { name: 'Confirm this change' })
    await expect(dialog).toContainText('Guests will see every task')
    await photograph(page, 'workspace-confirm', { dialog: true })
    await dialog.getByRole('button', { name: 'Save anyway' }).click()
    await expect(page.getByRole('status')).toContainText('Saved')
    await page.getByRole('button', { name: 'History' }).first().click()
    const history = page.getByRole('dialog', { name: 'Workspace history' })
    await expect(history).toContainText('Working with an agency')
    await expect(history).toContainText('Olivia')
  })

  test('cannot open the administration', async ({ page }) => {
    await page.goto('/admin/limits')
    await expect(page.getByText('Not found.')).toBeVisible()
    await expect(page.getByText('Tasks per project')).toHaveCount(0)
  })
})

test.describe('a member', () => {
  test.beforeEach(async ({ context, baseURL }) => signIn(context, baseURL!, 'member'))

  test('sets their own view over Acme\'s, and restores an earlier one', async ({ page }) => {
    await page.request.put('/api/tunables/groups/workspace', { headers: { cookie: 'playground-who=owner' }, data: { values: { defaultView: 'board' }, scope: { workspace: 'acme' } } })
    await open(page, '/me', 'Reminder time')
    const field = page.locator('[data-field="defaultView"]')
    await expect(field).toContainText('Inherited from Acme')
    await field.getByRole('radio', { name: 'Calendar' }).click()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await expect(field).toContainText('Set here · inherits Board from Acme')

    await field.getByRole('radio', { name: 'List' }).click()
    await save(page)
    await expect(page.getByRole('status')).toContainText('Saved')
    await page.getByRole('button', { name: 'History' }).first().click()
    await page.getByRole('button', { name: 'Restore' }).first().click()
    const confirm = page.getByRole('dialog', { name: 'Restore this revision' })
    await confirm.getByRole('textbox').fill('Calendar suits me')
    await confirm.getByRole('button', { name: 'Restore' }).click()
    await expect(page.getByRole('dialog', { name: 'Workspace history' })).toContainText('Calendar suits me')
    await page.keyboard.press('Escape')
    await expect(field.getByRole('radio', { name: 'Calendar' })).toBeChecked()
  })

  test('cannot open the workspace\'s settings', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page.getByText('Not found.').first()).toBeVisible()
  })
})

test.describe('Tasklane staff', () => {
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

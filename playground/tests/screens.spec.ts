import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Start every test from the seeded fixture, signed in as the Administrator. */
test.beforeEach(async ({ request, context, baseURL }) => {
  expect((await request.post('/api/playground/reset')).ok()).toBe(true)
  await context.addCookies([{ name: 'playground-who', value: 'admin', url: baseURL! }])
})

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

const screens = [
  { name: 'collection-settings', path: '/admin/feeds/settings', ready: 'Check interval' },
  { name: 'run-settings', path: '/admin/run-configs/settings', ready: 'Budget limit' },
  { name: 'reader-limits', path: '/admin/readers/limits', ready: 'Briefs per reader' },
  { name: 'run-configs', path: '/admin/run-configs', ready: 'Daily brief' },
  { name: 'models', path: '/admin/run-configs/models', ready: 'GPT-OSS 120B (Groq)' },
  { name: 'readers', path: '/admin/readers', ready: 'Ada Lovelace' },
  { name: 'all-settings', path: '/admin/settings', ready: 'Most articles per retrieval' }
]

for (const screen of screens) {
  test(`${screen.name} at rest`, async ({ page }) => {
    await open(page, screen.path, screen.ready)
    await accessible(page)
    await photograph(page, screen.name)
  })
}

test('lowering a limit below a Run Config is refused, naming it', async ({ page }) => {
  await open(page, '/admin/run-configs/settings', 'Budget limit')
  const field = page.getByRole('spinbutton', { name: 'Screening budget limit' })
  await field.fill('0.2')
  await field.blur()
  await expect(page.getByRole('region', { name: 'Unsaved changes' })).toContainText('1 unsaved change')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Run Config "Weekly brief": its Screening budget, $0.30, is above the Screening budget limit of $0.20.')).toBeVisible()
  await photograph(page, 'run-settings-refused')
})

test('a change with consequences asks to be confirmed, then saves and is in the history', async ({ page }) => {
  await open(page, '/admin/run-configs/settings', 'Budget limit')
  const field = page.getByRole('spinbutton', { name: 'Screening reason length' })
  await field.fill('20')
  await field.blur()
  await page.getByRole('textbox', { name: 'Reason for this change' }).fill('Longer reasons')
  await page.getByRole('button', { name: 'Save' }).click()
  const dialog = page.getByRole('dialog', { name: 'Confirm this change' })
  await expect(dialog).toContainText('redoes every saved Screening judgment')
  await photograph(page, 'run-settings-confirm', { dialog: true })
  await dialog.getByRole('button', { name: 'Save anyway' }).click()
  await expect(page.getByRole('status')).toContainText('Saved')
  await page.getByRole('button', { name: 'History' }).click()
  const history = page.getByRole('dialog', { name: 'Run Settings history' })
  await expect(history).toContainText('Longer reasons')
  await expect(history).toContainText('12 words')
  await expect(history).toContainText('20 words')
  await photograph(page, 'run-settings-history', { dialog: true })
})

test('an earlier revision is restored through the same checks', async ({ page }) => {
  await open(page, '/admin/readers/limits', 'Briefs per reader')
  const field = page.getByRole('spinbutton', { name: 'Briefs per reader' })
  await field.fill('3')
  await field.blur()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('status')).toContainText('Saved')
  await page.getByRole('button', { name: 'History' }).click()
  await page.getByRole('button', { name: 'Restore' }).first().click()
  const confirm = page.getByRole('dialog', { name: 'Restore this revision' })
  await confirm.getByRole('textbox').fill('Too tight')
  await confirm.getByRole('button', { name: 'Restore' }).click()
  await expect(page.getByRole('dialog', { name: 'Reader Limits history' })).toContainText('Too tight')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('spinbutton', { name: 'Briefs per reader' })).toHaveValue('12')
})

test('a Run Config is edited in its own panel, within the limits', async ({ page }) => {
  await open(page, '/admin/run-configs', 'Daily brief')
  await page.getByRole('button', { name: 'Edit' }).first().click()
  const panel = page.getByRole('dialog', { name: 'Edit Daily brief' })
  await expect(panel.getByRole('spinbutton', { name: 'Window' })).toHaveValue('24')
  await accessible(page)
  await photograph(page, 'run-config-editor', { dialog: true })
  await panel.getByRole('tab', { name: 'Cost', exact: true }).click()
  const turns = panel.getByRole('spinbutton', { name: 'Turns' })
  await turns.fill('500')
  await turns.blur()
  await panel.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(panel).toContainText('its Turns, 500, are above the Turns limit of 400.')
})

test('a model in use cannot be retired', async ({ page }) => {
  await open(page, '/admin/run-configs/models', 'GPT-OSS 120B (Groq)')
  const retire = page.getByRole('button', { name: 'Retire' })
  await expect(retire.first()).toBeDisabled()
  await expect(page.getByText('Used by Run Config "Daily brief", Run Config "Weekly brief"').first()).toBeVisible()
})

test('a reader is assigned a Run Config by reference', async ({ page }) => {
  await open(page, '/admin/readers', 'Ada Lovelace')
  await page.getByRole('combobox', { name: 'Daily Run Config' }).first().click()
  await page.getByRole('option', { name: 'Daily brief, pinned' }).click()
  await expect(page.getByRole('combobox', { name: 'Daily Run Config' }).first()).toContainText('Daily brief, pinned')
})

test('someone the host does not allow sees nothing', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'playground-who', value: 'reader', url: baseURL! }])
  await page.goto('/admin/run-configs/settings')
  await expect(page.getByText('Not found.')).toBeVisible()
  await expect(page.getByText('Budget limit')).toHaveCount(0)
})

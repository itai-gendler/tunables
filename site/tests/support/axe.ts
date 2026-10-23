import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Every page suite runs a WCAG 2.0 and 2.1 A/AA scan; a new page must pass it. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const summary = results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
  expect(summary).toEqual([])
}

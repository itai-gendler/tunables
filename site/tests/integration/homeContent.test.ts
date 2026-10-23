import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { homeContent } from '../../app/utils/homeContent'

const docsDir = fileURLToPath(new URL('../../../docs', import.meta.url))

function internalLinks(value: unknown): string[] {
  if (typeof value === 'string') return value.startsWith('/docs') ? [value] : []
  if (Array.isArray(value)) return value.flatMap(internalLinks)
  if (value && typeof value === 'object') return Object.values(value).flatMap(internalLinks)
  return []
}

describe('homeContent', () => {
  it('links only to docs that exist', () => {
    const links = internalLinks(homeContent)
    expect(links.length).toBeGreaterThan(5)
    for (const link of links) {
      const slug = link.replace(/^\/docs\/?/, '').split('#')[0] || 'index'
      expect(existsSync(`${docsDir}/${slug}.md`), link).toBe(true)
    }
  })

  it('names the three skills the CLI installs', () => {
    expect(homeContent.agents.skills.map(skill => skill.name)).toEqual(['tunables-adopt', 'tunables-define', 'tunables-verify'])
  })
})

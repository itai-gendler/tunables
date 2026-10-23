import { fileURLToPath } from 'node:url'
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// The docs and the changelog are authored at the root of this repository and
// rendered here as they are; `pnpm dev` hot-reloads edits to them.
//
// Absolute paths, because Nuxt Content's HMR watcher reports absolute changed
// paths and cannot match them against a relative collection cwd.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const docsDir = fileURLToPath(new URL('../docs', import.meta.url))

// The docs frontmatter contract, which the repository's `pnpm check` enforces
// too: `group` names the sidebar cluster and `order` is the position across
// all docs.
const docsSchema = z.object({
  order: z.number(),
  group: z.enum(['Get started', 'Concepts', 'Integrate', 'Screens', 'CLI', 'Skills', 'Reference'])
})

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: { cwd: docsDir, include: '*.md', prefix: '/docs' },
      schema: docsSchema
    }),
    // Excluding every subdirectory keeps the dev watcher off the rest of the
    // checkout.
    changelog: defineCollection({
      type: 'page',
      source: { cwd: repoRoot, include: 'CHANGELOG.md', exclude: ['*/**'], prefix: '/changelog' }
    })
  }
})

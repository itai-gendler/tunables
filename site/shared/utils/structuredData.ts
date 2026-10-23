// Imported by path rather than auto-imported, so the integration tests can load
// this module under Vitest, which does not apply Nuxt's transform.
import { REPOSITORY_URL, SITE_ORIGIN } from './site'

/**
 * Schema.org builders for the JSON-LD the public pages emit. Every node states
 * what the visible page already says; nothing here invents a value the page
 * does not show.
 */

const PROJECT_ID = `${SITE_ORIGIN}/#project`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`

type JsonLdNode = Record<string, unknown>

/** The maintainer, who publishes the site. */
const MAINTAINER: JsonLdNode = {
  '@type': 'Person',
  'name': 'Itai Gendler',
  'url': 'https://github.com/itai-gendler'
}

/** The project and the site, emitted once on every page. */
export function siteGraph(): JsonLdNode[] {
  return [{
    '@type': 'SoftwareSourceCode',
    '@id': PROJECT_ID,
    'name': 'tunables',
    'url': `${SITE_ORIGIN}/`,
    'codeRepository': REPOSITORY_URL,
    'programmingLanguage': 'TypeScript',
    'license': 'https://opensource.org/licenses/MIT',
    'author': MAINTAINER,
    'sameAs': [REPOSITORY_URL, 'https://www.npmjs.com/package/tunables']
  }, {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'name': 'tunables',
    'url': `${SITE_ORIGIN}/`,
    'about': { '@id': PROJECT_ID },
    'publisher': MAINTAINER
  }]
}

interface Crumb {
  name: string
  path: string
}

export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': absoluteSiteURL(crumb.path)
    }))
  }
}

/**
 * Serialise a graph for a `<script type="application/ld+json">` body. `<` is
 * escaped so a value containing `</script>` cannot close the element early.
 */
export function serializeJsonLd(graph: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')
}

/** Resolve a site path, or pass an absolute URL through unchanged. */
export function absoluteSiteURL(pathOrURL: string): string {
  return new URL(pathOrURL, SITE_ORIGIN).href
}

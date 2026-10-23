import type { MaybeRefOrGetter } from 'vue'

/**
 * The site's search and link-preview metadata, stated once per page.
 *
 * A page names its title and description. This writes them to the document
 * head, Open Graph and the Twitter card together, so a shared link never
 * previews a different title from the one a search result shows. The canonical
 * URL and the site-wide defaults come from `useSiteSeoDefaults` in `app.vue`.
 */

const DEFAULT_IMAGE = {
  src: '/tunables-social-card.png',
  alt: 'tunables — "Runtime settings with guardrails, for the app you already run", beside a dial.'
}

const DEFAULT_TITLE = 'tunables'
const DEFAULT_DESCRIPTION = 'Runtime settings with guardrails, for the app you already run: declared once, stored in your Postgres, edited on screens in your app, checked whole and recorded in a history.'

interface SiteSeoInput {
  /** The full document title, including its `· tunables` suffix. */
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string | undefined>
  /** A shorter title for link previews, where the site name is already shown. */
  socialTitle?: MaybeRefOrGetter<string | undefined>
  /** JSON-LD nodes describing this page, beside the site-wide graph. */
  structuredData?: MaybeRefOrGetter<Record<string, unknown>[]>
}

export function useSiteSeo(input: SiteSeoInput) {
  const socialTitle = () => toValue(input.socialTitle) ?? toValue(input.title)

  useSeoMeta({
    title: () => toValue(input.title),
    description: () => toValue(input.description),
    ogTitle: socialTitle,
    ogDescription: () => toValue(input.description),
    twitterTitle: socialTitle,
    twitterDescription: () => toValue(input.description)
  })

  if (input.structuredData) {
    const structuredData = input.structuredData
    useHead({
      script: () => {
        const nodes = toValue(structuredData)
        return nodes.length
          ? [{ key: 'structured-data-page', type: 'application/ld+json', innerHTML: serializeJsonLd(nodes) }]
          : []
      }
    })
  }
}

/**
 * The default title and description, the canonical URL, the default preview
 * and the site-wide JSON-LD. Called by `app.vue`, so every page has them before
 * it says anything of its own.
 */
export function useSiteSeoDefaults() {
  // Read from the route: `app.vue` stays mounted across client-side navigation,
  // so a value captured once would keep naming the first page.
  const route = useRoute()
  const canonicalURL = () => absoluteSiteURL(route.path.replace(/(.)\/+$/, '$1'))
  const image = absoluteSiteURL(DEFAULT_IMAGE.src)

  useHead({
    link: () => [{ rel: 'canonical', href: canonicalURL() }],
    script: [{
      key: 'structured-data-site',
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(siteGraph())
    }]
  })

  useSeoMeta({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogSiteName: 'tunables',
    ogTitle: DEFAULT_TITLE,
    ogDescription: DEFAULT_DESCRIPTION,
    ogType: 'website',
    ogUrl: canonicalURL,
    ogImage: image,
    ogImageAlt: DEFAULT_IMAGE.alt,
    twitterCard: 'summary_large_image',
    twitterImage: image,
    twitterImageAlt: DEFAULT_IMAGE.alt
  })
}

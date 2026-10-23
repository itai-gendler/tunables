/**
 * The public origin, for the places that need an absolute URL rather than a path.
 *
 * The canonical tag and the sitemap cannot use `useRequestURL()`: during
 * `nuxt generate` that resolves to the prerenderer's localhost origin, and in
 * development to the dev server's port. Both would publish a URL nobody can
 * open, so the origin is stated rather than observed.
 *
 * `shared/utils` is auto-imported into both the app and the Nitro server.
 * Modules that also run under Vitest import it by path instead, because Vitest
 * does not apply the auto-import transform.
 */
export const SITE_ORIGIN = 'https://tunables.dev'

/** The repository every "on GitHub" link points at. */
export const REPOSITORY_URL = 'https://github.com/itai-gendler/tunables'

/**
 * The not-found page's document title. `app/error.vue` sets it in the browser,
 * and `nuxt.config.ts` writes it into the generated `404.html`, which Nuxt emits
 * as an empty shell with no head of its own.
 */
export const NOT_FOUND_TITLE = 'Page not found · tunables'

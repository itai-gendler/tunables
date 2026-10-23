# Architecture

read_when: changing how the site is built, its routes, or where content comes
from.

## Build

`nuxt generate` prerenders every route into `.output/public`. The crawler
starts at `/` and `/sitemap.xml`; the home page also lists every doc route from
the docs collection while it is prerendered, so no doc depends on being linked.
`autoSubfolderIndex: false` writes `docs/quickstart.html` rather than
`docs/quickstart/index.html`. `failOnError` makes any broken prerender fail the
build.

## Content

`content.config.ts` defines two Nuxt Content collections, both read from the
repository root with absolute paths so the dev watcher sees edits:

| Collection | Source | Route |
| --- | --- | --- |
| `docs` | `../docs/*.md` | `/docs/<file>`, `index.md` at `/docs` |
| `changelog` | `../CHANGELOG.md` | rendered by `pages/changelog/index.vue` |

The docs schema requires `order` and a `group` from the fixed list; the
sidebar (`useDocsNavigation`) clusters by `group` in `order`. `ProseA` turns a
relative `./other.md` link into `/docs/other`; a `content:file:beforeParse` hook
fixes the index's links and the changelog's reference-style headings.
Code is highlighted at build time with the site's own Shiki themes
(`config/syntaxHighlightTheme.ts`), chosen so every token clears AA.

The changelog page splits `CHANGELOG.md` at each `##`: `Unreleased` while it
holds entries, then each dated release (`app/utils/changelogReleases.ts`).

## Routes

| Route | Page |
| --- | --- |
| `/` | `pages/index.vue` → `HomeLayout` |
| `/docs`, `/docs/*` | `pages/docs/[...slug].vue` in `layouts/docs.vue` |
| `/changelog` | `pages/changelog/index.vue` |
| `/privacy` | `pages/privacy.vue` |
| `/sitemap.xml` | `server/routes/sitemap.xml.get.ts` |
| anything else | `app/error.vue`, served from `404.html` |

## In the browser

Everything a visitor needs is in the generated HTML. After hydration the
browser may ask GitHub for the star count (once, when idle) and load the docs
search index the first time search opens. Neither is needed to read a page.

## SEO

`useSiteSeoDefaults` (in `app.vue`) sets the canonical URL on
`https://tunables.dev`, the default description, the social card and the
site-wide JSON-LD; each page states its own title and description with
`useSiteSeo`.

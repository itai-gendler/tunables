import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collapseShortcutReferences } from './config/markdownReferences'
import { panelSyntaxTheme } from './config/syntaxHighlightTheme'
import { NOT_FOUND_TITLE } from './shared/utils/site'

const isDevelopment = process.env.NODE_ENV === 'development'
const isolatedBuildDir = process.env.TUNABLES_SITE_BUILD_DIR

// The site lives in the tunables repository. Its docs and changelog are read
// from the checkout it is built in, so a change and the page that shows it ship
// in one pull request.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

// Nuxt Content ingests only `**/*.md`, so images committed beside the docs are
// served as a public asset at the same relative path a page resolves them to:
// `./images/x.webp` on /docs/<slug> is /docs/images/x.webp, on GitHub and here.
const docsImagesDir = resolve(repoRoot, 'docs', 'images')
const docsImageAssets = existsSync(docsImagesDir)
  ? [{ dir: docsImagesDir, baseURL: '/docs/images', maxAge: 60 * 60 * 24 * 365 }]
  : []

// The header badge names the tunables release this site documents, read from
// the package in this repository so it cannot drift.
const { version: tunablesVersion } = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as { version: string }

export default defineNuxtConfig({
  ...(isolatedBuildDir ? { buildDir: isolatedBuildDir } : {}),
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content'
  ],
  devtools: { enabled: isDevelopment },
  app: {
    // Error pages do not render app.vue, so document language belongs here.
    head: { htmlAttrs: { lang: 'en' } }
  },
  css: [
    '@fontsource-variable/archivo',
    '@fontsource-variable/inter',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '~/assets/css/main.css'
  ],
  // Light and dark both read well; the visitor's system preference decides,
  // and the header's toggle overrides it.
  colorMode: {
    preference: 'system',
    fallback: 'light'
  },
  content: {
    // Keep the live dev database apart from the build's, so a build running
    // beside `pnpm dev` cannot drop its tables mid-request.
    _localDatabase: {
      type: 'sqlite',
      filename: isDevelopment
        ? '.data/content/contents.dev.sqlite'
        : '.data/content/contents.build.sqlite'
    },
    experimental: {
      // Node's built-in sqlite avoids the better-sqlite3 native build.
      sqliteConnector: 'native'
    }
  },
  mdc: {
    highlight: {
      // `default` is the fallback before a color mode class is set, so it is
      // the readable light theme too.
      theme: {
        light: panelSyntaxTheme('light'),
        default: panelSyntaxTheme('light'),
        dark: panelSyntaxTheme('dark')
      },
      langs: ['ts', 'js', 'json', 'bash', 'sh', 'vue', 'sql', 'yaml', 'md', 'ini', 'dotenv', 'diff']
    }
  },
  ui: {
    // The fonts are self-hosted from @fontsource above; Nuxt Fonts would fetch
    // the same families from Google at build time.
    fonts: false,
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error'],
      defaultVariants: { size: 'sm', color: 'primary' }
    }
  },
  runtimeConfig: {
    public: {
      tunablesVersion
    }
  },
  compatibilityDate: '2024-11-01',
  // Every page is generated. The crawler follows links from `/`, which reaches
  // every doc; the sitemap is named because no page links it as HTML.
  nitro: {
    hooks: {
      // `404.html` is a client-only shell rendered before any page runs, so no
      // head tag from `app/error.vue` reaches it. A static host serves it for
      // every unknown URL, and without this it has no title at all.
      'prerender:generate'(route) {
        if (route.route !== '/404.html' || !route.contents) return
        route.contents = route.contents.replace(
          '</head>',
          `<title>${NOT_FOUND_TITLE}</title><meta name="robots" content="noindex"></head>`
        )
      }
    },
    publicAssets: docsImageAssets,
    prerender: {
      crawlLinks: true,
      // `/changelog` is written as `changelog.html`, not `changelog/index.html`,
      // so static hosts serve it at the slashless URL every link uses.
      autoSubfolderIndex: false,
      failOnError: true,
      routes: ['/', '/sitemap.xml']
    }
  },
  hooks: {
    // MDC reads a shortcut reference such as the changelog's `## [0.1.0]` as an
    // inline span, dropping both the brackets and the link GitHub resolves from
    // `[0.1.0]: <url>`. Spelling each defined label as the equivalent collapsed
    // reference, `[0.1.0][]`, renders what GitHub renders.
    //
    // The docs index renders at /docs rather than /docs/index, so a `./x.md`
    // link written in it would land on /x. Point its links inside /docs here.
    'content:file:beforeParse'({ file, collection }) {
      if (typeof file.body !== 'string') return
      if (collection.name === 'changelog') {
        file.body = collapseShortcutReferences(file.body)
        return
      }
      if (collection.name !== 'docs') return
      file.body = file.body.replace(/\]\(\.\/index\.md(?=[#)])/g, '](/docs')
      if (!/(?:^|[/:])index\.md$/.test(file.id)) return
      file.body = file.body.replace(/\]\(\.\/(?!docs\/)/g, '](./docs/')
    }
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  // Every icon ships in the client bundle, so no page asks api.iconify.design
  // for one at runtime: a static site has no icon endpoint to fall back on.
  icon: {
    provider: 'none',
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts}']
      }
    }
  }
})

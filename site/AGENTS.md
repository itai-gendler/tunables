# AGENTS.md — site/

The tunables.dev site. The repository's own instructions still apply; this file
adds what is specific to `site/`.

## What the site is

- A static Nuxt site, generated with `nuxt generate` into `.output/public`.
  There is no server, database, account, mailing list or request-time logic,
  and nothing may add one: see [ADR-0001](./docs/adr/0001-a-static-site.md).
- It renders this repository: `../docs` (the docs) and `../CHANGELOG.md`, and
  reads the version from `../package.json`. Fix content where it is authored,
  not here.
- Pages are emitted as `name.html` and linked slashless (`/changelog`). Never
  link a trailing-slash URL.
- tunables publishes no theme. The site's theme is its own, in
  `app/assets/css/main.css` and `app/app.config.ts`; the library's screens take
  the host's theme instead.

## Vocabulary

- [`CONTEXT.md`](./CONTEXT.md) is the glossary. Use its terms exactly.
- The product is **tunables**, always lowercase, even at the start of a
  sentence.

## Locations

- `app/` — pages, components, composables, layouts, assets. The home page's
  words are in `app/utils/homeContent.ts`, never in a template.
- `server/` — build-time routes only: the sitemap.
- `shared/` — helpers shared by `app/` and `server/`.
- `config/` — build-time configuration: the syntax theme, Markdown references.
- `tests/integration/` (Vitest), `tests/e2e/` (Playwright, against the
  generated site), `tests/support/`.
- `docs/` — [architecture](./docs/architecture.md), [brand and UI](./docs/brand.md),
  [engineering standards](./docs/engineering-standards.md),
  [deployment](./docs/deployment.md), and `adr/`.

## Docs content

Docs live in `../docs/*.md`, flat, each with `title`, `description`, `group`
and `order` frontmatter. `group` is one of Get started, Concepts, Integrate,
Screens, CLI, Skills, Reference; `order` runs from 1 without gaps across all
docs. Each doc opens with its own `# Title` and links to others as
`./other.md`, so it reads the same on GitHub and in the npm package. Code
samples must compile against the real API in `../src`.

## Verification

Run from `site/` before handing work back:

```bash
pnpm editorconfig
pnpm lint
pnpm typecheck
pnpm knip
pnpm test:integration
pnpm test:e2e
```

Every Playwright page suite runs an axe WCAG 2.0/2.1 A/AA scan; new pages must
be violation-free, in light and dark. When the output changes, generate it and
look at it: `pnpm generate`, then `pnpm preview`.

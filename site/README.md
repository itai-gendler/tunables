# tunables.dev

The [tunables.dev](https://tunables.dev) site: the home page, the docs and the
changelog, generated as static files from this repository, so a change to the
docs and the page that shows it land in one pull request.

| What | Read from |
| --- | --- |
| Pages and components | `site/` |
| Docs | `../docs` |
| Changelog | `../CHANGELOG.md` |
| Version badge | `../package.json` |

## Stack

Nuxt 4 · Nuxt UI v4 · Nuxt Content 3 · Tailwind CSS 4 · Vitest · Playwright ·
pnpm, as the `@tunables/site` member of the repository's workspace.

## Local development

From the repository root, `pnpm install` once, then:

```bash
cd site
pnpm dev
```

`pnpm dev` listens on 0.0.0.0, port 3000. Edits under `../docs` and to
`../CHANGELOG.md` hot-reload.

## Build

```bash
pnpm generate
pnpm preview
```

`pnpm generate` writes the whole site to `.output/public`: one HTML file per
page (`changelog.html`, served at `/changelog`) and the sitemap. Nothing runs
per request, so any static host can serve it.

## Deploy

Cloudflare Pages serves the site (project `tunables`, production branch
`main`). `.github/workflows/site.yml` builds the site once and deploys that
build: a pull request from this repository to a preview URL as soon as the
build passes, and `main` to tunables.dev only once the static checks and the
e2e tests pass too. It needs the repository secrets `CLOUDFLARE_API_TOKEN`
(Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`. Response headers are in
`public/_headers`.

## Verification

```bash
pnpm editorconfig
pnpm lint
pnpm typecheck
pnpm knip
pnpm test:integration
pnpm test:e2e     # generates, then runs Playwright against the static files
```

Further reading: [architecture](./docs/architecture.md),
[brand and UI](./docs/brand.md),
[engineering standards](./docs/engineering-standards.md), and
[ADR-0001](./docs/adr/0001-a-static-site.md).

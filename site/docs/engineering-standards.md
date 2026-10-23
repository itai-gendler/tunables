# Engineering standards

read_when: changing the site's tooling, dependencies, TypeScript or ESLint
policy, tests or CI.

## Runtime and packages

- The site is the private pnpm workspace member `@tunables/site`. It does not
  depend on the `tunables` package: it documents it.
- Node.js `>=22.12.0`. CI uses Node 24.
- The root `packageManager` pins pnpm. CI installs with
  `pnpm install --frozen-lockfile`; a dependency change ships `package.json`
  and the root `pnpm-lock.yaml` together.
- A package imported by page, server-route or build-time code is a
  `dependency`; test runners, linters and tools are `devDependencies`.

## Quality gates

`.github/workflows/site.yml` runs on every pull request and push to `main`
that touches `site/`, `docs/`, `CHANGELOG.md` or the workspace files, and only
in `itai-gendler/tunables`. The `static` job runs the checks; beside it,
`build` runs `pnpm generate` and uploads the output; `e2e` runs Playwright
against it in the Playwright container image, split across two runners. Keep
that image's tag equal to `@playwright/test`. The required `site` check passes
when the change cannot affect the site.

| Command | Contract |
| --- | --- |
| `pnpm editorconfig` | whitespace, encoding, line endings, final newlines |
| `pnpm lint` | one flat ESLint policy (`pnpm lint:fix` to apply fixes) |
| `pnpm typecheck` | Nuxt app/server/shared projects, plus tooling and tests |
| `pnpm knip` | no unused files, exports or dependencies |
| `pnpm test:integration` | Vitest |
| `pnpm generate` | every prerendered route succeeds |
| `pnpm test:e2e` | Playwright (desktop and mobile Chromium) with axe, against the generated site served statically; locally it generates first |

## ESLint boundaries

`eslint.config.mjs` extends the Nuxt flat configuration and adds: `app/` never
imports from `server/`; `shared/` imports from neither. No blanket disables.

## Knip

`knip.json` lists what static analysis cannot see: `content.config.ts` and the
prose components Nuxt Content loads by name, and packages used by string (the
`@iconify-json/*` sets, the `@fontsource` CSS named in `nuxt.config.ts`).
Removing an exception and running `pnpm knip` is the test that it is still
needed.

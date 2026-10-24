# Repository guidance

## Purpose

tunables keeps the values someone tunes while an app runs: declared once with
their kind, unit and default, stored in the app's own database, changed only
through checked saves that record a revision, and shown in screens the app
embeds. It attaches to an existing server, database and sign-in.

[`product-model/`](product-model/README.md) is the Product Model (pdd-kit): what
tunables does — its Capabilities and Scenarios, Business Rules, Entities and
Screens. It is the source of truth the code is checked against. Change what the
product should do with `/pdd-ideate`, check the code against it with
`/pdd-verify`, and never settle a product question in code.
[`CONTEXT.md`](CONTEXT.md) is the vocabulary; use its terms.
[`decisions/`](decisions/) holds the decisions that are expensive to reverse.
[`spec/`](spec/) holds the contracts code follows: change a contract there
before the code it governs, and record options turned down in
[`spec/rejected.md`](spec/rejected.md).

## Layout

- `src/model/` — kinds of setting, units, groups, presets, catalogs, effects,
  deployment values, explanations: what an app declares.
- `src/engine/` — `createTunables`, the storage contract, the memory store and
  the description the screens read.
- `src/postgres/` — Postgres storage and its Drizzle tables.
- `src/server/` — the operations (`service.ts`), the fetch handler, Express and
  oRPC adapters.
- `src/client/`, `src/vue/` — the screens' client and headless composables.
- `layers/nuxt/tunables/` — the embeddable Nuxt UI screens, published as
  `tunables/nuxt`. They bring no theme.
- `src/pdd/` — the Product Model link: explanations, default checks, drafts.
- `src/cli.ts`, `src/commands/`, `src/core/` — the CLI and its installer,
  copied from pdd-kit ([decision 0008](decisions/0008-the-repository-follows-pdd-kit.md)).
- `skills/` — the agent skills `tunables install` puts in place.
- `examples/` — Tasklane, the example app the docs use: a todo app with
  workspaces and people (`examples/tasklane`: groups, plans as a layer, a
  catalog, scopes, its access policy and CLI config), served by Express and by
  Hono (`examples/express`, `examples/hono`). Tested in CI.
- `test/fixtures/news/` — news, the app tunables was extracted from, as
  tunables would hold it, with news's own Product Model entities. Only a test
  fixture: the verification that tunables fits news, never the example the
  docs show.
- `playground/` — Tasklane as a Nuxt host app that embeds the screens over
  oRPC, with staff, a workspace owner and a member. Private workspace member.
- `site/` — tunables.dev, a static Nuxt Content site rendering `docs/` and
  `CHANGELOG.md`. Private workspace member with its own `AGENTS.md`.

## Rules that are load-bearing

Each names the Business Rule it holds as `rule \`slug\``; `pnpm check` fails when
a cited rule is not in the Product Model.

- **A value has one home.** A setting lives in the store, a deployment value in
  the environment ([decision 0002](decisions/0002-a-value-has-one-home.md)).
  Never add a fallback from one to the other.
- **The definition is the one home of a default.** Do not store defaults or
  read them as a fallback at runtime; a missing stored value is an error
  ([decision 0003](decisions/0003-the-definition-is-the-one-home-of-a-default.md)).
- **Every change goes through the engine.** Saves, resets, restores, preset and
  catalog changes take the exclusive lock, run every check, and append one
  revision in the same transaction. Nothing writes the tables directly except
  `tunables/testing`'s `setForTest`, which records its own revision.
- **A refused change is an answer, not an error.** Problems name the field and
  say why in its own words; refusing never throws.
- **Boot never needs the database.** Creating tunables, the server adapters and
  the screens connects to nothing.
- **tunables has no users.** Every request asks the host's `actor` and
  `authorize`; without `authorize`, nothing is allowed.
- **The screens take the host's look.** Use Nuxt UI semantic classes only; no
  colors, fonts or CSS in `layers/nuxt/tunables`.
- **Every adapter passes the same suite.** A store runs `test/suites/engine.ts`
  unchanged; every client runs the client suite in `test/server.test.ts`.
- **The fixture stays faithful to news.** Its keys, facts and defaults are
  news's own; `node dist/cli.js --cwd test/fixtures/news check` holds them to
  news's Product Model. Examples in docs, the site and the skills use Tasklane,
  not news ([decision 0010](decisions/0010-tasklane-is-the-example-news-is-a-fixture.md));
  when Tasklane cannot show a feature, extend Tasklane.

## Local setup

- `pnpm install`, then `pnpm db:test` starts the Postgres the integration
  suites use (Docker, port 5434).
- `pnpm test` runs the unit suites (it builds `dist/` first);
  `pnpm test:integration` runs the engine suite on Postgres through both
  drivers, the lock and transaction checks and the CLI against the database.
- The playground: `pnpm --dir playground dev` serves Tasklane on
  `http://localhost:3000` with in-memory storage, or on Postgres when
  `DATABASE_URL` is set. `pnpm --dir playground screenshots` photographs every
  screen in both themes.
- Screenshot baselines are kept per platform, and CI compares the Linux ones.
  After accepting a screen change on macOS with
  `pnpm --dir playground screenshots:update`, regenerate the Linux baselines in
  `mcr.microsoft.com/playwright:<the @playwright/test version>-noble`, on a copy
  of the repository without `node_modules` (a Linux install must not overwrite
  the macOS one): `pnpm install --frozen-lockfile`, then
  `npx playwright test --update-snapshots=all` in `playground/`, and copy
  `tests/__screenshots__/linux` back. Commit both with the change.
- The site: `pnpm --dir site dev`. How tunables.dev is deployed, and the
  Cloudflare setup behind it, is in [site/docs/deployment.md](site/docs/deployment.md).

## Change and release checks

- Keep changelog entries brief and nontechnical: state only user-visible
  outcomes, under Keep a Changelog's `### Added`, `### Changed`, `### Fixed`
  and `### Removed`. Write the entry under `[Unreleased]` in the change that
  makes it, with no links.
- The repository installs with pnpm, pinned in `packageManager`;
  `pnpm-lock.yaml` is the only lockfile.
- Run `pnpm verify` after any change, `pnpm test:integration` after a change to
  the engine, storage or CLI, and the playground screenshots after a change to a
  screen.
- Lefthook runs the fast gates before each commit and the build and tests
  before each push; do not bypass them with `--no-verify`.
- Dependencies are updated by Renovate.
- Prepare a release in its own pull request: `pnpm version <version>
  --no-git-tag-version`, fetch, then `pnpm changelog:release`. Once it is
  merged, dispatch the Release workflow on `main` with that version
  (`gh workflow run release.yml -f version=<version>`): it verifies, tags
  `v<version>` and starts Publish, which publishes to npm with trusted
  publishing and provenance and creates the GitHub release. The registry shows
  the version a minute or two later.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync
  (`pnpm version` does).
- Docs, the Product Model and these files describe only the current state.
  When something stops being true, delete or rewrite it; do not annotate what
  used to be.
- Do not publish, tag, or push unless explicitly asked, and never push to
  `main` without being asked to.

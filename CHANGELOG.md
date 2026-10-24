# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Scopes:** each workspace and person can set its own value where a field allows it. An app declares its chain of scopes, a field says where it may be overridden, freely or at most or at least what it inherits, and a value is read through the system, the plan, the workspace and the person. A change that would leave a narrower value outside its bound is refused, naming it, and each scope keeps its own history and restore.
- Plans as a layer: a preset set can sit between the system values and a workspace's own.
- Scoped reads and changes in the API, the client, the Vue form and the Nuxt form, which shows where each value comes from and offers to use the inherited value again; the app's access decision receives the scope, so owners and members can change only their own.
- `tunables get`, `set` and `history` take `--scope`, and `set` takes `--inherit`; `get`, `set`, `history` and `restore` can go through the app's API with `--url` and a token instead of the database.
- Tasklane, a todo app with workspaces and people, as the example throughout the docs, in `examples/`, served by Express and by Hono, and as the playground.
- Docs: what tunables is for, scopes, and who can do what.

### Changed

- A catalog entry picked by a setting, for the whole system or at a scope, counts as in use and cannot be retired.
- The news app tunables was extracted from is now only a test fixture, under `test/fixtures/news`.

## [0.1.0] - 2026-10-24

### Added

- Settings declared once, with their kind, unit, default, section, effects and Product Model fact, checked on every save in their own words, with rules across settings, guards for what the app keeps, and confirmations for changes with consequences.
- Every change recorded as a revision, with each value before and after; restore an earlier revision through the same checks; reset to defaults.
- Named presets with one default per slot, assigned by reference and bounded by the settings; catalogs of allowed choices that keep an entry in use available.
- Deployment values read from the environment with defaults, and `.env.example` written from them.
- Storage in the app's own Postgres through node-postgres or postgres.js, inside its transactions, behind a storage contract with an in-memory store for tests.
- **Server:** the operations as a web-standard handler for Nitro, Hono, Bun or Deno, as Express middleware, and as an oRPC router, with access decided by the app.
- **Screens:** a Nuxt layer with a settings form, All settings, history with restore, presets, assignment and catalog screens, in the app's own Nuxt UI look; headless Vue composables for other designs.
- **CLI:** `check`, `env`, `explain`, `model draft`, `sync`, `get`, `set`, `history`, `restore`, `install` and `update`.
- **Skills:** `tunables-adopt`, `tunables-define` and `tunables-verify`, installed with `npx tunables install`.
- **Product Model:** field explanations from a pdd-kit Product Model, defaults checked against it, and missing facts drafted for `/pdd-ideate`.
- **Docs:** tunables.dev, with a quickstart, concepts, integration, screens, CLI and skills guides.

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.1.0][0.1.0]

[Unreleased]: https://github.com/itai-gendler/tunables/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/itai-gendler/tunables/releases/tag/v0.1.0

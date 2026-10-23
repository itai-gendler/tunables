# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/itai-gendler/tunables/commits/main

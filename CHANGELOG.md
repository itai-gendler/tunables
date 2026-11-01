# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-11-01

### Added

- Deployment values can be optional, secret or carry a local example, and `.env.example` wraps their descriptions at 80 columns. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- The screens fit an app's own pages: `bare` leaves the title to the page, the group form's unsaved-changes bar can sit in a page's footer, `size` sets the size of every control, and every field and section has an address to link to. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A section states once the effects all its settings share. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- `atMost: 'group.key'` holds a preset's number field at or below a setting: checked when the preset is saved and when the setting is lowered, worded by tunables, and shown beside the field in the editor. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A refused change names the preset in its way, and the group form says to lower it first. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A group's `afterSave` says what a saved change does next, beside *Saved*. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- `TunablesPresets` and `TunablesCatalog` take a `summary` slot for each row; a catalog row lists all its values by default. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A subject's assignments read in `TunablesHistory` as the preset each slot runs as. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))

### Changed

- `TunablesAssign` takes `for-slot` instead of `slot`, which Vue reserves. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A new preset starts as a copy of its slot's default. A preset's or catalog entry's fields no longer show a default or a reset: a named record has none of its own. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))

### Fixed

- A range or size stored in Postgres no longer reads as changed from its default. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A history lists its changes newest first past ten of them on Postgres. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- `tunables check` reads a stated default of "1 day" as the "24 hours" a setting declares. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A `bare` group form or preset list heads its sections one level below the page's own title. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- The unsaved-change marks are announced as images, which their label needs. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- The save bar keeps its padding in a page's footer, and the restore dialog says whose change it puts back plainly. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A history can be scrolled from the keyboard when none of its revisions offers a Restore. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))
- A group form whose save bar sits in a page's footer hydrates without a mismatch. ([#1](https://github.com/itai-gendler/tunables/pull/1)) ([3182589](https://github.com/itai-gendler/tunables/commit/3182589ac6188eed9c9245f1e9a0d19a8375a1c8))

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.2.0...v0.3.0][0.3.0]

## [0.2.0] - 2026-10-24

### Added

- **Scopes:** each workspace and person can set its own value where a field allows it. An app declares its chain of scopes, a field says where it may be overridden, freely or at most or at least what it inherits, and a value is read through the system, the plan, the workspace and the person. A change that would leave a narrower value outside its bound is refused, naming it, and each scope keeps its own history and restore. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- Plans as a layer: a preset set can sit between the system values and a workspace's own. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- Scoped reads and changes in the API, the client, the Vue form and the Nuxt form, which shows where each value comes from and offers to use the inherited value again; the app's access decision receives the scope, so owners and members can change only their own. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- `tunables get`, `set` and `history` take `--scope`, and `set` takes `--inherit`; `get`, `set`, `history` and `restore` can go through the app's API with `--url` and a token instead of the database. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- Tasklane, a todo app with workspaces and people, as the example throughout the docs, in `examples/`, served by Express and by Hono, and as the playground. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- Docs: what tunables is for, scopes, and who can do what. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))

### Changed

- A catalog entry picked by a setting, for the whole system or at a scope, counts as in use and cannot be retired. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))
- The news app tunables was extracted from is now only a test fixture, under `test/fixtures/news`. ([4ceb18f](https://github.com/itai-gendler/tunables/commit/4ceb18f0dca05a06370f09b7b34611d4c0eb15d7))

### Contributors

- [@itai-gendler](https://github.com/itai-gendler)

**Full Changelog**: [v0.1.0...v0.2.0][0.2.0]

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

[Unreleased]: https://github.com/itai-gendler/tunables/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/itai-gendler/tunables/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/itai-gendler/tunables/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/itai-gendler/tunables/releases/tag/v0.1.0

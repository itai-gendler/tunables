# One package, with a subpath per part and optional peers

Status: accepted.

## Context

tunables has a core, a Postgres store, server adapters, Vue composables, Nuxt
screens, a Product Model link and a CLI. Separate packages would each need a
name, a version and a release, and `config-toolkit`-style names were taken.

## Decision

- One npm package, `tunables`, with subpath exports: `tunables`,
  `tunables/postgres`, `tunables/drizzle`, `tunables/server`,
  `tunables/express`, `tunables/orpc`, `tunables/client`, `tunables/vue`,
  `tunables/nuxt`, `tunables/pdd`, `tunables/testing`, `tunables/config`, and
  the `tunables` command — the way `pdd-toolkit` ships `pdd-toolkit/report`.
- Every framework and driver is an optional peer. Runtime dependencies are
  only what the core and the CLI need.

## Consequences

- One version and one changelog for everything.
- A CLI-only or core-only install pulls no Vue, Nuxt, oRPC, Express or driver;
  `check-repo` refuses a peer that is not optional.

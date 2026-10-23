# The repository follows pdd-kit's structure

Status: accepted.

## Context

pdd-kit, by the same author, already has a CLI scaffold, a skill installer,
packaging checks, a release flow with npm trusted publishing, CI, a static docs
site and agent setup that work.

## Decision

- Copy them and adapt the names: `src/cli.ts`, the update check and invocation
  hints, `install`/`update` and the ownership marker, tsdown with subpath
  exports, the package-size and Nuxt-consumer checks, the changelog tooling,
  `release.yml` and `publish.yml`, lefthook, Renovate, the generic half of
  `check-repo`, the site scaffold, `CLAUDE.md` → `AGENTS.md`.
- Extract shared code into a common package only after both copies have held
  steady through several releases.

## Consequences

- A fix to a copied part is made in both repositories until it is extracted.

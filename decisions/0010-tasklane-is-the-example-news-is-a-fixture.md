# Tasklane is the example; news is a test fixture

Status: accepted.

## Context

tunables was extracted from news, and its first fixture, playground, landing
page and docs all used news's settings: Feeds, Run Configs, Screening, Readers.
Read by anyone else, those examples explained news rather than tunables: a
reader had to learn a news app to see what a setting, a preset or a catalog is
for. Scoped values made it plainer still, since news has no workspaces.

## Decision

- **Tasklane** is the one example: a todo app with workspaces and the people in
  them, Free, Pro and Team plans as a layer of its limits, a catalog of
  suggestion models, and staff, an owner and a member with different access.
  It lives in `examples/tasklane` and is what the docs, the landing page, the
  skills, the playground and the Express and Hono examples show.
- **news** is kept only as a test fixture in `test/fixtures/news`, with news's
  own keys, facts, defaults and Product Model entities, so CI keeps proving
  tunables still fits the app it came from
  (`node dist/cli.js --cwd test/fixtures/news check`).
- news itself is not migrated to tunables by this repository; that is news's
  own change, made when news adopts it.

## Consequences

- A feature is shown in Tasklane terms. When Tasklane cannot show a feature,
  extend Tasklane rather than borrowing another app's vocabulary.
- A change that breaks the news fixture is a regression, even though no doc
  mentions news.

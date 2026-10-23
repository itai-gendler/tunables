# Contributing

Thank you for helping. Small, focused pull requests are easiest to review.

## Before you start

- Read [AGENTS.md](AGENTS.md) for how the repository is laid out and the rules
  the code holds, and [CONTEXT.md](CONTEXT.md) for the vocabulary.
- What tunables does is described in its [Product Model](product-model/README.md).
  A change to behavior starts there, with `/pdd-ideate`, and the code is checked
  against it with `/pdd-verify`.
- A change to how things are stored or served starts in
  [spec/storage.md](spec/storage.md) or [spec/handlers.md](spec/handlers.md).

## Setup

```sh
corepack enable
pnpm install
pnpm db:test            # Postgres for the integration suites, in Docker
pnpm verify             # typecheck, build, size budgets, unit tests, repo checks
pnpm test:integration   # the engine on Postgres, both drivers, and the CLI
```

The playground embeds every screen: `pnpm --dir playground dev`, then open
`http://localhost:3100`.

## Making a change

1. Write or update the tests first: the engine suite in `test/suites/engine.ts`
   runs against every store, and the client suite in `test/server.test.ts`
   against every adapter.
2. Keep the fixture faithful to news: `node dist/cli.js --cwd fixture check`.
3. For a screen, run `pnpm --dir playground screenshots` and commit the new
   baselines with the change.
4. Add a line under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) saying what
   changed for someone using tunables.
5. For a skill, keep its name prefixed with `tunables-`, its `SKILL.md` under
   500 lines, and update `agents/openai.yaml`.

The Git hooks run the same gates as CI. Do not bypass them.

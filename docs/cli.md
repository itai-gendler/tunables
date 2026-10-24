---
title: The CLI
description: The tunables command, tunables.config.ts, and which commands need a database.
group: CLI
order: 19
---

# The CLI

The `tunables` command checks your definitions, writes the files generated
from them, reads and changes stored values through the same checks as the
screens, and installs the agent skills. It is installed with the package:

```bash
npx tunables --help
```

## Commands

| Command | Does | Needs a database |
| --- | --- | --- |
| [`check`](./cli-check.md#check) | Check definitions, `.env.example` and the Product Model | No |
| [`env`](./cli-check.md#env) | Write `.env.example` from the deployment values | No |
| [`explain`](./cli-check.md#explain) | Write field explanations from the Product Model | No |
| [`model draft`](./cli-check.md#model-draft) | Draft the facts the Product Model lacks | No |
| [`sync`](./cli-values.md#sync) | Seed new settings with their defaults | Yes |
| [`get`](./cli-values.md#get) | Print stored values, for the system or a scope | Yes, or the app's API |
| [`set`](./cli-values.md#set) | Change values, checked and recorded | Yes, or the app's API |
| [`history`](./cli-values.md#history) | Show a group's revisions | Yes, or the app's API |
| [`restore`](./cli-values.md#restore) | Restore a group to an earlier revision | Yes, or the app's API |
| [`install`](./cli-skills.md#install) | Install the agent skills | No |
| [`update`](./cli-skills.md#update) | Update installed skills | No |

Every command takes:

| Option | Does |
| --- | --- |
| `-c, --cwd <path>` | Run from another directory |
| `--config <file>` | Use this config instead of `tunables.config.ts` |
| `-h, --help` | Show help for the command |
| `-V, --version` | Show the CLI version |

`get`, `set` and `history` take `--scope workspace=acme,user=dana` to work at
a [scope](./scopes.md). `get`, `set`, `history` and `restore` take
`--url <url>`, or read `TUNABLES_URL`, to go through your app's tunables API
with `TUNABLES_TOKEN` as a bearer token instead of through `connect`; see
[Through your app's API](./cli-values.md#through-your-apps-api).

A command exits 0 when it succeeds, 1 when what it checked does not hold or a
change was refused, and 2 for a usage mistake, such as a missing config or an
unknown group.

## tunables.config.ts

The commands read `tunables.config.ts` (or `.mts`, `.js`, `.mjs`) at the root
of your app. It is TypeScript, loaded as it is; nothing needs building first.

```ts [tunables.config.ts]
import pg from 'pg'
import { defineConfig } from 'tunables/config'
import { fromPg, migrate } from 'tunables/postgres'
import { catalogs, effects, environment, groups, presets, units } from './server/settings'
import { makeTunables } from './server/tunables'

let pool: pg.Pool | undefined

export default defineConfig({
  groups,
  presets,
  catalogs,
  units,
  effects,
  environment,
  envExample: '.env.example',
  envHeader: 'Deployment values. Settings an administrator tunes live in the database.',
  productModel: 'product-model',
  explanations: 'server/tunables-explanations.ts',
  async connect() {
    pool = new pg.Pool({ connectionString: environment.get('DATABASE_URL') })
    await migrate(fromPg(pool))
    return makeTunables(fromPg(pool))
  },
  async disconnect() {
    await pool?.end()
  }
})
```

| Option | What it is |
| --- | --- |
| `groups`, `presets`, `catalogs`, `units`, `effects` | Your definitions, as you pass them to `createTunables`. Enough for every command that needs no database. |
| `environment` | Your [deployment values](./deployment-values.md). |
| `envExample`, `envHeader` | Where `.env.example` is (`.env.example` by default) and the lines it starts with. |
| `productModel` | Your pdd-kit Product Model. Defaults to `product-model` when that directory exists. |
| `explanations`, `explanationsImport` | Where `tunables explain` writes the explanations module, and what it imports its type from (`tunables` by default). |
| `connect` | Your app's tunables over its own store. Called only by the commands that read or change stored values, unless they are given `--url`. |
| `disconnect` | Close what `connect` opened, so the command can exit. |

Importing the config must not connect to anything: open the connection inside
`connect`, so `check` and the other offline commands, and the agent skills that
run them, work without a database.

## Who a change is recorded as

A change from the terminal is recorded with your username and
`(terminal)`, such as `ada (terminal)`, and needs a `--reason`, which is kept
in the history. Through `connect`, the commands reach everything the database
does, and your `authorize` is not asked. With `--url`, the change is recorded
as the actor your app names for `TUNABLES_TOKEN`, and your `authorize` decides
what it may do.

[`examples/tasklane/tunables.config.ts`](https://github.com/itai-gendler/tunables/blob/main/examples/tasklane/tunables.config.ts)
is a complete config: in memory, or on Postgres when `DATABASE_URL` is set.

## Update checks

A globally installed CLI checks npm for a newer version at most once a day, in
the background, and asks once per new version whether to update. It never
checks in CI, without a terminal, when run through `npx`, or as a project
dependency, whose version your lockfile decides. Set
`TUNABLES_NO_UPDATE_CHECK=1` to turn it off.

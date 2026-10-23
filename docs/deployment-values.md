---
title: Deployment values
description: Values a deployment sets in its environment and nobody tunes while the app runs, declared once and listed in .env.example.
group: Concepts
order: 9
---

# Deployment values

Not every value is a setting. A lock id, a batch size, a log level, the
database URL: a deployment sets these in its environment, and nobody tunes them
while the app runs. tunables calls them **deployment values**, and gives them
the same treatment as settings: declared once, with a description and a
default, checked as a whole, and listed for whoever deploys the app.

## One home per value

A value lives in the environment or in a group, **never both**. There is no
precedence rule, because there is never a second place a value could come
from. Ask one question of each value: *would anyone change this while the app
runs, without a deploy?*

- **Yes:** it is a setting. Put it in a [group](./settings-and-groups.md).
- **No, but it differs per deployment, or it is a secret:** it is a
  deployment value.
- **No, and it never differs:** it is code. Layout geometry, format tables and
  protocol constants stay where they are.

Moving a value from one home to the other deletes the old one in the same
change.

## Declaring them

```ts [server/environment.ts]
import { defineEnvironment, env } from 'tunables'

export const environment = defineEnvironment({
  DATABASE_URL: env.string({ description: 'The Postgres the app and tunables share.', section: 'Infrastructure' }),
  APP_LOCK_SCHEDULER: env.integer({ default: 7101, description: 'Advisory lock id the scheduler holds while it ticks.', section: 'Mechanics' }),
  APP_QUERY_BATCH: env.integer({ default: 500, max: 5000, description: 'Rows written per statement when a batch is saved.', section: 'Mechanics' }),
  APP_LOG_LEVEL: env.choice({ options: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'How much the server and worker log.', section: 'Mechanics' }),
  APP_TRACE: env.boolean({ default: false, description: 'Whether requests are traced.', section: 'Mechanics' })
})
```

| Builder | Value | Accepts |
| --- | --- | --- |
| `env.string` | `string` | any text |
| `env.integer` | `number` | a whole number, at least 1 unless `min` says otherwise, at most `max` |
| `env.number` | `number` | a number more than 0 unless `min` says otherwise, at most `max` |
| `env.boolean` | `boolean` | `1`, `true`, `yes`, `on` or `0`, `false`, `no`, `off` |
| `env.choice` | one of `options` | one of the options, exactly |

Each takes a `description`, a `default` unless it must be set, and a `section`
it is listed under in `.env.example`.

## Reading them

Read them once at start. No database is involved.

```ts
const config = environment.read() // every value, checked at once
config.APP_QUERY_BATCH // number
config.APP_LOG_LEVEL // 'debug' | 'info' | 'warn' | 'error'

environment.get('APP_LOCK_SCHEDULER') // one value
```

`read` checks every value and throws one `EnvironmentError` naming each that
is missing or malformed, so a bad deployment fails at start with the whole
list, not one variable at a time:

```
The environment is not valid:
- DATABASE_URL: is required and not set.
- APP_QUERY_BATCH: may not be more than 5000.
```

Both read `process.env` unless you pass another source.

## .env.example

`.env.example` is written from the declarations, never by hand. Each value
appears under its section, with its description, commented out at its default;
one without a default is left uncommented and empty, because it must be set.

```bash
npx tunables env
```

```ini [.env.example]
# Deployment values. Settings an administrator tunes live in the database.

# --- Infrastructure

# The Postgres the app and tunables share.
DATABASE_URL=

# --- Mechanics

# Advisory lock id the scheduler holds while it ticks.
# APP_LOCK_SCHEDULER=7101
```

Name the file and its header in `tunables.config.ts`:

```ts [tunables.config.ts]
export default defineConfig({
  groups,
  environment,
  envExample: '.env.example',
  envHeader: 'Deployment values. Settings an administrator tunes live in the database.'
})
```

`tunables check` fails when `.env.example` does not list the values as
declared, so a new variable cannot ship undocumented. `renderEnvExample` gives
you the same text in code.

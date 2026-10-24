# tunables

**Runtime settings with guardrails, for the app you already run.**

Every app has values someone needs to tune while it runs: limits, intervals,
budgets, sizes. They end up as constants, environment variables and one-off
admin forms, with no history, and lowering one quietly breaks whatever was using
more. tunables gives each of them one home:

- **Declare each setting once**: its kind, unit, default, explanation and what
  it affects. Checks, storage, the API and the form all follow from it.
- **Store it in your own Postgres**, inside your transactions. No separate
  service.
- **Change it safely**: every save is checked whole and refused in plain words,
  rules across settings hold, a limit is never lowered below what uses it, and a
  change with consequences asks to be confirmed.
- **See and undo every change**: one revision per change, restore through the
  same checks.
- **Embed the screens** in your own administration, in your own Nuxt UI look.
- **Per workspace and per person**: each workspace and person sets its own
  value, within the plan, where a field allows it. Every value says where it
  comes from, and a broader change never strands a narrower one.
- **Presets and catalogs** for named configurations assigned by reference, such
  as plans, and lists of allowed choices that keep what is in use.
- **Built for coding agents**: a CLI, agent skills, and field explanations from
  a [pdd-kit](https://pdd-kit.dev) Product Model.

```sh
npm i tunables
```

```ts
import { createTunables, defineGroup, number } from 'tunables'
import { fromPostgresJs, migrate, postgresStore } from 'tunables/postgres'

export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, override: { workspace: 'at-most' } })
  }
})

const client = fromPostgresJs(sql) // your postgres.js or node-postgres client
await migrate(client)
export const tunables = createTunables({ store: postgresStore(client), groups: [limits], scopes: ['workspace', 'user'] })

await tunables.sync()
const { maxProjects } = await tunables.get('limits', { scope: { workspace: 'acme' } })
```

Mount the API in your server and embed the screens:

```ts
import { createHandler } from 'tunables/server'
const handle = createHandler({ tunables, actor: req => currentUser(req)?.id, authorize: req => isAdmin(req) })
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['tunables/nuxt'] })
```

```vue
<TunablesGroupForm group="limits" />
<TunablesGroupForm group="limits" :scope="{ workspace: 'acme' }" />
```

Install the agent skills into your repository:

```sh
npx tunables install
```

## Documentation

[tunables.dev](https://tunables.dev) · [Quickstart](docs/quickstart.md) ·
[What it is for](docs/patterns.md) · [Concepts](docs/settings-and-groups.md) ·
[Scopes](docs/scopes.md) · [Who can do what](docs/access.md) ·
[CLI](docs/cli.md) · [Skills](docs/skills.md)

## Examples

[Tasklane](docs/tasklane-example.md), a todo app with workspaces and people, is
the example throughout the docs:

- [`examples/tasklane`](examples/tasklane/tunables.ts): its limits, workspace
  settings, plans, models and scopes, its access policy and its CLI config.
- [`examples/express`](examples/express/app.ts) and
  [`examples/hono`](examples/hono/app.ts): Tasklane served by Express and by
  Hono, with routes of its own that read each person's values. Run
  `npx jiti examples/express/server.ts` or `npx jiti examples/hono/server.ts`.
- [`playground/`](playground/package.json): Tasklane as a Nuxt app over oRPC,
  with staff, a workspace owner and a member to switch between.
  Run `pnpm --dir playground dev`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). What tunables does is described in its
[Product Model](product-model/README.md); how to work in this repository is in
[AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

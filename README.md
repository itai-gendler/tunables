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
- **Presets and catalogs** for named configurations assigned by reference, and
  lists of allowed choices that keep what is in use.
- **Built for coding agents**: a CLI, agent skills, and field explanations from
  a [pdd-kit](https://pdd-kit.dev) Product Model.

```sh
npm i tunables
```

```ts
import { createTunables, defineGroup, number } from 'tunables'
import { fromPostgresJs, migrate, postgresStore } from 'tunables/postgres'

export const run = defineGroup({
  id: 'run',
  title: 'Run Settings',
  fields: {
    budgetLimitUsd: number({ label: 'Budget limit', unit: 'dollars', integer: false, default: 25, affects: ['cost'] })
  }
})

const client = fromPostgresJs(sql) // your postgres.js or node-postgres client
await migrate(client)
export const tunables = createTunables({ store: postgresStore(client), groups: [run], effects: { cost: { label: 'Model cost', warn: true } } })

await tunables.sync()
const { budgetLimitUsd } = await tunables.get('run')
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
<TunablesGroupForm group="run" />
```

Install the agent skills into your repository:

```sh
npx tunables install
```

## Documentation

[tunables.dev](https://tunables.dev) · [Quickstart](docs/quickstart.md) ·
[Concepts](docs/settings-and-groups.md) · [CLI](docs/cli.md) · [Skills](docs/skills.md)

`fixture/` holds a complete example: the settings, Run Configs and permitted
models of the news app tunables was extracted from. `playground/` embeds its
screens in a Nuxt app.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). What tunables does is described in its
[Product Model](product-model/README.md); how to work in this repository is in
[AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

# Wiring

How each part of an adoption is written. The names are the package's real
exports: `tunables`, `tunables/postgres`, `tunables/drizzle`,
`tunables/server`, `tunables/express`, `tunables/orpc`, `tunables/client`,
`tunables/vue`, `tunables/nuxt`, `tunables/config`, `tunables/testing`. Adapt
paths and names to the app; keep the shapes.

## The definitions module

One module declares everything, and both the app and `tunables.config.ts`
import it. It must import nothing that connects.

```ts
// server/settings.ts
import {
  choice, defineCatalog, defineEffects, defineEnvironment, defineGroup, definePresets,
  env, number, pick, text, toggle, type Unit
} from 'tunables'

/** Units of the app's own, beside the built-in ones. */
export const units = {
  cents: { label: 'cents', format: (value: number) => `${value}¢` }
} satisfies Record<string, Unit>

/** What changing a setting changes. `warn` marks what costs money or reaches people. */
export const effects = defineEffects({
  members: { label: 'What everyone in the workspace sees', icon: 'i-lucide-users' },
  cost: { label: 'AI cost', warn: true, icon: 'i-lucide-coins' }
})

/** Where a setting may take its own value, broadest first. Only when the app has tenants. */
export const scopes = ['workspace', 'user'] as const

export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  description: 'How much a workspace may hold and use. A workspace takes its plan\'s limits, and its owner may lower them.',
  entity: 'limits', // with a Product Model: the Entity whose facts these fields are
  place: { label: 'Admin › Limits', href: '/admin/limits' },
  fields: {
    maxProjects: number({ fact: 'Projects', unit: 'count', default: 3, max: 10000, affects: ['members'], override: { workspace: 'at-most' } }),
    aiSuggestionsPerDay: number({ fact: 'AI suggestions a day', unit: 'count', default: 20, min: 0, max: 10000, affects: ['cost'], override: { workspace: 'at-most', user: 'at-most' } })
  }
})

export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  description: 'How a workspace works for everyone in it.',
  entity: 'workspace',
  place: { label: 'Workspace settings', href: '/workspace' },
  fields: {
    defaultView: choice({ fact: 'Default view', options: [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }], default: 'list', affects: ['members'], override: ['workspace', 'user'] }),
    dueSoonDays: number({ fact: 'Due soon', unit: 'days', default: 2, max: 30, affects: ['members'], override: ['workspace', 'user'] }),
    archiveAfterDays: number({ fact: 'Archive done tasks after', unit: 'days', default: 30, max: 365, affects: ['members'], override: ['workspace'] }),
    guestAccess: toggle({ fact: 'Guests', default: false, affects: ['members'], override: ['workspace'] }),
    suggestionModel: pick({ fact: 'Suggestion model', catalog: 'models', default: 'small', affects: ['cost'] }) // staff only
  },
  rules: values => values.dueSoonDays > values.archiveAfterDays
    ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
    : [],
  confirm: (next, previous) => next.guestAccess && !previous.guestAccess
    ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
    : undefined
})

export const tasks = defineGroup({
  id: 'tasks',
  title: 'Tasks',
  description: 'How tasks repeat.',
  entity: 'tasks',
  place: { label: 'Admin › Tasks', href: '/admin/tasks' },
  fields: {
    longestRepeatDays: number({ fact: 'Longest repeat', unit: 'days', default: 90, max: 365, affects: ['members'] })
  }
})

/** Plans: a layer of Limits at the workspace, between the system value and the workspace's own. */
export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  singular: 'Plan',
  entity: 'plan',
  place: { label: 'Admin › Plans', href: '/admin/plans' },
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: {
    maxProjects: number({ fact: 'Projects', unit: 'count', default: 3, max: 10000 }),
    aiSuggestionsPerDay: number({ fact: 'AI suggestions a day', unit: 'count', default: 20, min: 0, max: 10000 })
  },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free', values: { maxProjects: 3, aiSuggestionsPerDay: 5 } },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50, aiSuggestionsPerDay: 100 } }
  ]
})

export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  entity: 'model',
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ fact: 'Label', default: '', optional: false, maxLength: 80 }),
    centsPerSuggestion: number({ fact: 'Cost a suggestion', unit: 'cents', default: 1, affects: ['cost'] })
  },
  seed: [{ id: 'small', values: { label: 'Small and quick', centsPerSuggestion: 1 } }]
})

export const environment = defineEnvironment({
  DATABASE_URL: env.string({ description: 'The Postgres the app and tunables share.', section: 'Infrastructure' }),
  APP_QUERY_BATCH: env.integer({ default: 500, description: 'Rows written per statement when a batch is saved.', section: 'Mechanics' }),
  APP_LOG_LEVEL: env.choice({ options: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'How much the server logs.', section: 'Mechanics' })
})

export const groups = [limits, workspace, tasks] as const
export const presets = [plans] as const
export const catalogs = [models] as const
```

Without a Product Model, drop `entity` and `fact`, and give each field `help`
(and `label` when the key does not read well). Without tenants, drop `scopes`,
every `override` and the `layer`: every value is then the system's. The
`tunables-define` skill's references cover fields, `override`, `within`,
`rules`, `seed` and `pick` in detail.

## The app's tunables

`createTunables` checks the definitions and never connects. Hand it a store
over the client the app already has; both node-postgres pools and postgres.js
connect on their first query, so boot stays database-free.

```ts
// server/tunables.ts
import { createTunables } from 'tunables'
import { fromPg, postgresStore, type SqlClient } from 'tunables/postgres'
import { pool } from './db' // the app's own pg.Pool
import { catalogs, effects, groups, presets, scopes, units } from './settings'
import { explanations } from './tunables-explanations' // generated by `tunables explain`; add once it exists
import { modelsInUse, recurringWithin, scopeLabel, workspaceNotes } from './tasks'

export function makeTunables(client: SqlClient = fromPg(pool)) {
  return createTunables({
    store: postgresStore(client, { schema: 'tunables' }),
    groups,
    presets,
    catalogs,
    units,
    effects,
    explanations,
    scopes, // only with tenants
    scopeLabel, // (scope, id) => 'Acme': how a workspace or person reads in refusals and screens
    guards: { tasks: [recurringWithin] },
    notes: { workspace: workspaceNotes },
    uses: { models: modelsInUse } // catalog id → names of app data using an entry, so it cannot be retired
  })
}

let instance: ReturnType<typeof makeTunables> | undefined
export const useTunables = () => (instance ??= makeTunables())
```

With postgres.js use `fromPostgresJs(sql)`. With Drizzle, pass the driver
client Drizzle was built on (`fromPg(pool)` or `fromPostgresJs(sql)`), not the
Drizzle object.

## Storage

tunables keeps four tables (`tunables_groups`, `tunables_revisions`,
`tunables_records`, `tunables_assignments`) in a schema of their own, `tunables`
by default. Use the same `schema` everywhere. Pick one:

- **`migrate`**, for an app without its own migration tool for these tables.
  It creates them if absent and is safe on every deploy. Run it in the migrate
  step, or inside the config's `connect`, so `tunables sync` creates and seeds
  in one command. Never at boot.

  ```ts
  import { fromPg, migrate } from 'tunables/postgres'
  await migrate(fromPg(pool), { schema: 'tunables' })
  ```

- **Drizzle**, for an app that generates migrations with drizzle-kit. Export
  each table from the schema file, so drizzle-kit sees them:

  ```ts
  // db/schema.ts
  import { tunablesTables } from 'tunables/drizzle'
  const tunables = tunablesTables('tunables')
  export const tunablesSchema = tunables.schema
  export const tunablesGroups = tunables.groups
  export const tunablesRevisions = tunables.revisions
  export const tunablesRecords = tunables.records
  export const tunablesAssignments = tunables.assignments
  ```

- **Plain SQL migrations**: `tunablesSql({ schema: 'tunables' })` from
  `tunables/postgres` returns the DDL to put in one.

Only tunables writes these tables. The app reads settings with `get`, never
with SQL.

## tunables.config.ts

What the CLI and these skills read. Importing it must not connect: open the
connection inside `connect`.

```ts
// tunables.config.ts
import pg from 'pg'
import { defineConfig } from 'tunables/config'
import { fromPg } from 'tunables/postgres'
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
  productModel: 'product-model', // only with a pdd-kit Product Model
  explanations: 'server/tunables-explanations.ts', // where `tunables explain` writes
  async connect() {
    pool = new pg.Pool({ connectionString: environment.get('DATABASE_URL') })
    return makeTunables(fromPg(pool))
  },
  async disconnect() {
    await pool?.end()
  }
})
```

The explanations module does not exist until `tunables explain` writes it.
Leave its import out of `server/tunables.ts` until then, or the config cannot
load.

## The server

Every adapter runs the same service: each request is answered only after
`actor` and `authorize` allow it.

Any server that speaks web `Request`/`Response` (Nitro, Nuxt, Hono, Bun, Deno,
Workers) uses `createHandler`. It answers paths under `basePath`
(`/api/tunables` by default) and returns `undefined` for the rest.

```ts
// Nuxt: server/routes/api/tunables/[...].ts
import type { H3Event } from 'h3'
import { createHandler } from 'tunables/server'

let handle: ReturnType<typeof createHandler<H3Event>> | undefined

export default defineEventHandler(async (event) => {
  handle ??= createHandler<H3Event>({
    tunables: useTunables(),
    actor: async (event) => {
      const user = await currentUser(event) // the app's own sign-in
      return user ? { id: user.id, name: user.name } : undefined
    },
    authorize: async (event, { action, target, actor }) => isAdministrator(event),
    host: event => useDatabase(event) // what guards, notes and uses receive as `host`; optional
  })
  return (await handle(toWebRequest(event), event)) ?? createError({ statusCode: 404 })
})
```

```ts
// Hono
const handle = createHandler<Context>({
  tunables,
  actor: (c) => {
    const user = c.get('user')
    return user ? { id: user.id, name: user.name } : undefined
  },
  authorize: c => c.get('user')?.role === 'admin'
})
app.all('/api/tunables/*', async c => (await handle(c.req.raw, c)) ?? c.notFound())
```

```ts
// Express: the context is the Express request
import { tunablesMiddleware } from 'tunables/express'
app.use(tunablesMiddleware({
  tunables,
  actor: req => req.user ? { id: req.user.id, name: req.user.name } : undefined,
  authorize: (req, { action }) => action === 'read' ? req.user.isStaff : req.user.isAdmin
}))
```

```ts
// oRPC: nested in the app's own router, with its context
import { tunablesRouter } from 'tunables/orpc'
export const router = { ...appRouter, tunables: tunablesRouter<AppContext>({ tunables, actor, authorize }) }
```

## Access

- `actor(context)` returns who is asking from the app's own session — a string
  or `{ id, name }` — or `undefined` when nobody is signed in. Revisions record
  the name.
- `authorize(context, { action, target, actor })` returns whether this actor
  may do this. `action` is `read` or `change`; `target.kind` is `description`,
  `group`, `presets`, `catalog` or `history`, and `target.id` names the group,
  preset set or catalog when there is one. For a group's read, change, history
  and restore at a scope, `target.scope` is the path, such as
  `{ workspace: 'acme' }`. Without `authorize`, nothing is allowed. Decide it
  from the app's existing roles; never return `true` for everyone.
- With scopes, let owners and members change only their own path, and let
  them read the description, which their settings screen needs:

  ```ts
  authorize: async (event, { target }) => {
    const user = await currentUser(event)
    if (!user) return false
    if (user.staff) return true
    if (target.kind === 'description') return true
    if (target.kind !== 'group' || !target.scope?.workspace) return false
    if (target.scope.user) return target.scope.user === user.id && await isMember(user.id, target.scope.workspace)
    return isOwner(user.id, target.scope.workspace)
  }
  ```

  A malformed path is answered 400 only to someone `authorize` admits; anyone
  else gets the usual refusal.
- `refusal` is `not-found` by default, so an outsider cannot tell the
  administration exists; `forbidden` answers 401/403 instead.
- `host(context)` hands guards, notes and uses the request's database or
  transaction.

When app code itself calls `save`, `reset`, `restore`, or a preset or catalog
change, it checks access itself first and passes `{ actor, reason }`.

## Screens

**Nuxt UI.** Extend the layer; its components use the host's own Nuxt UI
theme and bring no CSS.

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['tunables/nuxt'], modules: ['@nuxt/ui'] })
```

The screens call the fetch API at `appConfig.tunables.baseURL`
(`/api/tunables` by default). Place each component on the page beside what it
affects (the group's `place`), behind the app's own admin route guard:

| Component | Props | Shows |
| --- | --- | --- |
| `TunablesGroupForm` | `group`, `scope?`, `history?` | One group's form by section, with effects, problems, confirmation and history; given a `scope`, only the fields that scope may set, each with what it inherits and from where |
| `TunablesOverview` | — | All settings: every group, its values, what differs from default, where each is edited |
| `TunablesPresets` | `set` | A preset set: create, edit, make default, remove |
| `TunablesAssign` | `set`, `subject`, `slot`, `label?` | Which preset one subject follows for one slot |
| `TunablesCatalog` | `catalog` | A catalog: add, edit, retire, reinstate, what uses each entry |
| `TunablesHistory` | `target` (`{ kind, name, id? }`) | Revisions, with restore for groups |
| `TunablesFieldHint` | `label`, `help?`, `defaultDisplay?` | The question-mark explanation, for the app's own forms |

With oRPC instead of the fetch API, set `tunables: { baseURL: false }` in
`app.config.ts` and provide the client from a plugin:

```ts
import { orpcClient } from 'tunables/client'
import { TUNABLES_CLIENT } from 'tunables/vue'
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(TUNABLES_CLIENT, orpcClient(client.tunables)) // client: the app's oRPC client
})
```

**Vue without Nuxt.** Provide a client once, then build screens on the
headless composables `useGroupForm`, `useOverview`, `useHistory`,
`usePresets`, `useCatalog`, `useTunablesDescription` and `useUnloadGuard`.

```ts
import { fetchClient } from 'tunables/client'
import { provideTunables } from 'tunables/vue'
provideTunables(fetchClient({ baseURL: '/api/tunables' })) // in the root component's setup
```

**Other UIs** call the HTTP API through `fetchClient` from `tunables/client`.

## Reads

Read at the point of use, every time; a read is one query.

```ts
const { longestRepeatDays } = await useTunables().get('tasks')
// A value a workspace or a person may set: read at their path.
const { aiSuggestionsPerDay } = await useTunables().get('limits', { scope: { workspace: workspace.id, user: user.id } })
```

- No fallback: `get` returns every field or throws `TunablesMissing` (not
  synced) or `TunablesInvalid` (a stored value fails its check). A `?? 60`
  beside it is a second home of the default.
- A read without `scope` is the system value. Wherever a workspace's or a
  person's own value applies, pass the path; never pick between a tenant's
  row and the setting by hand.
- Do not capture settings at module scope or at boot; that needs a restart
  to change. A long-running worker re-reads each tick, with
  `{ lastGood: true }` to keep the last good values through a transient
  failure.
- An in-process cache refreshes with `useTunables().onChange('tasks', values => …)`.
- A write that depends on a setting holds it inside the app's transaction, so
  a concurrent lowering waits for it, and checks against the held values:

  ```ts
  await sql.begin(async (tx) => {
    const scoped = useTunables().within(tx)
    await scoped.hold()
    const { longestRepeatDays } = await scoped.get('tasks')
    if (input.repeatDays > longestRepeatDays) throw new Error(`A task may repeat at most every ${longestRepeatDays} days.`)
    await tx`update tasks set repeat_days = ${input.repeatDays} where id = ${input.id}`
  })
  ```

  `within` takes the driver's transaction: a postgres.js `sql.begin`
  transaction, a node-postgres client inside `begin`, or any object with
  `query(text, params)`. A Drizzle transaction object is not one.
- A preset is resolved per subject and slot; keep its `key` with what it
  produced. A preset set that is a `layer` is already in `get(group, { scope })`;
  resolve it only to show or record which plan applied:

  ```ts
  const plan = await useTunables().presets('plans').resolve(workspace.id, 'plan')
  // plan.key, plan.label, plan.assigned, plan.values
  ```

- Deployment values come from the environment definitions, read once at start
  (no database needed): `environment.read()` throws one `EnvironmentError`
  naming every missing or malformed value; `environment.get('APP_QUERY_BATCH')`
  reads one.

## Guards, notes and uses

```ts
import type { Guard, NotesProvider, UsesProvider } from 'tunables'

/** Lowering the Longest repeat below a recurring task's own is refused, naming the task. */
export const recurringWithin: Guard = async ({ next, host }) => {
  const db = (host as typeof sql | undefined) ?? sql // the CLI passes no host
  const limit = Number(next.longestRepeatDays)
  const over = await db`select title, repeat_days from tasks where repeat_days > ${limit}`
  return over.map(task => `Task "${task.title}" repeats every ${task.repeat_days} days, above the Longest repeat of ${limit} days.`)
}

/** What a value means here and now, shown under the field. */
export const workspaceNotes: NotesProvider = async ({ values, host }) => {
  const [{ count }] = await ((host as typeof sql | undefined) ?? sql)`select count(*)::int as count from tasks where done_at < now() - make_interval(days => ${Number(values.archiveAfterDays)})`
  return { archiveAfterDays: `${count} done tasks would be archived tonight.` }
}

/** What uses a model besides what tunables finds itself (presets and settings that pick it). */
export const modelsInUse: UsesProvider = async ({ entry, host }) =>
  (await projectsPinnedTo(entry, host)).map(project => `Project "${project.name}"`)

/** How a scope reads to a person: the workspace's or the person's name. */
export const scopeLabel = async (scope: string, id: string) => (scope === 'workspace' ? await workspaceName(id) : await personName(id)) ?? id
```

A guard must work without `host`: `tunables set` from the CLI passes none. A
guard also receives `scope`, the path saved (`{}` for the system), and `next`
as read there.

## The deploy step

Run `tunables sync` after the tables exist and before the new code serves. It
seeds new groups with their defaults, adds new fields with theirs, adds a
field newly declared on a preset set to every stored preset at its default,
creates a default preset for each empty slot and seeds empty catalogs, each as a
revision, and reports stored keys no definition declares (kept, never
dropped).

```bash
pnpm db:migrate && npx tunables sync
```

The job needs the environment `connect` reads, such as `DATABASE_URL`.

With plans as a layer, assign each workspace its plan once, from a one-off
script through the engine
(`tunables.presets('plans').assign(workspaceId, 'plan', 'pro', { actor, reason })`),
before moving a workspace's own values with `tunables set … --scope`: an
override is checked against the plan it inherits.

## .env.example

`tunables env` rewrites `.env.example` from the environment definitions: each
value under its description and section, commented out at its default, or
empty when it is required. Declare every variable the app reads first,
infrastructure and secrets included. `tunables check` fails when the file
drifts.

## Tests

```ts
import { setForTest, testTunables } from 'tunables/testing'
import { catalogs, effects, groups, presets, scopes, units } from '../server/settings'

const tunables = await testTunables({ groups, presets, catalogs, units, effects, scopes }) // in memory, synced
await setForTest(tunables, { tasks: { longestRepeatDays: 7 } }) // past rules, guards and confirmations
```

Make the code under test take its tunables (an argument, or the app's
injection seam) rather than importing the singleton, so a test can hand it
these.

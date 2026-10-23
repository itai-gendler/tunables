---
title: API reference
description: Every export of the tunables package, by the subpath it is imported from.
group: Reference
order: 24
---

# API reference

The package has one entry per concern, so an app imports only what it uses
and a CLI-only install pulls no framework. Every framework the entries use is
an optional peer dependency.

| Import | Needs |
| --- | --- |
| `tunables` | nothing |
| `tunables/postgres` | `pg` or `postgres` |
| `tunables/drizzle` | `drizzle-orm` 0.36 or later |
| `tunables/server` | nothing |
| `tunables/express` | `express` 4 or 5 |
| `tunables/orpc` | `@orpc/server` |
| `tunables/client` | nothing; `@orpc/client` for `orpcClient` |
| `tunables/vue` | `vue` 3.5 |
| `tunables/nuxt` | `nuxt` 4.4, `@nuxt/ui` 4.9 |
| `tunables/config`, `tunables/pdd`, `tunables/testing` | nothing |

## tunables

**Definitions**

| Export | What it is |
| --- | --- |
| `defineGroup(definition)` | A group of settings. See [Settings and groups](./settings-and-groups.md). |
| `definePresets(definition)` | A preset set. See [Presets](./presets.md). |
| `defineCatalog(definition)` | A catalog. See [Catalogs](./catalogs.md). |
| `defineEffects(effects)` | What changing a setting changes, by id. |
| `number`, `range`, `size`, `toggle`, `choice`, `choices`, `text`, `pick` | Field builders. See [Kinds and units](./kinds-and-units.md). |
| `BUILT_IN_UNITS`, `formatAmount(value, unit)` | The built-in units, and how an amount reads in one. |
| `fieldLabel(key, field)`, `formatValue(field, value, unitOf)`, `fieldSchema(key, field, unitOf)` | A field's name, its value as it reads, and its zod check. |
| `defaultsOf(fields)`, `toProblems(result)` | The defaults fields declare; a rule's result as problems. |
| `defineEnvironment(definitions)`, `env`, `renderEnvExample(environment, header?)`, `EnvironmentError` | [Deployment values](./deployment-values.md). |
| `explain(explanations, entity, fact)` | A fact's explanation from a generated explanations module. |

**The engine**

| Export | What it is |
| --- | --- |
| `createTunables(options)` | Your app's tunables over a store. |
| `memoryStore(options?)` | A store in this process, for tests and demos. See [Storage](./storage.md#the-memory-store). |
| `TunablesError` | The base of the errors below; the server answers it with 409. |
| `TunablesMissing` | A group or field is not stored yet: run `sync`. Has `group` and `keys`. |
| `TunablesInvalid` | Stored values no longer pass their checks. Has `group` and `problems`. |
| `TunablesUnknown` | A name the definitions do not declare: a programming error. |

`createTunables` takes `store`, `groups`, and optionally `presets`, `catalogs`,
`units`, `effects`, `explanations`, `guards`, `notes` and `uses`. It returns:

| Member | Does |
| --- | --- |
| `get(group, { lastGood? })` | The group's values, typed. |
| `entry(group, { host? })` | Values, defaults, what changed, how each reads, notes, and who changed it last. |
| `overview()` | Every group's entry. |
| `save(group, values, change?)` | Change fields, checked whole. Returns an `Outcome`. |
| `reset(group, keys?, change?)` | Put fields back at their defaults, checked. |
| `history(groupOrTarget, { limit?, before? })` | Revisions, newest first. |
| `restore(revisionId, change?)` | Restore a group's revision, checked. |
| `sync(change?)` | Store what the definitions add. Returns a `SyncReport`. |
| `presets(set)` | `list`, `get`, `create`, `update`, `remove`, `makeDefault`, `assign`, `assignments`, `resolve`. |
| `catalog(id)` | `list`, `get`, `available`, `add`, `edit`, `retire`, `reinstate`, `usedBy`. |
| `within(host)` | The same members inside your open transaction, plus `hold()` and `committed()`, which tells listeners once your transaction has committed. |
| `onChange(group, listener)` | Called after a change to the group commits in this process. Returns an unsubscribe. |
| `describe()` | Every definition as plain JSON, for the screens. |
| `definitions`, `store` | What it was created with. |

`change` is `{ actor?, reason?, confirmed?, host? }`. Types for all of these are
exported too: `Outcome`, `Problem`, `RuleResult`, `GroupEntry`, `SyncReport`,
`Guard`, `NotesProvider`, `UsesProvider`, `Actor`, `ChangeOptions`, `Preset`,
`CatalogEntry`, `Revision`, `RevisionTarget`, `TunablesStore`, `StoreSession`,
`Description` and more.

## tunables/postgres

| Export | What it is |
| --- | --- |
| `postgresStore(client, { schema?, lockKey? })` | The Postgres store. |
| `fromPg(poolOrClient)` | A node-postgres `Pool`, `Client` or pool client as a `SqlClient`. |
| `fromPostgresJs(sql)` | A postgres.js `sql` or transaction as a `SqlClient`. |
| `asExecutor(host)` | Any of those, or a `SqlExecutor`, as an executor; what `within` uses. |
| `migrate(client, { schema? })` | Create the tables if they are missing. |
| `tunablesSql({ schema? })` | The DDL, for your own migrations. |
| `lockKeyFor(schema)` | The advisory lock key a schema gets by default. |

Types: `SqlExecutor`, `SqlClient`, `PostgresStoreOptions`. See
[Storage](./storage.md).

## tunables/drizzle

| Export | What it is |
| --- | --- |
| `tunablesTables(schemaName?)` | `{ schema, groups, revisions, records, assignments }` as Drizzle `pg-core` tables. |

## tunables/server

| Export | What it is |
| --- | --- |
| `createHandler(options)` | A function from `Request` to `Response`, or `undefined` outside its `basePath`. |
| `createService(options)` | The operations every adapter wraps, each taking your context. |
| `ServiceError` | A refusal with a status: 400, 401, 403 or 404. |
| `errorResponse(error)` | The status and body an error answers with. |

Types: `HandlerOptions`, `ServiceOptions`, `TunablesService`, `Action`,
`AccessTarget`. See [Server and access](./server.md).

## tunables/express

| Export | What it is |
| --- | --- |
| `tunablesMiddleware(options)` | Express middleware; the context is the Express request. |

## tunables/orpc

| Export | What it is |
| --- | --- |
| `tunablesRouter(options)` | tunables' operations as oRPC procedures, to nest in your router. |

Type: `TunablesRouter`.

## tunables/client

| Export | What it is |
| --- | --- |
| `fetchClient({ baseURL?, fetch?, headers?, credentials? })` | The client over the HTTP API. |
| `orpcClient(procedures)` | The client over your oRPC client's `tunables` branch. |
| `TunablesClientError` | A request the server refused or could not answer, with its `status`. |
| `displayValue(field, value, entryLabel?)` | A value as it reads, from the field's description. |

Types: `TunablesClient`, `PresetSummary`, `CatalogEntrySummary`, and the
description types.

## tunables/vue

| Export | What it is |
| --- | --- |
| `TUNABLES_CLIENT`, `provideTunables(client)`, `useTunablesClient()` | Providing and reading the client. |
| `useTunablesDescription()`, `useGroupForm(group)`, `useOverview()`, `useHistory(target, { pageSize? })`, `usePresets(set)`, `useCatalog(catalog)` | Headless screens. See [Vue composables](./vue-composables.md). |
| `useUnloadGuard(dirty)` | Ask before unloading with unsaved changes. |
| `displayValue` | As in `tunables/client`. |

## tunables/nuxt

A Nuxt layer, used with `extends: ['tunables/nuxt']`. Components:
`TunablesGroupForm`, `TunablesOverview`, `TunablesHistory`,
`TunablesPresets`, `TunablesAssign`, `TunablesCatalog`, `TunablesFieldHint`.
App config: `tunables.baseURL`. Composable: `useTunablesLeaveGuard(dirty, message?)`.
See [The Nuxt layer](./nuxt-layer.md).

## tunables/config

| Export | What it is |
| --- | --- |
| `defineConfig(config)` | `tunables.config.ts`. See [The CLI](./cli.md#tunablesconfigts). |
| `loadConfig(cwd, file?)` | Find and load a config, as the CLI does. |
| `CONFIG_FILES`, `ConfigError` | The file names looked for; a config that cannot be found or loaded. |

## tunables/pdd

| Export | What it is |
| --- | --- |
| `readModelFacts(modelDirectory)` | Every Entity's facts in a `product-model/` directory, with their text and stated default. |
| `renderExplanations(explanations, importFrom?)` | The module `tunables explain` writes. |
| `checkAgainstModel(description, model)` | Each field whose Entity, fact or default disagrees with the model. |
| `sameDefault(stated, declared)` | Whether a default as the model states it is the field's own. |
| `draftFacts(description, model)` | The Markdown `tunables model draft` prints. |

## tunables/testing

| Export | What it is |
| --- | --- |
| `testTunables(options)` | Your tunables in memory, synced. |
| `setForTest(tunables, values)` | Store values as they are, past rules, guards and confirmations. |
| `memoryStore` | As in `tunables`. |

See [Testing](./testing.md).

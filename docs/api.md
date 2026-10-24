---
title: API reference
description: Every export of the tunables package, by the subpath it is imported from.
group: Reference
order: 27
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
| `definePresets(definition)` | A preset set, or with `layer` a layer of a group at a scope. See [Presets](./presets.md). |
| `defineCatalog(definition)` | A catalog. See [Catalogs](./catalogs.md). |
| `defineEffects(effects)` | What changing a setting changes, by id. |
| `number`, `range`, `size`, `toggle`, `choice`, `choices`, `text`, `pick` | Field builders. Each takes `override` for where a scope may set its own value. See [Kinds and units](./kinds-and-units.md) and [Scopes](./scopes.md). |
| `BUILT_IN_UNITS`, `formatAmount(value, unit)` | The built-in units, and how an amount reads in one. |
| `fieldLabel(key, field)`, `formatValue(field, value, unitOf)`, `fieldSchema(key, field, unitOf)` | A field's name, its value as it reads, and its zod check. |
| `defaultsOf(fields)`, `toProblems(result)` | The defaults fields declare; a rule's result as problems. |
| `defineEnvironment(definitions)`, `env`, `renderEnvExample(environment, header?)`, `EnvironmentError` | [Deployment values](./deployment-values.md). |
| `explain(explanations, entity, fact)` | A fact's explanation from a generated explanations module. |
| `scopeEntries(chain, path)`, `scopeKey(entries)`, `parseScopeKey(key)` | A [scope](./scopes.md) path in chain order, checked; its stored key, `workspace=acme;user=dana`; and back. |

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
`units`, `effects`, `explanations`, `guards`, `notes`, `uses`, `scopes` (the
chain, broadest first) and `scopeLabel(scope, id)`. It returns:

| Member | Does |
| --- | --- |
| `get(group, { scope?, lastGood? })` | The group's values, typed: the system's, or as read at a scope path. |
| `entry(group, { host?, scope? })` | Values, defaults, what changed, how each reads, notes, and who changed it last; at a scope, also `scope` and each field's `layers`. |
| `overview()` | Every group's entry. |
| `save(group, values, change?)` | Change fields, checked whole. Returns an `Outcome`. |
| `reset(group, keys?, change?)` | Put fields back at their defaults, checked; at a scope, use the inherited values again. |
| `history(groupOrTarget, { limit?, before? })` | Revisions, newest first. A scope's are `{ kind: 'group', name, id: scopeKey }`. |
| `restore(revisionId, change?)` | Restore a group's revision, checked; a scope's revision restores that scope's own values. |
| `sync(change?)` | Store what the definitions add. Returns a `SyncReport`. |
| `presets(set)` | `list`, `get`, `create`, `update`, `remove`, `makeDefault`, `assign`, `assignments`, `resolve`. |
| `catalog(id)` | `list`, `get`, `available`, `add`, `edit`, `retire`, `reinstate`, `usedBy`. |
| `within(host)` | The same members inside your open transaction, plus `hold()` and `committed()`, which tells listeners once your transaction has committed. |
| `onChange(group, listener)` | Called after a change to the group commits in this process. Returns an unsubscribe. |
| `describe()` | Every definition as plain JSON, for the screens. |
| `definitions`, `store` | What it was created with. |

`change` is `{ actor?, reason?, confirmed?, host?, scope? }`. In `save`, a
value of `null` at a scope uses the inherited value again. Types for all of
these are exported too: `Outcome`, `Problem`, `RuleResult`, `GroupEntry`,
`FieldLayer`, `ScopePath`, `OverrideRule`, `SyncReport`,
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
| `migrate(client, { schema? })` | Create the tables if they are missing, and bring older ones up to date. |
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
`AccessTarget` (`{ kind, id?, scope? }`). See [Server and access](./server.md)
and [Who can do what](./access.md).

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

`group(id, scope?)`, `save(id, { values, scope? })` and
`reset(id, { keys?, scope? })` take a scope path. Types: `TunablesClient`,
`PresetSummary`, `CatalogEntrySummary`, `ScopePath`, `FieldLayer`, and the
description types.

## tunables/vue

| Export | What it is |
| --- | --- |
| `TUNABLES_CLIENT`, `provideTunables(client)`, `useTunablesClient()` | Providing and reading the client. |
| `useTunablesDescription()`, `useGroupForm(group, { scope? })`, `useOverview()`, `useHistory(target, { pageSize? })`, `usePresets(set)`, `useCatalog(catalog)` | Headless screens. See [Vue composables](./vue-composables.md). |
| `useUnloadGuard(dirty)` | Ask before unloading with unsaved changes. |
| `displayValue` | As in `tunables/client`. |

## tunables/nuxt

A Nuxt layer, used with `extends: ['tunables/nuxt']`. Components:
`TunablesGroupForm` (with an optional `scope`), `TunablesOverview`, `TunablesHistory`,
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

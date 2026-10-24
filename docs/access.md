---
title: Who can do what
description: End users bound by values they never see, staff who tune groups, owners and members who change only their own scope, and the terminal.
group: Integrate
order: 14
---

# Who can do what

tunables has no users, roles or sessions. Your app says who is asking and
whether they may, through the [`actor` and `authorize`](./server.md#access)
options of whichever adapter serves the API. This page walks through the three
cases most apps have, with [Tasklane](./tasklane-example.md)'s policy, and then
the terminal.

## People bound by values they never change

This is most of what tunables does. Your server reads a setting where it
decides something, and applies it to whoever made the request. That person
never calls tunables' API and needs no access to it:

```ts
// Tasklane's own route, in examples/express/app.ts
app.post('/projects', async (req, res) => {
  const person = personOf(req)
  if (!person) return void res.status(401).end()
  const limits = await tunables.get('limits', { scope: { workspace: person.workspace, user: person.id } })
  if (req.body.open >= limits.maxProjects) {
    return void res.status(409).json({ error: `Your workspace may have ${limits.maxProjects} open projects.` })
  }
  res.status(201).json({ created: true })
})
```

`tunables.get` is not behind `authorize`: it is your code, running on your
server. Read at the [scope](./scopes.md) of the person asking, and they get
the value meant for them, from their plan, their workspace and their own
settings.

## Staff who tune groups

The people who tune the product are allowed by group. `authorize` receives
the action (`read` or `change`) and the target (`description`, `group`,
`presets` or `catalog`, with its `id`):

```ts
authorize: (context, { action, target }) => {
  const user = context.user
  if (!user?.staff) return false
  if (action === 'read') return true
  // Support may retire a model; only engineers change limits and plans.
  return user.role === 'engineer' || (target.kind === 'catalog' && user.role === 'support')
}
```

Reading history is a `read` of what it is the history of; restoring is a
`change` of the group. Guard the admin pages with your own route middleware
too; the screens never decide who sees them.

## Self-service per scope

Owners and members can change only their own scope. For a group, `target`
carries the scope path in `scope`: `{ workspace: 'acme' }` for Acme's own
values, `{ workspace: 'acme', user: 'dana' }` for Dana's. It is there for
reads, saves, resets, history and restore. A request without a scope is about
the whole system.

Tasklane's policy, from
[`examples/tasklane/access.ts`](https://github.com/itai-gendler/tunables/blob/main/examples/tasklane/access.ts):

```ts
import type { AccessTarget } from 'tunables/server'

export function mayUse(person: Person | undefined, target: AccessTarget): boolean {
  if (!person) return false
  if (person.staff) return true
  // Everyone signed in reads the description, so their own settings screen can show.
  if (target.kind === 'description') return true
  if (target.kind !== 'group' || target.scope?.workspace !== person.workspace) return false
  return target.scope.user ? target.scope.user === person.id : Boolean(person.owner)
}

createHandler({
  tunables,
  actor: person => person && { id: person.id, name: person.name },
  authorize: (person, { target }) => mayUse(person, target)
})
```

- Sam, on Tasklane's staff, may do anything.
- Olivia owns Acme. She may read and change `{ workspace: 'acme' }`, and
  nothing else: not the system values, not the plans, not Dana's own
  settings.
- Dana is a member of Acme. She may read and change
  `{ workspace: 'acme', user: 'dana' }` only.

Within their scope, [`override`](./scopes.md#declaring-what-may-be-overridden)
still decides which fields they may set and how far. `authorize` decides
*whose* values someone reaches; the definitions decide *which* values those
are.

### The description must be readable

A screen needs the definitions before it can draw a form, and it reads them
from `describe`. Allow `read` of `{ kind: 'description' }` to everyone who has
a self-service screen. The description holds labels, explanations, defaults
and bounds, never stored values.

It matters for one more reason: tunables answers a malformed request, such as
a scope path the chain does not have, with a 400 only to someone allowed to
read the description. To anyone else it is refused like any other request, so
a stranger learns nothing from probing.

### Refusal is 404

A refused request answers 404 by default, the same as a path that does not
exist, so someone outside the administration cannot tell it is there. Pass
`refusal: 'forbidden'` to answer 401 to nobody signed in and 403 to someone
who may not. A refused *change*, one that was allowed but failed a check, is
different: it is an answer with its problems, not an error.

## The terminal

`tunables get`, `set`, `history` and `restore` work two ways.

**Through `tunables.config.ts`**, the default, they call your app's tunables
directly, over your database. `authorize` is not asked: whoever runs them
already has the database credentials, which reach everything. Changes are
recorded as `<username> (terminal)`.

**Through your app's API**, with `--url` or `TUNABLES_URL`, they call the same
handler the screens do and send `TUNABLES_TOKEN` as a bearer token. Your
`actor` and `authorize` apply, and the revision records the actor your app
names for that token. No config file is needed. This is how to give a deploy
bot or an operator access to some groups or some scopes without database
credentials:

```ts
actor: (context) => {
  const token = context.headers.get('authorization')?.replace(/^Bearer /, '')
  if (token && token === process.env.PLANS_BOT_TOKEN) return { id: 'plans-bot', name: 'Plans bot' }
  return sessionUser(context)
}
```

```bash
TUNABLES_TOKEN=… npx tunables set limits maxProjects=20 \
  --url https://tasklane.example.com/api/tunables \
  --scope workspace=acme --reason "Agreed with Acme's owner"
```

A refusal prints what the app answered, such as
*"✗ https://tasklane.example.com/api/tunables answered 404: Not found. Check
the URL, and that TUNABLES_TOKEN is one the app allows this."* `sync` always
needs the database. See [Read and change values](./cli-values.md).

## Run it

The repository's examples serve Tasklane with this policy:

- [`examples/express`](https://github.com/itai-gendler/tunables/tree/main/examples/express):
  `npx jiti examples/express/server.ts`, on port 3300;
- [`examples/hono`](https://github.com/itai-gendler/tunables/tree/main/examples/hono):
  `npx jiti examples/hono/server.ts`, on port 3301.

Each takes an `x-person` header in place of a session: `sam`, `olivia` or
`dana`.

```bash
curl -H 'x-person: olivia' 'http://localhost:3300/api/tunables/groups/limits?scope=workspace%3Dacme'
curl -H 'x-person: dana' 'http://localhost:3300/api/tunables/groups/limits?scope=workspace%3Dacme'
```

The first answers Acme's limits; the second answers 404. The
[playground](./tasklane-example.md#the-playground) shows the same three people
on screens.

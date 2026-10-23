---
title: Server and access
description: Mount tunables' API as a fetch handler in Nitro, Hono, Bun or Deno, as Express middleware or as an oRPC router, with access decided by your app.
group: Integrate
order: 11
---

# Server and access

The screens, and any other client, reach tunables through one set of
operations: describe the definitions, read and save groups, read history and
restore, and manage presets and catalogs. tunables serves them three ways,
from one service, so every adapter asks the same access questions and answers
the same way.

| Your server | Use |
| --- | --- |
| Anything that speaks web `Request` and `Response`: Nitro and Nuxt, h3, Hono, Bun, Deno, Cloudflare Workers | `createHandler` from `tunables/server` |
| Express | `tunablesMiddleware` from `tunables/express` |
| An oRPC router | `tunablesRouter` from `tunables/orpc` |

## Access

tunables has no users, roles or sessions of its own. Every adapter takes the
same options, and every request is answered only after they allow it.

```ts
interface ServiceOptions<Context> {
  tunables: AnyTunables
  actor: (context: Context) => Actor | undefined | Promise<Actor | undefined>
  authorize?: (context: Context, request: { action: 'read' | 'change', target: AccessTarget, actor: Actor }) => boolean | Promise<boolean>
  refusal?: 'not-found' | 'forbidden'
  host?: (context: Context) => unknown
}
```

- **`actor`** says who is asking, from your own sign-in: a name, or
  `{ id, name }`. Return `undefined` when nobody is signed in. Revisions record
  the actor's name.
- **`authorize`** says whether this actor may do this. It is asked on every
  request. `action` is `read` or `change`; `target.kind` is `description`,
  `group`, `presets`, `catalog` or `history`, and `target.id` names the group,
  preset set or catalog when there is one. **Without `authorize`, nothing is
  allowed.**
- **`refusal`** decides how a refused request answers. The default,
  `not-found`, answers 404, so an outsider cannot tell the administration
  exists. `forbidden` answers 401 to nobody signed in and 403 to someone who
  may not.
- **`host`** hands your guards, notes and uses something from the request,
  such as its database transaction.

```ts
import type { ServiceOptions } from 'tunables/server'

export const access: Pick<ServiceOptions<AppContext>, 'actor' | 'authorize'> = {
  actor: context => context.user ? { id: context.user.id, name: context.user.name } : undefined,
  authorize: (context, { action, target }) => {
    if (!context.user) return false
    if (action === 'read') return context.user.staff
    return context.user.role === 'admin' || (target.kind === 'catalog' && context.user.role === 'operator')
  }
}
```

Spread it into whichever adapter you use: `createHandler({ tunables, ...access })`.

When your own code calls `save`, `reset`, `restore` or a preset or catalog
change directly, it decides access itself first, then passes `{ actor, reason }`.

## The fetch handler

`createHandler` returns one function from a `Request` to a `Response`. It
answers only paths under its `basePath`, `/api/tunables` by default, and
returns `undefined` for everything else, so your own routes go on as before.
Call it with the request and the context your `actor` and `authorize` read; the
context defaults to the request itself.

### Nuxt and Nitro

```ts [server/routes/api/tunables/[...].ts]
import type { H3Event } from 'h3'
import { createHandler } from 'tunables/server'
import { tunables } from '../../../tunables'

const handle = createHandler<H3Event>({
  tunables,
  actor: event => event.context.user ? { id: event.context.user.id, name: event.context.user.name } : undefined,
  authorize: event => event.context.user?.role === 'admin'
})

export default defineEventHandler(async event =>
  (await handle(toWebRequest(event), event)) ?? createError({ statusCode: 404 }))
```

### Hono

```ts
import { Hono, type Context } from 'hono'
import { createHandler } from 'tunables/server'

const app = new Hono()

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

### Bun and Deno

```ts
const handle = createHandler<Request>({
  tunables,
  actor: request => sessionUser(request), // your own sign-in
  authorize: (request, { actor }) => isAdministrator(actor)
})

Bun.serve({
  async fetch(request) {
    return (await handle(request)) ?? yourRoutes(request)
  }
})
```

`Deno.serve` takes the same function.

### Routes

| Method | Path | Does |
| --- | --- | --- |
| `GET` | `describe` | The definitions, as the screens need them |
| `GET` | `groups` | Every group's entry |
| `GET` / `PUT` | `groups/:id` | Read a group's entry; save a change |
| `POST` | `groups/:id/reset` | Reset fields to their defaults |
| `GET` | `history?kind=&name=&id=&limit=&before=` | A target's revisions |
| `POST` | `restore` | Restore a group's revision |
| `GET` / `POST` | `presets/:set` | List a set's presets; create one |
| `PUT` / `DELETE` | `presets/:set/:key` | Update a preset; remove it |
| `POST` | `presets/:set/:key/default` | Make a preset its slot's default |
| `GET` | `presets/:set/assignments?subject=` | Assignments |
| `PUT` | `presets/:set/assignments/:subject/:slot` | Assign a preset, or `{ key: null }` to follow the default |
| `GET` / `POST` | `catalogs/:id` | List entries with what uses each; add one |
| `PUT` | `catalogs/:id/:entry` | Edit an entry |
| `POST` | `catalogs/:id/:entry/retire`, `…/reinstate` | Retire or reinstate an entry |

Bodies are JSON. A save sends `{ values, reason?, confirmed? }`.

### Answers

- A change answers 200 with its [outcome](./settings-and-groups.md#saving-values),
  whether it was saved or refused. **A refused change is an answer, not an
  error**: it carries `saved: false` and its `problems`, or a `confirm`
  question.
- A malformed request answers 400, naming what is wrong.
- A refused request answers 404, or 401 and 403 with `refusal: 'forbidden'`.
  An unknown group, preset set or catalog answers 404.
- Stored values that no longer pass, or a group not yet synced, answer 409
  with the error's message.
- Anything else answers 500 with *"Something went wrong on the server."*,
  logs the error, and names nothing internal.

## Express

```ts
import express from 'express'
import { tunablesMiddleware } from 'tunables/express'

const app = express()
app.use(express.json())
app.use(tunablesMiddleware({
  tunables,
  // req.user as your sign-in middleware sets it
  actor: req => req.user ? { id: req.user.id, name: req.user.name } : undefined,
  authorize: (req, { action }) => action === 'read' ? Boolean(req.user?.staff) : req.user?.role === 'admin'
}))
```

The middleware answers under its `basePath` and calls `next()` for everything
else. Its context is the Express request, so `actor` and `authorize` read your
session from it. It works with or without a body parser in front of it.

## oRPC

`tunablesRouter` returns tunables' operations as oRPC procedures, to nest in
your own router. They receive your router's context, so access reads the same
session the rest of your app does.

```ts
import { tunablesRouter } from 'tunables/orpc'

export const router = {
  ...appRouter,
  tunables: tunablesRouter<AppContext>({
    tunables,
    actor: context => context.user ? { id: context.user.id, name: context.user.name } : undefined,
    authorize: context => context.user?.role === 'admin'
  })
}
```

A refused change is an answer with `problems`, as over HTTP. Errors become
oRPC errors with the matching code: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT` or `INTERNAL_SERVER_ERROR`. The screens call the router
through [`orpcClient`](./nuxt-layer.md#another-client).

## The service itself

`createService(options)` from `tunables/server` is the service every adapter
wraps: one method per operation, each taking your context first. Use it to
serve tunables over a transport none of the adapters cover.

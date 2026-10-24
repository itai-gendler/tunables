---
title: History and restore
description: Every change is a revision with who, when, why and each value before and after; restoring one runs the same checks as any save.
group: Concepts
order: 7
---

# History and restore

Every change tunables stores is recorded as a **revision**, in the same
transaction as the change itself. Nothing changes a setting without leaving
one: not a save from a screen, not `tunables set`, not `sync`, not a reset or
a restore.

## A revision

```ts
interface Revision {
  id: string // increasing: a later revision has a larger id
  target: { kind: 'group' | 'preset' | 'catalog' | 'assignment', name: string, id?: string }
  actor: string | null // who, as their name
  reason: string | null // why
  changes: { key: string, from: unknown, to: unknown }[] // each value before and after
  snapshot: unknown // the whole target after the change, so it can be restored
  at: string // when, as an ISO timestamp
}
```

A revision's `target` names what changed: a group by its id, with the
[scope](./scopes.md) key as `id` when the change was made at a scope, such as
`{ kind: 'group', name: 'limits', id: 'workspace=acme' }`; a preset by its set
and key; a catalog entry by its catalog and id; an assignment by its preset
set and subject. `changes` lists only the fields that differ.

The `actor` is whoever the change was made by: on the screens, the person your
[`actor`](./server.md#access) function returns; from a terminal,
`<your username> (terminal)`; from `sync`, `tunables sync` unless you name
someone. The `reason` is what the person wrote, or what tunables says it did:
*"Seeded with the defaults."*, *"Reset to defaults."*, *"Restored revision 9."*

## Reading the history

```ts
const revisions = await tunables.history('limits', { limit: 20 })

// The page before the oldest one shown
const older = await tunables.history('limits', { limit: 20, before: revisions.at(-1)?.id })

// A scope's own history
await tunables.history({ kind: 'group', name: 'limits', id: 'workspace=acme' })

// A preset's or a catalog entry's history
await tunables.history({ kind: 'preset', name: 'plans', id: 'pro' })
await tunables.history({ kind: 'catalog', name: 'models', id: 'small' })
```

Revisions come newest first, 50 at a time unless you ask for a `limit` (at
most 500). A group's history without an `id` is its system values' history.
The group form lists its group's history, or its scope's; `TunablesHistory`
shows any target's, and `tunables history <group> [--scope …]` prints it at a
terminal.

## Restoring

Restoring puts a group back as it was after an earlier revision. It is a save
like any other: the revision's snapshot goes through every
[check](./checks-and-guards.md), including `rules`, `within`, your guards and
`confirm`. If the settings, the presets or your records have moved on since,
and the old values would break something, the restore is refused and says why.

```ts
const outcome = await tunables.restore('9', { actor, reason: 'The promotion is over.' })
// outcome.revision.reason: "Restored revision 9. The promotion is over."
```

- A restore records a new revision; it never rewrites or removes history.
- Fields declared since the revision was made take their defaults.
- A scope's revision puts back that scope's own values exactly: what it set
  then, it sets again; what it did not set, it inherits again.
- Only group revisions are restored. Presets and catalog entries change
  through their own operations, each recorded the same way.

From a terminal:

```bash
npx tunables restore 9 --reason "The promotion is over."
```

## Resetting to defaults

`reset` is a save of the defaults the definitions declare, for some fields or
all of them, and is recorded with *"Reset maxProjects to default."* or
*"Reset to defaults."* unless you give a reason. The group form offers it per
field.

```ts
await tunables.reset('limits', ['maxProjects'], { actor })
```

At a scope, `reset` stops overriding instead, and is recorded with *"Use the
inherited maxProjects."*:

```ts
await tunables.reset('limits', ['maxProjects'], { actor, scope: { workspace: 'acme' } })
```

## Who may read it

Reading history is a `read` of its target; restoring is a `change` of the
group. For a scope's revisions, the request carries the scope, so an owner can
be allowed their workspace's history and nothing else. Your
[`authorize`](./server.md#access) decides both, like every other request; see
[Who can do what](./access.md).

## Where it is stored

Revisions are rows in `tunables_revisions`, appended and never updated. See
[Storage](./storage.md#the-tables).

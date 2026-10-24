# Scopes contract

A setting can take a different value for a part of the product — a workspace,
a user inside it — through **layers**. This contract governs scoped reads and
saves in `src/engine`, scoped storage in every store, the scoped operations of
the HTTP API, and the scoped screens. Change it here first.

## The chain

- An app declares its scopes in order, broadest first:
  `createTunables({ scopes: ['workspace', 'user'] })`. No scopes means no layers.
- A **scope path** names one place in the chain: `{ workspace: 'w1' }` or
  `{ workspace: 'w1', user: 'u7' }`. A path names a prefix of the chain: it
  cannot name `user` without `workspace`. Its **key** is written
  `workspace=w1;user=u7`; the system's key is the empty string.
- A value is read at a path through its layers, broadest first:
  1. the **system** value — the group's stored values;
  2. a **plan layer**, when a preset set is a layer of the group at a scope
     the path names: the preset the subject is assigned, or the slot's default;
  3. the **override** stored at each prefix of the path, in chain order.

  The most specific layer that holds a field wins.

## What may be overridden

- A field declares where it may be overridden:
  - `override: ['workspace', 'user']` — freely, at those scopes;
  - `override: { workspace: 'at-most', user: 'free' }` — per scope, as
    `free`, `at-most` or `at-least` the value it inherits.
  Without `override`, a field is set only for the whole system.
- `at-most` and `at-least` apply to number fields only.
- A plan layer's preset fields are a subset of the group's fields, with the
  same kinds. A plan sets them freely; its own `rules` and `within` still apply.

## Saving at a scope

A save names its path; the most specific scope in it is the **target**.

- Only fields overridable at the target may be saved there. Others are
  refused: "Reminder time cannot be set for Acme."
- Each value passes its kind, and its bound against the value it inherits:
  "Projects may be at most 50 for Acme, the value it inherits."
- The group's `rules` run on the values as read at the target path after the
  change.
- Guards receive the path and run as for any save; `confirm` compares the
  values as read at the path before and after.
- **Use inherited** removes an override; a scope with no overrides left keeps
  no row.
- A change that would leave any narrower override outside its bound is
  refused, naming each: lowering the system value, a plan's value, a scope's
  override, or moving a scope to another plan.
  "Acme keeps Projects at 20, above 10."
  Scopes are named as "Workspace w1" unless the app supplies
  `scopeLabel(scope, id)`.
- Every change records one revision on the target: `{ kind: 'group', name,
  id: scopeKey }`. Restore works per target.

## Storage

- A group row is `(id, scope, values, updated_at, updated_by)`. The system row
  has scope `''` and holds every field; a scoped row holds only the fields
  overridden there.
- Postgres keys `tunables_groups` by `(id, scope)`. `migrate` adds the column
  and the key to a database created before scopes.
- `sync` touches only system rows. Scoped rows are never seeded.

## Access

- `authorize` receives the path: `{ action, target: { kind: 'group', id,
  scope: { workspace: 'w1' } }, actor }`. A host lets a workspace owner read
  and change their workspace's path and nothing else.
- A scoped entry shows, per field, the value as read, the value it inherits,
  where that comes from (`system`, `plan:<set>:<key>`, or a scope key), and whether this
  scope overrides it.

## Reading in the app

`tunables.get('limits', { scope: { workspace: 'w1', user: 'u7' } })` returns the values
as read at that path. Without a path, the system values, as before.

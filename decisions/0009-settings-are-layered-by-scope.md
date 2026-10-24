# Settings are layered by scope, inside the database only

Status: accepted. Amends [0002](0002-a-value-has-one-home.md).

## Context

A workspace needs its own limits and a user their own preferences: "Acme keeps
200 tasks per list", "Dana's digest comes at 07:00". Without layers, every app
re-implements per-tenant values beside tunables, without its checks or history.
Decision 0002 kept precedence out on purpose, because precedence between
places (file, environment, database) is where configuration goes wrong.

## Decision

- An app declares an ordered chain of scopes, such as `['workspace', 'user']`.
  A value is read through its layers: the system value, a plan the workspace is
  on, the workspace's override, the user's override. The most specific wins.
- Layers exist only in the database, never between the environment and the
  database. A value is still a setting or a deployment value, never both.
- Each field declares where it may be overridden, and how: freely, or at most
  or at least what it inherits. Nothing is overridable unless declared.
- The chain is a hierarchy: a user's values sit inside their workspace, so
  bounds can be enforced in both directions — an override is refused above its
  bound, and a broader value is refused below an override, naming it.
- A preset set can be a layer of a group (Plans), sitting at its scope's place
  in the chain.
- Overrides are changed through the same API and screens, given a scope; the
  host's `authorize` receives the scope, so people who are not administrators
  can be allowed their own scope.

## Consequences

- Every screen says where a value comes from, so precedence is never a mystery.
- [spec/scopes.md](../spec/scopes.md) is the contract.

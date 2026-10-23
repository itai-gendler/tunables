# tunables attaches to the host: its server, its database, its sign-in

Status: accepted.

## Context

A configuration service with its own users and storage is one more thing to
run and secure, and it cannot take part in the host's transactions.

## Decision

- tunables runs inside the host app. It stores in the host's database through
  the host's client, mounts in the host's server, and asks the host who is
  acting and whether they may (`actor`, `authorize`) on every request.
- tunables has no users, roles or sessions. Without `authorize`, nothing is
  allowed. Refusals answer as not found unless the host chooses otherwise.
- What the host keeps that depends on a setting is checked by guards the host
  supplies, in the same transaction as the change.
- Boot never needs the database: creating tunables connects to nothing.

## Consequences

- A host write and a tunables change can commit together (`within`, `hold`).
- Adding tunables to an app is wiring, not deployment.

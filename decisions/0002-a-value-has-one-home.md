# A value has one home: a setting, or a deployment value

Status: accepted.

## Context

Values that can be set in several places need precedence rules, and those
rules are where configuration systems go wrong: which wins, file or database,
and why does this environment differ? news settled it in its ADR-0015.

## Decision

- **A setting** is tuned while the app runs by someone the host allows. It
  lives in the database, beside what it affects, and every change is checked
  and recorded.
- **A deployment value** is set per deployment and never tuned live: a lock
  id, a batch size, a connection string. It lives in the environment, has a
  description and a default unless it must be set, and is listed in
  `.env.example`.
- A value is one or the other, never both. There is no precedence.
- What is not a value — layout geometry, the tables that describe a format —
  stays in code.

## Consequences

- No value is set in two places, and an environment's departures from the
  defaults are visible on All settings.
- `tunables-verify` reports a value that lives in two homes.

# Every change is one revision, and a restore is a checked save

Status: accepted.

## Context

news recorded who changed a settings group last and nothing more. Asking what
a value was last week, or putting it back, was impossible.

## Decision

- Every change to a group, a preset, an assignment or a catalog entry appends
  one revision: who, when, why, each value before and after, and the whole
  target after the change.
- Restoring puts a group back as an earlier revision left it, through the same
  checks, guards and confirmation as any save, and records a revision of its own.
- A change that changes nothing records nothing.

## Consequences

- History is visible on every screen that changes something, and in the CLI.
- A restore can be refused: a preset may now use more than the old limit.

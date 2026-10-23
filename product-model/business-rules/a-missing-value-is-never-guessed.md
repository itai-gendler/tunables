---
appliesTo:
  - { type: capability, id: read-settings }
  - { type: capability, id: declare-deployment-values }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#TunablesMissing
  - kind: code
    role: implementation
    target: src/model/environment.ts#EnvironmentError
---

# A missing value is never guessed

A read of a setting that is not stored, a stored value that no longer passes
its check, and a deployment value with no default that is not set are each
refused with what is missing and how to fix it. Nothing stands in a default, an
empty value or a stale one for them, except the last good values the host app
asks for by name while its database is away.

---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: tunables-cli }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/server/service.ts#createService
  - kind: code
    role: implementation
    target: src/commands/values.ts#runSet
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesGroupForm.vue
---

# Change settings

Saves new values for a settings group, checked whole before anything is
stored: each value against its kind and unit, the rules by which the group's
settings bound one another, every preset the settings bound, and the host app's
own checks of what it keeps that depends on the group. A change with
consequences is saved only once confirmed. A saved change is recorded as one
revision, with who made it and why.

## Intent

Changing a value while the app runs must never leave it in a state its own
rules forbid, and must always leave a record, whichever surface the change came
through.

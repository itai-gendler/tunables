---
actors: [administrator, scope-owner]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesOverview.vue
---

# Tune a running app

## Goal

An Administrator changes how the running app behaves, or a Scope owner how it
behaves for their own workspace or for them, without a deploy, and can put it
back if the change turns out worse.

## Success criterion

The change is saved after passing every check, recorded with who made it and
why on the system or the scope it was made at, and an earlier state can be
restored through the same checks.

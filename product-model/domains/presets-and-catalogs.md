---
colorSlot: 3
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresets.vue
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesCatalog.vue
---

# Presets and catalogs

Named, assignable sets of values and the entries they pick from: creating,
editing and removing presets, choosing each slot's default, assigning a preset
to a subject, and adding, editing, retiring and reinstating catalog entries.

## Boundary

Owns presets, their slots and defaults, assignments, and catalog entries with
their states. It does not own the limits presets stay within, which are
settings groups, nor the subjects presets are assigned to, which the host app
keeps and names.

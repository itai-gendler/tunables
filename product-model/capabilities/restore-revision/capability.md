---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: tunables-cli }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/commands/values.ts#runRestore
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesHistory.vue
---

# Restore a revision

Puts a settings group back as it was after an earlier revision, through the
same checks and confirmation as any change, and records it as a new revision
whose reason names the one restored. Only a settings group's revisions are
restored; those of presets, catalog entries and assignments are history.

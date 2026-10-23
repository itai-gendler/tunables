---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: tunables-cli }, { place: library }]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesHistory.vue
  - kind: code
    role: implementation
    target: src/commands/values.ts#runHistory
---

# Review history

Reads the revisions of a settings group, a preset, a catalog entry or a
subject's assignments, newest first: who made each change, when, why, and each
value before and after.

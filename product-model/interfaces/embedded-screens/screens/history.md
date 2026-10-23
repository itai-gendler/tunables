---
entities:
  - entity: revision
    shows: [Target, Actor, Reason, Changes, At]
    collects: [Reason]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesHistory.vue
---

# History

The revisions of one settings group, preset, catalog entry or subject's
assignments, newest first: who, when, why, and each value before and after,
with older changes on request. For a settings group, any earlier revision can be
restored with a reason.

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

The revisions of one settings group, for the whole system or at one scope,
preset, catalog entry or subject's assignments, opened from where that thing is
edited, newest first: who, when, why, and each value before and after, with
older changes on request. For a settings group, any earlier revision of the
system's values or of a scope's override can be restored with a reason.

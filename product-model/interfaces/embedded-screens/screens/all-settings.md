---
entities:
  - entity: settings-group
    shows: [Title, Place, Values]
  - entity: setting
    shows: [Label, Section, Explanation, Effects, Default]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesOverview.vue
---

# All settings

Every setting of every group in one list, to find a setting without knowing
which group holds it. Each row reads with its label and explanation, its group
and section, its current value, and its default when it differs, and links to
the place where its group is edited. The Administrator finds settings by name,
by what they affect, or among those changed from their default.

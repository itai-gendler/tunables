---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesOverview.vue
---

# View all settings

Lists every setting of every group the person may read in one place, each with
its group and section, its explanation, what it affects, its current value and
its default when it differs, linked to where its group is edited. The host app
is asked about each group, and a group it does not let the person read is left
out; with none left, All settings is refused like any other read.

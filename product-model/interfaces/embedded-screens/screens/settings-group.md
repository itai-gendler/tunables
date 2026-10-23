---
entities:
  - entity: settings-group
    shows: [Title, Description, Values, Changed at, Changed by, Confirmation]
    collects: [Values]
  - entity: setting
    shows: [Label, Unit, Allowed values, Default, Explanation, Section, Effects, Notes]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesGroupForm.vue
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesField.vue
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesFieldHint.vue
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesEffects.vue
---

# Settings group

One settings group, edited beside what it affects. Each setting is listed under
its section with its label, its explanation and default behind a hint, what
changing it affects, what its current value means in the host app now, and a
way back to its default. The Administrator changes values, saves the group with
a reason, confirms a change that has consequences, reads each problem beside the
setting it is about, and opens the group's history. Who last changed the group
and when heads it, and leaving with unsaved changes asks first.

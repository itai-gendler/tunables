---
appliesTo:
  - { type: entity, id: setting, facts: [Explanation] }
  - { type: capability, id: explain-settings }
  - { type: capability, id: check-definitions }
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesFieldHint.vue
  - kind: code
    role: implementation
    target: src/model/explanations.ts
---

# Every field explains itself in the Product Model's words

Every setting, wherever it is set, shows beside its label what it is and its
default. The explanation is the Product Model's own description of the setting's
fact, generated from the model and never retyped; where the model describes the
fact, its description wins over any help written beside the declaration, and
the definition checks report that help. A setting the model does not describe
yet shows the help written beside its declaration until the model does.

---
appliesTo:
  - { type: entity, id: setting, facts: [Explanation] }
  - { type: capability, id: explain-settings }
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
fact, generated from the model and never retyped; a setting the model does not
describe yet shows the help written beside its declaration until the model
does.

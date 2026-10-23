---
appliesTo:
  - { type: entity, id: preset, facts: [Values] }
  - { type: entity, id: settings-group, effect: changes, facts: [Values] }
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#PresetsDefinition
---

# Presets stay within the settings

Every preset's values stay within what the settings groups allow, such as a
budget no higher than the budget limit. It is checked when a preset is saved
and whenever a setting that bounds presets changes, and a change that would
leave any preset outside is refused naming it.

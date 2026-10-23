---
appliesTo:
  - { type: entity, id: settings-group, facts: [Values] }
  - { type: entity, id: preset, facts: [Values] }
  - { type: entity, id: catalog-entry, facts: [Values] }
references:
  - kind: code
    role: implementation
    target: src/model/kinds.ts#fieldSchema
---

# Every value stays within its kind

A stored value is always one its setting's kind allows: a number within its
unit and bounds and whole where it must be, a range whose shortest is not
longer than its longest, one of a choice's options, choices listed once and at
least as many as required, a text no longer than allowed and not empty where it
must not be, a pick that names an entry of its catalog. A value that is not is
refused before anything is stored, with the problem in the setting's own words.

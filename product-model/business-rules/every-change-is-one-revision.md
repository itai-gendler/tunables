---
appliesTo:
  - { type: entity, id: settings-group, effect: changes }
  - { type: entity, id: preset, effect: creates }
  - { type: entity, id: preset, effect: changes }
  - { type: entity, id: preset, effect: removes }
  - { type: entity, id: assignment, effect: creates }
  - { type: entity, id: assignment, effect: changes }
  - { type: entity, id: assignment, effect: removes }
  - { type: entity, id: catalog-entry, effect: creates }
  - { type: entity, id: catalog-entry, effect: changes }
  - { type: entity, id: revision }
references:
  - kind: code
    role: implementation
    target: src/engine/store.ts#Revision
---

# Every change is one revision

Every change to a settings group, a preset, a subject's assignment or a catalog
entry — saved, reset, restored, synced, seeded or made the default — records
exactly one revision on each thing it changes, with who made it, why when a
reason was given, each value before and after, and the whole of what changed as
it was after. Making a preset the default records one on it and one on the
former default; removing a preset records one on it and one on the assignments
of each subject it returned to the default; a sync records one on each group and
each preset it changes. A save that changes nothing records none. Revisions are only ever added, never changed or
removed, and a revision is written in the same transaction as the change it
records.

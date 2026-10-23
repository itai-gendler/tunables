---
appliesTo:
  - { type: entity, id: catalog-entry, effect: changes, to: Retired }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#UsesProvider
---

# A catalog entry in use stays Available

An entry a preset picks, or that the host app names as used by something it
keeps, is not retired; retiring it is refused naming everything that uses it.

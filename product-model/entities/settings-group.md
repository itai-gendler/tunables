---
domain: definitions
relations:
  - entity: setting
    verb: holds
    cardinality: one-to-many
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#defineGroup
  - kind: code
    role: implementation
    target: src/engine/store.ts#StoredGroup
---

# Settings group

A set of settings edited together beside what they affect, such as a run's
limits or how collection works. It is declared in the host app's code and its
values are stored in the app's own database, one value for each setting it
holds. A group is saved whole: every change to it is checked against all of its
settings together.

## Information kept

- **Title** — the name its screen is headed with
- **Description** — what the group is for, in a sentence
- **Place** — where the host app edits it, linked from All settings
- **Rules** — how its settings bound one another, such as a shortest that is never longer than a longest, checked on every save
- **Confirmation** — what a change has to be confirmed for, when a change has consequences such as redoing work already done
- **Values** — the stored value of each setting it holds
- **Changed at** — when its values last changed
- **Changed by** — who last changed them

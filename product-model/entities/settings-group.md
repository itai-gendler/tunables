---
domain: definitions
relations:
  - entity: setting
    verb: holds
    cardinality: one-to-many
  - entity: override
    verb: is overridden by
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
settings together. Where the host app declares scopes, a scope may override
some of the group's settings, and the group's values are then read at that
scope through its layers: the system's values, a plan the scope is on, and the
override of each scope on the way, the most specific winning.

## Information kept

- **Title** — the name its screen is headed with
- **Description** — what the group is for, in a sentence
- **Place** — where the host app edits it, linked from All settings
- **Rules** — how its settings bound one another, such as a shortest that is never longer than a longest, checked on every save
- **Confirmation** — what a change has to be confirmed for, when a change has consequences such as redoing work already done
- **Plan** — the preset set that stands as a layer of it at one scope, when one does, such as Plans at the workspace: a workspace reads the values of the preset it is assigned, or of its slot's default, above the system's
- **Values** — the system's stored value of each setting it holds, which every scope inherits unless a plan or an override sets its own
- **Changed at** — when the system's values last changed
- **Changed by** — who last changed them

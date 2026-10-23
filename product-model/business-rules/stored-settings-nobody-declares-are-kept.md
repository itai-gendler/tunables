---
appliesTo:
  - { type: capability, id: sync-stored-settings }
  - { type: capability, id: declare-settings }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#SyncReport
---

# Stored settings nobody declares are kept

A stored value whose setting is no longer declared is never dropped: sync
reports it and keeps it, and a read of the group ignores it. Only a person who
decides it is no longer needed removes it from the database.

---
domain: host-integration
availability: [{ place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/engine/store.ts#StoreSession
---

# Hold settings

A write of the host app's own that depends on the settings — saving something a
limit bounds — holds them inside the host's transaction, so no change to any
group can commit until that write has. A lower limit is then checked against
what the write committed.

## Intent

Checking a limit and saving what it bounds must not leave a moment in which the
limit is lowered between the two.

---
kind: validation
routes:
  code: Code
steps:
  - text: The Host app asks to hold its tunables without a transaction of its own
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product refuses, saying that holding only means something inside a transaction of the app's own
    kind: product
    entities: []
    contexts:
      code:
        place: library
---

# Decline a hold outside a host transaction

## Trigger

The host app holds the settings where there is no write of its own to protect.

## Outcome

Nothing is held, and the host app is told where a hold belongs.

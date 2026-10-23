---
kind: system
acts: external
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# Host app

The app tunables runs inside. It creates its tunables from the definitions and
its own database, reads typed values where it uses them, holds the settings
while a write of its own depends on them, mounts the HTTP API and the screens
behind its own sign-in, and supplies what only it knows: who is asking and
whether they may act, the checks of things it keeps that a lower limit would
break, the notes that say what a value means in it now, and what uses a catalog
entry.

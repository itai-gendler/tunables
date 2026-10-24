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
break, the notes that say what a value means in it now, what uses a catalog
entry, and how a scope reads to a person. It reads a group's values for the whole
system, or at a scope such as one workspace or one user inside it.

## Information kept

- **Scopes** — the ordered chain of places in it a value may be overridden for, broadest first, such as workspace then user; each place sits inside the one before, so a user's values sit inside their workspace; an app that declares none has no layers

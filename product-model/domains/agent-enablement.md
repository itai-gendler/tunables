---
colorSlot: 6
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts
---

# Agent enablement

Getting the tunables skills to where a coding agent will find them, keeping
them current, and what an agent does with them: adopting tunables in an app,
defining a setting, and verifying an app's tunables.

## Boundary

Owns skill distribution, the ownership marker that makes an installation
recognizable, and the three skills' work in a repository. It does not own the
app's Product Model or any directory it did not install, and it never changes
stored values.

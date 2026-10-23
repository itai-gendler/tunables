---
kind: system
acts: external
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#TUNABLES_SKILLS
---

# AI agent

A coding agent that loads a tunables skill and works in the host app's
repository on the Developer's behalf. It initiates: it reads the app, proposes
which values become settings, declares what the Developer approves, runs the
definition checks, and reports what does not hold. It is named for the role
rather than for any one product that fills it.

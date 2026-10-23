---
domain: agent-enablement
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: skills/tunables-adopt/SKILL.md
    title: tunables-adopt
---

# Adopt tunables in an app

Brings tunables into an app that already runs. The AI agent finds the values the
app tunes today — constants, environment variables, settings tables — and
proposes which become settings, in which groups, and which stay deployment
values. Once the Developer approves, it declares them, mounts the API and the
screens behind the app's own access, reads each value where the app uses it,
writes `.env.example`, and checks the definitions; only once the checks pass
does it sync them into the app's own database, and it checks again at the end.

## Intent

Adopting should replace scattered values with one home each, without changing
what the app does on the day it is adopted.

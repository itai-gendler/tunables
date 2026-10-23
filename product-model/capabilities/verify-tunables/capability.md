---
domain: agent-enablement
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: skills/tunables-verify/SKILL.md
    title: tunables-verify
---

# Verify an app's tunables

Checks that an app keeps what tunables promises: every value in one home, no
default copied outside its definition, every read and change through tunables,
the API and the screens behind the app's own access, and the definition checks
passing. The AI agent reports each gap where it is, and fixes the ones the
Developer chooses.

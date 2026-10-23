---
domain: agent-enablement
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/install.ts
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#installSkillsToTarget
  - kind: code
    role: implementation
    target: src/core/providers.ts
---

# Install the agent skills

Puts the three tunables skills where a supported coding-agent harness will load
them, in the repository or in the Developer's own configuration, and marks the
installation as tunables-owned so it can be recognized again.

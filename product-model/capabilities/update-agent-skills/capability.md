---
domain: agent-enablement
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/update.ts#runUpdate
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#findManagedInstallations
---

# Update the agent skills

Brings every installation tunables owns to the skills that ship with the
current command, without discovering or adopting anything unmarked.

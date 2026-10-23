---
appliesTo:
  - { type: capability, id: install-agent-skills }
  - { type: capability, id: update-agent-skills }
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts
---

# Unowned skill directories are never replaced without force

Only a skill directory tunables can show it installed, by a valid marker, is
overwritten. Any other directory carrying a tunables skill's name stops the run
until the Developer says explicitly that the replacement is intended.

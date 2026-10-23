---
domain: agent-enablement
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts
---

# Skill installation

One place a supported coding-agent harness loads the tunables skills from,
together with the marker that says tunables put them there. Without a valid
marker, a directory carrying a tunables skill's name is somebody else's, and
the Product leaves it alone.

## Information kept

- **Provider** — the harness the skills were installed into
- **Scope** — whether it sits in the repository or in the Developer's own configuration
- **Version** — the tunables command that wrote it, which an update brings current
- **Skills** — the names of the skills it holds, so a retired one can be removed
- **Installed at** — when it was first written, kept across every update

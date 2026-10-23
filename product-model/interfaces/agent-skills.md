---
type: agent
actors: [ai-agent, developer]
entryPoints:
  - agent: /tunables-adopt
  - agent: /tunables-define
  - agent: /tunables-verify
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#TUNABLES_SKILLS
---

# tunables agent skills

The Interface inside a coding-agent harness. Three installed skills adopt
tunables in an app, define one setting, and verify an app's tunables. The
Developer converses through the same Interface and approves what the agent
proposes before it is written into the app.

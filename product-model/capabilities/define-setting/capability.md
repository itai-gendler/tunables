---
domain: agent-enablement
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: skills/tunables-define/SKILL.md
    title: tunables-define
---

# Define a setting

Makes one change the Developer asks for to an app that already uses tunables:
adding, changing, renaming or removing a setting, a settings group, a preset
set, a catalog or a deployment value. The AI agent decides where a new value
belongs, proposes its kind, unit, default, bounds, section, effects and fact
with the checks that keep it safe, and, once the Developer approves, declares
it, reads it where the app uses the value, says what each environment's stored
values need, and checks the definitions.

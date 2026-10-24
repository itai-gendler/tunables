---
entities:
  - entity: settings-group
    shows: [Title, Description, Confirmation]
  - entity: override
    shows: [Scope, Values, Inherited values, Changed at, Changed by]
    collects: [Values]
  - entity: setting
    shows: [Label, Unit, Allowed values, Default, Explanation, Section, Effects, Override bound]
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesGroupForm.vue
---

# Scoped settings

One settings group at one scope, such as a workspace or a user inside it,
placed wherever the host app shows that scope: a workspace's own settings, or
an Administrator's view of one workspace. It lists only the settings this scope
may override, each with the value it reads here, the value it inherits and
where that comes from — the system, a plan, or a broader scope by name —
whether this scope sets its own, the bound its own must keep, and Use inherited
beside a value this scope overrides. The person changes values, saves with a
reason, confirms a change that has consequences, reads each problem beside the
setting it is about, and opens this scope's history. Who last changed the
scope's values and when heads it.

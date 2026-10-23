---
id: tunables
summary: Runtime settings with guardrails, for the app you already run.
category: dev-tools
tags: [settings, runtime-settings, configuration, guardrails, administration]
authors:
  - name: Itai Gendler
    url: https://github.com/itai-gendler
license: MIT
languages: [en]
limitations:
  - Settings are stored only in Postgres, in the app's own database; no other database is supported yet.
  - The screens embed only in apps built with Nuxt UI; any other app builds its own screens over the HTTP API.
  - A change reaches other running instances of the app on their next read, not at once.
  - Renaming a setting does not carry its value; the new name starts at its default, and the old value stays stored under the old name.
  - The screens are in English only.
  - People sign in with the host app's own accounts, and the host app decides who may read and change settings; tunables keeps no users or roles of its own.
references:
  - kind: code
    role: implementation
    target: src/index.ts
    title: Package entry point
---

# tunables

tunables gives an app it already runs settings that can be changed while it
runs, without a deploy, and without giving up the guarantees a value in code
has. A Developer declares each setting once, with its kind, unit, default and
the Product Model fact it is. The values live in the app's own database. An
Administrator changes them in screens the app embeds beside what each setting
affects, where every change is checked whole against the setting's kind, the
settings that bound it and what already uses it, confirmed when it has
consequences, and recorded as a revision that can be restored. Presets bundle
settings into named, assignable sets, and catalogs keep the entries presets pick
from, which are retired rather than deleted. Values a deployment sets and
nobody tunes stay in the environment, declared beside the settings. A terminal
command and agent skills check the definitions, explain each setting in the
Product Model's words, and help adopt, define and verify tunables in an app.

## Intent

Make a value an operator can change at run time as trustworthy as a constant in
code: one home for each value and its default, no change that leaves the app in
a state its own rules forbid, and a record of who changed what, when and why.

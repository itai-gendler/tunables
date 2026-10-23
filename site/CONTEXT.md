# tunables.dev

The site of **tunables**, an open-source TypeScript library for runtime
settings with guardrails, for the app you already run. The site lives in
`site/` of `itai-gendler/tunables` (see
[ADR-0001](./docs/adr/0001-a-static-site.md)). The library's own vocabulary is
defined in the repository's docs; this file names the terms the site uses.

## Language

**tunables**:
The library, written lowercase everywhere. A **tunable** is one setting.
_Avoid_: Tunables, the tunables platform, the tunables service

**Setting**:
A value someone tunes while the app runs, declared once in a group and stored
in the app's own database.
_Avoid_: config, flag, option, parameter

**Group**:
Settings edited together, on one form, beside what they affect.
_Avoid_: section (a section is a sub-heading inside a group), namespace

**Deployment value**:
A value a deployment sets in its environment and nobody tunes while the app
runs. A value is a setting or a deployment value, never both.
_Avoid_: env setting, override

**Preset**:
A named configuration in a preset set, filling one slot; subjects follow the
slot's default or are assigned one by reference.
_Avoid_: profile, template, copy

**Catalog**:
A list of allowed choices whose entries are Available or Retired, never
deleted.
_Avoid_: enum, registry

**Revision**:
The record of one change: who, when, why, and each value before and after.
_Avoid_: audit log entry, version

**Guard**, **rule**, **within**, **confirm**:
The checks a save runs: a guard against what the host app keeps, a rule
between settings of one group, `within` between presets and the settings, and
a confirmation before a costly change.

**Host app**:
The app tunables runs inside: its server, its database, its sign-in.
_Avoid_: client app, tenant

**Screens**:
The administration UI the Nuxt layer provides, in the host's theme.
_Avoid_: dashboard, admin panel product

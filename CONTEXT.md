# Vocabulary

The words tunables uses, in code, docs and screens. Use these, not synonyms.

- **Tunable** — a value someone tunes while the app runs. In the docs and
  screens, a friendly word for one is a **knob**; the API says field or setting.
- **Setting** — a tunable kept in the app's database. Declared as a **field**
  of a **group**.
- **Group** — a set of settings stored and saved together, edited beside what
  they affect, such as Run Settings.
- **Field** — one setting's declaration: its **kind**, **unit**, **default**,
  **section**, **effects** and **fact**.
- **Kind** — number, range, size, toggle, choice, choices, text or pick.
- **Unit** — what an amount is measured in, which says how it reads and what it
  may be (minutes, dollars, hour of the day).
- **Default** — the value a field starts with; it lives only in the field's
  declaration.
- **Effect** — what changing a field changes, such as model cost or what readers
  get.
- **Deployment value** — a value set per deployment in the environment and never
  tuned live. Not a setting.
- **Rule** — settings in one group that bound one another.
- **Guard** — the host's check of something it keeps that depends on a group,
  run on every save.
- **Within** — how settings bound a preset; checked when either changes.
- **Confirmation** — a change with consequences, saved only when sent again
  confirmed.
- **Note** — what a value means here and now, supplied by the host.
- **Problem** — why a change was refused, naming the field.
- **Revision** — one recorded change: who, when, why, each value before and
  after, and the whole after.
- **Restore** — putting a group back as a revision left it, checked like any save.
- **Preset** — a named, reusable configuration filling a **slot**, such as a Run
  Config. Each slot has one **default**.
- **Assignment** — a subject's preset for a slot, by reference.
- **Catalog** — a list of allowed choices, such as permitted models. An
  **entry** is Available or Retired, never deleted.
- **Host** — the app tunables runs inside: its server, database and sign-in.
- **Actor** — who the host says is making a change.
- **Administrator** — whoever the host allows to change tunables.
- **Explanation** — a field's description, from its Product Model fact.
- **Sync** — seeding new groups, fields, presets and catalog entries with their
  defaults.

---
name: tunables-adopt
description: Bring tunables into an app that has none yet — one with hard-coded limits, intervals and sizes, environment overrides, or settings code of its own — by inventorying every value, classifying each as a setting, a deployment value or code, and, after the user approves the proposal, wiring definitions, storage, the server, access, screens, the deploy step and every read. Use when the user asks to adopt tunables, move constants or settings into tunables, or make values tunable at runtime across an app; do not use to add or change one setting in an app that already has tunables (use tunables-define) or to audit an existing adoption (use tunables-verify).
---

# Adopt tunables in an app

Take an app from values scattered through code, environment variables and its
own settings tables to one home per value: a **setting** an administrator tunes
while the app runs, stored in the app's database and changed only through
checked saves that record a revision; a **deployment value** in the
environment, listed in `.env.example`; or **code**, for what is not a value at
all. Nothing is written until the user approves the proposal.

The principles this skill applies, and never trades away:

- **One home per value.** A value is a setting or a deployment value, never
  both, and never also a constant beside them.
- **The definition is the one home of each default.** No fallback literal at the
  read, no seed file, no second copy in a migration or a doc.
- **Every change is one revision**, with who, when, why, and each value before
  and after. Values move into tunables through saves, so the move is recorded.
- **Lowering a limit never breaks what uses it.** Whatever depends on a setting
  is named by a rule, a guard or `within`, and a change below it is refused.
- **Boot never needs the database.** tunables connects lazily through the
  app's own client; the CLI's checks need no database at all.
- **Access is the app's.** tunables has no users or roles; the host supplies
  `actor` and `authorize`.
- **Code keeps only what is not a value**: layout geometry, format tables,
  protocol constants.
- **Product meaning is never decided in code.** What a setting is, who tunes
  it and what it starts at are product decisions. When the repository uses
  pdd-kit, those facts go through `/pdd-ideate` into `product-model/`.

Read before work:

- [references/classifying-values.md](references/classifying-values.md) — how to
  find every candidate value, the decision for each, and the proposal format.
- [references/wiring.md](references/wiring.md) — the exact wiring for
  definitions, storage, server, access, screens, reads, deploy and tests.

## Running the CLI

Run the tunables CLI through this skill's runner, which uses the version the
skill was installed with (the app's own `node_modules` copy when it matches,
otherwise `npx` at that version):

```bash
node <tunables-adopt-skill-dir>/scripts/run-tunables.mjs --root <dir with tunables.config.ts> <command> [options]
```

`--root` defaults to the current directory. `check`, `env`, `explain` and
`model draft` need no database; `sync`, `get`, `set`, `history` and `restore`
call the config's `connect`.

## 1. Establish the situation

1. Resolve the Git root and read the repository's agent instructions
   (`AGENTS.md`, `CLAUDE.md` or the like), its ADRs and its README. Follow
   them for how to build, test, migrate and commit.
2. If a `tunables.config.ts` already exists or `tunables` is already a
   dependency, this is not an adoption: stop and use `tunables-define` for a
   change, or `tunables-verify` for an audit.
3. Learn the stack, because the wiring follows it:
   - the database and its client: Postgres through `pg`, `postgres` (postgres.js)
     or Drizzle over one of them. tunables stores only in Postgres; with another
     database, stop and tell the user.
   - the server: Nuxt or Nitro, Hono, Bun, Express, oRPC, or another framework
     that speaks web `Request`/`Response`;
   - the screens: Nuxt UI, plain Vue, or another UI;
   - how sign-in works and who an administrator is;
   - where migrations run in development and in deployment;
   - the test runner, and whether screens have screenshot baselines.
4. Note whether a pdd-kit Product Model exists (`product-model/` with
   `entities/`). If it does, every setting will name a fact there.

## 2. Inventory

5. Find every candidate value, following the inventory in
   [classifying-values.md](references/classifying-values.md): hard-coded
   limits, intervals, timeouts, sizes, retry counts, thresholds and budgets;
   every `process.env` (or `import.meta.env`, `useRuntimeConfig`) read; existing
   settings tables, JSON or YAML settings files and their seeds; admin forms
   that edit them; feature switches; and named configurations the app keeps
   several of.
6. For each, record where it is defined and every place it is read
   (`file:line`), its current value, any override that changes it per
   environment, and what depends on it.

## 3. Classify

7. Place each value in exactly one home with the decision in
   [classifying-values.md](references/classifying-values.md): setting (in a
   group), preset set, catalog, deployment value, the app's own user data, or
   code. Where the evidence does not settle it — would anyone tune this while
   the app runs? — mark it as a question for the user rather than guessing.
8. Group the settings by what they govern and who tunes them, each group edited
   beside what it affects. Settings that bound one another belong in one group,
   because a group's `rules` see only its own values.
9. For each setting choose its kind, unit, default, bounds, section, effects and
   label or fact. For each group, the `rules` between its settings, the
   `confirm` for a change with costly consequences, and the `guards` for app
   data that depends on it. For preset sets, their slots and `within`; for
   catalogs, what uses an entry.

## 4. Propose and get approval

10. Present the proposal in the format
    [classifying-values.md](references/classifying-values.md) gives: groups and
    their fields, presets and catalogs, deployment values, values left in code
    with why, values that are user data, the checks between them, access, where
    each screen goes, how existing values move across, and open questions.
11. Ask every open question in one batch. A reply that only answers questions
    ("use your recommendation") settles them; it does not approve the
    proposal. Present the proposal again with the answers applied.
12. **Stop until the user explicitly approves.** Write nothing before that.

## 5. Wire

Follow [wiring.md](references/wiring.md) for each step, in this order.

13. Add the dependency: `tunables`, and the peers the stack needs (`pg` or
    `postgres`; `drizzle-orm` when the app uses it; `@nuxt/ui` and `nuxt` for
    the Nuxt layer; `vue` for the composables; `express` or `@orpc/server` and
    `@orpc/client`). Use the app's own package manager.
14. Write the definitions module: units, effects, groups, preset sets,
    catalogs and the environment, exported for the app and the config alike.
15. Write the app's tunables instance over its own Postgres client, with its
    guards, notes and uses, created lazily so boot never connects.
16. Store: `migrate` in the migrate step (or inside `connect`), the Drizzle
    tables from `tunables/drizzle` in the app's own schema, or `tunablesSql()`
    in a hand-written migration.
17. Write `tunables.config.ts` with the definitions, the environment, the
    `.env.example` path, the Product Model and explanations paths when there is
    a model, and `connect`/`disconnect`.
18. Mount the API: `createHandler` from `tunables/server` for any fetch-style
    server, `tunablesMiddleware` from `tunables/express`, or `tunablesRouter`
    from `tunables/orpc` nested in the app's router.
19. Decide access: `actor` from the app's own session, `authorize` from its own
    roles for each `read` and `change`, and `host` when guards need the
    request's database.
20. Add the screens beside what each group affects: `extends: ['tunables/nuxt']`
    and its components, or `tunables/vue` composables, or the app's own UI over
    `tunables/client`. Add an All settings page with the overview.
21. Add `tunables sync` to the deploy and migrate step, after the tables exist
    and before the new code serves.
22. Replace each old read with `tunables.get(group)` at the point of use, and
    each deployment value read with the environment. Delete each old constant,
    default and fallback as its read moves, so no second home survives.
23. Declare every environment variable the app reads, then run `tunables env`.
    It rewrites `.env.example` entirely, so anything undeclared is dropped.

## 6. The Product Model, when the repository has one

24. Run `tunables model draft --out <file outside the repository>`. It drafts
    the `## Information kept` lines the model lacks for each group, preset set
    and catalog, in the model's own form, and never writes the model.
25. Bring the draft to the `pdd-ideate` skill as the change to decide: invoke it
    when your harness can, otherwise hand the draft to the user to bring to
    `/pdd-ideate`. Its approval decides each fact's words and default; do not
    write `product-model/` from this skill.
26. Once the model holds the facts, run `tunables explain` to generate the
    explanations module, and pass it to `createTunables` as `explanations`. A
    field then explains itself in the model's words; do not also write `help`.

Without a Product Model, give each field a `help` sentence in the product's own
words, and a `label` when the key does not read well.

## 7. Check, then move existing values across

27. Run `tunables check` before anything is synced. **Stop on any finding**:
    report each one and settle it with the user — fix the code, or, when the
    Product Model is what disagrees, bring it to `/pdd-ideate` — then check
    again. Nothing is synced while a finding remains.
28. In each environment you can reach, after the tables exist: run
    `tunables sync`, which seeds every group with the defaults the definitions
    declare. Then, for every value that environment ran with that differs from
    the default (an environment override, a settings row, a JSON file), run
    `tunables set <group> key=value ... --reason "Moved from <old home>"`, so
    the history records the move. Never insert into tunables' tables directly.
29. For environments you cannot reach, hand the user the exact `sync` and `set`
    commands per environment. Then remove the old homes: environment variables
    from deployment manifests, rows or files that held settings, and admin code
    that edited them.

## 8. Finish

30. Run `tunables check` again and fix every finding. Run the app's typecheck,
    lint and tests. When screens changed and the app keeps screenshot
    baselines, update them the way its instructions say.
31. Report:
    - the groups, preset sets and catalogs adopted, with their field counts;
    - deployment values declared and `.env.example` written;
    - values left in code, and values that are user data, with why;
    - each old home removed, and any that remain with the reason;
    - values moved across, per environment, and commands handed to the user;
    - the access decided, and where each screen lives;
    - Product Model facts drafted, decided and explained, or still pending;
    - `tunables check`, typecheck and test results;
    - open questions.

## Guardrails

- Never write before the proposal is explicitly approved.
- Never decide product meaning in code: a setting's purpose, its default, who
  tunes it and what it bounds are the user's decisions, and with pdd-kit they go
  through `/pdd-ideate`.
- Never leave a value in two homes, and never keep a fallback default at a read.
- Never write tunables' tables with SQL, and never move a value in without a
  save that records its revision.
- Never sync while `tunables check` has a finding.
- Never make boot connect to the database, and never run `sync` at boot.
- Never ship a route without `authorize`, and never write `authorize` that
  allows everyone.
- Never invent a stack: wire into the database client, server, sign-in and UI
  the app already has.
- Never stage, commit or deploy unless the repository's instructions or the
  user say to.

---
title: Introduction
description: What tunables is, the problem it solves, and the principles it holds to.
group: Get started
order: 1
---

# Introduction

tunables is a TypeScript library for **runtime settings**: the limits,
intervals, budgets and switches someone needs to change while your app runs.
You declare each setting once. tunables keeps its value in your own Postgres,
puts it on a screen inside your own app, checks every change as a whole, and
records each change as a revision you can read and restore.

It is not a service. There is nothing to deploy beside your app and no account
to create: tunables runs in your process, through your database client, behind
your sign-in.

## The problem

A value someone needs to tune usually ends up in one of four places:

- **A constant in code.** Changing it is a deploy, and nobody outside
  engineering can see it.
- **An environment variable.** Read at boot, set per deployment, and invisible
  to the people who decide it.
- **A one-off admin form.** It checks its own fields, if it checks anything,
  and nothing else.
- **A key–value table.** A name and a blob, with no unit, no default and no
  explanation.

None of them keeps a history, so nobody can say who changed a value, what it
was before or why. None of them knows what the value bounds, so lowering a
limit quietly strands whatever was configured above it. And when the same value
can come from the environment *and* the database, the app grows a precedence
rule that nobody remembers.

## What tunables does instead

Every tunable is a knob on a panel:

1. **Declare it once.** A setting states its kind, unit, default, explanation,
   section and what changing it affects. Its check, its stored seed, the API's
   schema and its form input all follow from that one declaration. See
   [Settings and groups](./settings-and-groups.md).
2. **Store it in your Postgres.** Four tables in a schema of your database,
   written through the `pg` or `postgres` client you already have. See
   [Storage](./storage.md).
3. **Embed the screens.** Mount one handler in your server, extend the Nuxt
   layer, and put a form beside what the setting affects. The screens take your
   Nuxt UI theme. See [The Nuxt layer](./nuxt-layer.md).
4. **Change it safely.** From the screen, the API or the terminal, every change
   goes through the same checks and becomes a revision. See
   [History and restore](./history-and-restore.md).
5. **Let each workspace and person set their own, within the plan.** A field
   says where it may be overridden and how far; a value is read through the
   system, the plan, the workspace and the person. See [Scopes](./scopes.md).

## Principles

tunables is built around a few rules. The library enforces them where it can,
and the [skills](./skills.md) check the rest.

- **One home per value.** A value is either a setting, stored in the database
  and tuned while the app runs, or a deployment value, read from the
  environment. Never both, so there is never a precedence rule. See
  [Deployment values](./deployment-values.md).
- **Declare each setting once.** The definition is the only home of its
  default: no fallback literal at a read, no seed file, no copy in a migration.
- **Saves are checked whole.** A change is checked field by field, then
  against the rules between settings, the presets the settings bound and the
  records your app keeps. When it is refused, nothing is written, and each
  problem is said in plain words. See [Checks and guards](./checks-and-guards.md).
- **Lowering a limit never breaks what uses it.** Whatever depends on a
  setting is named by a rule, a guard or a preset's `within`, and a change
  below it is refused, naming what is in the way.
- **Every change is a revision**, with who, when, why, and each value before
  and after. Restoring one runs through the same checks as any other save.
- **Presets are assigned by reference.** A named configuration, such as a
  plan or a cadence, has one default per slot; subjects follow the default or
  are assigned one by its key, never given a copy. See [Presets](./presets.md).
- **Layers are declared, never guessed.** Nothing is overridable unless its
  field says where, and an override is bounded by what it inherits. Every
  screen says where a value comes from, and a broader change that would leave
  an override outside its bound is refused, naming it. Layers live only in the
  database, never between it and the environment. See [Scopes](./scopes.md).
- **Catalog entries in use cannot be retired.** A catalog holds allowed
  choices, such as permitted models; an entry something still picks stays
  available. See [Catalogs](./catalogs.md).
- **Boot never needs the database.** Creating tunables checks your definitions
  and touches nothing else.
- **Access is decided by your app.** tunables has no users or roles. Your app
  says who is asking and whether they may, on every request, down to the
  workspace or person a request is about. See [Who can do what](./access.md).
- **The screens look like your app.** They are built on Nuxt UI and bring no
  colors or fonts of their own. See [Theming](./theming.md).
- **Explanations come from the Product Model.** With a
  [pdd-kit](https://pdd-kit.dev) Product Model, each field names the fact it
  is; its explanation is the model's own words, and `tunables check` fails when
  a default disagrees with the one the model states. See
  [Check and generate](./cli-check.md).

## What is in the package

| Import | What it gives you |
| --- | --- |
| `tunables` | Definitions, the engine, the in-memory store |
| `tunables/postgres` | Postgres storage over `pg` or `postgres` |
| `tunables/drizzle` | The same tables as Drizzle definitions |
| `tunables/server` | A fetch handler for any server that speaks `Request` and `Response` |
| `tunables/express` | Express middleware |
| `tunables/orpc` | An oRPC router to nest in your own |
| `tunables/client` | The client the screens call: over fetch or oRPC |
| `tunables/vue` | Headless Vue composables |
| `tunables/nuxt` | A Nuxt layer with ready screens on Nuxt UI |
| `tunables/config` | `tunables.config.ts` for the CLI |
| `tunables/pdd` | Reading and checking a pdd-kit Product Model |
| `tunables/testing` | In-memory tunables for your own tests |

The [API reference](./api.md) lists each export. [What it is for](./patterns.md)
names the kinds of value tunables keeps, and
[Tasklane](./tasklane-example.md) walks through a complete example app's
settings.

## Next

Start with the [quickstart](./quickstart.md): one group, from a constant to a
screen with a history, in your own app.

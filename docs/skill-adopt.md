---
title: tunables-adopt
description: Bring tunables into an app that has none yet, from an inventory of every value to a wired, synced app with the old homes removed.
group: Skills
order: 24
---

# tunables-adopt

`tunables-adopt` takes an app from values scattered through code, environment
variables and its own settings tables to one home per value. Use it once per
app, when tunables is not yet a dependency. For one change in an app that
already uses tunables, use [`tunables-define`](./skill-define.md); to audit an
adoption, [`tunables-verify`](./skill-verify.md).

## What it does

1. **Learns the situation.** It reads your agent instructions, ADRs and README,
   and learns your stack: the Postgres client (`pg`, `postgres`, or Drizzle
   over one), the server, the UI, how sign-in works and who an administrator
   is, where migrations run, and how tests and screenshots work. It notes
   whether a pdd-kit Product Model exists.
2. **Inventories every value.** Hard-coded limits, intervals, timeouts, sizes,
   retry counts, thresholds and budgets; every environment read; settings
   tables, files and their seeds; admin forms that edit them; feature switches;
   named configurations the app keeps several of, such as plans; and values
   kept per workspace or per person beside a global one, with the code that
   picks between them. For each, where it is
   defined, every read, its value, any per-environment override, and what
   depends on it.
3. **Classifies each into one home**: a setting in a group, a preset set, a
   catalog, a deployment value, the app's own user data, or code. For a
   setting a workspace or a person may set for themselves, it declares the
   app's [scopes](./scopes.md) and the field's `override`; plans that set a
   group's values per workspace become a preset set that is a `layer` of it. When the
   evidence does not settle it, it asks you rather than guessing.
4. **Designs the definitions**: groups by what they govern and who tunes them,
   each field's kind, unit, default, bounds, section and effects, and the
   rules, guards, `within` checks and confirmations that keep lowering a limit
   from breaking anything.
5. **Proposes, and stops.** It presents the whole proposal, with every open
   question in one batch, and writes nothing until you explicitly approve.
6. **Wires it.** The dependency and its peers; the definitions module; your
   app's tunables over your own client, created so boot never connects; the
   tables; `tunables.config.ts`; the API with `actor` and `authorize` from your
   own sign-in; the screens beside what each group affects, and All settings;
   `tunables sync` in the deploy step; every read replaced, and every old
   constant, default and fallback deleted as its read moves. With scopes,
   `authorize` lets an owner or a member change only their own `target.scope`,
   and their own settings pages use the scoped form.
7. **Moves existing values across.** In each environment it can reach, `sync`
   seeds the defaults, then `tunables set … --reason "Moved from <old home>"`
   records each value that differed, at its scope with `--scope` for a
   workspace's or a person's own. For the rest, it hands you the exact
   commands. Then it removes the old homes.
8. **Settles the Product Model**, when there is one: `tunables model draft`
   drafts the facts, `/pdd-ideate` decides them with you, and
   `tunables explain` generates the explanations.
9. **Checks and reports**: `tunables check`, your typecheck, lint and tests,
   and a report of what was adopted, what stayed in code and why, what moved,
   and what is still open.

## What it never does

- write anything before you approve the proposal;
- leave a value in two homes, or keep a fallback default at a read;
- write tunables' tables with SQL, or move a value in without a revision;
- make boot connect to the database, or run `sync` at boot;
- ship a route without `authorize`, or an `authorize` that allows everyone;
- invent a stack your app does not already have.

## Ask for it

> Adopt tunables in this app.

> Move our hard-coded limits and the settings table into tunables.

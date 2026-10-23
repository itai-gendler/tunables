---
title: tunables-verify
description: Audit an app's tunables against their rules, report every finding with where it is and the rule it breaks, and fix only the findings you choose.
group: Skills
order: 23
---

# tunables-verify

`tunables-verify` checks that every value your app runs with has one home,
that every change goes through a checked save that records a revision, that
lowering a limit cannot break what uses it, and that access stays your app's.
It reports every finding first, and changes nothing until you choose what to
fix.

## Modes and scope

- **Check** (the default) reports every finding, then fixes only the ones you
  name.
- **Report only** inspects and reports. It writes nothing and runs nothing
  that changes files or stored values.

The scope is the whole app, or a named group, preset set, catalog, deployment
value or path, or **this branch**: the values its diff touches, inspected in
their current code, not only the changed lines.

## What it looks for

It runs `tunables check --json` and, with a Product Model,
`tunables model draft`, then searches the code for what no check can see:

| Finding | The rule it breaks |
| --- | --- |
| `check-failure` | The definitions, `.env.example`, explanations and Product Model agree. |
| `hard-coded-value` | A value someone might tune is a setting, with its default in its definition. |
| `two-homes` | One home per value, and the definition is the one home of each default. |
| `read-bypass` | Settings are read through tunables, so code gets the stored, checked value. |
| `stale-read` | A setting applies while the app runs, without a restart. |
| `write-bypass` | Every change is one revision, through a checked save. |
| `unguarded-dependent` | Lowering a limit never breaks what uses it; the dependent is named. |
| `unconfirmed-consequence` | A change that costs money, redoes work or reaches people at once is confirmed first. |
| `open-access` | Access is the app's, decided on every request with `actor` and `authorize`. |
| `boot-needs-database` | Boot never connects to the database. |
| `sync-missing` | A new field is stored before code reads it. |
| `env-drift` | Every deployment value is declared once, read through its definition, and listed in `.env.example`. |
| `unexplained-field` | A field explains itself in the product's words; with pdd-kit, from the Product Model. |
| `unit-mismatch` | A value is stored in the unit the person tunes in, and the read converts it correctly. |
| `misplaced-value` | Each value sits in the home its nature gives it. |

Searches are leads: it reads each hit and confirms the rule is broken before it
counts it. A hit that is one of the documented exceptions is dropped.

## The report

Findings are grouped by type and numbered across the whole report, so you can
choose by number:

```md
### two-homes (3)
| # | Where | What | Rule broken | Fix |
| - | ----- | ---- | ----------- | --- |
| 4 | server/worker.ts:41 | `refreshMinutes ?? 60` beside `tunables.get('collection')` | The definition is the one home of each default | Delete the fallback |
```

Each finding that needs a decision says what the decision is. The report ends
with the `tunables check` result and a count per type. A clean report says *no
findings in the inspected scope*, never that the app is correct, unless the
whole app was inspected.

## Fixing

You name the findings to fix. While fixing, it routes a question of product
meaning through `/pdd-ideate`, says what each environment's stored values need,
deletes the old home of any value it moves, and never weakens a check to make
a finding disappear. Then it runs `tunables check`, your typecheck, lint and
tests, and the searches again.

## Ask for it

> Verify our settings, report only.

> Check this branch's settings changes.

> Audit the collection group and fix what you find.

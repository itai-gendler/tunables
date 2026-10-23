---
name: tunables-verify
description: Audit an app that uses tunables against its rules — run tunables check, then search the code for tunable values still hard-coded, values kept in two homes, reads and writes that bypass tunables, dependents with no guard or within, consequential changes with no confirmation, admin routes with no authorize, boot that needs the database, and .env.example drift — report every finding with file:line and the rule it breaks, and fix only the findings the user chooses. Use when the user asks to check, audit or verify the app's settings, its tunables adoption, or a branch's settings changes; use "report only" when no changes are allowed. Do not use to adopt tunables (use tunables-adopt) or to make one planned change (use tunables-define).
---

# Verify an app's tunables

Check that every value the app runs with has one home, that every change goes
through a checked save that records a revision, that lowering a limit cannot
break what uses it, and that access stays the app's. Report every finding
first; change nothing until the user chooses what to fix.

The rules each finding is measured against:

- **One home per value**: a setting in the database, edited by an
  administrator, or a deployment value in the environment, never both, and no
  constant beside either.
- **The definition is the one home of each default.**
- **Every change is one revision**, through `save`, the screens, the API or
  `tunables set`.
- **Lowering a limit never breaks what uses it**: rules, guards and `within`
  name the dependent.
- **Consequential changes are confirmed.**
- **Boot never needs the database.**
- **Access is decided by the app**, through `actor` and `authorize`, on every
  route.
- **Code keeps only what is not a value.**
- **Product meaning is not decided in code**; with pdd-kit, each field's fact
  is in the Product Model and its explanation comes from there.

Read before work:

- [references/findings.md](references/findings.md) — each finding: the rule it
  breaks, how to detect it, how to fix it, and what is not one.

## Running the CLI

```bash
node <tunables-verify-skill-dir>/scripts/run-tunables.mjs --root <dir with tunables.config.ts> <command> [options]
```

The runner uses the CLI version this skill was installed with. Verification
needs no database: use `check` and `model draft`, which read only the
definitions, the Product Model and files. Never run `sync`, `set` or `restore`
except as part of a fix the user chose.

## 1. Establish mode and scope

1. Parse the mode first:
   - `report only` → inspect and report; no writes, no fixes, no commands that
     change files or stored values;
   - otherwise → check mode: report every finding, then fix only the ones the
     user chooses.
2. Resolve the scope:
   - no scope, `full` or `current` → the whole app;
   - a named group, preset set, catalog, deployment value or path → it, its
     reads, and what depends on it;
   - `this branch` → use the merge-base diff (committed, staged and working
     tree) to choose the worklist, then inspect the current code of each
     touched value, not only the diff lines.
3. Find `tunables.config.ts` and the definitions module. If the app has no
   tunables, stop: say so, and recommend `tunables-adopt`.
4. Read the repository's agent instructions for how to build, test and run
   checks, and note whether a pdd-kit `product-model/` exists.

## 2. Run the checks

5. Run `tunables check --json`. Every entry in `findings` is a
   `check-failure` finding: unsound definitions, `.env.example` out of date,
   the explanations module out of date, or a field whose fact or default
   disagrees with the Product Model.
6. With a Product Model, run `tunables model draft` (printing, never `--out`
   into the repository). Every field it lists is an `unexplained-field`
   finding whose fix is a product decision.
7. Build the inventory the searches compare against: every group, field (key,
   unit, default), preset set, catalog and deployment value the definitions
   declare.

## 3. Search the code

8. Work through every finding type in
   [findings.md](references/findings.md), in its order, over the scope. Use its
   searches as leads and read each hit before counting it. Confirm in the code
   that the rule is broken; a name or a comment is not evidence.
9. Classify each candidate:
   - **finding** — the rule is broken, and the fix is mechanical;
   - **finding, needs a decision** — the rule is broken, but the fix needs the
     user, or with pdd-kit `/pdd-ideate`, to decide: a value's home, its
     default, whether anyone tunes it, what a field means;
   - **not a finding** — the hit is one of the exceptions findings.md lists.
     Drop it.

## 4. Report

10. Report every finding before changing anything, grouped by type, in this
    form:

    ```markdown
    ### two-homes (3)
    | # | Where | What | Rule broken | Fix |
    | - | ----- | ---- | ----------- | --- |
    | 4 | server/worker.ts:41 | `refreshMinutes ?? 60` beside `tunables.get('collection')` | The definition is the one home of each default | Delete the fallback |
    ```

    Number findings across the whole report so the user can choose by number.
    Mark each that needs a decision, and say what the decision is. End with
    the `tunables check` result and a one-line count per type.
11. In report-only mode, stop here.

## 5. Fix what the user chooses

12. Ask which findings to fix. Fix only those. A reply that answers a decision
    settles it; it does not choose findings the user did not name.
13. Fix as findings.md says for each type. While fixing:
    - a decision about product meaning goes through the `pdd-ideate` skill when
      the repository uses pdd-kit — invoke it when your harness can, otherwise
      hand the question to the user — and `tunables explain` afterwards;
    - a changed definition never changes a stored value: say what each
      environment needs (`tunables sync`, or `tunables set <group> key=value
      --reason …`) and run it only where the user lets you;
    - moving a value between homes deletes the old home in the same change;
    - never weaken a check to make a finding disappear.
14. Run `tunables check`, the app's typecheck, lint and tests, and the
    searches again for the types you fixed. A fix that leaves its finding, or
    makes another, is reported, not hidden.

## 6. Finish

15. Report:
    - mode and scope inspected;
    - every finding, by type, marked fixed, left as found, or blocked on a
      decision;
    - decisions taken, and Product Model changes made through `/pdd-ideate`;
    - stored-value steps run, and those handed to the user per environment;
    - `tunables check`, typecheck and test results;
    - what was not inspected and why.

    Say **no findings in the inspected scope**, never that the app is
    correct, unless the full app was inspected.

## Guardrails

- Report-only mode forbids every write, fix and state-changing command.
- In check mode, never fix a finding the user did not choose.
- Never decide product meaning in code; with pdd-kit it goes through
  `/pdd-ideate`, and this skill never writes `product-model/`.
- Never write tunables' tables directly, and never run `sync`, `set` or
  `restore` without the user's go-ahead.
- Never count a green `tunables check` as proof that the code follows the
  rules: the searches find what the check cannot see.
- Never stage, commit or deploy unless the repository's instructions or the
  user say to.

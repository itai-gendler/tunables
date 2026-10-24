---
title: Agent skills
description: Three skills that let a coding agent adopt tunables, define settings the right way and verify that every value has one home.
group: Skills
order: 23
---

# Agent skills

tunables ships three skills for coding agents. Each is a self-contained
`SKILL.md` with its references, written to the same principles as the library,
so an agent working in your app holds the same line a careful person would:
one home per value, no fallback defaults, every change a revision, access left
to your app.

| Skill | Use it to |
| --- | --- |
| [`tunables-adopt`](./skill-adopt.md) | Bring tunables into an app that has none yet: inventory every value, decide its home, and wire the whole thing after you approve. |
| [`tunables-define`](./skill-define.md) | Add, change, rename or remove one setting, group, preset set, catalog or deployment value in an app that already uses tunables. |
| [`tunables-verify`](./skill-verify.md) | Audit an app's tunables: report every value still hard-coded, kept in two homes or unguarded, and fix only what you choose. |

## Installing them

```bash
npx tunables install
```

It installs the skills for Claude Code, Codex CLI, Cursor, Gemini CLI and
GitHub Copilot, in the project or for your user. See
[Install skills](./cli-skills.md). After upgrading tunables, run
`npx tunables update` so the skills match the library.

In Claude Code you can also add the repository as a plugin marketplace:

```
/plugin marketplace add itai-gendler/tunables
/plugin install tunables@tunables
```

## Using them

Ask in your own words; each skill's description tells the agent when it
applies. For example:

- *"Adopt tunables in this app."* runs `tunables-adopt`.
- *"Make the retry count tunable."* runs `tunables-define`.
- *"Let each workspace lower its AI suggestions a day, never above its
  plan."* runs `tunables-define`, which declares the field's `override`.
- *"Check our settings, report only."* runs `tunables-verify` without
  changing anything.

Or name the skill: `/tunables-define add a setting for the export batch size`.

## What they share

- **They propose before they write.** Adopt and define present what they would
  change, including every choice you did not state, and wait for your approval.
  Verify reports every finding first, and fixes only the ones you choose.
- **They use the CLI.** Each skill runs the `tunables` CLI through its own
  runner, at the version it was installed with, so its checks are the
  library's own. `check`, `env`, `explain` and `model draft` need no database;
  the skills run `sync`, `set` or `restore` only as part of a change you
  approved.
- **They never write tunables' tables directly.** Values move through saves
  and `tunables set`, with a reason, so the history records each move; a
  workspace's or a person's own value moves at its scope, with `--scope`.
- **They never decide product meaning in code.** What a setting is, who tunes
  it and what it starts at are product decisions. In a repository with a
  [pdd-kit](https://pdd-kit.dev) Product Model, they draft the facts with
  `tunables model draft` and bring them to `/pdd-ideate`; they never write
  `product-model/` themselves.
- **They follow your repository.** Each reads your agent instructions first,
  wires into the database client, server, sign-in and UI you already have, and
  never stages, commits or deploys unless your instructions or you say to.

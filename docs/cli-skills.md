---
title: Install skills
description: Install tunables' agent skills for Claude Code, Codex CLI, Cursor, Gemini CLI and GitHub Copilot, and keep them current.
group: CLI
order: 22
---

# Install skills: install, update

`tunables install` puts the three [agent skills](./skills.md) where your
coding agents read them. `tunables update` refreshes them to the version of
the CLI you run.

## install

```bash
npx tunables install
```

It finds the agent harnesses on your machine or in the project, asks which to
install for and where, and copies `tunables-adopt`, `tunables-define` and
`tunables-verify` into each.

| Provider | Id | Project | Global |
| --- | --- | --- | --- |
| Claude Code | `claude` | `.claude/skills` | `~/.claude/skills` |
| Codex CLI | `codex` | `.agents/skills` | `~/.agents/skills` |
| Cursor | `cursor` | `.cursor/skills` | `~/.cursor/skills` |
| Gemini CLI | `gemini` | `.gemini/skills` | `~/.gemini/skills` |
| GitHub Copilot | `github` | `.github/skills` | `~/.copilot/skills` |

`CLAUDE_CONFIG_DIR` moves Claude Code's global directory, as it does for
Claude Code itself.

| Option | Does |
| --- | --- |
| `--providers <list>` | Install for these, comma-separated: `claude,codex,cursor,gemini,github` |
| `--scope <scope>` | `project`, in this repository, or `global`, for your user |
| `--yes` | Accept the detected providers (Claude Code and Codex when none is found) and the project scope, without asking |
| `--force` | Replace a skill directory of the same name that tunables did not install |

Without a terminal, pass `--yes` or both `--providers` and `--scope`. Every
target is checked before anything is written, so a refusal leaves nothing half
installed. Commit the project skills with your repository, so everyone working
on the app gets them.

```bash
npx tunables install --providers claude,codex --scope project
```

## update

```bash
npx tunables update
```

Finds the skill installations tunables made, in the project and for your user,
and refreshes each to this CLI's version. It names, but never touches, a
skills directory it did not install.

| Option | Does |
| --- | --- |
| `--providers <list>` | Only look for these providers |
| `--scope <scope>` | Only look in `project` or `global` |
| `--force` | Replace an unmarked collision inside a managed installation |

Run it after upgrading the package, so the skills and the library they
describe agree.

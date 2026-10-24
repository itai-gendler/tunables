# Classifying values

Every value an app runs with has exactly one home. This reference is how to
find them, how to decide each one's home, and how to propose the result.

## Inventory

Search the whole repository, application and worker code alike. These searches
are leads; read each hit before counting it.

```bash
# Environment reads
rg -n "process\.env\.|process\.env\[|import\.meta\.env\.|useRuntimeConfig\(|Deno\.env|Bun\.env"

# Named constants with a numeric value
rg -n "^\s*(export\s+)?const\s+[A-Z][A-Z0-9_]+\s*=\s*[0-9]"

# Words that name tunable quantities
rg -n -i "(timeout|interval|limit|max[A-Z_]|min[A-Z_]|retries|attempts|ttl|batch|threshold|budget|quota|cap\b|delay|window|lookback|per_?(page|hour|day|minute)|concurren)"

# Time arithmetic and timers
rg -n "[0-9]+\s*\*\s*60|[0-9]_?000\b|setInterval\(|setTimeout\(|cron"

# Settings kept as data
rg -n -i "settings|config|options|feature.?flag" --glob "*.{sql,json,yaml,yml,toml}"

# Values kept per tenant or per person, and plans that set them
rg -n -i "(workspace|tenant|org|team|account|user|member)_?(settings|preferences|limits|overrides|config)|plan_?limits|tier"
```

Also look at:

- migrations and schema files for tables or columns that hold settings, and
  the seeds that fill them;
- admin routes and forms that edit settings, and the checks they run;
- request validation (`z.string().max(60)`, `.min(`) whose bound is a product
  limit rather than a format;
- places that keep several named configurations of the same shape (plans,
  tiers, run profiles) and lists someone adds to (models, regions, providers);
- per-workspace or per-person values kept beside a global one (a
  `workspace_settings` table, a `limits` column on the plan, a user's
  reminder hour), and the code that picks between them
  (`workspace.maxProjects ?? plan.maxProjects ?? MAX_PROJECTS`). Each is a
  candidate for a setting with `override`; the hand-written precedence goes.

For each candidate record: where it is defined (`file:line`), every read, its
value, each environment override, and what depends on it (stored data capped by
it, other values it must agree with, work it triggers when changed).

## Deciding the home

Ask in this order. The first yes decides.

1. **Is it a value at all?** Layout geometry, file and wire format tables,
   protocol constants, regular expressions, status codes, the list of states a
   thing can be in, conversions between units: these define what the code
   means, and changing them is a code change. → **code**.
2. **Does an end user own it, with no default anyone tunes for them?** Their
   saved filter, rows per page on a list they read, a hint they dismissed. →
   the app's **user data** (its own columns or browser storage), not tunables.
   A preference staff set a default for, which a person may change (a
   reminder hour, a default view), is a setting with `override` (step 8).
3. **Is it a secret, a connection, or infrastructure?** Database URLs, API
   keys, OAuth client ids, hostnames, ports. → **deployment value**, declared
   without a default so it is required.
4. **Would anyone change it while the app runs, in response to load, cost,
   abuse or what users get, without a release?** If no — it is set once per
   deployment and left: lock ids, statement batch sizes, how much of an error
   message is kept, log level, queue housekeeping, file bounds. →
   **deployment value**, with a default. If an administrator might ever tune
   it, it is not a mechanic: continue.
5. **Is it several values that travel together under a name, with one default
   per kind of use, and that a subject (a user, a team, a project) follows or
   is assigned?** Plans, tiers, run profiles, cadences. → **preset set**: one
   preset per named configuration, slots for the kinds of use, `assign` per
   subject. An "experiment" override is a preset, not an environment variable.
6. **Is it a list an administrator adds to and retires from, each entry with
   its own attributes, that other values choose from?** Permitted models with
   their rates, regions, providers. → **catalog**, chosen with `pick` fields in
   presets or groups.
7. Otherwise → **setting**, a field in a group.

Then, for each setting, one more question:

8. **May a workspace or a person set their own value of it?** Then the app
   declares its chain of scopes once
   (`createTunables({ scopes: ['workspace', 'user'], scopeLabel })`) and the
   field declares where: `override: ['workspace', 'user']` to set it freely,
   or `override: { workspace: 'at-most' }` for a number they may only lower
   (or `'at-least'` only raise) from what they inherit. Plans that set a
   group's values per workspace are a preset set with
   `layer: { group, scope: 'workspace' }`, read between the system value and
   the workspace's own. A field nobody outside staff should change (a cost, a
   safety rail, the model used) declares no `override`.

When a value is read from the environment with a constant fallback, or kept in
a settings row and also overridable by the environment, it has two homes today:
decide one, and plan to delete the other. A per-workspace column that wins over
a global setting is the same: it becomes that setting's override, and its
stored values move across at their scope.

When the evidence does not answer question 4, ask the user. Do not guess a
mechanic into a setting or a setting into the environment.

## Shaping groups

- A group is one place an administrator edits, beside what it affects:
  Tasklane's Limits on its Limits screen, the Workspace defaults beside the
  workspaces. Give it a `place` naming that screen. A workspace owner's and a
  person's own values are edited on their own settings pages, at their scope.
- Settings that bound one another go in one group: `rules` see only their own
  group's values. A preset set bounded by settings reads them through `within`.
- Within a group, `section` sorts fields under sub-headings by what they
  govern ("Retries and recovery", "What a new project starts with").
- `affects` names, by effect id, what changing a field changes; mark the
  effects that cost money or reach people with `warn: true`.

## Choosing the default

The default is what a fresh deployment starts with, not necessarily what
production runs today. When the code's literal and production's override
differ, ask which is the default; the other is moved across as a stored value
(`tunables set`) in the environments that ran it.

## What depends on a value

For each setting, ask what breaks if it is lowered:

- another setting in its group → a `rules` check;
- presets that must stay within it → the preset set's `within`;
- data the app keeps per row that must stay within it (a recurring task's
  repeat under the Longest repeat) → a guard, and `within(tx).hold()` on the
  write that saves such a row;
- a workspace's or a person's own value, bounded by what it inherits → the
  field's `override` rule (`at-most`, `at-least`); tunables checks it both
  ways;
- nothing already kept, only new additions (Projects per workspace) → no
  guard: enforce at the point of adding, and let lowering keep what exists.

And what a change sets off: if it redoes work, costs money or reaches people,
the group gets a `confirm`.

## The proposal

Present one proposal, in this shape, before writing anything.

```markdown
## Groups

### Limits (`limits`) — edited at Admin › Limits
| Key | Kind | Unit | Default | Bounds | Override | Section | Affects | Fact or help | Today |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| maxProjects | number | count | 3 | ≤ 10000 | workspace: at most | | members | Projects | `server/projects.ts:12` (const), `workspace_limits.max_projects` |

Rules: none.
Guards: none; Projects only caps new projects, checked where one is created.
Confirm: none.

## Scopes
workspace, then user; named by the workspace's and the person's display names.

## Preset sets
Plans (`plans`), slot plan, a layer of Limits at workspace; Free, Pro and Team from `plans.json`; each workspace assigned the plan it pays for.

## Catalogs
Models (`models`), picked by Workspace's Suggestion model; seeded with …

## Deployment values
| Name | Kind | Default | Section | Today |

## Left in code
| Value | Where | Why it is not a value |

## User data
| Value | Where | Why it belongs to the user |

## Access
Who may read and who may change, from the app's own roles.

## Moving existing values
Per environment: the values it runs with that differ from the default, and the `tunables set` that moves each, with `--scope workspace=<id>` for a workspace's or person's own.

## Old homes removed
Constants, env vars, rows, files and admin code deleted once the reads move.

## Open questions
```

Keep it to the decisions. Do not list alternatives you rejected.

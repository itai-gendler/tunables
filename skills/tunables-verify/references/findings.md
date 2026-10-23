# Findings

Each finding type names the rule it breaks, how to detect it, how to fix it,
and what looks like it but is not. Work through them in this order. Searches
are leads: read each hit, and confirm the rule is broken before reporting it.
Replace `<dir>` with the app's source directories, and exclude generated files,
`node_modules`, build output and the tunables explanations module.

---

## check-failure

**Rule:** the definitions are sound; `.env.example` lists every deployment
value as declared; the explanations module matches the Product Model; every
field's fact exists and its default agrees with the model.

**Detect:** `tunables check --json`. Each entry in `findings` is one, with its
`check`: `definitions`, `environment`, `explanations` or `model`.

**Fix:**
- `definitions` — the message names the field: a default that fails its own
  check, an unknown unit or effect, a `pick` from no catalog, an id defined
  twice, a preset set without slots. Fix the definition.
- `environment` — run `tunables env`. If the difference is a variable someone
  added to `.env.example` by hand, declare it in the environment first:
  `tunables env` rewrites the whole file.
- `explanations` — run `tunables explain`. Never edit the module by hand.
- `model` — a fact the model lacks, or a default that disagrees, is a product
  decision: with pdd-kit, bring it to `/pdd-ideate`; if the field's fact name
  is simply misspelled, correct the field.

---

## hard-coded-value

**Rule:** every value someone might tune while the app runs is a setting, with
its default in its definition. Code keeps only what is not a value.

**Detect:**

```bash
rg -n "^\s*(export\s+)?const\s+[A-Z][A-Z0-9_]+\s*=\s*[0-9]" <dir>
rg -n -i "(timeout|interval|limit|max[A-Z_]|min[A-Z_]|retries|attempts|ttl|batch|threshold|budget|quota|delay|window|lookback|concurren)\w*\s*[:=]\s*[0-9]" <dir>
rg -n "[0-9]+\s*\*\s*60|[0-9]_?000\b|setInterval\(|setTimeout\(" <dir>
rg -n "\.(max|min)\([0-9]+" <dir>   # validation bounds that may be product limits
```

Compare each hit with the inventory: a literal that matches a field's default,
or governs the same behavior as a field, is this finding (or `two-homes`).

**Fix:** a decision first — would anyone tune it while the app runs? If yes,
add it as a setting (the `tunables-define` workflow), read it with
`tunables.get`, and delete the literal. If it is a mechanic, make it a
deployment value. If it is not a value, it stays.

**Not a finding:** layout geometry, file and wire formats, protocol constants,
unit conversions (`60_000` turning minutes into milliseconds), state lists,
test fixtures, and values in tests.

---

## two-homes

**Rule:** one home per value, and the definition is the one home of each
default.

**Detect:**
- a fallback beside a read:
  `rg -n "tunables\.(get|entry)\(" <dir>` then read each use for `??`, `||`,
  `Math.min(…, N)`, or a default parameter applied to a setting;
- an environment variable that overrides or seeds a setting: for each
  environment definition, `rg -n "<NAME>"` and see whether it feeds a value a
  group also declares; and for each field key, search its words among
  `process.env` reads;
- a default copied elsewhere: each field's default searched in seeds, SQL
  migrations, JSON or YAML settings files, Nuxt `runtimeConfig`, and docs that
  restate it as fact;
- the old settings source still present after adoption: a settings table, file
  or admin form that held the same value.

**Fix:** keep the home the inventory names, delete the other. A deleted
environment override whose value differed somewhere is moved with
`tunables set <group> key=value --reason "Moved from <NAME>"` in that
environment; remove the variable from deployments. A doc that needs the
default links to the setting instead of restating it.

**Not a finding:** the generated explanations module and `.env.example`,
which restate defaults by design; tests that assert a default.

---

## read-bypass

**Rule:** the app reads a setting through the API — `tunables.get` (or
`entry`, `within(tx).get`, `presets(id).resolve`, `catalog(id)`) — so it gets
the stored, checked value.

**Detect:**

```bash
rg -n "tunables_(groups|records|assignments|revisions)" <dir>
rg -n "defaultsOf\(|\.fields\.\w+\.default\b|\.definitions\." <dir>
rg -n "\.store\.(readGroups|listRecords|listAssignments)" <dir>
```

Also: a preset's values copied into the app's own rows instead of its `key`,
then read from the copy.

**Fix:** read through the API. A default read as if it were the value is
replaced with `get`. A preset copy is replaced by keeping `key` and resolving
it; values kept as a record of what ran are fine when labeled as that.

**Not a finding:** the tunables screens and tooling reading `describe()`;
tests.

---

## stale-read

**Rule:** a setting applies while the app runs, without a restart.

**Detect:** `tunables.get(` called at module scope, at startup, or once before
a loop whose body uses the values without reading again; values stored in a
module-level variable with no `onChange` refresh.

**Fix:** read at the point of use, each time; a worker re-reads each tick with
`{ lastGood: true }`; an in-process cache subscribes with `onChange(group, …)`.

**Not a finding:** a read per request or per job.

---

## write-bypass

**Rule:** every change is one revision, through a checked save.

**Detect:**

```bash
rg -n -i "(insert into|update|delete from)\s+\S*tunables_" <dir>
rg -n "\.(writeGroup|appendRevision|putRecord|deleteRecord|putAssignment|deleteAssignment)\(" <dir>
rg -n "setForTest\(" <dir>   # outside test files
```

Also: deploy or seed scripts that write values, and app code that calls
`save`, `reset`, preset or catalog changes without an `actor` and `reason`.

**Fix:** change values with `tunables set … --reason`, the screens, or
`save(group, values, { actor, reason })`. Delete scripts that write the tables.
Pass the actor and a reason from app code.

**Not a finding:** `setForTest` in tests; tunables' own `migrate`.

---

## unguarded-dependent

**Rule:** lowering a limit never breaks what uses it; the dependent is named.

**Detect:** for each limit-like field (`max…`, `…Limit`, `longest…`,
`most…`), search where the app compares stored rows against it, and where it
saves rows that must stay within it:

```bash
rg -n "<fieldKey>" <dir>
```

Then check:
- rows the app keeps that must stay within the value (per-row counts,
  lookbacks, budgets) → the group has a guard in `guards`, naming each row in
  the way;
- the write path that saves such a row → it runs inside a transaction with
  `tunables.within(tx).hold()` and reads the limit from `within(tx).get`;
- presets whose fields a setting bounds → the preset set has `within` covering
  each bound;
- fields of one group that bound one another → the group's `rules`;
- app data that uses a catalog entry → a `uses` provider for that catalog;
- a guard that reads only `host` → it falls back to the app's own database when
  `host` is undefined (the CLI passes none).

**Fix:** add the missing guard, `hold`, `within`, rule or `uses` (the
`tunables-define` guards reference has the shapes), with a test that the
lowering is refused, naming the dependent.

**Not a finding:** a limit that only caps new additions (Briefs per reader),
checked where things are added: lowering it keeps what exists.

---

## unconfirmed-consequence

**Rule:** a change that costs money, redoes work or reaches people at once is
confirmed before it is saved.

**Detect:** fields whose `affects` include an effect with `warn: true`, in a
group with no `confirm`; and code that reacts to a change (an `onChange`
listener, a job keyed on a value) by recomputing, re-sending or re-billing.

**Fix:** a `confirm(next, previous)` on the group that names the consequence
and compares only the fields that trigger it. Whether a consequence is worth
confirming is a decision for the user.

**Not a finding:** a `warn` effect that only raises an ongoing cost gradually
(a higher budget per run), when the user has said not to confirm it.

---

## open-access

**Rule:** access is the app's, decided on every request: `actor` from its
sign-in, `authorize` from its roles.

**Detect:**

```bash
rg -n "createHandler\(|tunablesMiddleware\(|tunablesRouter\(" <dir>
```

For each: `authorize` is present and decides from the actor's role (not
`() => true`, not a check of sign-in alone); `actor` returns the signed-in
person, not a constant; the route is not reachable to readers where it should
not be. Also: app routes that call `save`, `reset`, `restore`, preset or
catalog changes, and check no role first.

**Fix:** write `authorize` from the app's existing roles, per `action` and
target where they differ; return the session's person from `actor`; add the
role check to the app's own routes.

**Not a finding:** a missing `authorize` refuses everything, so it breaks the
screens rather than opening them; report it as a broken route, not an open one.

---

## boot-needs-database

**Rule:** boot never needs the database.

**Detect:** `sync(`, `migrate(`, `get(` or `entry(` awaited at module scope or
in startup hooks (Nitro plugins, `app.listen` callbacks, server entry
files); a database client that connects when imported;
`tunables.config.ts` connecting outside `connect`.

**Fix:** create tunables lazily over a lazily connecting client; move `sync`
and `migrate` to the deploy step; open connections inside `connect`.

**Not a finding:** reading the environment at start with `environment.read()`.

---

## sync-missing

**Rule:** a new field is stored before code reads it, so `get` never throws
`TunablesMissing`.

**Detect:** the deploy, release or migrate scripts (CI workflows, Dockerfiles,
Helm hooks, `package.json` scripts) run no `tunables sync`, or run it after
the new code starts serving; tables created by nobody (`migrate`, Drizzle
tables, or SQL migration).

**Fix:** add `tunables sync` after migrations and before the new code serves,
with the environment `connect` needs.

---

## env-drift

**Rule:** every deployment value is declared once, read through the
environment definitions, and listed in `.env.example`.

**Detect:**

```bash
rg -n -o "process\.env\.([A-Z0-9_]+)|process\.env\[['\"]([A-Z0-9_]+)" <dir>
```

Compare the names with the environment definitions: a name read but not
declared, a name declared but never read, and a raw `process.env` read that
parses or defaults on its own instead of `environment.get`. `tunables check`
already reports `.env.example` itself.

**Fix:** declare the value (description, default, section) and read it with
`environment.get`; delete declarations nobody reads; run `tunables env`.

**Not a finding:** variables the platform or a framework reads itself
(`NODE_ENV`, `PORT` read by the server framework, `CI`).

---

## unexplained-field

**Rule:** a field explains itself in the product's words; with pdd-kit, from
the fact the Product Model keeps.

**Detect:** with a Product Model, every field `tunables model draft` lists, and
every field with both `fact` and `help` (the `help` hides the model's words).
Without one, fields with neither `help` nor a `label` that reads as words.

**Fix:** with pdd-kit, a decision: bring the draft to `/pdd-ideate`, then
`tunables explain`, and drop `help` from fields with a fact. Without one, write
`help`.

---

## unit-mismatch

**Rule:** a value is stored in the unit the person tunes in, and the read
converts it correctly.

**Detect:** for each `number` and `range` field, read every use of its key:
a `…Minutes` value multiplied by `1000`, a `…Seconds` value passed where
milliseconds are expected, a key whose unit word differs from its `unit`.

**Fix:** correct the conversion at the read, or the `unit` of the field when
the key is right and the unit is not (with pdd-kit, the stated default may
need `/pdd-ideate`).

---

## misplaced-value

**Rule:** each value sits in the home its nature gives it.

**Detect:** a group field one end user owns (a per-person preference); a
mechanic (lock id, batch size, how much text is kept) on an administrator's
screen; a secret or connection string in a group; several environment
variables that change together for an experiment; a list of choices kept as a
`choice` field's options that administrators keep asking to extend (a
catalog).

**Fix:** a decision for the user, then the move: user data to the app's
tables, a mechanic or secret to the environment, an experiment to a preset,
a growing list to a catalog. Move stored values with `tunables set` or the
environment, and delete the old home.

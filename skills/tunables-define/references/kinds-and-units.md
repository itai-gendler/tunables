# Kinds and units

Every field is declared once with its kind and default. Its check, its stored
seed, the API's schema and its form input all follow from that declaration.
All builders are exported from `tunables`.

## Kinds

| Kind | Builder | Value | Check |
| --- | --- | --- | --- |
| number | `number({ unit, default, integer?, min?, max? })` | `number` | whole by default; more than 0 unless `min` (or the unit's min) is set; inclusive `min`/`max` beyond the unit's own |
| range | `range({ unit, default: { min, max }, integer? })` | `{ min, max }` | each end as a number in the unit; `min ≤ max`. No field-level bounds |
| size | `size({ default: { width, height } })` | `{ width, height }` | whole pixels, each more than 0 |
| toggle | `toggle({ default })` | `boolean` | on or off |
| choice | `choice({ options, default })` | one option value | one of the options |
| choices | `choices({ options, default, minimum? })` | option values | only listed options, no repeats, at least `minimum` (1 by default) |
| text | `text({ default, maxLength?, optional?, multiline? })` | `string` | at most `maxLength`; `optional: false` refuses empty text |
| pick | `pick({ catalog, default })` | an entry id | an entry of that catalog, Available when newly picked |

Options are strings or `{ value, label }`. A `pick`, in a preset set or a
group, is checked on save: the entry exists and is Available (a retired entry
may stay picked while unchanged). The entry cannot be retired while a preset,
a group's value or a scope's override picks it.

Every default must pass its own field's check; `createTunables` refuses the
definitions otherwise. (Catalog field defaults are exempt: an entry is always
given its values.)

## Choosing a kind

- An amount of something → `number` with its unit. A "0 means off" number is
  two things: a `toggle` and a `number`.
- A shortest and a longest → `range`, not two numbers with a rule.
- An image or viewport minimum → `size`.
- A mode among named behaviors → `choice`, with labels in the product's words.
- A set of allowed behaviors → `choices`; set `minimum: 0` when none is
  allowed.
- Prose an administrator writes (instructions, a notice) → `text`, with
  `multiline` and a `maxLength`.
- A choice from an administrator-kept list → `pick` from a catalog.

## Units

Built in: `count`, `seconds`, `minutes`, `hours`, `days`, `characters`,
`words`, `tokens`, `kilobytes` (KB), `megabytes` (MB), `pixels`, `percent`
(0–100), `dollars` (reads `$2`), `hour` (of the day, 0–23, reads `06:00`),
`weekday` (0–6, reads `Monday`).

An app's own unit goes in `units`, passed to `createTunables` and the config:

```ts
export const units = {
  'dollars-per-million': { label: 'dollars per million tokens', format: (value: number) => `$${value} per million tokens` }
} satisfies Record<string, Unit>
```

A unit may set `label`, `min`, `max`, `integer` and `format`. A field naming
a unit that is not defined is refused when tunables is created.

Store in the unit the person tunes in. Minutes stay minutes; convert at the
read (`archiveAfterDays * 86_400_000`). Put the unit in the key
(`archiveAfterDays`, `attachmentMb`, `dueSoonDays`) so a read cannot
mistake it. Fractional amounts need `integer: false`.

## Bounds

- Bounds are safety rails, the values no deployment should ever run with: the
  largest response the server can hold, the longest request a worker can
  wait for. They are not policy; policy is the value.
- `min`/`max` on a number add to the unit's own. The unit's `min` replaces the
  "more than 0" rule; to allow 0, set `min: 0`.
- A bound that depends on another setting is a `rules` check, not a `max`.
- A bound on a workspace's or a person's own value is the field's `override`
  rule (`at-most` or `at-least` what it inherits), not a `max`.
- Tightening a bound can leave a stored value outside it, and reads then throw
  `TunablesInvalid`; move stored values first.

## Field information

Every kind takes:

| Key | Meaning |
| --- | --- |
| `fact` | The Product Model fact this field is, in the group's `entity`. Its explanation and stated default come from there; `tunables check` refuses a fact the model lacks or a default it contradicts. |
| `label` | The name a person reads. Defaults to `fact`, then the key. |
| `help` | An explanation for a field the Product Model does not describe. With a fact, leave it out: it would override the model's words. |
| `section` | The sub-heading the field sits under in its group's form. |
| `affects` | Effect ids from `effects`: what changing it changes. Unknown ids are refused. |
| `override` | Where the field may take its own value, at the scopes `createTunables({ scopes })` declares: a list (`['workspace', 'user']`, set freely), or per scope `'free'`, `'at-most'` or `'at-least'` the value it inherits (`{ workspace: 'at-most' }`, numbers only). Absent: set only for the whole system. |

Effects are declared once with `defineEffects({ id: { label, warn?, icon? } })`.
`warn: true` marks an effect that costs money or reaches people; it is shown
with emphasis, and a field with such an effect usually wants a `confirm`.

## The Product Model link

With pdd-kit, a group, preset set or catalog names its Entity with `entity`
(the file `product-model/entities/<entity>.md`, or `<entity>/entity.md`), and
each field names a fact listed under that Entity's `## Information kept`:

```markdown
## Information kept

- **Archive done tasks after** — how long a done task stays in its project before it is archived; defaults to 30 days
```

`tunables model draft` drafts lines like this for fields the model lacks, for
`/pdd-ideate` to decide (with a default for group fields). Wherever the model
states a default, `tunables check` compares it with the field's default as it
reads ("30 days", "$0.10", "On", "400 × 225 pixels"),
by its numbers or, without numbers, by its words.

## Keys and ids

- Field keys are camelCase with the unit in them. Group, preset set and
  catalog ids are short and lowercase (`limits`, `plans`, `models`).
- Preset keys are lowercase words with single hyphens (`daily-light`).
- An id is stored; changing one is a rename, with its stored values moved
  across.

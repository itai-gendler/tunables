---
title: Kinds and units
description: The eight kinds of setting, the built-in units, your own units, and how values are checked and read.
group: Concepts
order: 4
---

# Kinds and units

Every field is declared with a builder that names its kind. The kind decides
the value's type, its check, the input the screens draw for it, and how it
reads to a person.

## The kinds

| Builder | Value | Input | Options beyond the [common ones](./settings-and-groups.md#what-a-field-says) |
| --- | --- | --- | --- |
| `number` | `number` | A number with its unit | `unit`, `integer`, `min`, `max` |
| `range` | `{ min, max }` | A shortest and a longest | `unit`, `integer` |
| `size` | `{ width, height }` | Width and height in pixels | none |
| `toggle` | `boolean` | A switch | none |
| `choice` | one of the options | Radio buttons, or a select past three options | `options` |
| `choices` | several of the options | Checkboxes | `options`, `minimum` |
| `text` | `string` | A text box, or several lines | `maxLength`, `optional`, `multiline` |
| `pick` | an entry id | A select of a catalog's Available entries | `catalog` |

```ts
import { choice, choices, number, pick, range, size, text, toggle } from 'tunables'

const fields = {
  checkIntervalMinutes: number({ label: 'Check interval', unit: 'minutes', default: 5 }),
  largestResponseMegabytes: number({ label: 'Largest response', unit: 'megabytes', integer: false, default: 2 }),
  storySummaryLength: range({ label: 'Story summary length', unit: 'characters', default: { min: 40, max: 360 } }),
  imageMinimum: size({ label: 'Image minimum size', default: { width: 400, height: 225 } }),
  newFeedFullText: toggle({ label: 'New-feed full text', default: true }),
  scheduledCollection: choice({
    label: 'Scheduled collection',
    options: [{ value: 'off', label: 'Off' }, { value: 'brief-feeds', label: 'Feeds Briefs read' }],
    default: 'brief-feeds'
  }),
  efforts: choices({ label: 'Efforts', options: ['low', 'medium', 'high'], default: ['low', 'medium'], minimum: 0 }),
  framing: text({ label: 'Framing', default: '', maxLength: 4000, multiline: true }),
  model: pick({ label: 'Model', catalog: 'models', default: 'openai/gpt-oss-120b' })
}
```

`choice` and `choices` take options as plain strings, or as `{ value, label }`
when the stored value and the name a person reads differ. Their types are
narrowed to the options, so `scheduledCollection` reads as
`'off' | 'brief-feeds'`.

## How values are checked

Each kind's check follows from its declaration, and every problem is said in
the field's own words:

- **`number`** is a whole number unless `integer: false`, more than 0 unless a
  `min` says otherwise, and within `min` and `max`, which are inclusive. A
  unit's own bounds apply when the field states none. *"Check interval must be
  a whole number."*, *"Budget limit may not be more than $50."*
- **`range`** has a shortest and a longest, each checked like a number, and the
  shortest may not be longer than the longest.
- **`size`** has a whole-number width and height, each more than 0.
- **`choice`** must be one of its options; **`choices`** may hold only its
  options, each once, and at least `minimum` of them (1 unless you say 0).
- **`text`** may be at most `maxLength` characters, and may not be empty when
  `optional: false`.
- **`pick`** must name an entry of its catalog. A preset may not newly pick a
  Retired entry; see [Catalogs](./catalogs.md).

`fieldSchema(key, field, unitOf)` returns the zod schema a field is checked
with, for code that needs the same check outside a save.

## Units

A `number` or `range` is measured in a unit. A unit says how an amount reads to
a person and what values it may take.

| Unit | Reads as | Allows |
| --- | --- | --- |
| `count` | `12` | any positive amount |
| `seconds`, `minutes`, `hours`, `days` | `15 seconds` | any positive amount |
| `characters`, `words`, `tokens` | `280 characters` | any positive amount |
| `kilobytes`, `megabytes` | `100 KB`, `2 MB` | any positive amount |
| `pixels` | `400 pixels` | any positive amount |
| `percent` | `40%` | 0 to 100 |
| `dollars` | `$25`, `$0.10` | any positive amount |
| `hour` | `06:00` | a whole hour of the day, 0 to 23 |
| `weekday` | `Monday` | 0 (Sunday) to 6 (Saturday) |

`hour`, `weekday` and `percent` allow 0 because their own minimum is 0; other
units start above 0. Whatever the unit, a number is whole unless the field
says `integer: false`, so a dollar amount with cents needs it. The screens
draw `hour` and `weekday` as selects and put `$` before dollars.

### Your own units

Declare a unit your app measures in and pass it to `createTunables`:

```ts
import { createTunables, number, type Unit } from 'tunables'

export const units = {
  'dollars-per-million': {
    label: 'dollars per million tokens',
    format: (value: number) => `$${value} per million tokens`
  }
} satisfies Record<string, Unit>

const inputRate = number({ label: 'Input rate', unit: 'dollars-per-million', integer: false, default: 0.15 })

const tunables = createTunables({ store, groups, units })
```

A unit takes a `label`, and optionally `min`, `max`, `integer` and a `format`
function. A field measured in a unit nobody declared fails at start: *"run.inputRate
is measured in "dollars-per-million", which is not a unit. Add it to `units`."*

## How values read

`formatValue(field, value, unitOf)` gives the reading the screens, All
settings, `tunables get` and the entry's `display` use: `$25`, `40–360
characters`, `400 × 225 pixels`, `On`, `Feeds Briefs read`. In the browser,
`displayValue` from `tunables/client` reads a value from a field's description
the same way, for a value still being edited.

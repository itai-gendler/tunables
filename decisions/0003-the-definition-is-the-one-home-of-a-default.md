# The definition is the one home of each default

Status: accepted.

## Context

news kept defaults in a JSON file that a migration inserted beside the values,
and again as prose in its Product Model; nothing checked that the two agreed.

## Decision

- A field declares its default with its kind and unit:
  `number({ unit: 'dollars', default: 25 })`.
- `sync` seeds new groups and new fields from it; reset returns to it; the
  screens show it. Defaults are not stored.
- The app reads live values only from the store. A value that is not stored is
  an error naming `sync`, never a silent fallback to the default.
- When the field names a Product Model fact, `tunables check` holds the default
  the model states to the declared one.

## Consequences

- Changing a default changes what `sync` seeds and what reset returns to; it
  never changes a value already stored.
- For news this replaces "code keeps no copy" with "the definition is the one
  copy", and retires `initial-settings.json`.

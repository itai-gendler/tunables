---
domain: presets-and-catalogs
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#defineCatalog
---

# Catalog entry

One entry of a catalog the host app keeps for presets to pick from, such as a
permitted model with its effort levels and rates. Entries are added, edited,
retired and reinstated, never deleted, so whatever picked one can still name
it.

## Information kept

- **Catalog** — the catalog it belongs to
- **Id** — its stable name in the catalog; it never changes
- **Values** — its value for each setting the catalog declares
- **In use by** — the presets that pick it, and the things the host app names as using it

## States

### Available

It may be picked by any preset.

### Retired

It stays in the catalog, and a preset that already picked it keeps it, but no
preset may newly pick it.

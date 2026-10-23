# Field explanations come from the Product Model

Status: accepted.

## Context

news explained every setting in the words of its pdd-kit Product Model, with a
generator and a staleness test written for news alone.

## Decision

- A field names the Product Model fact it is (`fact`). `tunables explain`
  writes an explanations module from `product-model/entities`, and the screens
  show the fact's own description beside the field.
- `tunables check` refuses a field naming a fact the model does not keep, a
  default that disagrees with the model's, and stale explanations.
- `tunables model draft` proposes the facts the model lacks, as Markdown for
  `/pdd-ideate`. tunables never writes the model.

## Consequences

- Product meaning is decided in the Product Model, never in code.
- A field can still carry its own `help` when an app has no model.

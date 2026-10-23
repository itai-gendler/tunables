---
domain: definitions
references:
  - kind: code
    role: implementation
    target: src/model/kinds.ts
  - kind: code
    role: implementation
    target: src/model/units.ts#BUILT_IN_UNITS
  - kind: code
    role: implementation
    target: src/model/definitions.ts#defineEffects
---

# Setting

One value the host app reads and an Administrator may change while it runs,
declared once in a settings group, a preset set or a catalog. Its declaration
is where everything about it comes from: the check its value must pass, how the
value reads to a person, the input it is edited with and its default.

## Information kept

- **Key** — its stable name within what declares it
- **Label** — the name a person reads; the name of its fact unless another is given
- **Kind** — a number, a range, a size, a toggle, one choice, several choices, a text, or a pick from a catalog
- **Unit** — what a number or a range is measured in, such as minutes, dollars or an hour of the day, which also bounds the values it may take
- **Allowed values** — the least and most it may be beyond its unit, the choices it offers, how long a text may be, or the catalog it picks from
- **Default** — the value it starts at and is reset to, declared only here
- **Fact** — the Product Model fact it is
- **Explanation** — what it is, in the Product Model's description of its fact, or help written beside it where the model does not describe it, shown beside its label with its default
- **Section** — the sub-heading it is listed under in its group
- **Effects** — what changing it changes, such as cost or what people see, the ones that cost money or reach people marked as warnings
- **Notes** — what its current value means in the host app now, such as how many things use it

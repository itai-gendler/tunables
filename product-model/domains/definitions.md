---
colorSlot: 1
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts
---

# Definitions

Declaring, in the host app's code, what can be tuned and what a deployment
sets: each setting once with its kind, unit, default and fact, the groups,
preset sets and catalogs that hold them, the deployment values beside them,
and bringing what is stored in line with what is declared.

## Boundary

Owns declarations, their defaults, `.env.example`, and seeding stored values
from the definitions. It does not own changing a stored value once it exists,
which is administration, and it never decides a fact's meaning, which belongs
to the app's Product Model.

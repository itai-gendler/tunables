---
domain: definitions
availability: [{ place: library }]
references:
  - kind: code
    role: implementation
    target: src/model/environment.ts#defineEnvironment
---

# Declare deployment values

Declares what a deployment sets in its environment and nobody tunes while the
app runs — a lock id, a batch size, a connection limit — each with its kind,
its description, the section it is listed under and, unless it must be set, its
default, and reads them all at once, checked, when the host app starts.

## Intent

A value only a deployment decides still deserves one declaration, a
description and a check, and keeping it apart from the settings makes it plain
which values an Administrator can change and which only a deployment can.

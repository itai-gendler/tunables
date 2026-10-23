---
domain: administration
references:
  - kind: code
    role: implementation
    target: src/server/service.ts#createService
---

# Access policy

The host app's own answer to who is asking and what they may do, given to
tunables when the host mounts the HTTP API and asked on every request. It lives
in the host app's code; tunables never creates or changes it. With none given,
nobody may do anything.

## Information kept

- **Signed-in person** — who is asking, from the host app's own sign-in; nobody when no one is signed in
- **May read** — whether that person may read a settings group, a preset set, a catalog or a history
- **May change** — whether that person may change it
- **Refusal** — whether a refusal answers as if nothing were there, so an outsider cannot tell the administration exists, or as forbidden; defaults to Not found

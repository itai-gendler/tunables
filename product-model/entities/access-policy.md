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

- **Signed-in person** — who is asking, from the host app's own sign-in or a token a terminal sends; nobody when no one is signed in
- **Scope** — the scope a request is for, when it names one, such as workspace Acme, so the host app can let a workspace owner read and change their own workspace and nothing else
- **May read** — whether that person may read a settings group, for the whole system or at the scope asked about, a preset set, a catalog or a history
- **May change** — whether that person may change it, at that scope
- **Refusal** — whether a refusal answers as if nothing were there, so an outsider cannot tell the administration exists, or as forbidden; defaults to Not found

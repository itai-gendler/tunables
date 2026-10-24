---
kind: person
acts: external
references:
  - kind: code
    role: implementation
    target: src/server/service.ts#ServiceOptions
---

# Administrator

A person the host app lets read or change its settings, presets and catalogs
through the screens it embeds or the HTTP API, for the whole system and for any
scope the host app lets them override. tunables keeps nothing about
who holds this role: the host app signs them in and decides, on every request,
whether they may read or change what they ask for.

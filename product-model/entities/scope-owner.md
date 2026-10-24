---
kind: person
acts: external
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: adr
    role: intent
    target: decisions/0009-settings-are-layered-by-scope.md
---

# Scope owner

A person the host app lets read and change the values of one scope and nothing
broader: a workspace owner tuning their workspace, or a user setting their own
values inside it. They use the same screens and HTTP API as an Administrator,
given their scope. tunables keeps nothing about who holds this role: the host
app signs them in and decides, on every request and for the scope it names,
whether they may read or change it.

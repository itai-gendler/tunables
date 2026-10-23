---
type: web
actors: [administrator]
languages: [en]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/nuxt.config.ts
  - kind: code
    role: implementation
    target: src/vue/index.ts
---

# Embedded screens

The screens a host app places in its own administration, at the routes it
chooses and behind its own sign-in: each settings group beside what it affects,
All settings, the history of a change, presets with their editor and the
picker that assigns one, and catalogs. They act only through the HTTP API, so
what they may do is what the host app allows there.

---
scope: The library, its storage, HTTP API and client, the command-line tool, the embedded screens layer, and the bundled agent skills.
method: Static inspection of source, without executing it.
covered:
  - description: The library, its storage adapters, HTTP API, client, command-line tool, Product Model tooling and skill installer.
    paths: [src/]
  - description: The Nuxt layer of embedded screens.
    paths: [layers/nuxt/tunables/]
  - description: The bundled agent skills and their references.
    paths: [skills/]
exclusions:
  - description: The documentation site.
    paths: [site/]
  - description: The playground app used to try the screens during development.
    paths: [playground/]
  - description: The fixture app the tests and skills run against.
    paths: [fixture/]
  - description: Repository maintenance scripts.
    paths: [scripts/]
  - description: Continuous integration and repository automation.
    paths: [.github/]
  - description: The command-line tool's offer to update itself, copied from pdd-kit.
    paths: [src/core/cli-update.ts, src/update-check.ts]
  - description: Test helpers host apps use in their own tests.
    paths: [src/testing.ts]
unmapped: []
limitations: []
---

# Coverage

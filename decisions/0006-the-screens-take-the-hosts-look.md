# The screens take the host's look

Status: accepted.

## Context

Embedded screens that bring their own palette look foreign in every host. news
has its own design system (Blueprint) and changes it deliberately.

## Decision

- The screens are Nuxt UI components in a Nuxt layer and use only Nuxt UI's
  semantic colors and the host's `app.config`. The layer ships no CSS, fonts or
  colors.
- Fields lay themselves out by the space they are given (container queries),
  so they fit a page, a slideover or a narrow panel.
- A host on another design system builds on `tunables/vue`'s headless
  composables instead.

## Consequences

- In news, the screens are Blueprint with no extra work.
- tunables' own site and playground carry their own theme; the package does not.

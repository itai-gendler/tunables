# Brand and UI

read_when: changing colors, type, the logo, home page copy or the voice.

## Identity

- **Name:** tunables, always lowercase.
- **Tagline:** "Runtime settings with guardrails, for the app you already run."
- **Metaphor:** every tunable is a knob on a panel. The mark is a dial: eleven
  ticks over a 270° sweep, a knob, and a teal indicator turned two-thirds up
  (`app/components/BrandMark.vue`, `public/favicon.svg`). The hero's panel and
  the social card use the same dial at a larger size.
- **Sibling of pdd-kit, not a copy.** pdd-kit.dev is warm paper and brass;
  tunables is a control panel. Shared: the type stack, the restraint, the
  structure of the site.

## Color

Tokens are in `app/assets/css/main.css`; Nuxt UI's semantic colors in
`app/app.config.ts`.

| Role | Light | Dark |
| --- | --- | --- |
| Page (`--ui-bg`) | ink-50 `#f6f8f8` | ink-950 `#0d1316` |
| Cards (`--ui-bg-elevated`) | `#ffffff` | `#141c20` |
| Code ground (`--ui-bg-muted`) | `#eef2f2` | `#121a1e` |
| Primary (what can be turned) | teal-700 | teal-400 |
| Secondary, warning (what costs) | amber-700 | amber-400 |
| Error (a refused save) | red-700 | red-400 |

The neutral is `ink`, a cool slate with a trace of green. Muted and dimmed
text are both ink-600 in light (ink-400 in dark), because Nuxt UI's defaults
fail AA on these grounds. Color means something: teal is the control, amber is
cost, red is a refusal. Nothing is colored for decoration, and there are no
gradients.

The faint grid behind the hero (`.site-grid`) is the panel the knobs sit on;
it fades out before any body copy.

## Type

Archivo for headings, Inter for text, IBM Plex Mono for code, commands and the
small uppercase labels. All self-hosted from `@fontsource`.

## Light and dark

Both are first-class. The site follows the visitor's system preference, and
the header toggle overrides it. Every axe scan in `tests/e2e` runs in light,
and the home page and a docs page also run in dark.

## Voice

Plain, specific, active. Say what tunables does with the real words it uses:
the home page's refusals are the library's own messages for Tasklane, the
example todo app in `examples/tasklane`. No marketing adjectives, no emoji, no
exclamation marks. Short paragraphs.

## Home page

The words live in `app/utils/homeContent.ts`. Sections, in order: hero (with a
working dial demo of Projects on Tasklane's Pro plan), where settings live today,
how it works, guardrails, built for coding agents, it attaches, and the close.
Headings are left-aligned on the reading edge; each section says where it
continues in its corner.

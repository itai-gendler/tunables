---
title: Theming
description: The screens bring no colors, fonts or CSS of their own; they take your Nuxt UI theme.
group: Screens
order: 18
---

# Theming

The screens are part of your app, so they look like it. The layer brings no
colors, fonts or stylesheet: every component is built from Nuxt UI components
and Nuxt UI's semantic utilities (`text-highlighted`, `border-default`,
`bg-elevated`, `text-primary`), so it takes whatever your theme makes of them,
in light and dark.

## Your colors

Set them where you set them for the rest of your app:

```ts [app/app.config.ts]
export default defineAppConfig({
  ui: {
    colors: { primary: 'teal', neutral: 'slate' }
  }
})
```

Primary marks unsaved changes and the Save button; warning marks a change
that costs something and the button that confirms it; error marks problems.
Your component overrides under `ui` apply too: a rounder `button` or a denser
`input` changes the screens with the rest of the app.

## Let Tailwind see the components

Tailwind generates only the classes it finds in the files it scans. The
layer's components live in `node_modules`, so name them as a source in your
main stylesheet:

```css [app/assets/css/main.css]
@import "tailwindcss";
@import "@nuxt/ui";

@source "../../../node_modules/tunables/layers/nuxt/tunables/app";
```

The path is relative to the stylesheet. Without it, the screens render, but
spacing and layout classes your own app never uses are missing.

## Icons

Effects take an Iconify name, such as `i-lucide-coins`, and the screens use a
few Lucide icons of their own. Install the collection, so Nuxt Icon serves
them from your app:

```bash
npm install @iconify-json/lucide
```

## Words

The screens use your words: group, field and section names, explanations,
effects and problems all come from your definitions and your checks. Write
them in the product's language, the way the person changing a setting thinks
of it. With a [Product Model](./cli-check.md#explain), the explanations are the
model's own.

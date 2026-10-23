interface ThemeRule {
  scope?: string | string[]
  settings: { foreground?: string, fontStyle?: string }
}

/**
 * The site's Shiki themes, "Panel", light and dark: ink for code, teal for what
 * the language reserves, amber for literals. Every token color clears 6:1 on
 * its code ground (`--ui-bg-muted`: #eef2f2 light, #121a1e dark), so the docs
 * pass the WCAG AA contrast scan the e2e suites run. Stock themes put comments
 * and some tokens under 4.5:1 on these grounds.
 */
const PALETTES = {
  light: { background: '#eef2f2', plain: '#182025', muted: '#4f5d63', reserved: '#115e59', literal: '#92400e', name: '#2a3439' },
  dark: { background: '#121a1e', plain: '#e6ebec', muted: '#a3afb4', reserved: '#5eead4', literal: '#fcd34d', name: '#f6f8f8' }
}

export function panelSyntaxTheme(mode: 'light' | 'dark') {
  const PALETTE = PALETTES[mode]
  return {
    name: `tunables-panel-${mode}`,
    type: mode,
    colors: {
      'editor.background': PALETTE.background,
      'editor.foreground': PALETTE.plain
    },
    tokenColors: [
      { settings: { foreground: PALETTE.plain } },
      { scope: ['comment', 'punctuation.definition.comment', 'string.comment'], settings: { foreground: PALETTE.muted, fontStyle: 'italic' } },
      { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'constant.language', 'variable.language'], settings: { foreground: PALETTE.reserved } },
      { scope: ['string', 'string.template', 'constant.numeric', 'constant.other', 'string.regexp', 'entity.name.tag', 'support.class.component', 'markup.inline.raw'], settings: { foreground: PALETTE.literal } },
      { scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.type', 'support.type', 'entity.other.attribute-name'], settings: { foreground: PALETTE.name, fontStyle: 'bold' } },
      { scope: ['punctuation', 'keyword.operator', 'meta.brace'], settings: { foreground: PALETTE.muted } },
      { scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.variable', 'support.type.property-name'], settings: { foreground: PALETTE.plain } },
      { scope: ['markup.heading', 'markup.heading entity.name'], settings: { foreground: PALETTE.reserved, fontStyle: 'bold' } },
      { scope: 'markup.bold', settings: { fontStyle: 'bold' } },
      { scope: 'markup.italic', settings: { fontStyle: 'italic' } }
    ] satisfies ThemeRule[]
  }
}

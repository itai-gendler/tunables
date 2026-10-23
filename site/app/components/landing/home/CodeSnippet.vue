<script setup lang="ts">
/**
 * A short code sample on the home page, with its file name above it.
 *
 * The docs highlight code with Shiki at build time; the home page does not ship
 * a highlighter for five snippets. A handful of token roles is enough here:
 * strings in the accent, comments and terminal output muted, keywords and tags
 * in the strongest ink. Every role clears AA on the code ground in both modes.
 */
const { code, file } = defineProps<{ code: string, file: string }>()

type Role = 'string' | 'comment' | 'keyword' | 'tag' | 'prompt' | 'output' | 'plain'
interface Token { text: string, role: Role }

const TOKENS = /(\/\/.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|(<\/?[A-Za-z][\w-]*|\/?>)|\b(import|export|from|const|await|async|return|function)\b/gm

function tokenizeCode(source: string): Token[][] {
  return source.split('\n').map((line) => {
    const tokens: Token[] = []
    let last = 0
    for (const match of line.matchAll(TOKENS)) {
      if (match.index > last) tokens.push({ text: line.slice(last, match.index), role: 'plain' })
      const role: Role = match[1] ? 'comment' : match[2] ? 'string' : match[3] ? 'tag' : 'keyword'
      tokens.push({ text: match[0], role })
      last = match.index + match[0].length
    }
    if (last < line.length) tokens.push({ text: line.slice(last), role: 'plain' })
    return tokens
  })
}

function tokenizeTerminal(source: string): Token[][] {
  return source.split('\n').map((line) => {
    if (!line.startsWith('$ ')) return [{ text: line, role: 'output' }]
    return [{ text: '$ ', role: 'prompt' }, { text: line.slice(2), role: 'plain' }]
  })
}

const lines = computed(() => file === 'terminal' ? tokenizeTerminal(code) : tokenizeCode(code))

const ROLE_CLASS: Record<Role, string> = {
  string: 'text-primary',
  comment: 'text-muted italic',
  keyword: 'font-medium text-highlighted',
  tag: 'font-medium text-highlighted',
  prompt: 'select-none text-muted',
  output: 'text-muted',
  plain: 'text-default'
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-default bg-muted">
    <p class="flex items-center gap-1.5 border-b border-default px-3.5 py-2 font-mono text-[11px] text-muted">
      <UIcon :name="file === 'terminal' ? 'i-lucide-terminal' : 'i-lucide-file-code'" class="size-3.5" aria-hidden="true" />
      {{ file }}
    </p>
    <pre class="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.6]" tabindex="0"><code><span
      v-for="(line, lineIndex) in lines"
      :key="lineIndex"
      class="block min-h-[1.6em]"
    ><span
      v-for="(token, tokenIndex) in line"
      :key="tokenIndex"
      :class="ROLE_CLASS[token.role]"
    >{{ token.text }}</span></span></code></pre>
  </div>
</template>

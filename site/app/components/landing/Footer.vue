<script setup lang="ts">
const links = [
  { label: 'Docs', to: '/docs' },
  { label: 'Changelog', to: '/changelog' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'GitHub', to: 'https://github.com/itai-gendler/tunables', external: true },
  { label: 'npm', to: 'https://www.npmjs.com/package/tunables', external: true },
  { label: 'Issues', to: 'https://github.com/itai-gendler/tunables/issues', external: true }
]

const license = 'https://github.com/itai-gendler/tunables/blob/main/LICENSE'

const creator = {
  name: 'Itai Gendler',
  links: [
    { icon: 'i-simple-icons-github', to: 'https://github.com/itai-gendler', network: 'GitHub' },
    { icon: 'i-simple-icons-linkedin', to: 'https://www.linkedin.com/in/itaig/', network: 'LinkedIn' }
  ]
}
</script>

<template>
  <!-- The content lives in `#top` so it spans the footer itself; UFooter's own
    container would render an empty flex row underneath. -->
  <UFooter
    data-site-footer
    :ui="{ root: 'border-t border-default', top: 'py-0! lg:py-0!', container: 'hidden!' }"
  >
    <template #top>
      <UContainer>
        <div class="flex flex-col items-start gap-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div class="flex items-center gap-3">
            <NuxtLink to="/" class="flex items-center rounded-md" aria-label="tunables home">
              <BrandLockup />
            </NuxtLink>
            <NuxtLink
              :to="license"
              external
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-muted underline underline-offset-2 transition-colors hover:text-highlighted"
            >
              MIT licensed
            </NuxtLink>
          </div>

          <nav aria-label="Footer">
            <ul class="flex flex-wrap items-center gap-x-6 gap-y-3">
              <li v-for="link in links" :key="link.label">
                <NuxtLink
                  :to="link.to"
                  :external="link.external"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                  class="text-sm text-muted transition-colors hover:text-highlighted"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <div class="flex items-center gap-1">
            <p class="text-sm text-muted">
              Made by
              <span class="text-default">{{ creator.name }}</span>
            </p>
            <UButton
              v-for="link in creator.links"
              :key="link.network"
              :icon="link.icon"
              :to="link.to"
              external
              target="_blank"
              rel="noopener noreferrer"
              color="neutral"
              variant="ghost"
              size="sm"
              class="ml-1"
              :aria-label="`${creator.name} on ${link.network}`"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UFooter>
</template>

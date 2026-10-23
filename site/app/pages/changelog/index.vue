<script setup lang="ts">
import type { ButtonProps, ContentTocLink } from '@nuxt/ui'
import ChangelogSectionHeading from '~/components/landing/ChangelogSectionHeading.vue'

useSiteSeo({
  title: 'Changelog · tunables',
  description: 'Every release of tunables: the library, its screens, its CLI and its agent skills.'
})

// `CHANGELOG.md` at the root of itai-gendler/tunables is the only authored copy.
// Each `##` release becomes one card, in file order, with its entries rendered
// as written. A missing file fails the prerender rather than shipping an empty
// page.
const { data: changelog } = await useAsyncData('changelog', () =>
  queryCollection('changelog').first())

const releases = computed(() => changelogReleases(changelog.value?.body?.value ?? []))

if (!releases.value.length) {
  throw createError({ statusCode: 500, statusMessage: 'CHANGELOG.md holds no release with entries', fatal: true })
}

const versions = computed<ContentTocLink[]>(() => releases.value.map(release => ({
  id: release.slug,
  depth: 2,
  text: release.title
})))

const ctaLinks: ButtonProps[] = [
  { label: 'Releases on GitHub', to: 'https://github.com/itai-gendler/tunables/releases', external: true, target: '_blank', icon: 'i-simple-icons-github', color: 'neutral', variant: 'outline', size: 'lg' },
  { label: 'Read the docs', to: '/docs', trailingIcon: 'i-lucide-arrow-right', size: 'lg' }
]
</script>

<template>
  <div>
    <UContainer class="pt-12 pb-4 sm:pt-16">
      <h1 class="site-enter text-4xl font-semibold tracking-[-0.04em] text-highlighted sm:text-5xl">
        Changelog
      </h1>
      <p class="site-enter mt-4 max-w-2xl text-base leading-7 text-muted" style="--site-enter-delay: 0.08s">
        What each release of tunables changed, newest first.
      </p>
    </UContainer>

    <UContainer class="pt-6 pb-8 sm:pb-10 lg:pb-12">
      <UPage :ui="{ root: 'lg:grid-cols-10', left: 'lg:col-span-2', center: 'lg:col-span-8' }">
        <template #left>
          <UContentToc
            :links="versions"
            highlight
            title="Versions"
            aria-label="Versions"
          />
        </template>

        <UChangelogVersions data-changelog-versions>
          <UChangelogVersion
            v-for="release in releases"
            :id="release.slug"
            :key="release.id"
            :title="release.title"
            :date="release.date"
            :ui="{
              root: 'scroll-mt-[calc(var(--ui-header-height)+2rem)]',
              title: 'text-xl sm:text-2xl tracking-tight'
            }"
          >
            <template v-if="release.to" #title>
              <ULink :to="release.to" target="_blank" class="text-highlighted hover:text-primary">
                {{ release.title }}
              </ULink>
            </template>

            <template #body>
              <ContentRenderer
                :value="{ ...changelog, body: { type: 'minimark', value: release.nodes } }"
                :components="{ h3: ChangelogSectionHeading }"
                class="mt-2 leading-relaxed text-muted *:first:mt-0 *:last:mb-0 [&_ul]:marker:text-primary"
              />
            </template>
          </UChangelogVersion>
        </UChangelogVersions>
      </UPage>
    </UContainer>

    <UPageCTA
      variant="naked"
      title="Follow the next release."
      description="Every release is tagged on GitHub. Watch the repository to hear about the next one, or open an issue to say what it should change."
      :links="ctaLinks"
      :ui="{
        container: 'max-w-3xl py-16 sm:py-20 lg:py-20',
        title: 'tracking-tight',
        description: 'max-w-xl leading-relaxed text-muted'
      }"
    />
  </div>
</template>

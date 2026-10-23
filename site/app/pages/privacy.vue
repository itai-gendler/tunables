<script setup lang="ts">
useSiteSeo({
  title: 'Privacy · tunables',
  description: 'What this site and the tunables CLI collect, and what your browser keeps.'
})
</script>

<template>
  <UContainer class="max-w-3xl py-12 sm:py-16">
    <h1 class="text-4xl font-semibold tracking-[-0.04em] text-highlighted">
      Privacy
    </h1>
    <p class="mt-4 text-sm text-muted">
      Last updated: October 23, 2026
    </p>

    <USeparator class="my-10" />

    <div class="legal space-y-10 text-base leading-relaxed text-default">
      <section>
        <h2>The short version</h2>
        <p>
          This site is a set of static pages: no accounts, no sign-in, no mailing list and no cookies. Cloudflare, which hosts it, keeps basic page-view statistics without cookies. Nothing is sold.
        </p>
      </section>

      <section>
        <h2>What is collected</h2>
        <ul>
          <li><strong>Hosting logs.</strong> Cloudflare serves these pages and keeps the request logs it needs to deliver them and to protect against abuse, under its own privacy policy.</li>
          <li><strong>GitHub.</strong> The star count in the header is fetched by your browser from GitHub's public API, under GitHub's privacy statement.</li>
        </ul>
      </section>

      <section>
        <h2>The library and the CLI</h2>
        <p>
          tunables runs inside your app, against your database, and sends nothing anywhere. The <code>tunables</code> CLI checks npm for a newer version at most once a day; set <code>TUNABLES_NO_UPDATE_CHECK=1</code> to turn that off. It never checks in CI.
        </p>
      </section>

      <section>
        <h2>What your browser keeps</h2>
        <p>
          Your color mode choice, if you pick one, and a copy of the docs search index, both in local storage. Neither identifies you, and clearing the site's data removes them.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Email <a href="mailto:itai.gendler@gmail.com">itai.gendler@gmail.com</a>. When this policy changes, the date at the top changes with it.
        </p>
      </section>
    </div>
  </UContainer>
</template>

<style scoped>
.legal :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  margin-bottom: 0.75rem;
}

.legal :deep(ul) {
  padding-left: 1.25rem;
  list-style: disc;
  display: grid;
  gap: 0.375rem;
}

.legal :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.875em;
}

/* Underlined at rest: inside a sentence, color alone does not mark a link. */
.legal :deep(a) {
  color: var(--ui-primary);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>

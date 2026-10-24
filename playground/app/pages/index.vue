<script setup lang="ts">
const who = useCookie<'staff' | 'owner' | 'member'>('playground-who', { default: () => 'staff' })
await navigateTo(who.value === 'owner' ? '/workspace' : who.value === 'member' ? '/me' : '/admin/limits', { replace: true })
</script>

<template>
  <div />
</template>

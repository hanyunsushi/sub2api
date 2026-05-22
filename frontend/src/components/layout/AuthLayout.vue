<template>
  <div class="auth-ascii-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <GuizangAsciiBackground class="auth-ascii-background" />

    <!-- Content Container -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <!-- Custom Logo or Default Logo -->
        <template v-if="settingsLoaded">
          <div
            class="auth-logo mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white/70 shadow-glow ring-1 ring-primary-200/70 dark:bg-dark-800/70 dark:ring-primary-800/50"
          >
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <h1 class="text-gradient mb-2 text-3xl font-bold">
            {{ siteName }}
          </h1>
          <p class="auth-subtitle text-sm">
            {{ siteSubtitle }}
          </p>
        </template>
      </div>

      <!-- Card Container -->
      <div class="paper-card rounded-lg p-8 shadow-card">
        <slot />
      </div>

      <!-- Footer Links -->
      <div class="auth-footer-link mt-6 text-center text-sm">
        <slot name="footer" />
      </div>

      <!-- Copyright -->
      <div class="auth-copyright mt-8 text-center text-xs">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'

const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.text-gradient {
  @apply bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent;
}

.auth-logo {
  border: 1px solid var(--atelier-ink);
  background: var(--atelier-paper-2);
  box-shadow: 0 10px 24px -18px rgba(0, 47, 167, 0.42);
}

.auth-subtitle,
.auth-footer-link,
.auth-copyright {
  color: var(--atelier-muted);
}

.auth-footer-link :deep(a) {
  color: var(--atelier-blue);
}

:global(.dark) .auth-logo {
  border-color: rgba(233, 225, 210, 0.18);
  background: #11100d;
}

:global(.dark) .auth-subtitle,
:global(.dark) .auth-footer-link,
:global(.dark) .auth-copyright {
  color: rgba(243, 239, 229, 0.72);
}
</style>

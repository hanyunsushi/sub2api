<template>
  <div class="auth-ascii-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <!-- Content Container -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <!-- Custom Logo or Default Logo -->
        <template v-if="settingsLoaded">
          <div
            class="auth-logo mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-transparent shadow-none ring-0 dark:bg-transparent"
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
      <div class="paper-card rounded-lg p-8 shadow-none">
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
  @apply bg-none bg-clip-text text-transparent;
}

.auth-logo {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.auth-subtitle,
.auth-footer-link,
.auth-copyright {
  color: var(--atelier-muted);
}

.auth-footer-link :deep(a) {
  color: var(--atelier-blue);
}

.auth-footer-link :deep(.auth-footer-copy) {
  color: var(--atelier-muted);
}

.auth-footer-link :deep(.auth-footer-link-strong) {
  color: var(--atelier-blue);
}

.auth-footer-link :deep(.auth-footer-link-strong:hover) {
  color: var(--atelier-blue-dark);
}

:global(.dark) .auth-logo {
  border-color: transparent;
  background: transparent;
}

:global(.dark) .auth-subtitle,
:global(.dark) .auth-footer-link,
:global(.dark) .auth-copyright {
  color: rgba(248, 251, 255, 0.72);
}

:global(.dark) .auth-footer-link :deep(.auth-footer-copy) {
  color: rgba(248, 251, 255, 0.72);
}

:global(.dark) .auth-footer-link :deep(.auth-footer-link-strong) {
  color: #f8fbff;
}
</style>

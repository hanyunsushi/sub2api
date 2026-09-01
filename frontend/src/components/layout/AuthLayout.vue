<template>
  <main class="auth-ascii-shell auth-split-shell">
    <section class="auth-aside" aria-hidden="true">
      <div class="auth-aside-inner">
        <span class="auth-kicker">{{ t('auth.layout.kicker') }}</span>
        <h1 class="auth-quote">
          {{ t('auth.layout.quoteLineOne') }}<br />{{ t('auth.layout.quoteLineTwo') }}
        </h1>
        <p>
          {{ siteSubtitle }}
        </p>
        <div class="auth-points">
          <div
            v-for="point in authPoints"
            :key="point.numeric"
            class="auth-point"
          >
            <span class="numeric">{{ point.numeric }}</span>
            <span>{{ point.text }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="auth-main">
      <div class="auth-main-inner">
        <router-link to="/home" class="auth-page-brand" :aria-label="t('auth.layout.backToHome')">
          <span class="auth-logo">
            <img :src="siteLogo || '/logo.png'" alt="" />
          </span>
          <span class="auth-page-brand-copy">
            <span class="auth-brand-title">{{ siteName }}</span>
            <span class="auth-brand-subtitle">{{ siteSubtitle }}</span>
          </span>
        </router-link>

        <div class="auth-card">
        <slot />
        </div>

        <div class="auth-footer-link">
          <slot name="footer" />
        </div>

        <div class="auth-copyright">
          {{ t('auth.layout.copyright', { year: currentYear, siteName }) }}
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()
const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || 'Kreepai')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() =>
  appStore.cachedPublicSettings?.site_subtitle || t('auth.layout.defaultSubtitle')
)
const currentYear = computed(() => new Date().getFullYear())
const authPoints = computed(() => [
  { numeric: '01', text: t('auth.layout.points.accounts') },
  { numeric: '02', text: t('auth.layout.points.usage') },
  { numeric: '03', text: t('auth.layout.points.console') }
])

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.auth-main-inner {
  --auth-flow-gap: 20px;
}

.auth-footer-link :deep(.auth-footer-copy),
.auth-copyright {
  color: var(--anthropic-muted, var(--atelier-muted));
  font-size: 13px;
  line-height: 20px;
}

.auth-footer-link,
.auth-copyright {
  margin-top: var(--auth-flow-gap);
}

.auth-footer-link:empty {
  display: none;
}

.auth-footer-link :deep(.auth-footer-link-strong) {
  color: var(--anthropic-fg, var(--atelier-ink));
  text-decoration-color: transparent;
}

.auth-footer-link :deep(.auth-footer-link-strong:hover) {
  color: var(--anthropic-fg, var(--atelier-ink));
  text-decoration-color: currentColor;
}
</style>

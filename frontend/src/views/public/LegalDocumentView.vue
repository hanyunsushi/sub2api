<template>
  <div class="legal-page min-h-screen">
    <header class="legal-header border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <RouterLink to="/home" class="flex min-w-0 items-center gap-3">
          <span class="legal-logo flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </span>
          <span class="truncate text-base font-semibold">
            {{ siteName }}
          </span>
        </RouterLink>
        <RouterLink
          to="/login"
          class="legal-login-button inline-flex flex-shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition"
        >
          {{ t('home.login') }}
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <div v-if="loading" class="flex min-h-[320px] items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--anthropic-fg)]"></div>
      </div>

      <section
        v-else-if="loadError"
        class="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
      >
        <h1 class="text-lg font-semibold">{{ t('legal.loadFailed') }}</h1>
        <p class="mt-2 text-sm">{{ t('legal.retryLater') }}</p>
      </section>

      <section
        v-else-if="!currentDocument"
        class="legal-panel rounded-lg border p-6"
      >
        <div class="flex items-start gap-3">
          <span class="legal-small-icon flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md">
            <Icon name="document" size="sm" />
          </span>
          <div>
            <h1 class="text-lg font-semibold">{{ t('legal.notFound') }}</h1>
            <p class="legal-muted mt-2 text-sm leading-6">
              {{ t('legal.notFoundDescription') }}
            </p>
          </div>
        </div>
      </section>

      <article v-else>
        <div class="legal-article-head mb-8 border-b pb-6">
          <div class="flex items-start gap-4">
            <span class="legal-small-icon flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
              <Icon :name="documentIcon" size="md" />
            </span>
            <div class="min-w-0">
              <p class="legal-kicker text-sm font-medium">{{ documentTypeLabel }}</p>
              <h1 class="mt-2 break-words text-2xl font-bold tracking-normal sm:text-3xl">
                {{ currentDocument.title }}
              </h1>
              <p v-if="updatedAt" class="legal-muted mt-3 text-sm">
                {{ t('legal.updatedAt', { date: updatedAt }) }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="hasContent"
          class="legal-document-content"
          v-html="renderedHtml"
        ></div>
        <div
          v-else
          class="legal-panel rounded-lg border border-dashed px-6 py-14 text-center text-sm"
        >
          {{ t('legal.empty') }}
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { getLocale } from '@/i18n'
import { sanitizeUrl } from '@/utils/url'
import { useAppStore } from '@/stores/app'
import type { LoginAgreementDocument } from '@/types'
import zhAdminCompliance from '../../../../docs/legal/admin-compliance.zh.md?raw'
import enAdminCompliance from '../../../../docs/legal/admin-compliance.en.md?raw'

type LegalDocumentIcon = 'document' | 'shield' | 'globe' | 'cog'

const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()
const settings = computed(() => appStore.cachedPublicSettings)
const loading = ref(!settings.value)
const loadError = ref(false)

marked.setOptions({
  breaks: true,
  gfm: true,
})

const documentId = computed(() => String(route.params.documentId || ''))
const isAdminComplianceDocument = computed(() => documentId.value === 'admin-compliance')
const documents = computed(() => settings.value?.login_agreement_documents ?? [])
const siteName = computed(() => settings.value?.site_name || 'Kreepai')
const siteLogo = computed(() => sanitizeUrl(settings.value?.site_logo || '', {
  allowRelative: true,
  allowDataUrl: true,
}))
const updatedAt = computed(() =>
  isAdminComplianceDocument.value ? '' : settings.value?.login_agreement_updated_at || ''
)
const documentTypeLabel = computed(() =>
  isAdminComplianceDocument.value ? t('legal.adminCompliance') : t('legal.loginAgreement')
)

const currentDocument = computed<LoginAgreementDocument | null>(() => {
  if (isAdminComplianceDocument.value) {
    return {
      id: 'admin-compliance',
      title: t('adminCompliance.title'),
      content_md: getLocale() === 'zh' ? zhAdminCompliance : enAdminCompliance
    }
  }
  const id = documentId.value
  if (!id) {
    return null
  }
  return documents.value.find((doc) => doc.id === id) ?? null
})

const hasContent = computed(() => Boolean(currentDocument.value?.content_md?.trim()))

const renderedHtml = computed(() => {
  const content = currentDocument.value?.content_md?.trim() || ''
  if (!content) {
    return ''
  }
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

const documentIcon = computed<LegalDocumentIcon>(() => {
  const title = currentDocument.value?.title || ''
  if (title.includes('政策') || title.includes('隐私')) {
    return 'shield'
  }
  if (title.includes('国家') || title.includes('地区')) {
    return 'globe'
  }
  if (title.includes('特定')) {
    return 'cog'
  }
  return 'document'
})

onMounted(async () => {
  loadError.value = false
  const loadedSettings = await appStore.fetchPublicSettings()
  if (!loadedSettings) {
    loadError.value = true
  }
  loading.value = false
})
</script>

<style scoped>
.legal-document-content {
  line-height: 1.75;
  overflow-wrap: anywhere;
  color: inherit;
}

.legal-page {
  color: var(--atelier-ink);
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--atelier-surface-muted) 56%, transparent), transparent 30rem),
    radial-gradient(circle at 78% 6%, color-mix(in srgb, var(--atelier-butter) 10%, transparent), transparent 24rem),
    var(--atelier-canvas);
}

.legal-header,
.legal-panel {
  border-color: var(--atelier-material-edge);
  background: var(--atelier-material-1);
}

.legal-header {
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.08);
}

.legal-logo,
.legal-small-icon {
  border: 1px solid var(--atelier-material-edge);
  background: var(--atelier-material-dust);
  color: var(--atelier-blue);
  box-shadow: 0 10px 24px -22px rgba(17, 24, 39, 0.36);
}

.legal-login-button {
  border: 1px solid var(--atelier-ink);
  background: var(--atelier-blue);
  color: var(--atelier-white);
  box-shadow: none;
}

.legal-login-button:hover {
  background: var(--atelier-blue-dark);
}

.legal-article-head {
  border-color: var(--atelier-material-edge);
}

.legal-kicker,
.legal-document-content :deep(a) {
  color: var(--atelier-blue);
}

.legal-muted {
  color: var(--atelier-muted);
}

.legal-document-content :deep(h1) {
  @apply mb-4 mt-8 border-b pb-3 text-3xl font-bold;
  border-color: var(--atelier-material-edge);
}

.legal-document-content :deep(h2) {
  @apply mb-3 mt-7 text-2xl font-bold;
}

.legal-document-content :deep(h3) {
  @apply mb-2 mt-6 text-xl font-semibold;
}

.legal-document-content :deep(h4) {
  @apply mb-2 mt-5 text-lg font-semibold;
}

.legal-document-content :deep(p) {
  @apply mb-4;
  color: var(--atelier-ink);
}

.legal-document-content :deep(a) {
  @apply underline underline-offset-4;
}

.legal-document-content :deep(ul) {
  @apply mb-4 list-disc pl-6;
}

.legal-document-content :deep(ol) {
  @apply mb-4 list-decimal pl-6;
}

.legal-document-content :deep(li) {
  @apply mb-1;
  color: var(--atelier-ink);
}

.legal-document-content :deep(blockquote) {
  @apply my-5 border-l-4 pl-4;
  border-color: var(--atelier-dust);
  color: var(--atelier-muted);
}

.legal-document-content :deep(code) {
  @apply rounded px-1.5 py-0.5 font-mono text-sm;
  background: var(--atelier-material-dust);
  color: var(--atelier-ink);
}

.legal-document-content :deep(pre) {
  @apply my-5 overflow-x-auto rounded-lg bg-gray-950 p-4 text-gray-100;
}

.legal-document-content :deep(pre code) {
  @apply bg-transparent p-0 text-inherit;
}

.legal-document-content :deep(table) {
  @apply my-5 block w-full overflow-x-auto border-collapse;
}

.legal-document-content :deep(th) {
  @apply border px-3 py-2 text-left font-semibold;
  border-color: var(--atelier-material-edge);
  background: var(--atelier-material-dust);
}

.legal-document-content :deep(td) {
  @apply border px-3 py-2;
  border-color: var(--atelier-material-edge);
}

.legal-document-content :deep(img) {
  @apply my-5 h-auto max-w-full rounded-lg;
}

.legal-document-content :deep(hr) {
  @apply my-7;
  border-color: var(--atelier-material-edge);
}

:global(.dark) .legal-page {
  color: #f8fbff;
  background:
    radial-gradient(circle at 18% 0%, rgba(250, 249, 245, 0.08), transparent 34%),
    linear-gradient(180deg, #050505, #0a0a0a);
}

:global(.dark) .legal-header,
:global(.dark) .legal-panel {
  border-color: rgba(248, 251, 255, 0.16);
  background: #111827;
}

:global(.dark) .legal-muted,
:global(.dark) .legal-document-content :deep(blockquote) {
  color: #94a3b8;
}

:global(.dark) .legal-document-content :deep(p),
:global(.dark) .legal-document-content :deep(li) {
  color: #f8fbff;
}
</style>

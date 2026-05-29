<template>
  <div
    class="ai-search-box"
    data-testid="ai-search-box"
    role="search"
    aria-label="Ask AI"
    title="Ask AI"
    @focusin="refreshSnippetConfig"
    @pointerdown="refreshSnippetConfig"
  >
    <search-bar-snippet
      v-if="snippetConfig.configured"
      class="ai-search-official-bar"
      data-testid="ai-search-official-bar"
      :api-url="snippetConfig.api_url"
      placeholder="Ask AI"
      theme="light"
      hide-branding="true"
      hide-thumbnails="true"
      show-url="true"
      show-date="true"
      max-results="10"
      max-render-results="5"
      debounce-ms="250"
      disable-analytics="false"
      :translations.prop="searchTranslations"
    />
    <div v-else class="ai-search-unavailable">
      Ask AI
    </div>
  </div>
</template>

<script setup lang="ts">
import '@cloudflare/ai-search-snippet'

import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Translations } from '@cloudflare/ai-search-snippet'
import aiSearchAPI, { type AISearchSnippetConfig } from '@/api/aiSearch'

const snippetConfig = ref<AISearchSnippetConfig>({
  configured: false,
  api_url: '',
  instance_id: '',
  namespace: '',
})

const searchTranslations: Translations = {
  placeholder: 'Ask AI',
  searchButtonLabel: 'Ask',
  searchInputAriaLabel: 'Ask AI',
  emptyStateTitle: 'Ask AI',
  emptyStateDescription: 'Enter a question to search the knowledge base',
  noResultsTitle: 'No results',
  noResultsDescription: 'No results found for "{query}"',
  loadingMessages: ['Searching knowledge base...', 'Finding matching docs...'],
}

let refreshPromise: Promise<void> | null = null
let lastRefreshAt = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function emptySnippetConfig() {
  return {
    configured: false,
    api_url: '',
    instance_id: '',
    namespace: '',
  }
}

async function getSnippetConfig() {
  try {
    const config = await aiSearchAPI.getSnippetConfig()
    snippetConfig.value = config
  } catch {
    snippetConfig.value = emptySnippetConfig()
  }
}

function refreshSnippetConfig() {
  const now = Date.now()
  if (refreshPromise || now - lastRefreshAt < 30_000) return
  lastRefreshAt = now
  refreshPromise = getSnippetConfig().finally(() => {
    refreshPromise = null
  })
}

onMounted(() => {
  refreshSnippetConfig()
  refreshTimer = setInterval(refreshSnippetConfig, 8 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div
    class="ai-search-box"
    :class="{ 'ai-search-has-query': submittedQuery }"
    data-testid="ai-search-box"
    role="search"
    aria-label="Ask AI"
    title="Ask AI"
    @focusin="refreshSnippetConfig"
    @pointerdown="refreshSnippetConfig"
  >
    <form
      v-if="snippetConfig.configured"
      class="ai-search-manual-form"
      @submit.prevent="handleManualAsk"
    >
      <span class="ai-search-manual-icon" aria-hidden="true"></span>
      <input
        v-model="manualSearchInput"
        type="search"
        class="ai-search-manual-input"
        placeholder="Ask AI"
        aria-label="Ask AI"
        autocomplete="off"
        @keydown.enter.prevent="handleManualAsk"
      />
      <button type="submit" class="ai-search-manual-submit">
        Ask
      </button>
    </form>
    <search-bar-snippet
      v-if="snippetConfig.configured"
      :key="submittedQuery"
      ref="searchBarRef"
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

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Translations } from '@cloudflare/ai-search-snippet'
import aiSearchAPI, { type AISearchSnippetConfig } from '@/api/aiSearch'

type SearchBarSnippetElement = HTMLElement & {
  inputElement?: HTMLInputElement | null
  searchButton?: HTMLButtonElement | null
  performSearch?: (query: string) => Promise<void>
  handleInputChange?: Parameters<HTMLElement['removeEventListener']>[1] | null
  handleInputKeydownEnter?: Parameters<HTMLElement['removeEventListener']>[1] | null
  handleSearchButtonClick?: Parameters<HTMLElement['removeEventListener']>[1] | null
}

const snippetConfig = ref<AISearchSnippetConfig>({
  configured: false,
  api_url: '',
  instance_id: '',
  namespace: '',
})
const manualSearchInput = ref('')
const submittedQuery = ref('')
const searchBarRef = ref<SearchBarSnippetElement | null>(null)

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
let stripFrame: number | null = null

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

function resolveOfficialInput(snippet: SearchBarSnippetElement | null) {
  return snippet?.inputElement
    || snippet?.shadowRoot?.querySelector<HTMLInputElement>('.search-input')
    || null
}

function resolveOfficialButton(snippet: SearchBarSnippetElement | null) {
  return snippet?.searchButton
    || snippet?.shadowRoot?.querySelector<HTMLButtonElement>('.search-submit-button')
    || null
}

function stripOfficialAutoSearchListeners() {
  stripFrame = null
  const snippet = searchBarRef.value
  const inputElement = resolveOfficialInput(snippet)
  const buttonElement = resolveOfficialButton(snippet)
  if (inputElement) {
    if (snippet?.handleInputChange) {
      inputElement.removeEventListener('input', snippet.handleInputChange)
    }
    if (snippet?.handleInputKeydownEnter) {
      inputElement.removeEventListener('keydown', snippet.handleInputKeydownEnter)
    }
  }
  if (buttonElement && snippet?.handleSearchButtonClick) {
    buttonElement.removeEventListener('click', snippet.handleSearchButtonClick)
    buttonElement.addEventListener('click', handleManualAsk)
  }
}

function scheduleStripOfficialAutoSearchListeners() {
  if (stripFrame !== null) {
    cancelAnimationFrame(stripFrame)
  }
  stripFrame = requestAnimationFrame(stripOfficialAutoSearchListeners)
}

async function handleManualAsk() {
  const query = manualSearchInput.value.trim()
  if (!query) return
  submittedQuery.value = query
  await nextTick()
  const snippet = searchBarRef.value
  const inputElement = resolveOfficialInput(snippet)
  if (inputElement) {
    inputElement.value = query
  }
  stripOfficialAutoSearchListeners()
  if (snippet?.performSearch) {
    await snippet.performSearch(query)
  } else {
    resolveOfficialButton(snippet)?.click()
  }
  manualSearchInput.value = ''
}

onMounted(() => {
  refreshSnippetConfig()
  refreshTimer = setInterval(refreshSnippetConfig, 8 * 60 * 1000)
  scheduleStripOfficialAutoSearchListeners()
})

onBeforeUnmount(() => {
  if (stripFrame !== null) {
    cancelAnimationFrame(stripFrame)
    stripFrame = null
  }
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

watch(
  () => [snippetConfig.value.configured, snippetConfig.value.api_url, submittedQuery.value],
  () => {
    nextTick(scheduleStripOfficialAutoSearchListeners)
  },
)
</script>

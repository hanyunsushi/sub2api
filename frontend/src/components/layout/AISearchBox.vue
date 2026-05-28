<template>
  <div
    ref="rootRef"
    class="ai-search-box relative"
    data-testid="ai-search-box"
  >
    <form
      class="ai-search-form hidden items-center gap-2 sm:flex"
      role="search"
      @submit.prevent="submitSearch"
    >
      <Icon name="search" size="sm" class="ai-search-icon" aria-hidden="true" />
      <input
        ref="desktopInputRef"
        v-model="query"
        class="ai-search-input"
        type="search"
        placeholder="ask ai"
        aria-label="ask ai"
        autocomplete="off"
        @focus="openPanel"
        @keydown.esc.prevent="closePanel"
      >
      <button
        v-if="query"
        class="ai-search-clear"
        type="button"
        aria-label="clear ask ai"
        title="clear ask ai"
        @click="clearSearch"
      >
        <Icon name="x" size="xs" />
      </button>
    </form>

    <button
      ref="mobileButtonRef"
      class="ai-search-mobile-trigger sm:hidden"
      type="button"
      aria-label="ask ai"
      title="ask ai"
      @click="toggleMobileSearch"
    >
      <Icon name="search" size="sm" />
    </button>

    <FloatingDropdown
      :show="panelOpen"
      :trigger-el="triggerEl"
      placement="bottom-end"
      :offset="8"
      panel-class="dropdown ai-search-panel"
    >
      <div class="ai-search-panel-content" data-testid="ai-search-panel">
        <form
          v-if="mobileMode"
          class="ai-search-mobile-form"
          role="search"
          @submit.prevent="submitSearch"
        >
          <Icon name="search" size="sm" class="ai-search-icon" aria-hidden="true" />
          <input
            ref="mobileInputRef"
            v-model="query"
            class="ai-search-input"
            type="search"
            placeholder="ask ai"
            aria-label="ask ai"
            autocomplete="off"
            @keydown.esc.prevent="closePanel"
          >
        </form>

        <div v-if="loading" class="ai-search-state">
          <span class="spinner h-4 w-4" aria-hidden="true"></span>
          <span>Searching</span>
        </div>

        <div v-else-if="errorMessage" class="ai-search-state ai-search-error">
          {{ errorMessage }}
        </div>

        <div v-else-if="hasSearched && !answer && results.length === 0" class="ai-search-state">
          No results
        </div>

        <div v-else-if="answer || results.length > 0" class="ai-search-results">
          <div v-if="answer" class="ai-search-answer">
            {{ answer }}
          </div>

          <div v-if="results.length > 0" class="ai-search-sources">
            <a
              v-for="result in results"
              :key="result.id"
              class="ai-search-result"
              :href="result.url || '#'"
              :aria-disabled="!result.url"
              @click="handleResultClick($event, result.url)"
            >
              <span class="ai-search-result-title">{{ result.title || 'AI Search' }}</span>
              <span class="ai-search-result-snippet">{{ result.snippet }}</span>
              <span class="ai-search-result-source">
                {{ result.source }}
                <Icon v-if="result.url" name="externalLink" size="xs" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>

        <div v-else class="ai-search-state">
          ask ai
        </div>
      </div>
    </FloatingDropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import aiSearchAPI, { type AISearchResult } from '@/api/aiSearch'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import Icon from '@/components/icons/Icon.vue'

const rootRef = ref<HTMLElement | null>(null)
const desktopInputRef = ref<HTMLInputElement | null>(null)
const mobileButtonRef = ref<HTMLElement | null>(null)
const mobileInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const answer = ref('')
const results = ref<AISearchResult[]>([])
const panelOpen = ref(false)
const mobileMode = ref(false)
const loading = ref(false)
const hasSearched = ref(false)
const errorMessage = ref('')
let searchRequestID = 0

const triggerEl = computed(() => {
  if (mobileMode.value) return mobileButtonRef.value
  return desktopInputRef.value
})

function openPanel() {
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
  mobileMode.value = false
}

function toggleMobileSearch() {
  mobileMode.value = true
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) {
    nextTick(() => mobileInputRef.value?.focus())
  }
}

function clearSearch() {
  query.value = ''
  answer.value = ''
  results.value = []
  hasSearched.value = false
  errorMessage.value = ''
  desktopInputRef.value?.focus()
}

async function submitSearch() {
  const trimmed = query.value.trim()
  if (!trimmed || loading.value) return

  const requestID = ++searchRequestID
  loading.value = true
  hasSearched.value = true
  errorMessage.value = ''
  panelOpen.value = true

  try {
    const response = await aiSearchAPI.search(trimmed)
    if (requestID !== searchRequestID) return
    answer.value = response.answer || ''
    results.value = response.results || []
    if (!response.configured) {
      errorMessage.value = 'AI Search unavailable'
    }
  } catch (error) {
    if (requestID !== searchRequestID) return
    const apiError = error as { reason?: string; message?: string }
    errorMessage.value = apiError.reason === 'AI_SEARCH_NOT_CONFIGURED'
      ? 'AI Search unavailable'
      : apiError.message || 'AI Search failed'
    answer.value = ''
    results.value = []
  } finally {
    if (requestID === searchRequestID) {
      loading.value = false
    }
  }
}

function handleResultClick(event: MouseEvent, url?: string) {
  if (!url) {
    event.preventDefault()
    return
  }
  closePanel()
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target || rootRef.value?.contains(target)) return
  const panel = document.querySelector('.ai-search-panel')
  if (panel?.contains(target)) return
  closePanel()
}

document.addEventListener('pointerdown', handleDocumentPointerDown)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <div class="ai-search-box" data-testid="ai-search-box">
    <button
      type="button"
      class="ai-search-trigger"
      data-testid="ai-search-trigger"
      role="search"
      aria-label="Ask AI"
      title="Ask AI"
      :aria-expanded="open"
      @click="openPanel"
    >
      <span class="ai-search-trigger-icon" aria-hidden="true"></span>
      <span class="ai-search-trigger-label">Ask AI</span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="ai-search-overlay"
        data-testid="ai-search-overlay"
        @pointerdown.self="closePanel"
      >
        <div
          ref="panelRef"
          class="ai-search-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Ask AI"
        >
          <header class="ai-search-panel-head">
            <span class="ai-search-panel-title">Ask AI</span>
            <button
              type="button"
              class="ai-search-panel-close"
              aria-label="Close"
              title="Close"
              @click="closePanel"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div class="ai-search-panel-body">
            <chat-page-snippet
              v-if="snippetConfig.configured"
              ref="chatRef"
              class="ai-search-chat"
              data-testid="ai-search-chat"
              :api-url="snippetConfig.api_url"
              placeholder="Ask AI"
              theme="light"
              hide-branding="true"
              :translations.prop="chatTranslations"
            />
            <div v-else class="ai-search-unavailable">
              Ask AI is not configured yet.
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import '@cloudflare/ai-search-snippet'

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Translations } from '@cloudflare/ai-search-snippet'
import aiSearchAPI, { type AISearchSnippetConfig } from '@/api/aiSearch'

const snippetConfig = ref<AISearchSnippetConfig>({
  configured: false,
  api_url: '',
  instance_id: '',
  namespace: '',
})
const open = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const chatRef = ref<HTMLElement | null>(null)

const chatTranslations: Translations = {
  chatPlaceholder: 'Ask AI',
  newChatButton: 'New chat',
  emptyStateTitle: 'Ask AI',
  emptyStateDescription: 'Ask a question about this platform and get an answer with sources.',
  loadingMessages: ['Thinking...', 'Searching knowledge base...'],
}

let refreshPromise: Promise<void> | null = null
let lastRefreshAt = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function emptySnippetConfig(): AISearchSnippetConfig {
  return {
    configured: false,
    api_url: '',
    instance_id: '',
    namespace: '',
  }
}

async function getSnippetConfig() {
  try {
    snippetConfig.value = await aiSearchAPI.getSnippetConfig()
  } catch {
    snippetConfig.value = emptySnippetConfig()
  }
}

function refreshSnippetConfig(force = false) {
  const now = Date.now()
  if (refreshPromise) return
  if (!force && now - lastRefreshAt < 30_000) return
  lastRefreshAt = now
  refreshPromise = getSnippetConfig().finally(() => {
    refreshPromise = null
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    closePanel()
  }
}

function openPanel() {
  open.value = true
  refreshSnippetConfig(true)
}

function closePanel() {
  open.value = false
}

onMounted(() => {
  refreshSnippetConfig(true)
  refreshTimer = setInterval(() => refreshSnippetConfig(), 8 * 60 * 1000)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  document.removeEventListener('keydown', handleKeydown)
})

watch(open, (value) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('ai-search-locked', value)
  }
  if (value) {
    nextTick(() => {
      panelRef.value?.focus?.()
    })
  }
})
</script>

<template>
  <div class="ai-search-box" data-testid="ai-search-box">
    <button
      type="button"
      class="ai-search-trigger"
      data-testid="ai-search-trigger"
      role="search"
      aria-label="Creepee"
      title="Creepee"
      :aria-expanded="open"
      aria-controls="creepee-ai-sidecar"
      @click="openPanel"
    >
      <img
        class="ai-search-trigger-avatar"
        :src="claudeCodeCrabAvatar"
        alt=""
        aria-hidden="true"
      >
      <span class="ai-search-trigger-label">Creepee</span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        id="creepee-ai-sidecar"
        class="ai-search-sidecar"
        data-testid="ai-search-sidecar"
      >
        <div
          ref="panelRef"
          class="ai-search-panel"
          data-testid="ai-search-panel"
          role="complementary"
          aria-label="Creepee 智能助手"
          tabindex="-1"
        >
          <header class="ai-search-panel-head">
            <div class="ai-search-panel-brand">
              <img
                class="ai-search-panel-avatar"
                :src="claudeCodeCrabAvatar"
                alt="Claude Code crab"
              >
              <div class="ai-search-panel-copy">
                <span class="ai-search-panel-title">Creepee</span>
                <span class="ai-search-panel-subtitle">智能助手</span>
              </div>
            </div>
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
              placeholder="问 Creepee"
              theme="light"
              hide-branding="true"
              :translations.prop="chatTranslations"
            />
            <div v-else class="ai-search-unavailable">
              Creepee is not configured yet.
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

const creepeeLabel = 'Creepee'
const claudeCodeCrabAvatar = '/brand/claudecode-color.png'
const creepeeSnippetBrandStyleID = 'creepee-ai-search-brand-style'
const creepeeSnippetLoadingColor = '#f6821f'
const creepeeLoadingMessages = [
  'Sautéing...',
  'Pondering...',
  'Ruminating...',
  'Mulling...',
  'Herding...',
  'Synthesizing...',
  'Distilling...',
  'Inferring...',
]

const chatTranslations: Translations = {
  chatTitle: creepeeLabel,
  chatPlaceholder: '问 Creepee',
  newChatButton: 'New chat',
  emptyStateTitle: creepeeLabel,
  emptyStateDescription: '向智能助手询问站点功能，并获得带来源的回答。',
  chatEmptyTitle: creepeeLabel,
  chatEmptyDescription: '询问渠道、模型、菜单、用量或管理后台设置。',
  assistantAvatar: creepeeLabel,
  loadingMessages: creepeeLoadingMessages,
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

// The embedded `chat-page-snippet` web component sends the message whenever
// Enter is pressed without Shift, but it does not guard against IME
// composition. While typing Chinese (or any IME) the Enter that should only
// confirm the candidate would otherwise submit the half-finished input as
// English. We intercept Enter during composition in the capture phase on the
// snippet host so the component's own keydown handler never runs, letting the
// IME commit the text normally.
function handleChatKeydownCapture(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (event.isComposing || event.keyCode === 229) {
    event.stopImmediatePropagation()
  }
}

function attachChatImeGuard() {
  const el = chatRef.value
  if (!el) return
  el.removeEventListener('keydown', handleChatKeydownCapture, true)
  el.addEventListener('keydown', handleChatKeydownCapture, true)
  installSnippetBrandStyles()
}

function detachChatImeGuard() {
  chatRef.value?.removeEventListener('keydown', handleChatKeydownCapture, true)
}

function snippetBrandStyles() {
  return `
.chat-message-assistant .chat-message-avatar {
  background: transparent url("${claudeCodeCrabAvatar}") center / 82% 82% no-repeat !important;
  border-color: rgba(246, 130, 31, 0.34) !important;
  box-shadow: inset 0 0 0 1px rgba(246, 130, 31, 0.18) !important;
  color: transparent !important;
  font-size: 0 !important;
}

.chat-streaming .loading-text,
.modal-loading .loading-text {
  color: ${creepeeSnippetLoadingColor} !important;
  font-weight: 750 !important;
}
`
}

function installSnippetBrandStyles(attempt = 0) {
  const root = chatRef.value?.shadowRoot
  if (!root) {
    if (attempt < 20 && typeof window !== 'undefined') {
      window.setTimeout(() => installSnippetBrandStyles(attempt + 1), 50)
    }
    return
  }
  if (root.querySelector(`style[data-creepee-brand-style="${creepeeSnippetBrandStyleID}"]`)) return

  const style = document.createElement('style')
  style.dataset.creepeeBrandStyle = creepeeSnippetBrandStyleID
  style.textContent = snippetBrandStyles()
  root.appendChild(style)
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
  detachChatImeGuard()
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('ai-search-panel-open')
})

watch(open, (value) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('ai-search-panel-open', value)
  }
  if (value) {
    nextTick(() => {
      panelRef.value?.focus?.()
      attachChatImeGuard()
      installSnippetBrandStyles()
    })
  } else {
    detachChatImeGuard()
  }
})

// The chat element only renders once the snippet config resolves, which can
// land after the panel is already open. Re-attach the IME guard when the chat
// element appears so Enter-during-composition is always intercepted.
watch(
  () => snippetConfig.value.configured,
  (configured) => {
    if (configured && open.value) {
      nextTick(() => {
        attachChatImeGuard()
        installSnippetBrandStyles()
      })
    }
  },
)
</script>

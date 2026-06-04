<template>
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
</template>

<script setup lang="ts">
import '@cloudflare/ai-search-snippet'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Translations } from '@cloudflare/ai-search-snippet'
import aiSearchAPI, { type AISearchSnippetConfig } from '@/api/aiSearch'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const open = computed(() => appStore.aiSearchPanelOpen)
const snippetConfig = ref<AISearchSnippetConfig>({
  configured: false,
  api_url: '',
  instance_id: '',
  namespace: '',
})
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
const creepeeWelcomeSuggestions = [
  '渠道监控为什么会失败？',
  '怎么配置自定义菜单？',
  'QLHazyCoder 支持哪些监控模型？',
  '如何排查模型映射不生效？',
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
let welcomeObserver: MutationObserver | null = null
let welcomeSessionPrepared = false

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

.chat-empty {
  min-height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 1.5rem !important;
}

.chat-empty-icon {
  display: none !important;
}

.creepee-welcome {
  width: min(100%, 29rem) !important;
  margin: 0 auto !important;
  color: var(--search-snippet-text-color) !important;
  text-align: center !important;
}

.creepee-welcome-orb {
  position: relative !important;
  width: 5.25rem !important;
  height: 5.25rem !important;
  margin: 0 auto 1.4rem !important;
  display: grid !important;
  place-items: center !important;
}

.creepee-welcome-logo {
  position: relative !important;
  z-index: 2 !important;
  width: 3.4rem !important;
  height: 3.4rem !important;
  object-fit: contain !important;
  animation: creepee-logo-float 4s ease-in-out infinite !important;
}

.creepee-welcome-pixel {
  position: absolute !important;
  display: block !important;
  width: 0.42rem !important;
  height: 0.42rem !important;
  border-radius: 0.125rem !important;
  background: ${creepeeSnippetLoadingColor} !important;
  opacity: 0.78 !important;
  animation: creepee-pixel-drift 3.6s ease-in-out infinite !important;
}

.creepee-welcome-pixel:nth-child(1) {
  top: 0.65rem !important;
  left: 1.15rem !important;
}

.creepee-welcome-pixel:nth-child(2) {
  right: 0.85rem !important;
  top: 1.55rem !important;
  width: 0.34rem !important;
  height: 0.34rem !important;
  animation-delay: -1.15s !important;
}

.creepee-welcome-pixel:nth-child(3) {
  right: 1.35rem !important;
  bottom: 0.7rem !important;
  animation-delay: -2.05s !important;
}

.creepee-welcome-pixel:nth-child(4) {
  left: 0.95rem !important;
  bottom: 1.55rem !important;
  width: 0.3rem !important;
  height: 0.3rem !important;
  background: rgba(0, 47, 167, 0.86) !important;
  animation-delay: -0.55s !important;
}

.creepee-welcome-greeting {
  color: var(--search-snippet-text-secondary) !important;
  font-family: var(--search-snippet-font-family-mono) !important;
  font-size: 0.76rem !important;
  font-weight: 760 !important;
  line-height: 1.25 !important;
}

.creepee-welcome-headline {
  margin-top: 0.35rem !important;
  color: var(--search-snippet-text-color) !important;
  font-size: 1.35rem !important;
  font-weight: 780 !important;
  line-height: 1.16 !important;
}

.creepee-welcome-suggestions {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 0.5rem !important;
  margin-top: 1.35rem !important;
}

.creepee-welcome-suggestion {
  width: 100% !important;
  min-height: 2.45rem !important;
  border: var(--search-snippet-border-width) solid var(--search-snippet-border-color) !important;
  border-radius: 0.45rem !important;
  background: var(--search-snippet-surface) !important;
  color: var(--search-snippet-text-color) !important;
  padding: 0.55rem 0.75rem !important;
  font-family: var(--search-snippet-font-family) !important;
  font-size: 0.82rem !important;
  font-weight: 680 !important;
  line-height: 1.25 !important;
  text-align: left !important;
  cursor: pointer !important;
  transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease !important;
}

.creepee-welcome-suggestion:hover {
  background: var(--search-snippet-hover-background) !important;
  border-color: rgba(246, 130, 31, 0.34) !important;
}

.creepee-welcome-suggestion:active {
  transform: translateY(1px) !important;
}

@keyframes creepee-logo-float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -0.24rem, 0); }
}

@keyframes creepee-pixel-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.62; }
  50% { transform: translate3d(0.22rem, -0.2rem, 0) scale(1.18); opacity: 0.92; }
}

.chat-page-container {
  position: relative !important;
  overflow: hidden !important;
}

.chat-sidebar {
  position: absolute !important;
  z-index: 3 !important;
  top: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  box-shadow: 20px 0 38px -30px rgba(17, 24, 39, 0.72) !important;
}

.chat-sidebar.collapsed {
  box-shadow: none !important;
}

.chat-main {
  width: 100% !important;
  min-width: 0 !important;
}

.chat-page-content,
.chat-page-content .container {
  min-width: 0 !important;
}
`
}

function collapseSnippetHistorySidebar(root: ShadowRoot): boolean {
  const sidebar = root.querySelector('.chat-sidebar')
  const toggleButton = root.querySelector<HTMLButtonElement>('.toggle-sidebar-button')
  if (!sidebar || !toggleButton) return false
  if (sidebar.classList.contains('collapsed')) return true
  toggleButton.click()
  return true
}

function isSnippetHistorySidebarExpanded(root: ShadowRoot): boolean {
  const sidebar = root.querySelector('.chat-sidebar')
  return Boolean(sidebar && !sidebar.classList.contains('collapsed'))
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return
  const root = chatRef.value?.shadowRoot
  if (!root || !isSnippetHistorySidebarExpanded(root)) return

  const sidebar = root.querySelector('.chat-sidebar')
  const toggleButton = root.querySelector('.toggle-sidebar-button')
  const path = event.composedPath()
  if ((sidebar && path.includes(sidebar)) || (toggleButton && path.includes(toggleButton))) {
    return
  }

  collapseSnippetHistorySidebar(root)
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

function escapeSnippetHTML(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function handleWelcomeSuggestionClick(event: Event) {
  const button = event.currentTarget as HTMLButtonElement
  const question = button.dataset.question || button.textContent?.trim() || ''
  if (!question) return

  const root = chatRef.value?.shadowRoot
  if (!root) return
  const input = root.querySelector<HTMLTextAreaElement>('.chat-input')
  const sendButton = root.querySelector<HTMLButtonElement>('.chat-send-button')
  if (!input || !sendButton) return

  input.value = question
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  sendButton.click()
}

function renderCreepeeWelcomeState(root: ShadowRoot): boolean {
  const emptyState = root.querySelector<HTMLElement>('.chat-empty')
  if (!emptyState) return false
  if (emptyState.dataset.creepeeWelcome === 'true') return true

  const suggestionButtons = creepeeWelcomeSuggestions
    .map((question) => {
      const safeQuestion = escapeSnippetHTML(question)
      return `<button type="button" class="creepee-welcome-suggestion" data-question="${safeQuestion}">${safeQuestion}</button>`
    })
    .join('')

  emptyState.dataset.creepeeWelcome = 'true'
  emptyState.innerHTML = `
    <div class="creepee-welcome">
      <div class="creepee-welcome-orb" aria-hidden="true">
        <span class="creepee-welcome-pixel"></span>
        <span class="creepee-welcome-pixel"></span>
        <span class="creepee-welcome-pixel"></span>
        <span class="creepee-welcome-pixel"></span>
        <img class="creepee-welcome-logo" src="${claudeCodeCrabAvatar}" alt="">
      </div>
      <div class="creepee-welcome-greeting">${getTimeGreeting()}</div>
      <div class="creepee-welcome-headline">What are we doing today?</div>
      <div class="creepee-welcome-suggestions">
        ${suggestionButtons}
      </div>
    </div>
  `
  emptyState.querySelectorAll('.creepee-welcome-suggestion').forEach((button) => {
    button.addEventListener('click', handleWelcomeSuggestionClick)
  })
  return true
}

function ensureDefaultWelcomeSession(root: ShadowRoot): boolean {
  if (root.querySelector('.chat-empty')) return true
  const newChatButton = root.querySelector<HTMLButtonElement>('.new-chat-button')
  if (!newChatButton) return false
  newChatButton.click()
  return Boolean(root.querySelector('.chat-empty'))
}

function customizeSnippetWelcomeState(root: ShadowRoot, prepareEmptySession = false): boolean {
  if (prepareEmptySession && !ensureDefaultWelcomeSession(root)) return false
  return renderCreepeeWelcomeState(root)
}

function attachSnippetWelcomeObserver(root: ShadowRoot) {
  if (welcomeObserver) return
  welcomeObserver = new MutationObserver(() => {
    renderCreepeeWelcomeState(root)
  })
  welcomeObserver.observe(root, { childList: true, subtree: true })
}

function detachSnippetWelcomeObserver() {
  welcomeObserver?.disconnect()
  welcomeObserver = null
}

function installSnippetBrandStyles(attempt = 0) {
  const root = chatRef.value?.shadowRoot
  if (!root) {
    if (attempt < 20 && typeof window !== 'undefined') {
      window.setTimeout(() => installSnippetBrandStyles(attempt + 1), 50)
    }
    return
  }

  if (!root.querySelector(`style[data-creepee-brand-style="${creepeeSnippetBrandStyleID}"]`)) {
    const style = document.createElement('style')
    style.dataset.creepeeBrandStyle = creepeeSnippetBrandStyleID
    style.textContent = snippetBrandStyles()
    root.appendChild(style)
  }

  if (!collapseSnippetHistorySidebar(root) && attempt < 20 && typeof window !== 'undefined') {
    window.setTimeout(() => installSnippetBrandStyles(attempt + 1), 50)
  }

  const welcomeReady = welcomeSessionPrepared
    ? renderCreepeeWelcomeState(root)
    : customizeSnippetWelcomeState(root, true)
  if (welcomeReady) {
    welcomeSessionPrepared = true
  } else if (attempt < 20 && typeof window !== 'undefined') {
    window.setTimeout(() => installSnippetBrandStyles(attempt + 1), 50)
  }
  attachSnippetWelcomeObserver(root)
}

function closePanel() {
  appStore.closeAISearchPanel()
}

onMounted(() => {
  refreshSnippetConfig(true)
  refreshTimer = setInterval(() => refreshSnippetConfig(), 8 * 60 * 1000)
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  detachChatImeGuard()
  detachSnippetWelcomeObserver()
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  document.body.classList.remove('ai-search-panel-open')
})

watch(open, (value) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('ai-search-panel-open', value)
  }
  if (value) {
    welcomeSessionPrepared = false
    refreshSnippetConfig(true)
    nextTick(() => {
      panelRef.value?.focus?.()
      attachChatImeGuard()
      installSnippetBrandStyles()
    })
  } else {
    detachChatImeGuard()
    detachSnippetWelcomeObserver()
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

<template>
  <Teleport to="body">
    <div
      id="creepee-ai-sidecar"
      class="ai-search-sidecar"
      :class="{ 'ai-search-sidecar-open': open }"
      :data-open="open ? 'true' : 'false'"
      :aria-hidden="!open"
      data-testid="ai-search-sidecar"
    >
      <div
        ref="panelRef"
        class="ai-search-panel"
        data-testid="ai-search-panel"
        role="complementary"
        aria-label="Creepee Obsidian Codex Bridge"
        tabindex="-1"
      >
        <button data-testid="layout-ai-search-panel-button-close-panel"
          type="button"
          class="ai-search-panel-close"
          aria-label="Close"
          title="Close"
          @click="closePanel"
        >
          <span aria-hidden="true">x</span>
        </button>
        <div class="ai-search-panel-body">
          <iframe
            ref="bridgeFrameRef"
            class="ai-search-bridge-frame"
            data-testid="obsidian-bridge-frame"
            :src="bridgeUrl"
            title="Creepee Obsidian Codex Bridge"
            allow="clipboard-read; clipboard-write"
            @load="handleBridgeFrameLoad"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { authAPI } from '@/api/auth'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const open = computed(() => appStore.aiSearchPanelOpen)
const panelRef = ref<HTMLElement | null>(null)
const bridgeFrameRef = ref<HTMLIFrameElement | null>(null)
const bridgeFrameReady = ref(false)
const ticketIssuedForOpen = ref(false)
const ssoCompleteForOpen = ref(false)
let creepeeSSOAttemptCount = 0
let creepeeSSORetryTimer: number | null = null

const defaultBridgeUrl = 'http://127.0.0.1:43110/'
const bridgeUrl = (import.meta.env.VITE_OBSIDIAN_CODEX_BRIDGE_URL || defaultBridgeUrl).trim() || defaultBridgeUrl
const bridgeOrigin = new URL(bridgeUrl, window.location.href).origin
const maxCreepeeSSOAttempts = 3
const creepeeSSORetryDelayMs = 1200

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    closePanel()
  }
}

function closePanel() {
  appStore.closeAISearchPanel()
}

function clearCreepeeSSORetry() {
  if (creepeeSSORetryTimer === null) return
  window.clearTimeout(creepeeSSORetryTimer)
  creepeeSSORetryTimer = null
}

function resetCreepeeSSOForOpen() {
  clearCreepeeSSORetry()
  creepeeSSOAttemptCount = 0
  ticketIssuedForOpen.value = false
  ssoCompleteForOpen.value = false
}

function scheduleCreepeeSSORetry() {
  clearCreepeeSSORetry()
  if (!open.value || ssoCompleteForOpen.value || creepeeSSOAttemptCount >= maxCreepeeSSOAttempts) {
    return
  }
  creepeeSSORetryTimer = window.setTimeout(() => {
    creepeeSSORetryTimer = null
    ticketIssuedForOpen.value = false
    void sendCreepeeSSOTicket()
  }, creepeeSSORetryDelayMs)
}

async function sendCreepeeSSOTicket() {
  if (
    !open.value ||
    !bridgeFrameReady.value ||
    ticketIssuedForOpen.value ||
    ssoCompleteForOpen.value ||
    !bridgeFrameRef.value?.contentWindow
  ) {
    return
  }

  ticketIssuedForOpen.value = true
  creepeeSSOAttemptCount += 1
  try {
    const { ticket } = await authAPI.issueCreepeeSSOTicket()
    if (!open.value || ssoCompleteForOpen.value || !bridgeFrameRef.value?.contentWindow) {
      return
    }
    bridgeFrameRef.value?.contentWindow?.postMessage({
      type: 'sub2api:creepee-sso',
      ticket,
    }, bridgeOrigin)
    scheduleCreepeeSSORetry()
  } catch (error) {
    ticketIssuedForOpen.value = false
    scheduleCreepeeSSORetry()
    console.warn('Failed to issue Creepee SSO ticket', error)
  }
}

function handleBridgeFrameLoad() {
  bridgeFrameReady.value = true
  resetCreepeeSSOForOpen()
  void sendCreepeeSSOTicket()
}

function handleBridgeMessage(event: MessageEvent) {
  if (event.origin !== bridgeOrigin) return
  const data = event.data || {}
  if (data.type === 'obsidian-bridge:ready') {
    bridgeFrameReady.value = true
    ticketIssuedForOpen.value = false
    void sendCreepeeSSOTicket()
    return
  }
  if (data.type === 'obsidian-bridge:sso-complete') {
    ssoCompleteForOpen.value = true
    ticketIssuedForOpen.value = false
    clearCreepeeSSORetry()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('message', handleBridgeMessage)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('message', handleBridgeMessage)
  clearCreepeeSSORetry()
  document.body.classList.remove('ai-search-panel-open')
})

watch(open, (value) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('ai-search-panel-open', value)
  }
  if (value) {
    resetCreepeeSSOForOpen()
    nextTick(() => {
      panelRef.value?.focus?.()
      void sendCreepeeSSOTicket()
    })
  } else {
    resetCreepeeSSOForOpen()
  }
})
</script>

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
        <header class="ai-search-panel-head">
          <div class="ai-search-panel-brand">
            <img
              class="ai-search-panel-avatar"
              :src="claudeCodeCrabAvatar"
              alt="Claude Code crab"
            >
            <div class="ai-search-panel-copy">
              <span class="ai-search-panel-title">Creepee</span>
              <span class="ai-search-panel-subtitle">Obsidian Codex Bridge</span>
            </div>
          </div>
          <button data-testid="layout-ai-search-panel-button-close-panel"
            type="button"
            class="ai-search-panel-close"
            aria-label="Close"
            title="Close"
            @click="closePanel"
          >
            <span aria-hidden="true">x</span>
          </button>
        </header>
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

const claudeCodeCrabAvatar = '/brand/claudecode-color.png'
const defaultBridgeUrl = 'http://127.0.0.1:43110/'
const bridgeUrl = (import.meta.env.VITE_OBSIDIAN_CODEX_BRIDGE_URL || defaultBridgeUrl).trim() || defaultBridgeUrl
const bridgeOrigin = new URL(bridgeUrl, window.location.href).origin

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    closePanel()
  }
}

function closePanel() {
  appStore.closeAISearchPanel()
}

async function sendCreepeeSSOTicket() {
  if (!open.value || !bridgeFrameReady.value || ticketIssuedForOpen.value || !bridgeFrameRef.value?.contentWindow) {
    return
  }

  ticketIssuedForOpen.value = true
  try {
    const { ticket } = await authAPI.issueCreepeeSSOTicket()
    bridgeFrameRef.value?.contentWindow?.postMessage({
      type: 'sub2api:creepee-sso',
      ticket,
    }, bridgeOrigin)
  } catch (error) {
    ticketIssuedForOpen.value = false
    console.warn('Failed to issue Creepee SSO ticket', error)
  }
}

function handleBridgeFrameLoad() {
  bridgeFrameReady.value = true
  ticketIssuedForOpen.value = false
  void sendCreepeeSSOTicket()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
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
      void sendCreepeeSSOTicket()
    })
  } else {
    ticketIssuedForOpen.value = false
  }
})
</script>

<template>
  <div class="ai-search-box" data-testid="ai-search-box">
    <button
      type="button"
      class="ai-search-trigger"
      data-testid="ai-search-trigger"
      role="search"
      aria-label="Ask Creepee"
      title="Ask Creepee"
      :aria-expanded="appStore.aiSearchPanelOpen"
      aria-controls="creepee-ai-sidecar"
      @click="openPanel"
    >
      <CreepeeAvatar
        class="ai-search-trigger-avatar"
        action="idle"
      />
      <span class="ai-search-trigger-label">Ask Creepee</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import CreepeeAvatar from '@/components/layout/CreepeeAvatar.vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

function openPanel() {
  appStore.openAISearchPanel()
}
</script>

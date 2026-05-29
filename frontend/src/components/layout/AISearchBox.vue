<template>
  <div
    class="ai-search-box relative"
    data-testid="ai-search-box"
  >
    <form
      class="ai-search-form hidden items-center gap-2 sm:flex"
      role="search"
      @submit.prevent="openDialog"
    >
      <Icon name="search" size="sm" class="ai-search-icon" aria-hidden="true" />
      <input
        ref="desktopInputRef"
        v-model="query"
        class="ai-search-input"
        type="search"
        placeholder="Ask AI"
        aria-label="Ask AI"
        autocomplete="off"
        @focus="openDialog"
        @click="openDialog"
        @keydown.enter.prevent="openDialog"
        @keydown.esc.prevent="closeDialog"
      >
      <button
        v-if="query"
        class="ai-search-clear"
        type="button"
        aria-label="clear Ask AI"
        title="clear Ask AI"
        @click="clearSearch"
      >
        <Icon name="x" size="xs" />
      </button>
    </form>

    <button
      class="ai-search-mobile-trigger sm:hidden"
      type="button"
      aria-label="Ask AI"
      title="Ask AI"
      @click="openDialog"
    >
      <Icon name="search" size="sm" />
    </button>

    <Teleport to="body">
      <div
        v-if="dialogOpen"
        class="ai-search-dialog-backdrop"
        tabindex="-1"
        @click.self="closeDialog"
        @keydown.esc.prevent="closeDialog"
      >
        <section
          class="ai-search-dialog ai-search-dialog-official"
          data-testid="ai-search-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-search-dialog-title"
          @keydown.esc.prevent="closeDialog"
        >
          <header class="ai-search-dialog-header">
            <div class="ai-search-dialog-heading">
              <Icon name="search" size="sm" class="ai-search-icon" aria-hidden="true" />
              <h2 id="ai-search-dialog-title" class="ai-search-dialog-title">Ask AI</h2>
            </div>
            <button
              class="ai-search-dialog-close"
              type="button"
              aria-label="close Ask AI"
              title="close Ask AI"
              @click="closeDialog"
            >
              <Icon name="x" size="sm" />
            </button>
          </header>

          <div class="ai-search-dialog-content ai-search-dialog-content-official">
            <chat-page-snippet
              v-if="snippetConfig.configured"
              ref="chatPageRef"
              class="ai-search-official-snippet"
              data-testid="ai-search-official-snippet"
              :api-url="snippetConfig.api_url"
              placeholder="Ask AI"
              theme="auto"
              hide-branding="true"
              chat-query-rewrite='{"enabled":true}'
            />
            <div v-else class="ai-search-state ai-search-error">
              AI Search unavailable
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import '@cloudflare/ai-search-snippet'

import { nextTick, onMounted, ref } from 'vue'
import aiSearchAPI, { type AISearchSnippetConfig } from '@/api/aiSearch'
import Icon from '@/components/icons/Icon.vue'

type ChatPageSnippetElement = HTMLElement & {
  sendMessage?: (content: string) => Promise<void>
  clearChat?: () => void
}

const desktopInputRef = ref<HTMLInputElement | null>(null)
const chatPageRef = ref<ChatPageSnippetElement | null>(null)
const query = ref('')
const dialogOpen = ref(false)
const snippetConfig = ref<AISearchSnippetConfig>({
  configured: false,
  api_url: '',
  instance_id: '',
  namespace: '',
})

async function openDialog() {
  dialogOpen.value = true
  const submittedQuery = query.value.trim()
  query.value = ''
  await getSnippetConfig()
  nextTick(() => {
    if (submittedQuery) {
      void chatPageRef.value?.sendMessage?.(submittedQuery)
    }
  })
}

function closeDialog() {
  dialogOpen.value = false
}

function clearSearch() {
  query.value = ''
  nextTick(() => desktopInputRef.value?.focus())
}

async function getSnippetConfig() {
  try {
    const config = await aiSearchAPI.getSnippetConfig()
    snippetConfig.value = config
  } catch {
    snippetConfig.value = {
      configured: false,
      api_url: '',
      instance_id: '',
      namespace: '',
    }
  }
}

onMounted(getSnippetConfig)
</script>

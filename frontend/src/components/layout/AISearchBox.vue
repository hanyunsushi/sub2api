<template>
  <div
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
        placeholder="Ask AI"
        aria-label="Ask AI"
        autocomplete="off"
        @focus="openDialog"
        @click="openDialog"
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
          class="ai-search-dialog"
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

          <div class="ai-search-dialog-content">
            <form
              class="ai-search-mobile-form ai-search-dialog-form"
              role="search"
              @submit.prevent="submitSearch"
            >
              <Icon name="search" size="sm" class="ai-search-icon" aria-hidden="true" />
              <input
                ref="dialogInputRef"
                v-model="query"
                class="ai-search-input"
                type="search"
                placeholder="Ask AI"
                aria-label="Ask AI"
                autocomplete="off"
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

            <div
              v-if="recentChats.length > 0"
              class="ai-search-history"
              data-testid="ai-search-history"
            >
              <div class="ai-search-history-title">Recent chats</div>
              <div class="ai-search-history-list">
                <button
                  v-for="chat in recentChats"
                  :key="chat.id"
                  class="ai-search-history-item"
                  type="button"
                  @click="restoreChat(chat)"
                >
                  <span class="ai-search-history-question">{{ chat.question }}</span>
                  <span class="ai-search-history-answer">
                    {{ chat.answer || summarizeResults(chat.results) || 'No answer yet' }}
                  </span>
                </button>
              </div>
            </div>

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
              Ask AI
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import aiSearchAPI, { type AISearchResult } from '@/api/aiSearch'
import Icon from '@/components/icons/Icon.vue'

interface AISearchChat {
  id: string
  question: string
  answer: string
  results: AISearchResult[]
  createdAt: string
}

const AI_SEARCH_HISTORY_KEY = 'sub2api.aiSearch.recentChats'
const MAX_AI_SEARCH_HISTORY = 6

const desktopInputRef = ref<HTMLInputElement | null>(null)
const dialogInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const answer = ref('')
const results = ref<AISearchResult[]>([])
const dialogOpen = ref(false)
const loading = ref(false)
const hasSearched = ref(false)
const errorMessage = ref('')
const recentChats = ref<AISearchChat[]>([])
let searchRequestID = 0

function openDialog() {
  dialogOpen.value = true
  nextTick(() => dialogInputRef.value?.focus())
}

function closeDialog() {
  dialogOpen.value = false
}

function clearSearch() {
  query.value = String()
  answer.value = ''
  results.value = []
  hasSearched.value = false
  errorMessage.value = ''
  nextTick(() => {
    if (dialogOpen.value) {
      dialogInputRef.value?.focus()
    } else {
      desktopInputRef.value?.focus()
    }
  })
}

async function submitSearch() {
  const trimmed = query.value.trim()
  if (!trimmed || loading.value) return

  const requestID = ++searchRequestID
  query.value = ''
  loading.value = true
  hasSearched.value = true
  errorMessage.value = ''
  dialogOpen.value = true

  try {
    const response = await aiSearchAPI.search(trimmed)
    if (requestID !== searchRequestID) return
    answer.value = response.answer || ''
    results.value = response.results || []
    if (response.configured !== false) {
      pushRecentChat(trimmed, answer.value, results.value)
    }
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

function loadRecentChats() {
  try {
    const raw = localStorage.getItem(AI_SEARCH_HISTORY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    recentChats.value = parsed
      .map(normalizeRecentChat)
      .filter((chat): chat is AISearchChat => Boolean(chat))
      .slice(0, MAX_AI_SEARCH_HISTORY)
  } catch {
    recentChats.value = []
  }
}

function persistRecentChats() {
  try {
    localStorage.setItem(AI_SEARCH_HISTORY_KEY, JSON.stringify(recentChats.value))
  } catch {
    // Storage can fail in private windows; search remains usable without history.
  }
}

function normalizeRecentChat(value: unknown): AISearchChat | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<AISearchChat>
  if (typeof candidate.question !== 'string' || !candidate.question.trim()) return null
  return {
    id: typeof candidate.id === 'string' ? candidate.id : `${Date.now()}-${candidate.question}`,
    question: candidate.question,
    answer: typeof candidate.answer === 'string' ? candidate.answer : '',
    results: Array.isArray(candidate.results) ? candidate.results : [],
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
  }
}

function pushRecentChat(question: string, chatAnswer: string, chatResults: AISearchResult[]) {
  const nextChat: AISearchChat = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question,
    answer: chatAnswer,
    results: chatResults.slice(0, 5),
    createdAt: new Date().toISOString(),
  }
  recentChats.value = [
    nextChat,
    ...recentChats.value.filter((chat) => chat.question !== question),
  ].slice(0, MAX_AI_SEARCH_HISTORY)
  persistRecentChats()
}

function restoreChat(chat: AISearchChat) {
  answer.value = chat.answer
  results.value = chat.results
  query.value = ''
  hasSearched.value = true
  errorMessage.value = ''
  dialogOpen.value = true
}

function summarizeResults(chatResults: AISearchResult[]) {
  return chatResults[0]?.snippet || chatResults[0]?.title || ''
}

function handleResultClick(event: MouseEvent, url?: string) {
  if (!url) {
    event.preventDefault()
    return
  }
  closeDialog()
}

onMounted(loadRecentChats)
</script>

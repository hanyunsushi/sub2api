<template>
  <div>
    <!-- Multi-select Dropdown -->
    <div class="relative mb-3">
      <div data-testid="account-model-whitelist-selector-div-toggle-dropdown"
        ref="triggerRef"
        @click="toggleDropdown"
        class="cursor-pointer rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] px-3 py-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]"
      >
        <div class="grid grid-cols-2 gap-1.5">
          <span
            v-for="model in modelValue"
            :key="model"
            class="inline-flex items-center justify-between gap-1 rounded bg-[var(--anthropic-raised)] px-2 py-1 text-xs text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]"
          >
            <span class="flex items-center gap-1 truncate">
              <ModelIcon :model="model" size="14px" />
              <span class="truncate">{{ model }}</span>
            </span>
            <button data-testid="account-model-whitelist-selector-button-remove-model-model"
              type="button"
              @click.stop="removeModel(model)"
              class="shrink-0 rounded-full hover:bg-[var(--anthropic-raised)] dark:hover:bg-dark-500"
            >
              <Icon name="x" size="xs" class="h-3.5 w-3.5" :stroke-width="2" />
            </button>
          </span>
        </div>
        <div class="mt-2 flex items-center justify-between border-t border-[var(--anthropic-border)] pt-2 dark:border-[var(--anthropic-border)]">
          <span class="text-xs text-[var(--anthropic-muted)]">{{ t('admin.accounts.modelCount', { count: modelValue.length }) }}</span>
          <svg class="h-5 w-5 text-[var(--anthropic-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <!-- Dropdown List -->
      <FloatingDropdown
        :show="showDropdown"
        :trigger-el="triggerRef"
        :match-width="true"
        panel-class="overflow-hidden rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] shadow-none dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]"
      >
        <div class="sticky top-0 border-b border-[var(--anthropic-border)] bg-[var(--anthropic-page)] p-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]">
          <input data-testid="account-model-whitelist-selector-input-search-query"
            v-model="searchQuery"
            type="text"
            class="input w-full text-sm"
            :placeholder="t('admin.accounts.searchModels')"
            @click.stop
          />
        </div>
        <div class="max-h-52 overflow-auto">
          <div
            v-for="model in filteredModels"
            :key="model.value"
            data-testid="model-option"
            class="group flex items-center hover:bg-[var(--anthropic-raised)] dark:hover:bg-[var(--anthropic-raised)]"
          >
            <button
              type="button"
              data-testid="select-model"
              class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
              @click="toggleModel(model.value)"
            >
              <span
                :class="[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  modelValue.includes(model.value)
                    ? 'border-[var(--anthropic-fg)] bg-[var(--anthropic-fg)] text-white'
                    : 'border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]'
                ]"
              >
                <svg v-if="modelValue.includes(model.value)" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <ModelIcon :model="model.value" size="18px" />
              <span class="truncate text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ model.value }}</span>
            </button>
            <button
              type="button"
              data-testid="copy-model-id"
              class="mr-2 rounded p-1.5 text-[var(--anthropic-muted)] opacity-70 transition-colors hover:bg-[var(--anthropic-section)] hover:text-[var(--anthropic-fg)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atelier-focus)] group-hover:opacity-100"
              :title="`${t('common.copy')} ${model.value}`"
              :aria-label="`${t('common.copy')} ${model.value}`"
              @click="copyModelId(model.value)"
            >
              <Icon name="copy" size="sm" />
            </button>
          </div>
          <div v-if="filteredModels.length === 0" class="px-3 py-4 text-center text-sm text-[var(--anthropic-muted)]">
            {{ t('admin.accounts.noMatchingModels') }}
          </div>
        </div>
      </FloatingDropdown>
    </div>

    <!-- Quick Actions -->
    <div class="mb-4 flex flex-wrap gap-2">
      <button data-testid="account-model-whitelist-selector-button-fill-related"
        type="button"
        @click="fillRelated"
        class="rounded-lg border border-[var(--anthropic-info-border)] px-3 py-1.5 text-sm text-[var(--anthropic-info)] hover:bg-[var(--anthropic-info-bg)] dark:border-[var(--anthropic-info-border)] dark:text-[var(--anthropic-info)] dark:hover:bg-[var(--anthropic-section)]"
      >
        {{ t('admin.accounts.fillRelatedModels') }}
      </button>
      <button data-testid="account-model-whitelist-selector-button-sync-upstream-models"
        v-if="canSyncUpstream"
        type="button"
        @click="syncUpstreamModels"
        :disabled="isSyncingUpstream"
        class="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
      >
        {{ isSyncingUpstream ? t('admin.accounts.syncUpstreamModelsLoading') : t('admin.accounts.syncUpstreamModels') }}
      </button>
      <button data-testid="account-model-whitelist-selector-button-clear-all"
        type="button"
        @click="clearAll"
        class="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
      >
        {{ t('admin.accounts.clearAllModels') }}
      </button>
    </div>

    <!-- Custom Model Input -->
    <div class="mb-3">
      <label class="mb-1.5 block text-sm font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('admin.accounts.customModelName') }}</label>
      <div class="flex gap-2">
        <input data-testid="account-model-whitelist-selector-input-custom-model"
          v-model="customModel"
          type="text"
          class="input flex-1"
          :placeholder="t('admin.accounts.enterCustomModelName')"
          @keydown.enter.prevent="handleEnter"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />
        <button data-testid="account-model-whitelist-selector-button-add-custom"
          type="button"
          @click="addCustom"
          class="rounded-lg bg-[var(--anthropic-section)] px-4 py-2 text-sm font-medium text-[var(--anthropic-fg)] hover:bg-[var(--anthropic-section)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-fg)] dark:hover:bg-[var(--anthropic-raised)]"
        >
          {{ t('admin.accounts.addModel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { accountsAPI } from '@/api/admin/accounts'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import type { SyncUpstreamPreviewParams } from '@/api/admin/accounts'
import { useClipboard } from '@/composables/useClipboard'
import ModelIcon from '@/components/common/ModelIcon.vue'
import Icon from '@/components/icons/Icon.vue'
import { allModels, getModelsByPlatform } from '@/composables/useModelWhitelist'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string[]
  platform?: string
  platforms?: string[]
  accountId?: number
  syncCredentials?: {
    platform: string
    type: string
    base_url?: string
    api_key: string
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const appStore = useAppStore()
const { copyToClipboard } = useClipboard()

const showDropdown = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const customModel = ref('')
const isComposing = ref(false)
const isSyncingUpstream = ref(false)
const normalizedPlatforms = computed(() => {
  const rawPlatforms =
    props.platforms && props.platforms.length > 0
      ? props.platforms
      : props.platform
        ? [props.platform]
        : []

  return Array.from(
    new Set(
      rawPlatforms
        .map(platform => platform?.trim())
        .filter((platform): platform is string => Boolean(platform))
    )
  )
})

const upstreamSyncPlatforms = new Set(['anthropic', 'openai', 'gemini', 'antigravity', 'grok'])
const canSyncUpstream = computed(() => {
  if (props.accountId) {
    if (normalizedPlatforms.value.length === 0) return true
    return normalizedPlatforms.value.some(platform => upstreamSyncPlatforms.has(platform.toLowerCase()))
  }
  if (props.syncCredentials) {
    return upstreamSyncPlatforms.has(props.syncCredentials.platform.toLowerCase())
  }
  return false
})

const availableOptions = computed(() => {
  if (normalizedPlatforms.value.length === 0) {
    return allModels
  }

  const allowedModels = new Set<string>()
  for (const platform of normalizedPlatforms.value) {
    for (const model of getModelsByPlatform(platform)) {
      allowedModels.add(model)
    }
  }

  return allModels.filter(model => allowedModels.has(model.value))
})

const filteredModels = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return availableOptions.value
  return availableOptions.value.filter(
    m => m.value.toLowerCase().includes(query) || m.label.toLowerCase().includes(query)
  )
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (!showDropdown.value) searchQuery.value = ''
}

const removeModel = (model: string) => {
  emit('update:modelValue', props.modelValue.filter(m => m !== model))
}

const toggleModel = (model: string) => {
  if (props.modelValue.includes(model)) {
    removeModel(model)
  } else {
    emit('update:modelValue', [...props.modelValue, model])
  }
}

const copyModelId = async (model: string) => {
  await copyToClipboard(model)
}

const addCustom = () => {
  const model = customModel.value.trim()
  if (!model) return
  if (props.modelValue.includes(model)) {
    appStore.showInfo(t('admin.accounts.modelExists'))
    return
  }
  emit('update:modelValue', [...props.modelValue, model])
  customModel.value = ''
}

const handleEnter = () => {
  if (!isComposing.value) addCustom()
}

const fillRelated = () => {
  const newModels = [...props.modelValue]
  for (const platform of normalizedPlatforms.value) {
    for (const model of getModelsByPlatform(platform)) {
      if (!newModels.includes(model)) {
        newModels.push(model)
      }
    }
  }
  emit('update:modelValue', newModels)
}

const syncUpstreamModels = async () => {
  if (isSyncingUpstream.value) return
  if (!props.accountId && !props.syncCredentials) return

  isSyncingUpstream.value = true
  try {
    let result
    if (props.accountId) {
      result = await accountsAPI.syncUpstreamModels(props.accountId)
    } else if (props.syncCredentials) {
      result = await accountsAPI.syncUpstreamModelsPreview(props.syncCredentials as SyncUpstreamPreviewParams)
    } else {
      return
    }

    const upstreamModels = result.models.map(model => model.trim()).filter(Boolean)
    if (upstreamModels.length === 0) {
      appStore.showInfo(t('admin.accounts.syncUpstreamModelsEmpty'))
      return
    }

    const newModels = [...props.modelValue]
    let addedCount = 0
    for (const model of upstreamModels) {
      if (!newModels.includes(model)) {
        newModels.push(model)
        addedCount += 1
      }
    }

    emit('update:modelValue', newModels)
    if (addedCount > 0) {
      appStore.showSuccess(t('admin.accounts.syncUpstreamModelsSuccess', { count: addedCount, total: upstreamModels.length }))
    } else {
      appStore.showInfo(t('admin.accounts.syncUpstreamModelsNoChanges', { count: upstreamModels.length }))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : t('admin.accounts.syncUpstreamModelsFailed')
    appStore.showError(t('admin.accounts.syncUpstreamModelsError', { message }))
  } finally {
    isSyncingUpstream.value = false
  }
}

const clearAll = () => {
  emit('update:modelValue', [])
}

</script>

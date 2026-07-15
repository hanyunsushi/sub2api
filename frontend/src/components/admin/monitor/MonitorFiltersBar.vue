<template>
  <div class="table-filter-shell monitor-filter-shell flex flex-col gap-3 lg:flex-row lg:items-start">
    <!-- Left: Search + Filters -->
    <div class="table-filter-left flex flex-1 flex-wrap items-center gap-3">
      <div class="relative w-full sm:w-64">
        <Icon
          name="search"
          size="md"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
        />
        <input data-testid="admin-monitor-monitor-filters-bar-input-search"
          v-model="search"
          type="text"
          :placeholder="t('admin.channelMonitor.searchPlaceholder')"
          class="input pl-10"
          @input="$emit('search-input')"
        />
      </div>

      <Select
        variant="text-control"
        v-model="provider"
        :options="providerFilterOptions"
        :placeholder="t('admin.channelMonitor.allProviders')"
        class="w-44"
        @change="$emit('reload')"
      >
        <template #selected="{ option }">
          <span class="flex min-w-0 items-center gap-2">
            <ProviderBrandIcon
              v-if="option?.value"
              :provider="String(option.value)"
              :model="String(option.value)"
              class="!h-5 !w-5 !rounded"
            />
            <span class="truncate">{{ option?.label ?? t('admin.channelMonitor.allProviders') }}</span>
          </span>
        </template>
        <template #option="{ option }">
          <span class="flex min-w-0 items-center gap-2">
            <ProviderBrandIcon
              v-if="option.value"
              :provider="String(option.value)"
              :model="String(option.value)"
              class="!h-5 !w-5 !rounded"
            />
            <span class="select-option-label">{{ option.label }}</span>
          </span>
        </template>
      </Select>

      <Select
        variant="text-control"
        v-model="enabled"
        :options="enabledFilterOptions"
        :placeholder="t('admin.channelMonitor.enabledFilter')"
        class="w-40"
        @change="$emit('reload')"
      />
    </div>

    <!-- Right: Actions -->
    <div class="table-filter-actions flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-3 lg:w-auto">
      <button data-testid="admin-monitor-monitor-filters-bar-button-emit-reload"
        @click="$emit('reload')"
        :disabled="loading"
        class="btn btn-primary anthropic-refresh-action-button monitor-refresh-button"
        :title="t('common.refresh')"
      >
        {{ t("common.refresh") }}
      </button>
      <button data-testid="admin-monitor-monitor-filters-bar-button-emit-manage-templates"
        @click="$emit('manage-templates')"
        class="filter-menu-button"
        :title="t('admin.channelMonitor.template.manageButton')"
      >
        {{ t('admin.channelMonitor.template.manageButton') }}
      </button>
      <button data-testid="admin-monitor-monitor-filters-bar-button-emit-create" @click="$emit('create')" class="btn btn-primary monitor-create-button">
        {{ t('admin.channelMonitor.createButton') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Provider } from '@/api/admin/channelMonitor'
import Select from '@/components/common/Select.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import Icon from '@/components/icons/Icon.vue'
import {
  PROVIDER_OPENAI,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  PROVIDER_GROK,
} from '@/constants/channelMonitor'

defineProps<{
  loading: boolean
}>()

defineEmits<{
  (e: 'reload'): void
  (e: 'create'): void
  (e: 'manage-templates'): void
  (e: 'search-input'): void
}>()

const search = defineModel<string>('search', { required: true })
const provider = defineModel<Provider | ''>('provider', { required: true })
const enabled = defineModel<'' | 'true' | 'false'>('enabled', { required: true })

const { t } = useI18n()

const providerFilterOptions = computed(() => [
  { value: '', label: t('admin.channelMonitor.allProviders') },
  { value: PROVIDER_OPENAI, label: t('monitorCommon.providers.openai') },
  { value: PROVIDER_ANTHROPIC, label: t('monitorCommon.providers.anthropic') },
  { value: PROVIDER_GEMINI, label: t('monitorCommon.providers.gemini') },
  { value: PROVIDER_GROK, label: t('monitorCommon.providers.grok') },
])

const enabledFilterOptions = computed(() => [
  { value: '', label: t('admin.channelMonitor.allStatus') },
  { value: 'true', label: t('admin.channelMonitor.onlyEnabled') },
  { value: 'false', label: t('admin.channelMonitor.onlyDisabled') },
])
</script>

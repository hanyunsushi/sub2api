<template>
  <div class="flex items-center gap-1">
    <button data-testid="admin-monitor-monitor-actions-cell-button-emit-run-row"
      @click="$emit('run', row)"
      :disabled="running"
      class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-[var(--anthropic-muted)] transition-colors hover:bg-[var(--anthropic-raised)] hover:text-[var(--anthropic-fg)] dark:hover:bg-[var(--anthropic-raised)] dark:hover:text-[var(--anthropic-fg)]"
    >
      <Icon name="refresh" size="sm" :class="running ? 'animate-spin' : ''" />
      <span class="text-xs">{{ t('admin.channelMonitor.runNow') }}</span>
    </button>
    <button data-testid="admin-monitor-monitor-actions-cell-button-emit-edit-row"
      @click="$emit('edit', row)"
      class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-[var(--anthropic-muted)] transition-colors hover:bg-[var(--anthropic-raised)] hover:text-[var(--anthropic-fg)] dark:hover:bg-[var(--anthropic-raised)] dark:hover:text-[var(--anthropic-fg)]"
    >
      <Icon name="edit" size="sm" />
      <span class="text-xs">{{ t('common.edit') }}</span>
    </button>
    <button data-testid="admin-monitor-monitor-actions-cell-button-emit-delete-row"
      @click="$emit('delete', row)"
      class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-[var(--anthropic-muted)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
    >
      <Icon name="trash" size="sm" />
      <span class="text-xs">{{ t('common.delete') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChannelMonitor } from '@/api/admin/channelMonitor'
import Icon from '@/components/icons/Icon.vue'

defineProps<{
  row: ChannelMonitor
  running: boolean
}>()

defineEmits<{
  (e: 'run', row: ChannelMonitor): void
  (e: 'edit', row: ChannelMonitor): void
  (e: 'delete', row: ChannelMonitor): void
}>()

const { t } = useI18n()
</script>

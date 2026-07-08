<template>
  <div class="account-bulk-actions-bar mb-4 flex items-center justify-between rounded-lg bg-[var(--anthropic-section)] p-3 dark:bg-[var(--anthropic-section)]">
    <div class="flex flex-wrap items-center gap-2">
      <span v-if="selectedIds.length > 0" class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
        {{ t('admin.accounts.bulkActions.selected', { count: selectedIds.length }) }}
      </span>
      <template v-if="selectedIds.length > 0">
        <button
          @click="$emit('select-page')"
          class="text-xs font-medium text-[var(--anthropic-fg)] hover:text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)] dark:hover:text-[var(--anthropic-fg)]"
          data-testid="account-bulk-select-page"
        >
          {{ t('admin.accounts.bulkActions.selectCurrentPage') }}
        </button>
        <span class="text-gray-300 dark:text-[var(--anthropic-fg)]">•</span>
        <button
          @click="$emit('clear')"
          class="text-xs font-medium text-[var(--anthropic-fg)] hover:text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)] dark:hover:text-[var(--anthropic-fg)]"
          data-testid="account-bulk-clear"
        >
          {{ t('admin.accounts.bulkActions.clear') }}
        </button>
      </template>
    </div>
    <div class="flex gap-2">
      <template v-if="selectedIds.length > 0">
        <button @click="$emit('delete')" class="btn btn-secondary btn-sm account-bulk-action account-bulk-action-danger" data-testid="account-bulk-delete">{{ t('admin.accounts.bulkActions.delete') }}</button>
        <button @click="$emit('reset-status')" class="btn btn-secondary btn-sm account-bulk-action" data-testid="account-bulk-reset-status">{{ t('admin.accounts.bulkActions.resetStatus') }}</button>
        <button @click="$emit('refresh-token')" class="btn btn-secondary btn-sm account-bulk-action" data-testid="account-bulk-refresh-token">{{ t('admin.accounts.bulkActions.refreshToken') }}</button>
        <button @click="$emit('toggle-schedulable', true)" class="btn btn-secondary btn-sm account-bulk-action" data-testid="account-bulk-enable-scheduling">{{ t('admin.accounts.bulkActions.enableScheduling') }}</button>
        <button @click="$emit('toggle-schedulable', false)" class="btn btn-secondary btn-sm account-bulk-action" data-testid="account-bulk-disable-scheduling">{{ t('admin.accounts.bulkActions.disableScheduling') }}</button>
        <button @click="$emit('edit-selected')" class="btn btn-primary account-bulk-primary-action" data-testid="account-bulk-edit-selected">{{ t('admin.accounts.bulkActions.edit') }}</button>
      </template>
      <button @click="$emit('edit-filtered')" class="btn btn-primary account-bulk-primary-action" data-testid="account-bulk-edit-filtered">
        {{ t('admin.accounts.bulkEdit.submit') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps(['selectedIds']); defineEmits(['delete', 'edit-selected', 'edit-filtered', 'clear', 'select-page', 'toggle-schedulable', 'reset-status', 'refresh-token']); const { t } = useI18n()
</script>

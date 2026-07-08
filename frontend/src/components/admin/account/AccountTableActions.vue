<template>
  <div class="table-filter-actions flex flex-wrap items-center gap-3">
    <slot name="before"></slot>
    <button
      data-testid="admin-account-account-table-actions-button-emit-refresh"
      @click="$emit('refresh')"
      :disabled="loading"
      class="btn btn-tertiary anthropic-refresh-action-button accounts-refresh-button"
    >
      {{ t("common.refresh") }}
    </button>
    <slot name="after"></slot>
    <slot name="beforeCreate"></slot>
    <button data-testid="admin-account-account-table-actions-button-emit-create" @click="$emit('create')" class="btn btn-primary accounts-create-button">
      {{ t('admin.accounts.createAccount') }}
    </button>
    <slot name="afterCreate"></slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps(['loading'])
defineEmits(['refresh', 'create'])

const { t } = useI18n()
</script>

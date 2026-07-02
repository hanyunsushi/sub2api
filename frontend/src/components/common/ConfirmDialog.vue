<template>
  <BaseDialog :show="show" :title="title" width="narrow" @close="handleCancel">
    <div class="space-y-4">
      <p class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ message }}</p>
      <slot></slot>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <button data-testid="common-confirm-button-handle-cancel"
          @click="handleCancel"
          type="button"
          class="btn btn-secondary px-4 py-2 text-sm font-medium"
        >
          {{ cancelText }}
        </button>
        <button data-testid="common-confirm-button-handle-confirm"
          @click="handleConfirm"
          type="button"
          :class="[
            'btn px-4 py-2 text-sm font-medium',
            danger
              ? 'btn-danger confirm-button-danger'
              : 'btn-primary'
          ]"
        >
          {{ confirmText }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from './BaseDialog.vue'

const { t } = useI18n()

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  danger: false
})

const confirmText = computed(() => props.confirmText || t('common.confirm'))
const cancelText = computed(() => props.cancelText || t('common.cancel'))

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-button-danger {
  border: 1px solid var(--atelier-status-danger);
  background: var(--atelier-status-danger) !important;
  color: var(--anthropic-page, #faf9f5) !important;
}

.confirm-button-danger:hover {
  background: color-mix(in srgb, var(--atelier-status-danger) 86%, var(--atelier-ink)) !important;
}

.confirm-button-danger:focus {
  --tw-ring-color: color-mix(in srgb, var(--atelier-status-danger) 48%, transparent) !important;
}
</style>

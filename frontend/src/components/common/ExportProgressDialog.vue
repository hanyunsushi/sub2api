<template>
  <BaseDialog :show="show" :title="t('usage.exporting')" width="narrow" @close="handleCancel">
    <div class="space-y-4">
      <div class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
        {{ t('usage.exportingProgress') }}
      </div>
      <div class="flex items-center justify-between text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
        <span>{{ t('usage.exportedCount', { current, total }) }}</span>
        <span class="font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ normalizedProgress }}%</span>
      </div>
      <div class="h-2 w-full rounded-full bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]">
        <div
          role="progressbar"
          :aria-valuenow="normalizedProgress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${t('usage.exportingProgress')}: ${normalizedProgress}%`"
          class="h-2 rounded-full bg-[var(--anthropic-fg)] transition-all"
          :style="{ width: `${normalizedProgress}%` }"
        ></div>
      </div>
      <div v-if="estimatedTime" class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]" aria-live="polite" aria-atomic="true">
        {{ t('usage.estimatedTime', { time: estimatedTime }) }}
      </div>
    </div>

    <template #footer>
      <button data-testid="common-export-progress-button-handle-cancel"
        @click="handleCancel"
        type="button"
        class="rounded-md border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] px-4 py-2 text-sm font-medium text-[var(--anthropic-muted)] hover:bg-[var(--anthropic-section)] focus:outline-none focus:ring-2 focus:ring-[var(--atelier-focus)] focus:ring-offset-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)] dark:hover:bg-[var(--anthropic-raised)] dark:focus:ring-offset-dark-800"
      >
        {{ t('usage.cancelExport') }}
      </button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from './BaseDialog.vue'

interface Props {
  show: boolean
  progress: number
  current: number
  total: number
  estimatedTime: string
}

interface Emits {
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const normalizedProgress = computed(() => {
  const value = Number.isFinite(props.progress) ? props.progress : 0
  return Math.min(100, Math.max(0, Math.round(value)))
})

const handleCancel = () => {
  emit('cancel')
}
</script>

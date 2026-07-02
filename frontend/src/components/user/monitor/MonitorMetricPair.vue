<template>
  <div class="monitor-metric-pair mt-5 grid grid-cols-2 gap-2">
    <div
      class="min-w-0 rounded-xl p-3 bg-[var(--anthropic-section)] dark:bg-[var(--anthropic-section)] border border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"
    >
      <div
        class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--anthropic-muted)]"
      >
        <Icon :name="primaryIcon" size="xs" />
        <span>{{ primaryLabel }}</span>
      </div>
      <div class="mt-1.5 truncate text-lg font-bold font-mono tabular-nums text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
        {{ primaryValue }}<span class="text-xs font-normal text-[var(--anthropic-muted)] ml-0.5">{{ primaryUnit }}</span>
      </div>
    </div>
    <div
      class="min-w-0 rounded-xl p-3 bg-[var(--anthropic-section)] dark:bg-[var(--anthropic-section)] border border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"
    >
      <div
        class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--anthropic-muted)]"
      >
        <Icon :name="secondaryIcon" size="xs" />
        <span>{{ secondaryLabel }}</span>
      </div>
      <div class="mt-1.5 truncate text-lg font-bold font-mono tabular-nums text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
        {{ secondaryValue }}<span class="text-xs font-normal text-[var(--anthropic-muted)] ml-0.5">{{ secondaryUnit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'

defineProps<{
  primaryLabel: string
  primaryValue: string
  primaryUnit: string
  primaryIcon: 'bolt' | 'globe' | 'clock' | 'link'
  secondaryLabel: string
  secondaryValue: string
  secondaryUnit: string
  secondaryIcon: 'bolt' | 'globe' | 'clock' | 'link'
}>()
</script>

<style scoped>
.monitor-metric-pair {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>

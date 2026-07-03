<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import type { CustomEndpoint } from '@/types'

const props = defineProps<{
  apiBaseUrl: string
  customEndpoints: CustomEndpoint[]
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const copiedEndpoint = ref<string | null>(null)
const activeTooltipEndpoint = ref<string | null>(null)
const tooltipStyle = ref<Record<string, string>>({
  left: '0px',
  top: '0px',
  position: 'fixed',
  zIndex: '100000220',
})

let copiedResetTimer: number | undefined

const allEndpoints = computed(() => {
  const items: Array<{ name: string; endpoint: string; description: string; isDefault: boolean }> = []
  if (props.apiBaseUrl) {
    items.push({
      name: t('keys.endpoints.title'),
      endpoint: props.apiBaseUrl,
      description: '',
      isDefault: true,
    })
  }
  for (const ep of props.customEndpoints) {
    items.push({ ...ep, isDefault: false })
  }
  return items
})

async function copy(url: string) {
  const success = await copyToClipboard(url, t('keys.endpoints.copied'))
  if (!success) return

  copiedEndpoint.value = url
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
  copiedResetTimer = window.setTimeout(() => {
    if (copiedEndpoint.value === url) {
      copiedEndpoint.value = null
    }
  }, 1800)
}

function tooltipHint(endpoint: string): string {
  return copiedEndpoint.value === endpoint
    ? t('keys.endpoints.copiedHint')
    : t('keys.endpoints.clickToCopy')
}

function speedTestUrl(endpoint: string): string {
  return `https://www.tcptest.cn/http/${encodeURIComponent(endpoint)}`
}

function endpointTooltipData(endpoint: string) {
  return allEndpoints.value.find((item) => item.endpoint === endpoint) || null
}

function openTooltip(endpoint: string, event: MouseEvent | FocusEvent) {
  activeTooltipEndpoint.value = endpoint
  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  const rect = target.getBoundingClientRect()
  nextTick(() => {
    const tooltipWidth = Math.min(384, Math.max(220, window.innerWidth - 32))
    const preferredLeft = rect.left + rect.width / 2
    const clampedLeft = Math.min(
      window.innerWidth - tooltipWidth / 2 - 12,
      Math.max(tooltipWidth / 2 + 12, preferredLeft),
    )
    const preferredTop = rect.top - 10
    const top = preferredTop > 96 ? preferredTop : rect.bottom + 10
    tooltipStyle.value = {
      position: 'fixed',
      zIndex: '100000220',
      left: `${clampedLeft}px`,
      top: `${top}px`,
      maxWidth: '24rem',
      transform: preferredTop > 96 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
    }
  })
}

function closeTooltip(endpoint: string) {
  if (activeTooltipEndpoint.value === endpoint) {
    activeTooltipEndpoint.value = null
  }
}

onBeforeUnmount(() => {
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
})
</script>

<template>
  <div v-if="allEndpoints.length > 0" class="endpoint-popover-list flex flex-wrap gap-2">
    <div
      v-for="(item, index) in allEndpoints"
      :key="index"
      class="endpoint-popover-item flex items-center gap-1.5 rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] px-2.5 py-1.5 text-xs transition-colors dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]"
    >
      <span class="font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ item.name }}</span>
      <span
        v-if="item.isDefault"
        class="endpoint-default-badge rounded bg-[var(--anthropic-section)] px-1 py-px text-[10px] font-medium leading-tight text-[var(--anthropic-fg)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-fg)]"
      >{{ t('keys.endpoints.default') }}</span>

      <span class="text-gray-300 dark:text-dark-500">|</span>

      <div class="endpoint-popover-endpoint group/endpoint relative flex items-center gap-1.5">
        <code
          class="endpoint-code cursor-pointer font-mono text-[var(--anthropic-muted)] decoration-gray-400 decoration-dashed underline-offset-2 hover:text-[var(--anthropic-fg)] hover:underline focus:text-[var(--anthropic-fg)] focus:underline focus:outline-none dark:text-[var(--anthropic-muted)] dark:decoration-gray-500 dark:hover:text-[var(--anthropic-fg)] dark:focus:text-[var(--anthropic-fg)]"
          role="button"
          tabindex="0"
          data-testid="endpoint-tooltip-trigger"
          @mouseenter="openTooltip(item.endpoint, $event)"
          @mouseleave="closeTooltip(item.endpoint)"
          @focus="openTooltip(item.endpoint, $event)"
          @blur="closeTooltip(item.endpoint)"
          @click="copy(item.endpoint)"
          @keydown.enter.prevent="copy(item.endpoint)"
          @keydown.space.prevent="copy(item.endpoint)"
        >{{ item.endpoint }}</code>

        <button data-testid="keys-endpoint-popover-button-copy-item-endpoint"
          type="button"
          class="endpoint-popover-icon-action rounded p-0.5 transition-colors"
          :class="copiedEndpoint === item.endpoint
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-[var(--anthropic-muted)] hover:text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)] dark:hover:text-[var(--anthropic-fg)]'"
          :aria-label="tooltipHint(item.endpoint)"
          @click="copy(item.endpoint)"
        >
          <svg v-if="copiedEndpoint === item.endpoint" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <a data-testid="keys-endpoint-popover-link-a"
          :href="speedTestUrl(item.endpoint)"
          target="_blank"
          rel="noopener noreferrer"
          class="endpoint-popover-icon-action rounded p-0.5 text-[var(--anthropic-muted)] transition-colors hover:text-amber-500 dark:text-[var(--anthropic-muted)] dark:hover:text-amber-400"
          :title="t('keys.endpoints.speedTest')"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </a>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="activeTooltipEndpoint && endpointTooltipData(activeTooltipEndpoint)"
      class="endpoint-tooltip pointer-events-none fixed w-max max-w-[24rem] rounded-xl border border-slate-200 bg-[var(--anthropic-page)] px-3 py-2.5 text-left shadow-[0_14px_36px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80 dark:border-slate-700 dark:bg-[var(--anthropic-section)] dark:ring-slate-700/70"
      :style="tooltipStyle"
      role="tooltip"
    >
      <p
        v-if="endpointTooltipData(activeTooltipEndpoint)?.description"
        class="max-w-[24rem] break-words text-xs leading-5 text-slate-600 dark:text-slate-200"
      >
        {{ endpointTooltipData(activeTooltipEndpoint)?.description }}
      </p>
      <p
        class="flex items-center gap-1.5 text-[11px] leading-4 text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]"
        :class="endpointTooltipData(activeTooltipEndpoint)?.description ? 'mt-1.5' : ''"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-[var(--anthropic-fg)] dark:bg-primary-300"></span>
        {{ tooltipHint(activeTooltipEndpoint) }}
      </p>
      <div class="endpoint-tooltip-arrow absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-[var(--anthropic-page)] dark:border-slate-700 dark:bg-[var(--anthropic-section)]"></div>
    </div>
  </Teleport>
</template>

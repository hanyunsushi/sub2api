<template>
  <!-- 展示信息模块：可变高度分组选项，名称说明与倍率在窄面板允许分行。 -->
  <div class="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
    <!-- 区分-身份牌：平台归属由 GroupBadge 表达，不把身份颜色改成健康状态。 -->
    <div
      class="flex min-w-0 flex-[1_1_160px] flex-col items-start"
      :title="description || undefined"
    >
      <GroupBadge
        :name="name"
        :platform="platform"
        :logo-url="logoUrl"
        :subscription-type="subscriptionType"
        :show-rate="false"
        class="groupOptionItemBadge"
      />
      <!-- 提示信息：说明保留三行摘要与 title 全文，连续长词可换行。 -->
      <span
        v-if="description"
        class="mt-1.5 w-full whitespace-pre-line [overflow-wrap:anywhere] text-left text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3"
      >
        {{ description }}
      </span>
    </div>

    <!-- 区分-信息牌 / 数字展示：倍率沿用平台与峰时价格配色，只接入共享标签几何。 -->
    <div class="flex min-w-0 max-w-full items-center gap-2 pt-0.5">
      <div class="flex min-w-0 max-w-full flex-col items-end gap-1">
        <span v-if="rateMultiplier !== undefined" :class="['badge inline-flex max-w-full flex-wrap items-center rounded-full px-3 py-1 text-xs font-semibold', ratePillClass]">
          <template v-if="hasCustomRate">
            <span class="mr-1 line-through opacity-50">{{ rateMultiplier }}x</span>
            <span class="font-bold">{{ userRateMultiplier }}x</span>
          </template>
          <template v-else>
            {{ rateMultiplier }}x {{ t('admin.groups.rateLabel') }}
          </template>
        </span>
        <span
          v-if="hasPeakRate"
          class="badge inline-flex max-w-full flex-wrap items-center [overflow-wrap:anywhere] rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
          :title="peakRateTitle"
        >
          {{ peakRateText }}
        </span>
      </div>
      <!-- 选择下拉菜单：原选中条件保留；系统模式由中性选中面表达，不额外绘制勾。 -->
      <svg
        v-if="showCheckmark && selected"
        class="group-option-check h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GroupBadge from './GroupBadge.vue'
import type { SubscriptionType, GroupPlatform } from '@/types'
import { useAppStore } from '@/stores/app'
import { formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'

const { t } = useI18n()

interface Props {
  name: string
  logoUrl?: string | null
  platform: GroupPlatform
  subscriptionType?: SubscriptionType
  rateMultiplier?: number
  userRateMultiplier?: number | null
  peakRateEnabled?: boolean
  peakStart?: string
  peakEnd?: string
  peakRateMultiplier?: number
  description?: string | null
  selected?: boolean
  showCheckmark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subscriptionType: 'standard',
  selected: false,
  showCheckmark: true,
  userRateMultiplier: null,
  peakRateEnabled: false
})

// Whether user has a custom rate different from default
const hasCustomRate = computed(() => {
  return (
    props.userRateMultiplier !== null &&
    props.userRateMultiplier !== undefined &&
    props.rateMultiplier !== undefined &&
    props.userRateMultiplier !== props.rateMultiplier
  )
})

const appStore = useAppStore()

const hasPeakRate = computed(() => {
  return Boolean(props.peakRateEnabled && props.peakStart && props.peakEnd)
})

const peakRateText = computed(() => {
  return formatPeakRateWindow(
    {
      peak_rate_enabled: props.peakRateEnabled,
      peak_start: props.peakStart,
      peak_end: props.peakEnd,
      peak_rate_multiplier: props.peakRateMultiplier
    },
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
})

const peakRateTitle = computed(() => {
  return t('common.peakRateTooltip', { window: peakRateText.value })
})

// 区分-信息牌：倍率借用平台身份配色，不表达请求成功或账户健康。
const ratePillClass = computed(() => {
  switch (props.platform) {
    case 'anthropic':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
    case 'openai':
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
    case 'gemini':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400'
    default: // antigravity and others
      return 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400'
  }
})
</script>

<style scoped>
/* 区分-身份牌：选项内分组名称加粗，不修改 GroupBadge 的平台或订阅语义。 */
.groupOptionItemBadge :deep(span.truncate) {
  font-weight: 600;
}

/* 选择下拉菜单：原 selected/showCheckmark API 保留，共享中性选中面无需额外勾。 */
:root.kreepai-design-system .group-option-check {
  display: none;
}
</style>

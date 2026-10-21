<template>
  <section class="py-3 md:py-4">
    <div class="flex items-center justify-end gap-3 flex-wrap">
      <!-- 路由切换组件：原7/15/30日查询，复用单跟随面。 -->
      <RouteSwitch :label="t('admin.dashboard.timeRange')" :model-value="window" :options="windowOptions" @update:model-value="emit('update:window', $event as MonitorWindow)" />

      <!-- 区分-状态牌：整体渠道状态复用统一6px/13px/600语义标签，不采用pill。 -->
      <StatusBadge :status="overallStatus === 'operational' ? 'success' : 'warning'" :label="overallLabel" />

      <!-- 普通按钮 / 悬浮效果：标准刷新保留原请求与loading。 -->
      <RefreshButton :label="t('common.refresh')" :loading="loading" @refresh="emit('refresh')" />

      <AutoRefreshButton
        v-if="autoRefresh"
        :enabled="autoRefresh.enabled.value"
        :interval-seconds="autoRefresh.intervalSeconds.value"
        :countdown="autoRefresh.countdown.value"
        :intervals="autoRefresh.intervals"
        @update:enabled="autoRefresh.setEnabled"
        @update:interval="autoRefresh.setInterval"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RouteSwitch from '@/components/common/RouteSwitch.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'
import AutoRefreshButton from '@/components/common/AutoRefreshButton.vue'
export type MonitorWindow = '7d' | '15d' | '30d'
export type OverallStatus = 'operational' | 'degraded'

const props = defineProps<{
  overallStatus: OverallStatus
  intervalSeconds: number
  window: MonitorWindow
  loading: boolean
  autoRefresh?: {
    enabled: { value: boolean }
    intervalSeconds: { value: number }
    countdown: { value: number }
    intervals: readonly number[]
    setEnabled: (v: boolean) => void
    setInterval: (v: number) => void
  }
}>()

const emit = defineEmits<{
  (e: 'update:window', value: MonitorWindow): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()

const windowOptions = computed<{ value: MonitorWindow; label: string }[]>(() => [
  { value: '7d', label: t('channelStatus.windowTab.7d') },
  { value: '15d', label: t('channelStatus.windowTab.15d') },
  { value: '30d', label: t('channelStatus.windowTab.30d') },
])

const overallLabel = computed(() => t(`channelStatus.overall.${props.overallStatus}`))


</script>

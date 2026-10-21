<script setup lang="ts">
// 日期范围选择器：原相对查询与时分归应用，日历/快捷列/确认取消共用原单表面。
import React from 'react'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SystemDateRangePicker from '@/components/common/date-range/SystemDateRangePicker.vue'
import type { DateRange } from '@/components/common/date-range/date-range-picker-react'

const props = defineProps<{ timeRange: string; customStartTime?: string | null; customEndTime?: string | null }>()
const emit = defineEmits<{ change: [value: { timeRange: string; startTime?: string; endTime?: string }] }>()
const { t, locale } = useI18n()
const minutes = { '5m': 5, '30m': 30, '1h': 60, '6h': 360, '24h': 1440 }
type RelativeRange = keyof typeof minutes
const keys = Object.keys(minutes) as RelativeRange[]
const now = ref(new Date())
const startClock = ref('')
const endClock = ref('')
const pendingMode = ref(props.timeRange)
const ranges = computed(() => Object.fromEntries(Object.entries(minutes).map(([key, value]) => [key, { start: new Date(now.value.getTime() - value * 60000), end: new Date(now.value.getTime()) }])) as Record<RelativeRange, DateRange>)
const value = computed<DateRange>(() => props.timeRange === 'custom' && props.customStartTime && props.customEndTime
  ? { start: new Date(props.customStartTime), end: new Date(props.customEndTime) }
  : ranges.value[props.timeRange as RelativeRange] ?? ranges.value['1h'])
const clock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
const dayWithClock = (date: Date, time: string) => {
  const [hours, mins] = time.split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, mins)
}
const sameRange = (a: DateRange | null, b: DateRange | null) => Boolean(a && b && a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime())
function resetDraft() {
  now.value = new Date()
  pendingMode.value = props.timeRange
  startClock.value = clock(value.value.start)
  endClock.value = clock(value.value.end)
}
resetDraft()
function prepare(event: Event) {
  if ((event.target as HTMLElement).closest('[data-testid="date-range-trigger"]')) resetDraft()
}
const presets = computed(() => keys.map(key => ({ label: t(`admin.ops.timeRange.${key}`), range: () => ranges.value[key] })))
function selectPreset(_preset: unknown, index: number) {
  const key = keys[index]
  if (!key) return
  pendingMode.value = key
  startClock.value = clock(ranges.value[key].start)
  endClock.value = clock(ranges.value[key].end)
}
function applied(range: DateRange) {
  const preset = ranges.value[pendingMode.value as RelativeRange]
  if (preset && sameRange(preset, range)) {
    emit('change', { timeRange: pendingMode.value })
    return
  }
  emit('change', { timeRange: 'custom', startTime: dayWithClock(range.start, startClock.value).toISOString(), endTime: dayWithClock(range.end, endClock.value).toISOString() })
}
const validRange = computed(() => {
  const start = startClock.value, end = endClock.value
  return (range: DateRange) => Boolean(start && end && dayWithClock(range.end, end).getTime() > dayWithClock(range.start, start).getTime())
})
const formatLabel = computed(() => {
  const start = startClock.value, end = endClock.value
  const format = new Intl.DateTimeFormat(locale?.value === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  const committed = value.value
  return (range: DateRange | null) => {
    if (!range) return t('dates.selectDateRange')
    if (range === committed && props.timeRange !== 'custom') return t(`admin.ops.timeRange.${props.timeRange}`)
    const preset = keys.find(key => sameRange(range, ranges.value[key]))
    if (preset && pendingMode.value === preset) return t(`admin.ops.timeRange.${preset}`)
    const a = range === committed ? range.start : dayWithClock(range.start, start)
    const b = range === committed ? range.end : dayWithClock(range.end, end)
    return `${format.format(a)} – ${format.format(b)}`
  }
})
const controls = computed(() => {
  const start = startClock.value, end = endClock.value
  const field = (side: 'start' | 'end', current: string) => React.createElement('label', { key: side },
    t(`admin.ops.customTimeRange.${side}Time`),
    React.createElement('input', { type: 'time', className: 'input', value: current, required: true, onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      if (side === 'start') startClock.value = event.target.value
      else endClock.value = event.target.value
      pendingMode.value = 'custom'
    } }))
  return (_range: DateRange | null) => React.createElement('div', { className: 'ops-query-time-fields' }, field('start', start), field('end', end))
})
const boundary = () => document.querySelector<HTMLElement>('.kreepai-layout-content')
</script>

<template>
  <!-- 日期范围选择器 / 填写框：分钟快捷范围内置预设列，时分和日历使用同一次Apply/Cancel。 -->
  <div class="ops-query-time-picker" @pointerdown.capture="prepare" @keydown.capture="prepare">
    <SystemDateRangePicker :model-value="value" :presets="presets" :label="t('admin.dashboard.timeRange')" :locale="locale === 'zh' ? 'zh-CN' : 'en-US'" :format-range-label="formatLabel" :is-same-range="sameRange" :render-range-controls="controls" :on-preset-select="selectPreset" :can-apply-range="validRange" :boundary="boundary" @change="applied" />
  </div>
</template>

<style scoped>
/* 日期范围选择器 / 填写框：时分仅为应用组合；保留原单表面与Motion，窄屏字段可重排。 */
.ops-query-time-picker { min-width: 0; max-width: 100%; container-type: inline-size; }
.ops-query-time-picker :deep([data-testid=date-range-trigger]) { max-width: 100cqi; }
.ops-query-time-picker :deep(.ops-query-time-fields) { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,140px),1fr)); gap: 12px; padding: 12px 18px; border-top: 1px solid var(--border); }
.ops-query-time-picker :deep(.ops-query-time-fields label) { display: grid; gap: 4px; min-width: 0; font: 400 12px/20px var(--ff-body); color: var(--text-2); }
.ops-query-time-picker :deep(.ops-query-time-fields input) { width: 100%; min-width: 0; }
/* 日期范围选择器：手机完整日期/时分摘要独占一行，操作区在下方，不覆盖长文。 */
@container (max-width: 420px) {
  .ops-query-time-picker :deep([data-testid=date-range-footer]) { flex-wrap: wrap; }
  .ops-query-time-picker :deep([data-testid=date-range-summary]) { flex: 1 1 100%; }
}
</style>

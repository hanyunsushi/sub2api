<template>
  <!-- 日期范围选择器：原八个快捷范围和事件保留，日历直接执行设计系统React源。 -->
  <div @pointerdown.capture="refreshLimit" @keydown.capture="refreshLimit"><SystemDateRangePicker :model-value="value" :presets="systemPresets" :locale="locale === 'zh' ? 'zh-CN' : 'en-US'" :label="t('dates.selectDateRange')" :max-date="maximumDate" :boundary="boundary" @change="applyRange" /></div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SystemDateRangePicker from './date-range/SystemDateRangePicker.vue'
import type { DateRange } from './date-range/date-range-picker-react'
interface DatePreset { labelKey: string; value: string; getRange: () => { start: string; end: string } }
const props = defineProps<{ startDate: string; endDate: string }>()
const emit = defineEmits<{ 'update:startDate': [value: string]; 'update:endDate': [value: string]; change: [range: { startDate: string; endDate: string; preset: string | null }] }>()
const { t, locale } = useI18n()
const formatDateToString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
const today = () => formatDateToString(new Date())
const parseDay = (value: string) => new Date(value + 'T00:00:00')
const value = computed(() => ({ start: parseDay(props.startDate), end: parseDay(props.endDate) }))
const maximumDate = ref(new Date())
function refreshLimit() { const date=new Date(); date.setDate(date.getDate()+1); maximumDate.value=date }
refreshLimit()
const boundary = () => document.querySelector<HTMLElement>('.kreepai-layout-content')
const presets: DatePreset[] = [
  {
    labelKey: 'dates.today',
    value: 'today',
    getRange: () => {
      const t = today()
      return { start: t, end: t }
    }
  },
  {
    labelKey: 'dates.yesterday',
    value: 'yesterday',
    getRange: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      const yesterday = formatDateToString(d)
      return { start: yesterday, end: yesterday }
    }
  },
  {
    labelKey: 'dates.last24Hours',
    value: 'last24Hours',
    getRange: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      return {
        start: formatDateToString(start),
        end: formatDateToString(end)
      }
    }
  },
  {
    labelKey: 'dates.last7Days',
    value: '7days',
    getRange: () => {
      const end = today()
      const d = new Date()
      d.setDate(d.getDate() - 6)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.last14Days',
    value: '14days',
    getRange: () => {
      const end = today()
      const d = new Date()
      d.setDate(d.getDate() - 13)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.last30Days',
    value: '30days',
    getRange: () => {
      const end = today()
      const d = new Date()
      d.setDate(d.getDate() - 29)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.thisMonth',
    value: 'thisMonth',
    getRange: () => {
      const now = new Date()
      const start = formatDateToString(new Date(now.getFullYear(), now.getMonth(), 1))
      return { start, end: today() }
    }
  },
  {
    labelKey: 'dates.lastMonth',
    value: 'lastMonth',
    getRange: () => {
      const now = new Date()
      const start = formatDateToString(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const end = formatDateToString(new Date(now.getFullYear(), now.getMonth(), 0))
      return { start, end }
    }
  }
]

const systemPresets = computed(() => presets.map(preset => ({ label: t(preset.labelKey), range: () => { const range = preset.getRange(); return { start: parseDay(range.start), end: parseDay(range.end) } } })))
function applyRange(range: DateRange) {
  const startDate = formatDateToString(range.start), endDate = formatDateToString(range.end)
  const preset = presets.find(p => { const r=p.getRange(); return r.start===startDate && r.end===endDate })?.value ?? null
  emit('update:startDate',startDate); emit('update:endDate',endDate); emit('change',{startDate,endDate,preset})
}
</script>

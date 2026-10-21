<script setup lang="ts">
// 日期范围选择器 / 填写框：自然日日历复用设计系统，时分和开放端点归业务查询。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SystemDateRangePicker from './date-range/SystemDateRangePicker.vue'
import type { DateRange } from './date-range/date-range-picker-react'
const props = withDefaults(defineProps<{ start: string; end: string; time?: boolean; clearable?: boolean }>(), { time: false, clearable: true })
const emit = defineEmits<{ 'update:start': [value: string]; 'update:end': [value: string]; change: [] }>()
const { t, locale } = useI18n()
const value = computed(() => props.start && props.end ? { start: new Date(props.time ? props.start : props.start + 'T00:00:00'), end: new Date(props.time ? props.end : props.end + 'T00:00:00') } : null)
const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
function apply(range: DateRange) {
 emit('update:start', day(range.start) + (props.time ? 'T' + (props.start.slice(11,16) || '00:00') : ''))
 emit('update:end', day(range.end) + (props.time ? 'T' + (props.end.slice(11,16) || '23:59') : ''))
 emit('change')
}
function clock(side: 'start' | 'end', event: Event) {
 const date = props[side].slice(0,10) || day(new Date())
 const clock = (event.target as HTMLInputElement).value
 const value = clock ? date + 'T' + clock : ''
 if (side === 'start') emit('update:start', value); else emit('update:end', value)
 emit('change')
}
function clear(side: 'start' | 'end') { if (side === 'start') emit('update:start', ''); else emit('update:end', ''); emit('change') }
</script>
<template>
 <div class="date-range-fields">
  <SystemDateRangePicker :model-value="value" :locale="locale === 'zh' ? 'zh-CN' : 'en-US'" :label="t('dates.selectDateRange')" :placeholder="t('dates.selectDateRange')" :months="'auto'" @change="apply" />
  <div v-if="time" class="date-range-clocks">
   <label>{{ t('admin.ops.customTimeRange.startTime') }}<input type="time" class="input" :value="start.slice(11,16)" @change="clock('start', $event)" /></label>
   <label>{{ t('admin.ops.customTimeRange.endTime') }}<input type="time" class="input" :value="end.slice(11,16)" @change="clock('end', $event)" /></label>
  </div>
  <div v-if="clearable && (start || end)" class="date-range-clear">
   <button v-if="start" type="button" class="btn btn-ghost" @click="clear('start')">{{ t('common.clear') }} · {{ start.replace('T',' ') }}</button>
   <button v-if="end" type="button" class="btn btn-ghost" @click="clear('end')">{{ t('common.clear') }} · {{ end.replace('T',' ') }}</button>
  </div>
 </div>
</template>
<style scoped>
/* 日期范围选择器：实际容器重排；原自然日草稿/Apply/Cancel保持，时分不降为日期。 */
.date-range-fields { min-width:0; max-width:100%; }
.date-range-clocks { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.date-range-clocks label { flex:1 1 120px; min-width:0; color:var(--text-2); font-size:12px; }
.date-range-clocks .input { width:100%; }
.date-range-clear { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.date-range-clear button { max-width:100%; white-space:normal; height:auto; overflow-wrap:anywhere; }
</style>

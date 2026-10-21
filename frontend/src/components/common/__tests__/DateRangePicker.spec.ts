import { mount, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import DateRangePicker from '../DateRangePicker.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key, locale: ref('en') }) }))
enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())
const mountPicker = () => mount(DateRangePicker,{props:{startDate:'2026-10-01',endDate:'2026-10-02'},global:{stubs:{SystemDateRangePicker:true}}})

describe('date query adapter',()=>{
  it('retains all eight shortcut names and local-day values',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,19,12))
    const wrapper=mountPicker(), calendar=wrapper.findComponent({name:'SystemDateRangePicker'})
    const presets=calendar.props('presets')
    expect(presets).toHaveLength(8)
    expect(presets.map((p:{label:string})=>p.label)).toContain('dates.last24Hours')
    expect(presets[2].range().start.getDate()).toBe(18)
  })
  it('applies the calendar value to the original three events without UTC day shifts',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,19,12))
    const wrapper=mountPicker()
    wrapper.findComponent({name:'SystemDateRangePicker'}).vm.$emit('change',{start:new Date(2026,9,18),end:new Date(2026,9,19)})
    expect(wrapper.emitted('update:startDate')).toEqual([['2026-10-18']])
    expect(wrapper.emitted('update:endDate')).toEqual([['2026-10-19']])
    expect(wrapper.emitted('change')).toEqual([[{startDate:'2026-10-18',endDate:'2026-10-19',preset:'last24Hours'}]])
  })
})

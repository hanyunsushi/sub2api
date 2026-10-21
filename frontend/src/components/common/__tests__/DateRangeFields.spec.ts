import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
vi.mock('vue-i18n', () => ({ useI18n: () => ({t:(key:string)=>key,locale:{value:'zh'}}) }))
import DateRangeFields from '../DateRangeFields.vue'
import SystemDateRangePicker from '../date-range/SystemDateRangePicker.vue'

describe('date range query boundary', () => {
  it('keeps local dates and original minute precision until calendar Apply', async () => {
    const wrapper = mount(DateRangeFields, {props:{start:'2026-10-19T09:17',end:'2026-10-20T18:43',time:true},global:{stubs:{SystemDateRangePicker:true}}})
    const calendar=wrapper.findComponent(SystemDateRangePicker)
    expect(wrapper.emitted('change')).toBeUndefined()
    calendar.vm.$emit('change',{start:new Date(2026,9,2),end:new Date(2026,9,5)})
    expect(wrapper.emitted('update:start')?.[0]).toEqual(['2026-10-02T09:17'])
    expect(wrapper.emitted('update:end')?.[0]).toEqual(['2026-10-05T18:43'])
    expect(wrapper.emitted('change')).toHaveLength(1)
    wrapper.unmount()
  })
  it('clears only the requested endpoint and retains day semantics', async()=>{
    const wrapper=mount(DateRangeFields,{props:{start:'2026-10-01',end:'2026-10-20'},global:{stubs:{SystemDateRangePicker:true}}})
    const range=wrapper.findComponent(SystemDateRangePicker).props('modelValue')
    expect(range.start.getHours()).toBe(0)
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:start')?.[0]).toEqual([''])
    expect(wrapper.emitted('update:end')).toBeUndefined()
    wrapper.unmount()
  })
})

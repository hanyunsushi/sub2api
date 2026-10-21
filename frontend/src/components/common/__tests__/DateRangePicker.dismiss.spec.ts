import { mount, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import DateRangePicker from '../DateRangePicker.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key, locale: ref('en') }) }))
enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())
const mountPicker = () => mount(DateRangePicker,{props:{startDate:'2026-10-01',endDate:'2026-10-02'},global:{stubs:{SystemDateRangePicker:true}}})

describe('uncommitted date draft',()=>{
  it('does not emit while shared calendar has not applied, and follows external committed dates',async()=>{
    const wrapper=mountPicker(),calendar=wrapper.findComponent({name:'SystemDateRangePicker'})
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.setProps({startDate:'2026-11-01',endDate:'2026-11-03'})
    expect(calendar.props('modelValue').start.getMonth()).toBe(10)
    expect(calendar.props('modelValue').end.getDate()).toBe(3)
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})

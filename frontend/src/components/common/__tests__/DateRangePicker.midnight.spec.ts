import { mount, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import DateRangePicker from '../DateRangePicker.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key, locale: ref('en') }) }))
enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())
const mountPicker = () => mount(DateRangePicker,{props:{startDate:'2026-10-01',endDate:'2026-10-02'},global:{stubs:{SystemDateRangePicker:true}}})

describe('shortcuts after midnight',()=>{
  it('refreshes shortcuts and tomorrow limit when opened on the next day',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date(2026,8,30,23,59))
    const wrapper=mountPicker(),calendar=wrapper.findComponent({name:'SystemDateRangePicker'})
    vi.setSystemTime(new Date(2026,9,1,0,1));await wrapper.get('div').trigger('pointerdown')
    expect(calendar.props('maxDate').getDate()).toBe(2)
    expect(calendar.props('presets')[0].range().end.getMonth()).toBe(9)
    expect(calendar.props('presets')[3].range().start.getDate()).toBe(25)
  })
})

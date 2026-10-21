import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import type { ReactElement } from 'react'
import OpsDashboardHeader from '../OpsDashboardHeader.vue'
import type { DateRange } from '@/components/common/date-range/date-range-picker-react'

vi.mock('@/api', () => ({ adminAPI: { groups: { getAll: vi.fn().mockResolvedValue([]) } } }))
vi.mock('@/api/admin/ops', () => ({ opsAPI: { getRealtimeTrafficSummary: vi.fn().mockResolvedValue({ enabled: true, summary: null }) } }))
vi.mock('@/stores', () => ({ useAdminSettingsStore: () => ({ opsRealtimeMonitoringEnabled: true, setOpsRealtimeMonitoringEnabledLocal: vi.fn() }) }))
vi.mock('vue-i18n', async () => ({
  ...await vi.importActual<typeof import('vue-i18n')>('vue-i18n'),
  useI18n: () => ({ t: (key: string) => key })
}))
enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())

async function mountRange(now: Date, custom?: { start: string; end: string }) {
  expect(now.getTimezoneOffset()).toBe(-480)
  vi.useFakeTimers()
  vi.setSystemTime(now)
  const wrapper = mount(OpsDashboardHeader, {
    props: { platform: '', groupId: null, timeRange: custom ? 'custom' : '1h', customStartTime: custom?.start, customEndTime: custom?.end, queryMode: 'auto', loading: false, lastUpdated: null },
    global: { stubs: { Select: true, HelpTooltip: true, Icon: true, SystemDateRangePicker: true, BaseDialog: true } }
  })
  await flushPromises()
  const picker = wrapper.findComponent({ name: 'SystemDateRangePicker' })
  const clockInputs = () => {
    const controls = picker.props('renderRangeControls')(picker.props('modelValue')) as ReactElement<{ children: ReactElement<{ children: unknown[] }>[] }>
    return controls.props.children.map(label => label.props.children[1] as ReactElement<{ value: string; onChange: (event: { target: { value: string } }) => void }>)
  }
  return { wrapper, picker, clockInputs }
}

describe('ops unified time range timezone', () => {
  it.each([
    [14, 23, '2026-10-09T13:23', '2026-10-09T14:23'],
    [0, 15, '2026-10-08T23:15', '2026-10-09T00:15']
  ] as const)('prefills the previous local hour at %i:%i', async (hour, minute, start, end) => {
    const { picker, clockInputs } = await mountRange(new Date(2026, 9, 9, hour, minute))
    const range = picker.props('modelValue') as DateRange
    expect(range.start.getTime()).toBe(new Date(start).getTime())
    expect(range.end.getTime()).toBe(new Date(end).getTime())
    expect(clockInputs().map(input => input.props.value)).toEqual([start.slice(11), end.slice(11)])
  })

  it('submits selected calendar days with original clocks only when Apply emits', async () => {
    const { wrapper, picker, clockInputs } = await mountRange(new Date(2026, 9, 9, 14, 23))
    const range = { start: new Date(2026, 9, 5), end: new Date(2026, 9, 7) }
    picker.props('renderRangeControls')(range)
    expect(wrapper.emitted('update:customTimeRange')).toBeUndefined()
    expect(clockInputs().map(input => input.props.value)).toEqual(['13:23', '14:23'])
    picker.vm.$emit('change', range)
    await flushPromises()
    expect(wrapper.emitted('update:customTimeRange')).toEqual([[new Date(2026, 9, 5, 13, 23).toISOString(), new Date(2026, 9, 7, 14, 23).toISOString()]])
    expect(wrapper.emitted('update:timeRange')).toEqual([['custom']])
  })

  it.each(['5m', '30m', '1h', '6h', '24h'])('retains the rolling %s query value after preset confirmation', async mode => {
    const { wrapper, picker } = await mountRange(new Date(2026, 9, 9, 14, 23))
    const index = ['5m', '30m', '1h', '6h', '24h'].indexOf(mode)
    const preset = picker.props('presets')[index]
    picker.props('onPresetSelect')(preset, index)
    await flushPromises()
    expect(wrapper.emitted('update:timeRange')).toBeUndefined()
    picker.vm.$emit('change', preset.range(new Date()))
    await flushPromises()
    expect(wrapper.emitted('update:timeRange')).toEqual([[mode]])
    expect(wrapper.emitted('update:customTimeRange')).toBeUndefined()
  })

  it('distinguishes same-day minute presets and keeps clock edits in the confirmed custom range', async () => {
    const { wrapper, picker, clockInputs } = await mountRange(new Date(2026, 9, 9, 14, 23))
    const [five, thirty] = picker.props('presets').map((preset: { range: (date: Date) => DateRange }) => preset.range(new Date()))
    expect(picker.props('isSameRange')(five, thirty)).toBe(false)
    clockInputs()[0].props.onChange({ target: { value: '09:17' } })
    clockInputs()[1].props.onChange({ target: { value: '18:43' } })
    await flushPromises()
    expect(wrapper.emitted('update:customTimeRange')).toBeUndefined()
    picker.vm.$emit('change', { start: new Date(2026, 9, 1), end: new Date(2026, 9, 20) })
    await flushPromises()
    expect(wrapper.emitted('update:customTimeRange')).toEqual([[new Date(2026, 9, 1, 9, 17).toISOString(), new Date(2026, 9, 20, 18, 43).toISOString()]])
  })

  it('restores committed custom minutes and blocks inverted or empty clock drafts', async () => {
    const custom = { start: new Date(2026, 9, 1, 9, 17).toISOString(), end: new Date(2026, 9, 20, 18, 43).toISOString() }
    const { picker, clockInputs } = await mountRange(new Date(2026, 9, 20, 20), custom)
    expect(clockInputs().map(input => input.props.value)).toEqual(['09:17', '18:43'])
    const sameDay = { start: new Date(2026, 9, 20), end: new Date(2026, 9, 20) }
    clockInputs()[1].props.onChange({ target: { value: '08:00' } })
    await flushPromises()
    expect(picker.props('canApplyRange')(sameDay)).toBe(false)
    clockInputs()[1].props.onChange({ target: { value: '' } })
    await flushPromises()
    expect(picker.props('canApplyRange')(sameDay)).toBe(false)
  })
})

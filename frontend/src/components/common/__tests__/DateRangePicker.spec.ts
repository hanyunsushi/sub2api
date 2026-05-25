import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

import DateRangePicker from '../DateRangePicker.vue'

const componentSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../DateRangePicker.vue'),
  'utf8'
)

const messages: Record<string, string> = {
  'dates.today': 'Today',
  'dates.yesterday': 'Yesterday',
  'dates.last24Hours': 'Last 24 Hours',
  'dates.last7Days': 'Last 7 Days',
  'dates.last14Days': 'Last 14 Days',
  'dates.last30Days': 'Last 30 Days',
  'dates.thisMonth': 'This Month',
  'dates.lastMonth': 'Last Month',
  'dates.startDate': 'Start Date',
  'dates.endDate': 'End Date',
  'dates.apply': 'Apply',
  'dates.selectDateRange': 'Select date range'
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => messages[key] ?? key,
    locale: ref('en')
  })
}))

afterEach(() => {
  document.body.innerHTML = ''
})

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('DateRangePicker', () => {
  it('uses last 24 hours as the default recognized preset', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const wrapper = mount(DateRangePicker, {
      props: {
        startDate: formatLocalDate(yesterday),
        endDate: formatLocalDate(now)
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Last 24 Hours')
  })

  it('emits range updates with last24Hours preset when applied', async () => {
    const now = new Date()
    const today = formatLocalDate(now)

    const wrapper = mount(DateRangePicker, {
      props: {
        startDate: today,
        endDate: today
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    })

    await wrapper.find('.date-picker-trigger').trigger('click')
    await nextTick()
    const presetButton = document.body.querySelectorAll('.date-picker-preset')
    const last24Button = Array.from(presetButton).find((node) =>
      node.textContent?.includes('Last 24 Hours')
    ) as HTMLButtonElement | undefined
    expect(last24Button).toBeDefined()

    last24Button!.click()
    await nextTick()
    const applyButton = document.body.querySelector('.date-picker-apply') as HTMLButtonElement | null
    expect(applyButton).not.toBeNull()

    applyButton!.click()
    await nextTick()

    const nowAfterClick = new Date()
    const yesterdayAfterClick = new Date(nowAfterClick.getTime() - 24 * 60 * 60 * 1000)
    const expectedStart = formatLocalDate(yesterdayAfterClick)
    const expectedEnd = formatLocalDate(nowAfterClick)

    expect(wrapper.emitted('update:startDate')?.[0]).toEqual([expectedStart])
    expect(wrapper.emitted('update:endDate')?.[0]).toEqual([expectedEnd])
    expect(wrapper.emitted('change')?.[0]).toEqual([
      {
        startDate: expectedStart,
        endDate: expectedEnd,
        preset: 'last24Hours'
      }
    ])
  })

  it('teleports the dropdown above dashboard card stacking contexts', async () => {
    const now = new Date()
    const today = formatLocalDate(now)

    mount(DateRangePicker, {
      props: {
        startDate: today,
        endDate: today
      },
      global: {
        stubs: {
          Icon: true
        }
      },
      attachTo: document.body
    })

    const trigger = document.body.querySelector('.date-picker-trigger') as HTMLButtonElement | null
    expect(trigger).not.toBeNull()

    trigger!.click()
    await nextTick()

    const dropdown = document.body.querySelector('.date-picker-dropdown-portal') as HTMLElement | null
    expect(dropdown).not.toBeNull()
    expect(dropdown?.closest('[data-v-app]')).toBeNull()
    expect(dropdown?.style.position).toBe('fixed')
    expect(dropdown?.style.zIndex).toBe('100000030')
    expect(dropdown?.style.minWidth).toBe('320px')
  })

  it('keeps teleported dark dropdown hover states readable outside dashboard scope', () => {
    expect(componentSource).toContain('background:')
    expect(componentSource).toContain('background: var(--atelier-paper-2) !important')
    expect(componentSource).not.toContain('background-size: 28px 28px, 28px 28px, auto !important;')
    expect(componentSource).toContain('color: var(--atelier-ink);')
    expect(componentSource).toContain('box-shadow: 0 18px 38px -30px rgba(17, 24, 39, 0.58) !important;')
    expect(componentSource).toContain('.dark .date-picker-dropdown-portal .date-picker-preset:hover')
    expect(componentSource).toContain('.dark .date-picker-dropdown-portal .date-picker-preset-active:hover')
    expect(componentSource).toContain('background: var(--atelier-paper-2) !important;')
    expect(componentSource).toContain('color: var(--atelier-ink);')
    expect(componentSource).not.toContain('background: #111827;')
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('.admin-dashboard-atelier .date-picker-dropdown-portal')
    expect(componentSource).not.toContain('transition: all 0.2s ease')
  })
})

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

import DateRangePicker from '../DateRangePicker.vue'
import Select from '../Select.vue'

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

const cssBlock = (source: string, selector: string) => {
  const selectorIndex = source.indexOf(selector)
  expect(selectorIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
  const openBraceIndex = source.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => messages[key] ?? key,
    locale: ref('en')
  })
}))

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('DateRangePicker', () => {
  it('opens dropdowns on hover like the Anthropic nav filters', () => {
    expect(componentSource).toContain('@mouseenter="openDropdown"')
    expect(componentSource).toContain('@pointerenter="openDropdown"')
    expect(componentSource).toContain('@mouseleave="scheduleHoverClose"')
    expect(componentSource).toContain('@mouseenter="cancelHoverClose"')
    expect(componentSource).toContain('@click="openDropdown"')
    expect(componentSource).not.toContain('@mouseover="openDropdown"')
    expect(componentSource).not.toContain(String.raw`@pointerenter="openDropdown"
      @mouseenter="openDropdown"
      @mouseover="openDropdown"
      :class="['date-picker-trigger', isOpen && 'date-picker-trigger-open']"`)
    expect(componentSource).toContain('const openDropdown = () => {')
    expect(componentSource).toContain('const scheduleHoverClose = () => {')
    expect(componentSource).toContain('const isPointerWithinDropdown = (target: EventTarget | null)')
    expect(componentSource).toContain('dropdownRef.value?.contains(target)')
    expect(componentSource).toContain("document.addEventListener('pointermove', handleDocumentHoverMove")
    expect(componentSource).toContain("document.addEventListener('mousemove', handleDocumentHoverMove")
    expect(componentSource).not.toContain('@click="toggle"')
  })

  it('hides the leading calendar icon so time-range filters are text plus chevron only', () => {
    const iconBlockStart = componentSource.indexOf('.date-picker-icon {')
    const iconBlockEnd = componentSource.indexOf('}', iconBlockStart)
    const iconBlock = componentSource.slice(iconBlockStart, iconBlockEnd + 1)

    expect(iconBlockStart).toBeGreaterThanOrEqual(0)
    expect(iconBlock).toContain('display: none !important;')
    expect(iconBlock).not.toContain('@apply text-gray-400')
    expect(componentSource).not.toContain('<Icon')
    expect(componentSource).not.toContain("import Icon from")
    expect(componentSource).not.toContain('<Icon name="calendar"')
    expect(componentSource).not.toContain('<Icon\n          name="chevronDown"')
    expect(componentSource).toContain('<span class="date-picker-chevron" aria-hidden="true"></span>')
    expect(componentSource).toContain(':global(#app .app-layout-content .usage-filter-left .date-picker-trigger)')
    expect(componentSource).toContain('background-color: transparent !important;')
    expect(componentSource).toContain('text-decoration-line: underline !important;')
  })

  it('uses design-system text date inputs instead of native date pickers', () => {
    expect(componentSource).toContain('type="text"')
    expect(componentSource).toContain('inputmode="numeric"')
    expect(componentSource).toContain('placeholder="YYYY-MM-DD"')
    expect(componentSource).toContain('pattern="\\d{4}-\\d{2}-\\d{2}"')
    expect(componentSource).toContain("const normalizeDateInput = (field: 'start' | 'end')")
    expect(componentSource).toContain("normalizeDateInput('start')")
    expect(componentSource).toContain("normalizeDateInput('end')")
    expect(componentSource).not.toContain('type="date"')
    expect(componentSource).not.toContain('type="datetime-local"')
    expect(componentSource).toContain('.date-picker-dropdown-portal .date-picker-input::-webkit-calendar-picker-indicator')
    expect(componentSource).toContain('display: none !important;')
  })

  it('keeps the custom date range separator vertically centered with the inputs', () => {
    const customBlock = cssBlock(componentSource, '.date-picker-dropdown-portal .date-picker-custom')
    expect(customBlock).toContain('--date-picker-input-height: 2.125rem;')

    const inputBlock = cssBlock(componentSource, '.date-picker-dropdown-portal .date-picker-input')
    expect(inputBlock).toContain('min-height: var(--date-picker-input-height);')

    const separatorBlock = cssBlock(componentSource, '.date-picker-dropdown-portal .date-picker-separator')
    expect(separatorBlock).toContain('align-items: center;')
    expect(separatorBlock).toContain('justify-content: center;')
    expect(separatorBlock).toContain('align-self: flex-end;')
    expect(separatorBlock).toContain('height: var(--date-picker-input-height);')
    expect(separatorBlock).toContain('padding-bottom: 0;')
    expect(separatorBlock).not.toContain('pb-1')
  })

  it('closes a hover-opened dropdown after the pointer leaves', async () => {
    vi.useFakeTimers()
    const today = formatLocalDate(new Date())

    const wrapper = mount(DateRangePicker, {
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

    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(document.body.querySelector('.date-picker-dropdown-portal')).not.toBeNull()

    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(119)
    await nextTick()
    expect(document.body.querySelector('.date-picker-dropdown-portal')).not.toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.date-picker-trigger').classes()).not.toContain('date-picker-trigger-open')

    wrapper.unmount()
  })

  it('closes an open dropdown when the pointer moves outside the trigger and portal', async () => {
    vi.useFakeTimers()
    const today = formatLocalDate(new Date())

    const wrapper = mount(DateRangePicker, {
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

    await wrapper.find('.date-picker-trigger').trigger('click')
    await nextTick()
    expect(document.body.querySelector('.date-picker-dropdown-portal')).not.toBeNull()

    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(119)
    await nextTick()
    expect(document.body.querySelector('.date-picker-dropdown-portal')).not.toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.date-picker-trigger').classes()).not.toContain('date-picker-trigger-open')

    wrapper.unmount()
  })

  it('closes an open date picker when another shared dropdown opens', async () => {
    const today = formatLocalDate(new Date())
    const dateWrapper = mount(DateRangePicker, {
      props: {
        startDate: today,
        endDate: today
      },
      attachTo: document.body
    })
    const selectWrapper = mount(Select, {
      props: {
        modelValue: 'day',
        options: [
          { value: 'day', label: 'Day' },
          { value: 'hour', label: 'Hour' }
        ]
      },
      global: {
        stubs: {
          Icon: true
        }
      },
      attachTo: document.body
    })

    await dateWrapper.find('.date-picker-trigger').trigger('click')
    await nextTick()
    expect(dateWrapper.find('.date-picker-trigger').classes()).toContain('date-picker-trigger-open')

    await selectWrapper.find('.select-trigger').trigger('click')
    await nextTick()

    expect(dateWrapper.find('.date-picker-trigger').classes()).not.toContain('date-picker-trigger-open')
    expect(selectWrapper.find('.select-trigger').attributes('aria-expanded')).toBe('true')
    expect(document.body.querySelectorAll('.date-picker-dropdown-portal')).toHaveLength(0)
    expect(document.body.querySelectorAll('.select-dropdown-portal')).toHaveLength(1)

    dateWrapper.unmount()
    selectWrapper.unmount()
  })

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
    expect(applyButton!.classList.contains('btn')).toBe(true)
    expect(applyButton!.classList.contains('btn-secondary')).toBe(true)

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
    expect(componentSource).toContain('box-shadow: var(--anthropic-dropdown-shadow, 0 4px 24px rgba(0, 0, 0, 0.05)) !important;')
    expect(componentSource).toContain('.date-picker-dropdown-portal .date-picker-preset:hover:not(.date-picker-preset-active)')
    expect(componentSource).toContain('.date-picker-dropdown-portal .date-picker-preset-active:hover')
    expect(componentSource).toContain('color: var(--date-picker-muted-text);')
    expect(componentSource).not.toContain('color: #f8fbff;')
    expect(componentSource).not.toContain('background: rgba(0, 47, 167, 0.24);')
    expect(componentSource).toContain('background: var(--atelier-paper-2) !important;')
    expect(componentSource).toContain('color: var(--atelier-ink);')
    expect(componentSource).not.toContain('background: #111827;')
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).toContain('.date-picker-dropdown-portal .date-picker-input:focus {')
    expect(componentSource).toContain('.date-picker-dropdown-portal .date-picker-input:focus-visible {')
    expect(componentSource).toContain('border-color: var(--anthropic-border, var(--atelier-material-edge));')
    expect(componentSource).toContain('outline: 2px solid var(--anthropic-focus')
    expect(componentSource).toContain('class="btn btn-secondary date-picker-apply"')
    expect(componentSource).toContain('padding: 1rem;')
    expect(componentSource).toContain('background: transparent;')
    expect(componentSource).toContain('color: var(--anthropic-fg, var(--atelier-ink));')
    expect(componentSource).toContain('--button-bg-hover: var(--anthropic-fg, var(--atelier-ink));')
    expect(componentSource).toContain('background: var(--button-bg-hover);')
    expect(componentSource).toContain('min-width: 4.75rem;')
    expect(componentSource).toContain('box-shadow: 0 0 0 var(--button-border-width, 1px) var(--button-border);')
    expect(componentSource).toContain('box-shadow: 0 0 0 var(--button-border-width-hover, 1px) var(--button-border-hover);')
    expect(componentSource).not.toContain('0 0 0 var(--button-spacer-hover, 1px) var(--anthropic-page')
    expect(componentSource).not.toContain('.date-picker-trigger:is(:hover, :focus, :focus-visible, .date-picker-trigger-open)')
    expect(componentSource).not.toContain('.admin-dashboard-atelier .date-picker-dropdown-portal')
    expect(componentSource).not.toContain('transition: all 0.2s ease')
  })
})

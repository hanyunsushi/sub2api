import { describe, expect, it } from 'vitest'
import { afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import componentSource from '../Select.vue?raw'
import Select from '../Select.vue'
import DateRangePicker from '../DateRangePicker.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' }
  })
}))

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  setViewportWidth(originalInnerWidth)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Select portal styles', () => {
  it('opens dropdowns on hover like the Anthropic nav filters', () => {
    expect(componentSource).toContain('@mouseenter="openDropdown"')
    expect(componentSource).toContain('@pointerenter="openDropdown"')
    expect(componentSource).toContain('@mouseleave="scheduleHoverClose"')
    expect(componentSource).toContain('@mouseenter="cancelHoverClose"')
    expect(componentSource).toContain('@click="openDropdown"')
    expect(componentSource).not.toContain('@mouseover="openDropdown"')
    expect(componentSource).not.toContain('@pointerenter="openDropdown"\n      @mouseenter="openDropdown"\n      @mouseover="openDropdown"')
    expect(componentSource).toContain('const openDropdown = () => {')
    expect(componentSource).toContain('const scheduleHoverClose = () => {')
    expect(componentSource).toContain('const isPointerWithinDropdown = (target: EventTarget | null)')
    expect(componentSource).toContain('dropdownRef.value?.contains(target)')
    expect(componentSource).toContain("document.addEventListener('pointermove', handleDocumentHoverMove")
    expect(componentSource).toContain("document.addEventListener('mousemove', handleDocumentHoverMove")
    expect(componentSource).not.toContain('@click="toggle"')
  })

  it('closes a hover-opened dropdown after the pointer leaves', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Select, {
      props: {
        modelValue: 'hour',
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

    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(document.body.querySelector('.select-dropdown-portal')).not.toBeNull()

    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(119)
    await nextTick()
    expect(document.body.querySelector('.select-dropdown-portal')).not.toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.select-trigger').classes()).not.toContain('select-trigger-open')
    expect(wrapper.find('.select-trigger').attributes('aria-expanded')).toBe('false')

    wrapper.unmount()
  })

  it('closes an open dropdown when the pointer moves outside the trigger and portal', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Select, {
      props: {
        modelValue: 'hour',
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

    await wrapper.find('.select-trigger').trigger('click')
    await nextTick()
    expect(document.body.querySelector('.select-dropdown-portal')).not.toBeNull()

    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(119)
    await nextTick()
    expect(document.body.querySelector('.select-dropdown-portal')).not.toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.select-trigger').attributes('aria-expanded')).toBe('false')

    wrapper.unmount()
  })

  it('closes an open select when another shared dropdown opens', async () => {
    const selectWrapper = mount(Select, {
      props: {
        modelValue: 'hour',
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
    const dateWrapper = mount(DateRangePicker, {
      props: {
        startDate: '2026-06-28',
        endDate: '2026-06-28'
      },
      attachTo: document.body
    })

    await selectWrapper.find('.select-trigger').trigger('click')
    await nextTick()
    expect(selectWrapper.find('.select-trigger').attributes('aria-expanded')).toBe('true')

    await dateWrapper.find('.date-picker-trigger').trigger('click')
    await nextTick()

    expect(selectWrapper.find('.select-trigger').attributes('aria-expanded')).toBe('false')
    expect(dateWrapper.find('.date-picker-trigger').classes()).toContain('date-picker-trigger-open')
    expect(document.body.querySelectorAll('.select-dropdown-portal')).toHaveLength(0)
    expect(document.body.querySelectorAll('.date-picker-dropdown-portal')).toHaveLength(1)

    selectWrapper.unmount()
    dateWrapper.unmount()
  })

  it('keeps teleported dark option hover states readable outside page scopes', () => {
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option:hover')
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option-focused')
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option-selected:hover')
    expect(componentSource).toContain('--select-option-text: var(--atelier-muted);')
    expect(componentSource).toContain('--select-option-stable-text: var(--select-option-text);')
    expect(componentSource).toContain('--select-option-selected-text: var(--atelier-ink);')
    expect(componentSource).toContain('color: var(--select-option-stable-text);')
    expect(componentSource).not.toContain('--select-option-hover-text')
    expect(componentSource).not.toContain('--select-surface: #111827;')
    expect(componentSource).not.toContain('color: var(--atelier-blue-dark);')
    expect(componentSource).not.toContain('.admin-dashboard-atelier .select-dropdown-portal')
  })

  it('uses atelier surface tokens for trigger, portal, option states, and reveal motion', () => {
    expect(componentSource).toContain('--select-component-surface: var(--select-default-surface, var(--atelier-paper-2));')
    expect(componentSource).toContain('--select-surface: var(--select-component-surface);')
    expect(componentSource).toContain('--select-muted-surface: var(--select-component-surface);')
    expect(componentSource).toContain(':global(#app .app-layout-content .table-filter-left .select-trigger)')
    expect(componentSource).not.toContain(':global(#app .app-layout-content .table-filter-left) .select-trigger')
    expect(componentSource).toContain('--select-default-surface: transparent !important;')
    expect(componentSource).toContain('--select-component-surface: transparent !important;')
    expect(componentSource).toContain('background-color: transparent !important;')
    expect(componentSource).toContain('--select-option-selected-surface: var(--anthropic-cookbook-hover, var(--atelier-ui-hover-surface));')
    expect(componentSource).toContain('--select-option-focused-surface: var(--select-option-hover-surface);')
    expect(componentSource).toContain('--select-option-hover-surface: var(--anthropic-section, var(--atelier-paper-2));')
    expect(componentSource).toContain('class="select-dropdown-portal"')
    expect(componentSource).toContain(':class="[selectDropdownVariantClass, instanceId, portalClass]"')
    expect(componentSource).toContain("menuVariant?: 'auto' | 'underline' | 'highlight'")
    expect(componentSource).toContain("props.menuVariant === 'underline'")
    expect(componentSource).toContain("props.menuVariant === 'highlight'")
    expect(componentSource).toContain("filter-underline-menu select-dropdown-portal--underline")
    expect(componentSource).toContain("dropdown-highlight-menu select-dropdown-portal--highlight")
    expect(componentSource).toContain('.select-dropdown-portal--underline .select-option')
    expect(componentSource).toContain('padding: 12px;')
    expect(componentSource).toContain('border-radius: 8px;')
    expect(componentSource).toContain('background: var(--select-surface);')
    expect(componentSource).toContain('border-color: var(--anthropic-cookbook-border, var(--atelier-line));')
    expect(componentSource).toContain('background: var(--select-option-selected-surface);')
    expect(componentSource).toContain('text-decoration-line: none;')
    expect(componentSource).toContain('.select-dropdown-portal .select-search-input:focus {')
    expect(componentSource).toContain('.select-dropdown-portal .select-search-input:focus-visible {')
    expect(componentSource).toContain('outline: 2px solid var(--anthropic-focus')
    expect(componentSource).toContain('.select-dropdown-portal .select-option-selected :where(.select-option-label, svg)')
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('transform: scale(')
  })
})

describe('Select remote search', () => {
  const mountRemoteSelect = (props: Record<string, unknown> = {}) => {
    const wrapper = mount(Select, {
      props: {
        modelValue: null,
        remote: true,
        options: [
          { value: 'alpha', label: 'Alpha account' },
          { value: 'beta', label: 'Beta account' },
        ],
        ...props,
      },
    })
    unmountWrapper = () => wrapper.unmount()
    return wrapper
  }

  const openDropdown = async () => {
    const dropdown = document.body.querySelector<HTMLElement>('.select-dropdown-portal')
    expect(dropdown).not.toBeNull()
    return dropdown as HTMLElement
  }

  const typeSearchQuery = async (query: string) => {
    const dropdown = await openDropdown()
    const input = dropdown.querySelector<HTMLInputElement>('.select-search-input')
    expect(input).not.toBeNull()
    input!.value = query
    input!.dispatchEvent(new Event('input'))
    await nextTick()
  }

  it('emits debounced search events and skips local filtering in remote mode', async () => {
    vi.useFakeTimers()
    const wrapper = mountRemoteSelect()
    await wrapper.get('button').trigger('click')
    await nextTick()

    await typeSearchQuery('zzz')

    // 防抖窗口内不触发。
    expect(wrapper.emitted('search')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(300)

    expect(wrapper.emitted('search')).toEqual([['zzz']])
    // 远程模式不做本地过滤：无命中的 query 下选项仍完整展示（由父组件更新 options）。
    const dropdown = await openDropdown()
    const labels = [...dropdown.querySelectorAll('.select-option-label')].map((el) => el.textContent)
    expect(labels).toContain('Alpha account')
    expect(labels).toContain('Beta account')
  })

  it('does not emit search when the dropdown closes and the query resets', async () => {
    vi.useFakeTimers()
    const wrapper = mountRemoteSelect()
    await wrapper.get('button').trigger('click')
    await nextTick()

    await typeSearchQuery('hidden')

    // 关闭下拉：排队中的防抖定时器应被取消，也不应因 query 重置而尾随 emit。
    await wrapper.get('button').trigger('click')
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)

    expect(wrapper.emitted('search')).toBeUndefined()
  })

  it('shows the loading text instead of empty text while loading with no options', async () => {
    const wrapper = mountRemoteSelect({ options: [], loading: true })
    await wrapper.get('button').trigger('click')
    await nextTick()

    const dropdown = await openDropdown()
    expect(dropdown.querySelector('.select-empty')?.textContent).toContain('common.loading')
  })

  it('keeps local filtering and emits nothing when remote is not set', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Select, {
      props: {
        modelValue: null,
        searchable: true,
        options: [
          { value: 'alpha', label: 'Alpha account' },
          { value: 'beta', label: 'Beta account' },
        ],
      },
    })
    unmountWrapper = () => wrapper.unmount()
    await wrapper.get('button').trigger('click')
    await nextTick()

    await typeSearchQuery('alpha')
    await vi.advanceTimersByTimeAsync(300)

    expect(wrapper.emitted('search')).toBeUndefined()
    const dropdown = await openDropdown()
    const labels = [...dropdown.querySelectorAll('.select-option-label')].map((el) => el.textContent)
    expect(labels).toEqual(['Alpha account'])
  })
})

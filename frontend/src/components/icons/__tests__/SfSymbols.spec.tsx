import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { renderToStaticMarkup } from 'react-dom/server'
import Icon from '../Icon.vue'
import SidebarIcon from '../SidebarIcon.vue'
import { SfSymbolReact } from '../SfSymbolReact'
import { resolveSfIcon, sfIconPairs, sfSymbols, type SfIconName } from '../sf-symbols'
import RefreshButton from '@/components/common/RefreshButton.vue'
import InfoNotice from '@/components/common/InfoNotice.vue'

const wrappers: Array<{ unmount: () => void }> = []
afterEach(() => { wrappers.splice(0).forEach(w => w.unmount()) })

describe('real SF Symbols Regular exports', () => {
  it('resolves every functional alias to two distinct, attributed contours', () => {
    for (const name of Object.keys(sfIconPairs) as SfIconName[]) {
      const outline = resolveSfIcon(name), fill = resolveSfIcon(name, true)
      expect(outline.exportName).not.toBe(fill.exportName)
      expect(outline.symbol.paths).not.toEqual(fill.symbol.paths)
      for (const { symbol, exportName } of [outline, fill]) {
        expect(symbol.source).toContain('/blob/2a0100e93e11a22ea0ff5e0530efd10e2cf0d243/dist/module/sf')
        expect(symbol.source).toContain(`sf${exportName}.js`)
        expect(symbol.sha256).toMatch(/^[a-f0-9]{64}$/)
        expect(symbol.viewBox.split(' ').map(Number).every(Number.isFinite)).toBe(true)
        expect(symbol.paths.every(p => p.d.length > 0 && (p.fillOpacity ?? 1) <= 1)).toBe(true)
      }
    }
  })
  it('preserves exact viewBoxes and all original path opacity instead of adding strokes', async () => {
    const wrapper = mount(Icon, { props: { name: 'bell', label: '公告' } }); wrappers.push(wrapper)
    expect(wrapper.get('svg').attributes('viewBox')).toBe(sfSymbols.Bell.viewBox)
    expect(wrapper.get('svg').attributes('stroke')).toBe('none')
    expect(wrapper.get('svg').attributes('role')).toBe('img')
    expect(wrapper.get('svg').attributes('aria-label')).toBe('公告')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBeUndefined()
    wrapper.findAll('path').forEach((path, index) => {
      expect(path.attributes('d')).toBe(sfSymbols.Bell.paths[index]?.d)
      expect(path.attributes('fill-opacity')).toBe(String(sfSymbols.Bell.paths[index]?.fillOpacity))
    })
    await wrapper.get('svg').trigger('mouseenter'); await wrapper.get('svg').trigger('focus')
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfBell')
    await wrapper.setProps({ filled: true })
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfBellFill')
    expect(wrapper.get('svg').attributes('data-icon-weight')).toBe('Regular')
    expect(wrapper.get('path').attributes('d')).toBe(sfSymbols.BellFill.paths[0]?.d)
  })
  it('keeps brand and directional exceptions unchanged even when filled is requested', () => {
    for (const name of ['chevronDown', 'arrowRight', 'mcp'] as const) {
      const wrapper = mount(Icon, { props: { name, filled: true } }); wrappers.push(wrapper)
      expect(wrapper.get('svg').attributes('data-icon-library')).toBeUndefined()
      expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 24 24')
      expect(wrapper.get('svg').attributes('fill')).toBe('none')
      expect(wrapper.get('svg').attributes('stroke')).toBe('currentColor')
      expect(wrapper.get('path').attributes('d')).toBeTruthy()
    }
  })
  it('uses the same original export in the React date bridge', () => {
    const html = renderToStaticMarkup(<SfSymbolReact name="calendar" filled />)
    expect(html).toContain('data-icon-export="sfCalendarCircleFill"')
    expect(html).toContain(`viewBox="${sfSymbols.CalendarCircleFill.viewBox}"`)
    expect(html).toContain(`d="${sfSymbols.CalendarCircleFill.paths[0]?.d}"`)
    expect(html).toContain('aria-hidden="true"')
  })
  it('preserves explicit utility-sized boxes instead of imposing the default20px', () => {
    const wrapper = mount(Icon, { props: { name: 'key' }, attrs: { class: 'h-12 w-12' } }); wrappers.push(wrapper)
    expect(wrapper.get('svg').classes()).not.toContain('h-5')
    expect(wrapper.get('svg').classes()).toContain('h-12')
  })
})

describe('SF state ownership', () => {
  it('renders and cleans up inside a separate Host Vue runtime without sharing refs or lifecycle state', async () => {
    const source = readFileSync(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.global.prod.js'), 'utf8')
    const host = runInNewContext(`${source};Vue`, { document, window, Element, HTMLElement, SVGElement, console }) as typeof import('vue')
    expect(host.h).not.toBe(h)
    const root = document.createElement('div')
    document.body.append(root)
    const draw = (name: SfIconName, current?: string, expanded?: boolean) => host.render(host.h('button', {
      'aria-current': current, 'aria-expanded': expanded,
    }, [host.h(SidebarIcon, { name })]), root)
    try {
      draw('key')
      await flushPromises()
      expect(root.querySelector('svg')?.getAttribute('data-icon-export')).toBe('sfKey')
      const leafStyle = (root.querySelector('.sf-sidebar-symbol') as HTMLElement).style
      expect([leafStyle.display, leafStyle.width, leafStyle.height, leafStyle.color]).toEqual(['inline-flex', '16px', '16px', 'inherit'])
      expect(root.querySelector('.console-kreepai-surface')).toBeNull()
      const svgStyle = root.querySelector('svg')!.style
      expect([svgStyle.display, svgStyle.width, svgStyle.height, svgStyle.color]).toEqual(['block', '100%', '100%', 'inherit'])
      draw('key', 'page')
      await flushPromises()
      expect(root.querySelector('svg')?.getAttribute('data-icon-export')).toBe('sfKeyFill')
      draw('folder', 'page', false)
      await flushPromises()
      expect(root.querySelector('svg')?.getAttribute('data-icon-export')).toBe('sfFolder')
      draw('folder', 'page', true)
      await flushPromises()
      expect(root.querySelector('svg')?.getAttribute('data-icon-export')).toBe('sfFolderFill')
      const leaf = root.querySelector('.sf-sidebar-symbol')!
      host.render(null, root)
      expect(leaf.childElementCount).toBe(0)
      draw('key')
      await flushPromises()
      expect(root.querySelectorAll('svg')).toHaveLength(1)
    } finally {
      host.render(null, root)
      root.remove()
    }
  })
  it('follows actual native/Host row selection and expansion, never hover or active descendants alone', async () => {
    const open = ref<boolean | undefined>(undefined), current = ref<string | undefined>(undefined)
    const wrapper = mount(defineComponent({ setup: () => () => h('button', { 'aria-expanded': open.value, 'aria-current': current.value }, [h(SidebarIcon, { name: 'key' })]) }), { attachTo: document.body }); wrappers.push(wrapper)
    const visibleFill = () => wrapper.get('svg').attributes('data-icon-export') === 'sfKeyFill'
    await flushPromises(); expect(visibleFill()).toBe(false)
    await wrapper.get('button').trigger('mouseenter'); await wrapper.get('button').trigger('focus'); expect(visibleFill()).toBe(false)
    current.value = 'page'; await nextTick(); await flushPromises(); expect(visibleFill()).toBe(true)
    open.value = false; await nextTick(); await flushPromises(); expect(visibleFill()).toBe(false)
    open.value = true; await nextTick(); await flushPromises(); expect(visibleFill()).toBe(true)
    open.value = false; await nextTick(); await flushPromises(); expect(visibleFill()).toBe(false)
    // Host owns sidebar colors; an exported icon must not create an app CSS root.
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.get('.sf-sidebar-symbol').classes()).not.toContain('console-kreepai-surface')
  })
  it('fills the refresh only while loading and keeps click/disabled semantics', async () => {
    const wrapper = mount(RefreshButton); wrappers.push(wrapper)
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfArrowClockwiseCircle')
    await wrapper.get('svg').trigger('mouseenter')
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfArrowClockwiseCircle')
    await wrapper.get('button').trigger('click'); expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ loading: true })
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfArrowClockwiseCircleFill')
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('button').trigger('click'); expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.setProps({ loading: false })
    expect(wrapper.get('svg').attributes('data-icon-export')).toBe('sfArrowClockwiseCircle')
  })
  it.each(['info', 'warning', 'danger', 'success'] as const)('uses real SF feedback with a visible text alternative: %s', tone => {
    const wrapper = mount(InfoNotice, { props: { tone }, slots: { default: '业务提示文字' } }); wrappers.push(wrapper)
    expect(wrapper.get('svg').attributes('data-icon-library')).toBe('SF Symbols')
    expect(wrapper.get('svg').attributes('data-icon-variant')).toBe('fill')
    expect(wrapper.text()).toBe('业务提示文字')
    expect(wrapper.get('.kreepai-info-notice').attributes('role')).toBe(tone === 'danger' ? 'alert' : 'status')
  })
})

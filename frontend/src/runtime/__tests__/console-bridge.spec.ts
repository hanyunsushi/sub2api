import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createConsoleActionBridge, consoleBridgeKey, useConsoleActions, useConsoleNavigation, useConsoleHeader } from '../console-actions'

describe('independent Console descriptors', () => {
  it('merges application controls without allowing stale page cleanup or disabled actions to win', () => {
    let authenticated = false
    const publish = vi.fn(), login = vi.fn(), oldPage = vi.fn(), newPage = vi.fn()
    const bridge = createConsoleActionBridge(() => authenticated ? [] : [{ key: 'login', label: '登录', run: login }], publish)
    const old = bridge.register(oldPage)
    bridge.setActions([{ key: 'refresh', label: '刷新' }]); bridge.dispatch('refresh'); bridge.dispatch('login')
    const current = bridge.register(newPage)
    bridge.setActions([{ key: 'create', label: '创建', loading: true }]); old()
    expect(publish.mock.lastCall?.[0].map((item: { key: string }) => item.key)).toEqual(['create', 'login'])
    bridge.dispatch('refresh'); bridge.dispatch('create'); expect(newPage).not.toHaveBeenCalled()
    bridge.setActions([{ key: 'create', label: '创建' }]); bridge.dispatch('create')
    expect(newPage).toHaveBeenCalledWith('create'); expect(oldPage).toHaveBeenCalledTimes(1)
    current(); expect(publish.mock.lastCall?.[0].map((item: { key: string }) => item.key)).toEqual(['login'])
    authenticated = true; bridge.update(); bridge.dispatch('login')
    expect(publish.mock.lastCall?.[0]).toEqual([]); expect(login).toHaveBeenCalledTimes(1)
  })
  it('reacts to permission-filtered menus and stops publishing after unmount', async () => {
    const admin = ref(false)
    const setNavigation = vi.fn()
    const component = defineComponent({ setup() {
      useConsoleNavigation(() => admin.value ? [{key:'users', label:'用户',path:'/admin/users'}] : [{key:'profile',label:'资料',path:'/profile'}])
      return () => h('span')
    } })
    const wrapper = mount(component, {global:{provide:{[consoleBridgeKey as symbol]:{setNavigation}}}})
    expect(setNavigation.mock.lastCall?.[0][0].path).toBe('/profile')
    admin.value = true
    await nextTick()
    expect(setNavigation.mock.lastCall?.[0][0].path).toBe('/admin/users')
    wrapper.unmount()
    const count = setNavigation.mock.calls.length
    admin.value = false
    await nextTick()
    expect(setNavigation).toHaveBeenCalledTimes(count)
  })
  it('routes topbar to original callback, respects busy/disabled, and unregisters', async () => {
    const busy=ref(false), disabled=ref(false), run=vi.fn(), setActions=vi.fn(), unregister=vi.fn()
    let dispatch: (key:string)=>void = () => {}
    const component=defineComponent({setup(){
      useConsoleActions([{key:'create',label:'创建',run,loading:()=>busy.value,disabled:()=>disabled.value}])
      return ()=>h('span')
    }})
    const wrapper=mount(component,{global:{provide:{[consoleBridgeKey as symbol]:{setActions,register:(handler:typeof dispatch)=>{dispatch=handler;return unregister}}}}})
    dispatch('unknown');expect(run).not.toHaveBeenCalled()
    dispatch('create');expect(run).toHaveBeenCalledTimes(1)
    busy.value=true;await nextTick();dispatch('create');expect(run).toHaveBeenCalledTimes(1)
    expect(setActions.mock.lastCall?.[0][0].loading).toBe(true)
    busy.value=false;disabled.value=true;await nextTick();dispatch('create');expect(run).toHaveBeenCalledTimes(1)
    wrapper.unmount();expect(unregister).toHaveBeenCalledTimes(1)
  })
  it('keeps the original header context and publishes actual readiness until unmounted', async () => {
    const title = ref('仪表盘'), ready = ref(false), setHeader = vi.fn()
    const target = document.createElement('div')
    const wrapper = mount(defineComponent({ setup() {
      expect(useConsoleHeader(() => title.value, () => ready.value)).toBe(target)
      return () => h('span')
    } }), { global: { provide: { [consoleBridgeKey as symbol]: { topbarTarget: target, setHeader } } } })
    const owner = setHeader.mock.lastCall?.[0]
    expect(setHeader.mock.lastCall?.[1]).toEqual({ mounted: true, title: '仪表盘', ready: false })
    ready.value = true; title.value = 'API 密钥'; await nextTick()
    expect(setHeader.mock.lastCall).toEqual([owner, { mounted: true, title: 'API 密钥', ready: true }])
    wrapper.unmount()
    expect(setHeader.mock.lastCall).toEqual([owner, null])
    const count = setHeader.mock.calls.length
    title.value = '卸载后'; await nextTick()
    expect(setHeader).toHaveBeenCalledTimes(count)
  })
  it('does nothing on standalone pages without a bridge', () => {
    const wrapper=mount(defineComponent({setup(){useConsoleActions([]);useConsoleNavigation(()=>[]);return()=>h('span')}}))
    expect(wrapper.exists()).toBe(true);wrapper.unmount()
  })
})

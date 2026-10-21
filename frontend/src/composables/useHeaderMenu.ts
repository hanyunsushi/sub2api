import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'

// 悬浮下拉菜单：同一顶栏仅保留一个打开项，不跨应用共享状态。
const headerMenuKey: InjectionKey<Ref<string | null>> = Symbol('header-menu')
export function provideHeaderMenu() {
  const activeMenu = ref<string | null>(null)
  provide(headerMenuKey, activeMenu)
  return activeMenu
}
export function useHeaderMenu(key: string) {
  const activeMenu = inject(headerMenuKey, null) ?? ref<string | null>(null)
  return computed({
    get: () => activeMenu.value === key,
    set: (open: boolean) => {
      if (open) activeMenu.value = key
      else if (activeMenu.value === key) activeMenu.value = null
    }
  })
}

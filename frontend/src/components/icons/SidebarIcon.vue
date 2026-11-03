<script lang="ts">
import { h, render, type VNode } from 'vue'
import Icon from './Icon.vue'
import type { SfIconName } from './sf-symbols'

interface MountedIcon { name: SfIconName; observer?: MutationObserver }
const mounted = new WeakMap<HTMLElement, MountedIcon>()

// 侧边栏 / 卡片SVG：Host只拥有叶子容器；图标由AI自己的Vue独立渲染，
// 不把template ref、setup状态或组件生命周期交给另一份Vue运行时。
function sync(root: HTMLElement, name: SfIconName) {
  const button = root.closest('button')
  const filled = button?.hasAttribute('aria-expanded')
    ? button.getAttribute('aria-expanded') === 'true'
    : button?.getAttribute('aria-current') === 'page'
  render(h(Icon, { name, filled: !!filled }), root)
}

export default function SidebarIcon({ name }: { name: SfIconName }) {
  return h('span', {
    class: 'sf-sidebar-symbol console-kreepai-surface',
    'aria-hidden': 'true',
    onVnodeMounted(vnode: VNode) {
      const root = vnode.el as HTMLElement
      const state: MountedIcon = { name }
      mounted.set(root, state)
      const button = root.closest('button')
      if (button) {
        state.observer = new MutationObserver(() => sync(root, state.name))
        state.observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded', 'aria-current'] })
      }
      sync(root, name)
    },
    onVnodeUpdated(vnode: VNode) {
      const root = vnode.el as HTMLElement
      const state = mounted.get(root)
      if (state) state.name = name
      sync(root, name)
    },
    onVnodeBeforeUnmount(vnode: VNode) {
      const root = vnode.el as HTMLElement
      mounted.get(root)?.observer?.disconnect()
      mounted.delete(root)
      render(null, root)
    },
  })
}
</script>
<style scoped>
/* 侧边栏：原20px槽位不变，不新增缩放、弹跳或交叉渐隐。 */
.sf-sidebar-symbol { display: inline-grid; width: 100%; height: 100%; place-items: center; }
</style>

<template>
  <!-- 侧边栏 / 卡片SVG：只读原生/Host按钮的真实状态，悬停不切Fill；不改变路由或Motion树。 -->
  <span ref="root" class="sf-sidebar-symbol console-kreepai-surface" aria-hidden="true">
    <Icon :name="name" :filled="selected" />
  </span>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import type { SfIconName } from './sf-symbols'
defineProps<{ name: SfIconName }>()
const root = ref<HTMLElement | null>(null)
const selected = ref(false)
let observer: MutationObserver | undefined
// 侧边栏：菜单DOM由原React/Host独占；从aria同步避免把其展开状态猜成当前路由或hover。
// 不使用跨@scope的祖先CSS选择器，以便同一图标在Console隔离产物中也能正确切换。
onMounted(() => {
  const button = root.value?.closest('button')
  if (!button) return
  const sync = () => { selected.value = button.hasAttribute('aria-expanded') ? button.getAttribute('aria-expanded') === 'true' : button.getAttribute('aria-current') === 'page' }
  sync()
  observer = new MutationObserver(sync)
  observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded', 'aria-current'] })
})
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
/* 侧边栏：原20px槽位不变，不新增缩放、弹跳或交叉渐隐。 */
.sf-sidebar-symbol { display: inline-grid; width: 100%; height: 100%; place-items: center; }
</style>

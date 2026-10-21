<template>
  <!-- 路由切换组件：单一跟随面连续移动；只发原值，不改查询、权限或业务请求。 -->
  <div ref="root" class="kreepai-route-switch" role="tablist" :aria-label="label" @pointerleave="reset" @focusout="onFocusOut" @keydown="onKeydown">
    <button v-for="option in options" :key="option.value" type="button" role="tab" :aria-selected="modelValue === option.value" :tabindex="modelValue === option.value ? 0 : -1" :class="{ active: modelValue === option.value }" @pointerenter="move($event.currentTarget as HTMLElement)" @focus="move($event.currentTarget as HTMLElement)" @click="$emit('update:modelValue', option.value)">{{ option.label }}</button>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps<{ modelValue: string; options: { value: string; label: string }[]; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const root = ref<HTMLElement | null>(null)
let observer: ResizeObserver | undefined
function move(button: HTMLElement | null) {
  if (!button || !root.value) return
  const parent = root.value.getBoundingClientRect(), rect = button.getBoundingClientRect()
  root.value.style.setProperty('--route-indicator-x', `${rect.left - parent.left + root.value.scrollLeft}px`)
  root.value.style.setProperty('--route-indicator-w', `${rect.width}px`)
}
function reset() { move(root.value?.querySelector('[aria-selected=true]') ?? null) }
function onFocusOut(event: FocusEvent) { if (!root.value?.contains(event.relatedTarget as Node | null)) reset() }
function onKeydown(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const buttons = [...root.value!.querySelectorAll<HTMLButtonElement>('button')]
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
  buttons[target]?.focus(); buttons[target]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  if (props.options[target]) emit('update:modelValue', props.options[target].value)
}
watch(() => [props.modelValue, props.options], () => { void nextTick(reset) }, { deep: true })
onMounted(() => { reset(); observer = new ResizeObserver(reset); observer.observe(root.value!) })
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
/* 路由切换组件：16/12/4轨道，240ms单面跟随；窄屏只在本控件横向滚动。 */
.kreepai-route-switch { position: relative; isolation: isolate; display: inline-flex; flex-wrap: nowrap; gap: 0; min-width: 0; max-width: 100%; min-height: 40px; padding: 4px; border: 0; border-radius: 16px; background: var(--card-hover); overflow-x: auto; scrollbar-width: thin; }
.kreepai-route-switch::before { content: ''; position: absolute; z-index: -1; top: 4px; bottom: 4px; left: 0; width: var(--route-indicator-w, 0px); transform: translateX(var(--route-indicator-x, 4px)); border-radius: 12px; background: var(--card); transition: transform .24s cubic-bezier(.215,.61,.355,1), width .24s cubic-bezier(.215,.61,.355,1); pointer-events: none; }
.kreepai-route-switch > button { flex: 0 0 auto; min-height: 32px; padding: 6px 14px; border: 0; border-radius: 12px; background: transparent; color: var(--text-2); font: 500 13px/20px var(--ff-body); white-space: nowrap; }
.kreepai-route-switch > button.active { color: var(--text); }
.kreepai-route-switch > button:focus-visible { outline: none; box-shadow: inset 0 0 0 2px rgba(29,39,51,.16); }
@media (pointer: coarse) { .kreepai-route-switch { min-height: 52px; } .kreepai-route-switch > button { min-height: 44px; } }
@media (prefers-reduced-motion: reduce) { .kreepai-route-switch::before { transition: none; } }
</style>

<template>
  <Teleport to="body" :disabled="!portal">
    <div data-testid="common-floating-dropdown-div-div"
      v-if="show && triggerEl && !hiddenByOwner"
      ref="panelRef"
      class="floating-dropdown-portal"
      :class="panelClass"
      :style="baseStyle"
      @mouseenter="emit('mouseenter', $event)"
      @mouseleave="emit('mouseleave', $event)"
      @click.stop
      @mousedown.stop
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import {
  claimDropdownOwner,
  onDropdownOwnerClaimed,
  releaseDropdownOwner
} from '@/utils/dropdownCoordinator'

type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

interface Props {
  show: boolean
  triggerEl: HTMLElement | null
  placement?: DropdownPlacement
  matchWidth?: boolean
  offset?: number
  zIndex?: number
  viewportPadding?: number
  panelClass?: string
  portal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-start',
  matchWidth: false,
  offset: 4,
  zIndex: 100000040,
  viewportPadding: 8,
  panelClass: '',
  portal: true
})

const emit = defineEmits<{
  (e: 'mouseenter', event: MouseEvent): void
  (e: 'mouseleave', event: MouseEvent): void
  (e: 'close'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const hiddenByOwner = ref(false)
const instanceId = `floating-dropdown-${Math.random().toString(36).slice(2, 9)}`
let previousShow = Boolean(props.show && props.triggerEl)
let stopDropdownOwnerListener: (() => void) | null = null
let activeFloatingClose: (() => void) | null = null

const baseStyle = computed(() => ({
  position: 'fixed' as const,
  zIndex: String(props.zIndex)
}))

const closeSelf = () => {
  if (hiddenByOwner.value) return
  hiddenByOwner.value = true
  emit('close')
}

const claimFloatingOwner = () => {
  if (!props.show || !props.triggerEl) return
  if (activeFloatingClose && activeFloatingClose !== closeSelf) activeFloatingClose()
  activeFloatingClose = closeSelf
  hiddenByOwner.value = false
  claimDropdownOwner(instanceId)
}

const updatePosition = () => {
  if (!props.triggerEl || !panelRef.value) return

  const rect = props.triggerEl.getBoundingClientRect()
  const panel = panelRef.value
  const panelWidth = panel.offsetWidth || (props.matchWidth ? rect.width : 0)
  const [vertical, horizontal] = props.placement.split('-') as ['bottom' | 'top', 'start' | 'end']
  const preferredLeft = horizontal === 'end' ? rect.right - panelWidth : rect.left
  const maxLeft = window.innerWidth - (panelWidth || rect.width) - props.viewportPadding
  const clampedLeft = Math.max(props.viewportPadding, Math.min(preferredLeft, maxLeft))

  panel.style.left = `${clampedLeft}px`
  if (props.matchWidth) panel.style.width = `${rect.width}px`
  panel.style.top = ''
  panel.style.bottom = ''

  const panelHeight = panel.offsetHeight || 240
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const shouldFlipUp = vertical === 'bottom' && spaceBelow < panelHeight && spaceAbove > spaceBelow
  const shouldFlipDown = vertical === 'top' && spaceAbove < panelHeight && spaceBelow > spaceAbove
  const actualVertical = shouldFlipUp ? 'top' : shouldFlipDown ? 'bottom' : vertical
  if (actualVertical === 'top') {
    panel.style.bottom = `${window.innerHeight - rect.top + props.offset}px`
  } else {
    panel.style.top = `${rect.bottom + props.offset}px`
  }
}

const schedulePositionUpdate = () => {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(updatePosition)
  else updatePosition()
}

onMounted(() => {
  stopDropdownOwnerListener = onDropdownOwnerClaimed((owner) => {
    if (owner !== instanceId && props.show) closeSelf()
  })
  if (props.show) claimFloatingOwner()
  schedulePositionUpdate()
  window.addEventListener('scroll', schedulePositionUpdate, { capture: true, passive: true })
  window.addEventListener('resize', schedulePositionUpdate)
})

onUpdated(() => {
  const isOpen = Boolean(props.show && props.triggerEl)
  if (isOpen && !previousShow) claimFloatingOwner()
  if (!props.show) hiddenByOwner.value = false
  if (isOpen) schedulePositionUpdate()
  previousShow = isOpen
})

onBeforeUnmount(() => {
  if (activeFloatingClose === closeSelf) activeFloatingClose = null
  releaseDropdownOwner(instanceId)
  stopDropdownOwnerListener?.()
  stopDropdownOwnerListener = null
  window.removeEventListener('scroll', schedulePositionUpdate, { capture: true })
  window.removeEventListener('resize', schedulePositionUpdate)
})
</script>

<style scoped>
.floating-dropdown-portal {
  pointer-events: auto;
  z-index: 100000040;
  border: 1px solid var(--dropdown-border, var(--control-border, var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08)))) !important;
  border-radius: 16px !important;
  background: var(--dropdown-bg, var(--control-bg, var(--anthropic-page, #faf9f5))) !important;
  color: var(--dropdown-fg, var(--control-fg, var(--anthropic-fg, #141413))) !important;
  box-shadow: var(--anthropic-dropdown-shadow, 0 4px 24px rgba(0, 0, 0, 0.05)) !important;
  transform-origin: top;
}

.floating-dropdown-enter-active,
.floating-dropdown-leave-active {
  transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);
}

.floating-dropdown-enter-from,
.floating-dropdown-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}
</style>

<template>
  <Teleport to="body">
    <Transition name="floating-dropdown">
      <div
        v-if="show && triggerEl"
        ref="panelRef"
        class="floating-dropdown-portal"
        :class="panelClass"
        :style="dropdownStyle"
        @click.stop
        @mousedown.stop
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

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
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-start',
  matchWidth: false,
  offset: 4,
  zIndex: 100000040,
  viewportPadding: 8,
  panelClass: ''
})

const panelRef = ref<HTMLElement | null>(null)
const triggerRect = ref<DOMRect | null>(null)
const effectivePlacement = ref<DropdownPlacement>(props.placement)

const updatePosition = () => {
  if (!props.triggerEl) return
  triggerRect.value = props.triggerEl.getBoundingClientRect()

  nextTick(() => {
    if (!props.triggerEl || !panelRef.value || !triggerRect.value) return

    const rect = props.triggerEl.getBoundingClientRect()
    const panelHeight = panelRef.value.offsetHeight || 240
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const [vertical, horizontal] = props.placement.split('-') as ['bottom' | 'top', 'start' | 'end']
    const shouldFlipUp = vertical === 'bottom' && spaceBelow < panelHeight && spaceAbove > spaceBelow
    const shouldFlipDown = vertical === 'top' && spaceAbove < panelHeight && spaceBelow > spaceAbove
    const nextVertical = shouldFlipUp ? 'top' : shouldFlipDown ? 'bottom' : vertical

    triggerRect.value = rect
    effectivePlacement.value = `${nextVertical}-${horizontal}` as DropdownPlacement
  })
}

const dropdownStyle = computed(() => {
  if (!triggerRect.value) return { position: 'fixed', zIndex: String(props.zIndex) }

  const rect = triggerRect.value
  const panel = panelRef.value
  const panelWidth = panel?.offsetWidth || (props.matchWidth ? rect.width : 0)
  const [vertical, horizontal] = effectivePlacement.value.split('-') as ['bottom' | 'top', 'start' | 'end']
  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: String(props.zIndex)
  }

  const preferredLeft = horizontal === 'end' ? rect.right - panelWidth : rect.left
  const maxLeft = window.innerWidth - (panelWidth || rect.width) - props.viewportPadding
  const clampedLeft = Math.max(props.viewportPadding, Math.min(preferredLeft, maxLeft))
  style.left = `${clampedLeft}px`

  if (props.matchWidth) {
    style.width = `${rect.width}px`
  }

  if (vertical === 'top') {
    style.bottom = `${window.innerHeight - rect.top + props.offset}px`
  } else {
    style.top = `${rect.bottom + props.offset}px`
  }

  return style
})

watch(
  () => [props.show, props.triggerEl, props.placement],
  ([show]) => {
    if (show) {
      effectivePlacement.value = props.placement
      updatePosition()
      window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
      window.addEventListener('resize', updatePosition)
    } else {
      window.removeEventListener('scroll', updatePosition, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition, { capture: true })
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.floating-dropdown-portal {
  pointer-events: auto;
}

.floating-dropdown-enter-active,
.floating-dropdown-leave-active {
  transition: all 0.16s ease;
}

.floating-dropdown-enter-from,
.floating-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>

<template>
  <FeedbackSurface :show="show" modal :label="title" :label-id="dialogId" :panel-class="`kf-feedback-panel modal-content kf-dialog-width-${width} ${widthClasses}`" scope-class="console-kreepai-surface kreepai-design-system" :z-index="zIndex" :close-on-escape="closeOnEscape" :close-on-click-outside="closeOnClickOutside" @close="emit('close')">
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title" aria-hidden="true">
              {{ title }}
            </h3>
            <button
              v-if="showCloseButton"
              @click="emit('close')"
              class="-mr-2 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 dark:text-dark-500 dark:hover:bg-dark-700 dark:hover:text-dark-300 dark:focus-visible:ring-offset-dark-900"
              aria-label="Close modal"
            >
              <Icon name="x" size="md" />
            </button>
          </div>

          <!-- Body -->
          <div ref="modalBodyRef" class="modal-body">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
  </FeedbackSurface>
</template>

<script lang="ts">
let dialogIdCounter = 0
</script>
<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import FeedbackSurface from './feedback/FeedbackSurface.vue'

type DialogWidth = 'narrow' | 'normal' | 'wide' | 'extra-wide' | 'full'

interface Props {
  show: boolean
  title: string
  width?: DialogWidth
  closeOnEscape?: boolean
  closeOnClickOutside?: boolean
  showCloseButton?: boolean
  zIndex?: number
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 'normal',
  closeOnEscape: true,
  closeOnClickOutside: false,
  showCloseButton: true,
  zIndex: 1000
})

const emit = defineEmits<Emits>()
const dialogId = `kreepai-dialog-${++dialogIdCounter}`
const modalBodyRef = ref<HTMLElement | null>(null)
watch(() => props.show, async visible => { if (visible) { await nextTick(); if (modalBodyRef.value) modalBodyRef.value.scrollTop = 0 } }, { immediate: true, flush: 'post' })

const widthClasses = computed(() => {
  // Width guidance: narrow=confirm/short prompts, normal=standard forms,
  // wide=multi-section forms or rich content, extra-wide=analytics/tables,
  // full=full-screen or very dense layouts.
  const widths: Record<DialogWidth, string> = {
    narrow: 'max-w-md',
    normal: 'max-w-lg',
    wide: 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
    'extra-wide': 'w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl',
    full: 'w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl'
  }
  return widths[props.width]
})

</script>

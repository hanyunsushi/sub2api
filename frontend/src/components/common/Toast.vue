<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[9999] space-y-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast toast-themed pointer-events-auto min-w-[320px] max-w-md overflow-hidden rounded-lg border shadow-card'
          ]"
        >
          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="mt-0.5 flex-shrink-0">
                <Icon
                  :name="getToastIconName(toast.type)"
                  size="md"
                  class="toast-icon"
                  aria-hidden="true"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <p v-if="toast.title" class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ toast.title }}
                </p>
                <p
                  :class="[
                    'text-sm leading-relaxed',
                    toast.title
                      ? 'mt-1 text-gray-600 dark:text-gray-300'
                      : 'text-gray-900 dark:text-white'
                  ]"
                >
                  {{ toast.message }}
                </p>
              </div>

              <!-- Close button -->
              <button data-testid="common-toast-button-remove-toast-toast-id"
                @click="removeToast(toast.id)"
                class="toast-close -m-1 flex-shrink-0 rounded p-1 transition-colors"
                aria-label="Close notification"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div v-if="toast.duration" class="h-1 bg-gray-100 dark:bg-dark-700">
            <div
              class="h-full toast-progress"
              :style="{ animationDuration: `${toast.duration}ms` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const toasts = computed(() => appStore.toasts)

const getToastIconName = (type: string): 'checkCircle' | 'xCircle' | 'exclamationTriangle' | 'infoCircle' => {
  switch (type) {
    case 'success':
      return 'checkCircle'
    case 'error':
      return 'xCircle'
    case 'warning':
      return 'exclamationTriangle'
    case 'info':
    default:
      return 'infoCircle'
  }
}

const removeToast = (id: string) => {
  appStore.hideToast(id)
}
</script>

<style scoped>
.toast-themed {
  border-color: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 28%, transparent);
  background: color-mix(in srgb, var(--atelier-paper-2, #fffaf0) 96%, var(--atelier-terracotta-action, #c96442));
  color: var(--atelier-ink, #171512);
  box-shadow: 0 18px 44px rgba(20, 20, 19, 0.14);
}

.toast-icon {
  color: var(--atelier-terracotta-action, #c96442);
}

.toast-close {
  color: color-mix(in srgb, var(--atelier-ink, #171512) 58%, transparent);
}

.toast-close:hover {
  background: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 12%, transparent);
  color: var(--atelier-terracotta-action, #c96442);
}

.toast-progress {
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--atelier-terracotta-action, #c96442),
    var(--atelier-terracotta-action-hover, #d97757)
  );
  animation-name: toast-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

:root.dark .toast-themed {
  border-color: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 42%, transparent);
  background: color-mix(in srgb, var(--atelier-ink, #171512) 92%, var(--atelier-terracotta-action, #c96442));
  color: var(--atelier-paper-2, #fffaf0);
}

@keyframes toast-progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>

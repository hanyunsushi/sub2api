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
            'toast toast-themed pointer-events-auto min-w-[320px] max-w-md overflow-hidden rounded-lg border shadow-none',
            `toast-themed--${toast.type}`
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
                <p v-if="toast.title" class="text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ toast.title }}
                </p>
                <p
                  :class="[
                    'text-sm leading-relaxed',
                    toast.title
                      ? 'mt-1 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]'
                      : 'text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]'
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
          <div v-if="toast.duration" class="h-1 bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]">
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
  --toast-status-color: var(--atelier-status-info);
  --toast-status-color-strong: var(--atelier-status-info);
  border-radius: 16px;
  border-color: color-mix(in srgb, var(--toast-status-color) 28%, transparent);
  background: color-mix(in srgb, var(--atelier-paper-2, #fffaf0) 92%, var(--toast-status-color) 8%);
  color: var(--atelier-ink, #171512);
  box-shadow: var(--anthropic-dropdown-shadow, 0 4px 24px rgba(0, 0, 0, 0.05));
}

.toast-themed--success {
  --toast-status-color: var(--atelier-status-success);
}

.toast-themed--error {
  --toast-status-color: var(--atelier-status-danger);
}

.toast-themed--warning {
  --toast-status-color: var(--atelier-status-warning);
}

.toast-themed--info {
  --toast-status-color: var(--atelier-status-info);
}

.toast-icon {
  color: var(--toast-status-color);
}

.toast-close {
  color: color-mix(in srgb, var(--atelier-ink, #171512) 58%, transparent);
}

.toast-close:hover {
  background: color-mix(in srgb, var(--toast-status-color) 12%, transparent);
  color: var(--toast-status-color);
}

.toast-progress {
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--toast-status-color),
    color-mix(in srgb, var(--toast-status-color) 78%, var(--atelier-white, #ffffff))
  );
  animation-name: toast-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

:root.dark .toast-themed {
  border-color: color-mix(in srgb, var(--toast-status-color) 42%, transparent);
  background: color-mix(in srgb, var(--atelier-ink, #171512) 90%, var(--toast-status-color) 10%);
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

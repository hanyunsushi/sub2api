<template>
  <div
    class="not-found-atelier relative flex min-h-screen items-center justify-center overflow-hidden px-4"
  >
    <!-- Background Decoration -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="not-found-plate not-found-plate-blue"></div>
      <div class="not-found-plate not-found-plate-dust"></div>
    </div>

    <div class="relative z-10 w-full max-w-md text-center">
      <!-- 404 Display -->
      <div class="mb-8">
        <div class="relative inline-block">
          <span class="not-found-code text-[12rem] font-bold leading-none"
            >404</span
          >
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="not-found-icon flex h-24 w-24 items-center justify-center rounded-lg"
            >
              <svg
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="mb-8">
        <h1 class="mb-3 text-2xl font-bold">
          {{ t('errors.pageNotFound') }}
        </h1>
        <p class="not-found-copy">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col justify-center gap-3 sm:flex-row">
        <button data-testid="not-found-button-go-back" @click="goBack" class="btn btn-secondary">
          <Icon name="arrowLeft" size="md" class="mr-2" />
          Go Back
        </button>
        <router-link to="/dashboard" class="btn btn-primary">
          <Icon name="home" size="md" class="mr-2" />
          Go to Dashboard
        </router-link>
      </div>

      <!-- Help Link -->
      <p class="not-found-copy mt-8 text-sm">
        Need help?
        <a data-testid="not-found-link-a"
          href="#"
          class="not-found-link transition-colors"
        >
          Contact support
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const router = useRouter()

function goBack(): void {
  router.back()
}
</script>

<style scoped>
.not-found-atelier {
  color: var(--atelier-ink);
  background:
    radial-gradient(circle at 12% 18%, rgba(201, 100, 66, 0.08), transparent 30rem),
    radial-gradient(circle at 78% 6%, rgba(217, 119, 87, 0.08), transparent 24rem),
    var(--atelier-canvas);
}

.not-found-plate {
  position: absolute;
  border: 1px solid rgba(20, 20, 19, 0.18);
  border-radius: 8px;
  opacity: 0.9;
}

.not-found-plate-blue {
  right: -6rem;
  top: -5rem;
  width: 22rem;
  height: 18rem;
  background: var(--atelier-blue);
}

.not-found-plate-dust {
  left: -5rem;
  bottom: -4rem;
  width: 18rem;
  height: 16rem;
  background: var(--atelier-dust-soft);
}

.not-found-code {
  color: color-mix(in srgb, var(--atelier-surface-dust) 72%, var(--atelier-white));
}

.not-found-icon {
  border: 1px solid var(--atelier-ink);
  background: var(--atelier-blue);
  color: var(--atelier-white);
  box-shadow: 0 12px 42px rgba(201, 100, 66, 0.14);
}

.not-found-copy {
  color: var(--atelier-muted);
}

.not-found-link {
  color: var(--atelier-blue);
}

.not-found-link:hover {
  color: var(--atelier-blue-dark);
}

:global(.dark) .not-found-atelier {
  color: #f8fbff;
  background:
    radial-gradient(circle at 18% 0%, rgba(201, 100, 66, 0.14), transparent 34%),
    linear-gradient(180deg, #050505, #0a0a0a);
}

:global(.dark) .not-found-code {
  color: rgba(248, 251, 255, 0.1);
}

:global(.dark) .not-found-copy {
  color: #94a3b8;
}
</style>

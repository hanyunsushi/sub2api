<template>
  <div class="app-layout-shell min-h-screen">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div
      class="app-layout-content relative min-h-screen overflow-hidden transition-all duration-300"
      :class="[sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64']"
    >
      <GuizangAsciiBackground tone="light" class="app-layout-ascii-background" />

      <div class="relative z-[1] min-h-screen">
        <!-- Header -->
        <AppHeader />

        <!-- Main Content -->
        <main class="app-route-page app-route-page-entering p-4 md:p-6 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>

<style>
.app-layout-shell {
  background: #fbfcff;
}

.dark .app-layout-shell {
  background: #050712;
}

.app-route-page {
  transform-origin: top center;
  transition:
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}

.app-route-page-entering {
  animation: app-route-page-enter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes app-route-page-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-route-page {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }

  .app-route-page-entering {
    animation-duration: 1ms;
  }
}
</style>

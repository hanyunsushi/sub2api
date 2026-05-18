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
        <main
          :class="['app-route-page p-4 md:p-6 lg:p-8', pageEntering && 'app-route-page-entering']"
          @animationend.self="pageEntering = false"
        >
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isAdmin = computed(() => authStore.user?.role === 'admin')
const pageEntering = ref(false)
let routeAnimationFrame = 0

const triggerPageEnter = async () => {
  if (routeAnimationFrame) {
    cancelAnimationFrame(routeAnimationFrame)
  }
  pageEntering.value = false
  await nextTick()
  routeAnimationFrame = requestAnimationFrame(() => {
    pageEntering.value = true
    routeAnimationFrame = 0
  })
}

watch(() => route.fullPath, () => {
  void triggerPageEnter()
})

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
  void triggerPageEnter()
})

onBeforeUnmount(() => {
  if (routeAnimationFrame) {
    cancelAnimationFrame(routeAnimationFrame)
  }
})

defineExpose({ replayTour })
</script>

<style>
.app-layout-shell {
  background: #fbfcff;
}

.dark .app-layout-shell {
  background: #020307;
}

.app-route-page {
  transform-origin: top center;
  transition:
    opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.72s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.app-route-page-entering {
  animation: app-route-page-enter 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes app-route-page-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.982);
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

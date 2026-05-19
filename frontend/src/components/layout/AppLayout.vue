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
          :class="[
            'app-route-page p-4 md:p-6 lg:p-8',
            `app-route-page-${pageTransitionPhase}`
          ]"
          @animationend.self="settlePageTransition"
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
const pageTransitionPhase = ref<'preparing' | 'entering' | 'settled'>('preparing')
let routeAnimationFrame = 0

const settlePageTransition = () => {
  pageTransitionPhase.value = 'settled'
}

const triggerPageEnter = async () => {
  if (routeAnimationFrame) {
    cancelAnimationFrame(routeAnimationFrame)
  }
  pageTransitionPhase.value = 'preparing'
  await nextTick()
  routeAnimationFrame = requestAnimationFrame(() => {
    pageTransitionPhase.value = 'entering'
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
  --route-enter-duration: 0.92s;
  --route-enter-easing: cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
  perspective: 1200px;
  will-change: opacity, transform, filter;
}

.app-route-page-preparing {
  opacity: 0;
  transform: translate3d(0, 30px, 0) scale(0.982);
  filter: blur(10px) saturate(0.92);
}

.app-route-page-entering {
  animation: app-route-page-enter var(--route-enter-duration) var(--route-enter-easing) both;
}

.app-route-page-entering > *,
.app-route-page-entering > * > * {
  animation: app-route-page-child-enter 0.78s var(--route-enter-easing) both;
}

.app-route-page-entering > * > :nth-child(2) {
  animation-delay: 48ms;
}

.app-route-page-entering > * > :nth-child(3) {
  animation-delay: 84ms;
}

.app-route-page-entering > * > :nth-child(n + 4) {
  animation-delay: 118ms;
}

.app-route-page-settled {
  opacity: 1;
  transform: none;
  filter: none;
}

@keyframes app-route-page-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0) scale(0.982);
    filter: blur(10px) saturate(0.92);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0) saturate(1);
  }
}

@keyframes app-route-page-child-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.988);
    filter: blur(6px);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-route-page-entering,
  .app-route-page-entering > *,
  .app-route-page-entering > * > * {
    animation-duration: 1ms;
    animation-delay: 0ms;
  }

  .app-route-page-preparing,
  .app-route-page-entering,
  .app-route-page-settled {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
</style>

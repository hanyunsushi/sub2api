<template>
  <div class="app-layout-shell min-h-screen">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div
      class="app-layout-content relative min-h-screen overflow-hidden transition-[margin-left] duration-300"
      :class="[sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[220px]']"
    >
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

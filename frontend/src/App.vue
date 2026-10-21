<script setup lang="ts">
import { isMicrofrontend } from '@/runtime/environment'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { computed, onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue'
import { pageLoading, pageLoadingTarget, cancelPageLoad } from '@/utils/page-loading'
import { runShift5Enter, resetShift5Transition } from '@/utils/shift5'
import '@/styles/design-system/motion.css'
import Toast from '@/components/common/Toast.vue'
import NavigationProgress from '@/components/common/NavigationProgress.vue'
import PageScrollbar from '@/components/common/PageScrollbar.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AdminComplianceDialog from '@/components/admin/AdminComplianceDialog.vue'
import { resolveRouteDocumentTitle } from '@/router/title'
import AnnouncementPopup from '@/components/common/AnnouncementPopup.vue'
import { useAppStore, useAuthStore, useSubscriptionStore, useAnnouncementStore, useAdminComplianceStore, useAdminSettingsStore } from '@/stores'
import { getSetupStatus } from '@/api/setup'
import { updateFavicon } from '@/utils/branding'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { resolveSiteBillingMode } from '@/utils/siteBillingMode'

const router = useRouter()
const route = useRoute()
const embeddedAuthShell = computed(() => ['Login', 'Register', 'ForgotPassword'].includes(String(route.name)))
const routeShell = ref<HTMLElement | null>(null)
let shellMounted = false
async function enterRoute() {
  await nextTick()
  if (!shellMounted || !routeShell.value || !pageLoading.value) return
  const root = routeShell.value
  const target = root.querySelector<HTMLElement>('.kreepai-auth-content, .kreepai-layout-content, .sub2api-microfrontend-content main') || root.firstElementChild as HTMLElement || root
  await runShift5Enter(target, !embeddedAuthShell.value)
}
watch(() => route.fullPath, enterRoute, { flush: 'post' })
onMounted(() => { shellMounted = true; void enterRoute() })
onBeforeUnmount(() => { shellMounted = false; resetShift5Transition(); cancelPageLoad() })
const appStore = useAppStore()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const announcementStore = useAnnouncementStore()
const adminComplianceStore = useAdminComplianceStore()
const adminSettingsStore = useAdminSettingsStore()

function updateDocumentTitle() {
  if (isMicrofrontend()) return
  const customMenuItems = [
    ...(appStore.cachedPublicSettings?.custom_menu_items ?? []),
    ...(authStore.isAdmin ? adminSettingsStore.customMenuItems : []),
  ]
  document.title = resolveRouteDocumentTitle(route, appStore.siteName, customMenuItems, {
    billingMode: resolveSiteBillingMode(appStore.cachedPublicSettings),
  })
}

// Watch for site settings changes and update favicon/title
watch(
  () => appStore.siteLogo,
  (newLogo) => {
    if (newLogo && !isMicrofrontend()) {
      updateFavicon(newLogo)
    }
  },
  { immediate: true }
)

watch(
  [
    () => route.fullPath,
    () => route.meta.title,
    () => route.meta.titleKey,
    () => appStore.siteName,
    () => appStore.cachedPublicSettings?.custom_menu_items,
    () => appStore.cachedPublicSettings?.subscription_enabled,
    () => appStore.cachedPublicSettings?.payment_balance_disabled,
    () => authStore.isAdmin,
    () => adminSettingsStore.customMenuItems,
  ],
  updateDocumentTitle,
  { deep: true }
)

let announcementTimer: ReturnType<typeof setTimeout> | null = null
// Watch for authentication state and manage subscription data + announcements
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && authStore.isAuthenticated) {
    announcementStore.fetchAnnouncements()
  }
}

function onAdminComplianceRequired(event: Event) {
  const detail = (event as CustomEvent<Record<string, string>>).detail || {}
  adminComplianceStore.requireAcknowledgement(detail)
}

// 订阅功能开关（opt-out）。关闭后不再预加载/轮询订阅接口；开关在登录后才到达时补启动，反向则清空。
const subscriptionFeatureEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.subscription))

function startSubscriptionSync() {
  subscriptionStore.fetchActiveSubscriptions().catch((error) => {
    console.error('Failed to preload subscriptions:', error)
  })
  subscriptionStore.startPolling()
}

watch(subscriptionFeatureEnabled, (enabled) => {
  if (!authStore.isAuthenticated) return
  if (enabled) {
    startSubscriptionSync()
  } else {
    subscriptionStore.clear()
  }
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated, oldValue) => {
    if (isAuthenticated) {
      if (authStore.isAdmin) {
        adminComplianceStore.fetchStatus().catch((error) => {
          console.error('Failed to fetch admin compliance status:', error)
        })
      }

      // User logged in: preload subscriptions and start polling (skipped when the
      // subscription feature is switched off; see the flag watcher below)
      if (subscriptionFeatureEnabled.value) {
        startSubscriptionSync()
      }

      // Announcements: new login vs page refresh restore
      if (oldValue === false) {
        // New login: delay 3s then force fetch
        announcementTimer = setTimeout(() => announcementStore.fetchAnnouncements(true), 3000)
      } else {
        // Page refresh restore (oldValue was undefined)
        announcementStore.fetchAnnouncements()
      }

      // Register visibility change listener
      document.addEventListener('visibilitychange', onVisibilityChange)
    } else {
      // User logged out: clear data and stop polling
      subscriptionStore.clear()
      announcementStore.reset()
      adminComplianceStore.reset()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  },
  { immediate: true }
)

// Route change trigger (throttled by store)
const removeAnnouncementNavigation = router.afterEach(() => {
  if (authStore.isAuthenticated) {
    announcementStore.fetchAnnouncements()
  }
})

onBeforeUnmount(() => {
  removeAnnouncementNavigation()
  if (announcementTimer) clearTimeout(announcementTimer)
  subscriptionStore.stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('admin-compliance-required', onAdminComplianceRequired)
})

onMounted(async () => {
  window.addEventListener('admin-compliance-required', onAdminComplianceRequired)

  // Check if setup is needed
  try {
    const status = await getSetupStatus()
    if (status.needs_setup && route.path !== '/setup') {
      router.replace('/setup')
      return
    }
  } catch {
    // If setup endpoint fails, assume normal mode and continue
  }

  // Load public settings into appStore (will be cached for other components)
  await appStore.fetchPublicSettings()

  // Re-resolve document title now that site settings are available
  updateDocumentTitle()
})
</script>

<template>
  <!-- 多项目路由导航：无头原菜单常驻应用，公开首页也能发布同一权限树。 -->
  <AppSidebar v-if="isMicrofrontend()" headless />
  <NavigationProgress v-if="!embeddedAuthShell" />
  <PageScrollbar v-if="!isMicrofrontend()" />
  <div ref="routeShell" class="kreepai-route-shell" :class="{ 'is-preparing': pageLoading && !pageLoadingTarget?.classList.contains('settings-main') }">
  <!-- 展示信息模块：认证模式只切换右侧原表单，左侧说明和品牌始终保留。 -->
  <AuthLayout v-if="embeddedAuthShell"><RouterView /></AuthLayout>
  <RouterView v-else />
  </div>
  <Toast />
  <AnnouncementPopup />
  <AdminComplianceDialog />
</template>

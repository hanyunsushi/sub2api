<template>
  <header class="app-header-atelier paper-surface sticky top-0 z-30 border-b border-gray-200/50 dark:border-dark-700/50">
    <div class="flex h-16 items-center justify-between px-4 md:px-6">
      <!-- Left: Mobile Menu Toggle + Page Title -->
      <div class="flex min-w-0 items-center gap-4">
        <button data-testid="layout-app-header-button-toggle-mobile-sidebar"
          @click="toggleMobileSidebar"
          class="btn-ghost btn-icon lg:hidden"
          aria-label="Toggle Menu"
        >
          <Icon name="menu" size="md" />
        </button>

        <div
          data-testid="header-context-strip"
          class="app-header-context hidden min-w-0 max-w-[44vw] flex-col sm:flex lg:max-w-[520px]"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span class="app-header-context-dot" aria-hidden="true"></span>
            <h1 class="truncate text-sm font-semibold text-gray-900 dark:text-white md:text-base">
              {{ pageTitle || 'Console' }}
            </h1>
            <span v-if="user" class="app-header-role-chip">{{ headerRoleLabel }}</span>
          </div>
          <div class="app-header-meta-line flex min-w-0 items-center gap-2">
            <span class="app-header-route-meta truncate">{{ headerRouteLabel }}</span>
            <span v-if="pageDescription" class="hidden truncate lg:inline">{{ pageDescription }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Announcements + Docs + Language + Subscriptions + Balance + User Dropdown -->
      <div class="flex items-center gap-3">
        <!-- AI Search -->
        <AISearchBox v-if="user" />

        <!-- Announcement Bell -->
        <AnnouncementBell v-if="user" />

        <!-- Docs Link -->
        <a data-testid="layout-app-header-link-a"
          v-if="docUrl"
          :href="docUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
        >
          <Icon name="book" size="sm" />
          <span class="hidden sm:inline">{{ t('nav.docs') }}</span>
        </a>

        <!-- Language Switcher -->
        <LocaleSwitcher />

        <!-- Subscription Progress (for users with active subscriptions) -->
        <SubscriptionProgressMini v-if="user" />

        <!-- Balance Display -->
        <div
          v-if="user"
          class="relative hidden sm:block"
          @mouseenter="openBalanceDropdown"
          @mouseleave="scheduleCloseBalanceDropdown"
        >
          <div
            ref="balanceChipRef"
            data-testid="header-balance-chip"
            class="header-balance-chip-fixed flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors"
            :class="balanceChipClass"
            @mouseenter="openBalanceDropdown"
            @mouseleave="scheduleCloseBalanceDropdown"
          >
            <div class="header-balance-chip-identity">
              <ProviderBrandIcon
                v-if="currentExternalSubscriptionInChip"
                data-testid="header-balance-provider-logo"
                class="header-balance-provider-logo h-4 w-4 flex-shrink-0"
                :provider="externalSubscriptionLogoProvider(currentExternalSubscriptionInChip)"
                :model="currentExternalSubscriptionInChip.name"
                :logo-url="currentExternalSubscriptionInChip.logo_url"
                :data-logo-url="currentExternalSubscriptionInChip.logo_url || ''"
              />
              <svg
                v-else
                class="h-4 w-4 flex-shrink-0"
                :class="balanceIconClass"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
              <span
                v-if="currentExternalSubscriptionInChip"
                :class="[balanceProviderTextClass(currentExternalSubscriptionInChip), 'header-balance-provider-name min-w-0 truncate text-sm font-semibold']"
              >
                {{ externalSubscriptionChipLabel(currentExternalSubscriptionInChip) }}
              </span>
            </div>
            <template v-if="currentExternalSubscriptionInChip">
              <span
                :class="[balanceProviderTextClass(currentExternalSubscriptionInChip), 'header-balance-chip-amount truncate text-sm font-semibold tabular-nums']"
              >
                {{ formatExternalSubscriptionBalance(currentExternalSubscriptionInChip, true, { walletOnly: true }) }}
              </span>
            </template>
            <span
              v-else
              class="balance-system-text header-balance-system-amount min-w-0 truncate text-sm font-semibold tabular-nums"
            >
              {{ formattedSystemBalance }}
            </span>
          </div>

          <FloatingDropdown
            :show="balanceDropdownOpen"
            :trigger-el="balanceChipRef"
            placement="bottom-end"
            :offset="8"
            panel-class="dropdown header-balance-dropdown-panel w-72 max-w-[calc(100vw-1.5rem)]"
          >
            <div
              data-testid="header-balance-dropdown"
              class="space-y-2 p-3"
              @mouseenter="cancelBalanceDropdownClose"
              @mouseleave="scheduleCloseBalanceDropdown"
            >
              <div class="balance-row balance-row-system flex min-w-0 items-center justify-between gap-4 rounded-lg px-3 py-2">
                <div class="text-xs font-medium">
                  系统余额
                </div>
                <div class="balance-system-text text-sm font-semibold">
                  {{ formattedSystemBalance }}
                </div>
              </div>
              <div
                v-for="subscription in visibleExternalSubscriptions"
                :key="subscription.provider"
                :class="[
                  'balance-row balance-row-external flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2',
                  `balance-row-${providerClassSuffix(subscription.provider)}`
                ]"
              >
                <div
                  class="flex min-w-0 flex-1 items-center gap-2"
                >
                  <ProviderBrandIcon
                    data-testid="header-balance-dropdown-provider-logo"
                    class="header-balance-provider-logo h-5 w-5 flex-shrink-0"
                    :provider="externalSubscriptionLogoProvider(subscription)"
                    :model="subscription.name"
                    :logo-url="subscription.logo_url"
                    :data-logo-url="subscription.logo_url || ''"
                  />
                  <div
                    :class="[balanceProviderTextClass(subscription), 'min-w-0 truncate text-xs font-medium']"
                    :title="externalSubscriptionChipLabel(subscription)"
                  >
                    {{ externalSubscriptionChipLabel(subscription) }}
                  </div>
                </div>
                <div class="min-w-0 max-w-[10rem] flex-shrink text-right">
                  <div
                    :class="[balanceProviderTextClass(subscription), 'truncate text-sm font-semibold']"
                    :title="formatExternalSubscriptionBalance(subscription, true, { walletOnly: true })"
                  >
                    {{ formatExternalSubscriptionBalance(subscription, true, { walletOnly: true }) }}
                  </div>
                  <div
                    class="balance-expiry-text truncate text-[11px] leading-4"
                    :title="formatExternalSubscriptionExpiry(subscription, true)"
                  >
                    {{ formatExternalSubscriptionExpiry(subscription, true) }}
                  </div>
                </div>
              </div>
            </div>
          </FloatingDropdown>
        </div>

        <!-- User Dropdown -->
        <div v-if="user" class="relative" ref="dropdownRef">
          <button data-testid="layout-app-header-button-toggle-dropdown"
            ref="dropdownButtonRef"
            @click="toggleDropdown"
            class="user-menu-trigger flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-dark-800"
            aria-label="User Menu"
          >
            <div class="user-avatar flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-medium text-white shadow-sm">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="displayName"
                class="h-full w-full object-cover"
              >
              <span v-else>{{ userInitials }}</span>
            </div>
            <div class="hidden text-left md:block">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ displayName }}
              </div>
              <div class="text-xs capitalize text-gray-500 dark:text-dark-400">
                {{ user.role }}
              </div>
            </div>
            <Icon name="chevronDown" size="sm" class="hidden text-gray-400 md:block" />
          </button>

          <!-- Dropdown Menu -->
          <FloatingDropdown
            :show="dropdownOpen"
            :trigger-el="dropdownButtonRef"
            placement="bottom-end"
            :offset="8"
            panel-class="dropdown w-56"
          >
              <!-- User Info -->
              <div class="border-b border-gray-100 px-4 py-3 dark:border-dark-700">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ displayName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-dark-400">{{ user.email }}</div>
              </div>

              <!-- Balance (mobile only) -->
              <div class="border-b border-gray-100 px-4 py-2 dark:border-dark-700 sm:hidden">
                <div class="text-xs text-gray-500 dark:text-dark-400">
                  {{ t('common.balance') }}
                </div>
                <div class="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  ${{ user.balance?.toFixed(2) || '0.00' }}
                </div>
              </div>

              <div class="py-1">
                <router-link data-testid="layout-app-header-router-link-close-dropdown" to="/profile" @click="closeDropdown" class="dropdown-item">
                  <Icon name="user" size="sm" />
                  {{ t('nav.profile') }}
                </router-link>

                <router-link data-testid="layout-app-header-router-link-close-dropdown-2" to="/keys" @click="closeDropdown" class="dropdown-item">
                  <Icon name="key" size="sm" />
                  {{ t('nav.apiKeys') }}
                </router-link>

                <a data-testid="layout-app-header-link-close-dropdown"
                  v-if="authStore.isAdmin"
                  href="https://github.com/Wei-Shaw/sub2api"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="closeDropdown"
                  class="dropdown-item"
                >
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  {{ t('nav.github') }}
                </a>

              </div>

              <!-- Contact Support (only show if configured) -->
              <div
                v-if="contactInfo"
                class="border-t border-gray-100 px-4 py-2.5 dark:border-dark-700"
              >
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    class="h-3.5 w-3.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                  </svg>
                  <span>{{ t('common.contactSupport') }}:</span>
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{
                    contactInfo
                  }}</span>
                </div>
              </div>

              <div v-if="showOnboardingButton" class="border-t border-gray-100 py-1 dark:border-dark-700">
                <button data-testid="layout-app-header-button-handle-replay-guide" @click="handleReplayGuide" class="dropdown-item w-full">
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a1 1 0 110 2 1 1 0 010-2zm1.07-7.75c0-.6-.49-1.25-1.32-1.25-.7 0-1.22.4-1.43 1.02a1 1 0 11-1.9-.62A3.41 3.41 0 0111.8 5c2.02 0 3.25 1.4 3.25 2.9 0 2-1.83 2.55-2.43 3.12-.43.4-.47.75-.47 1.23a1 1 0 01-2 0c0-1 .16-1.82 1.1-2.7.69-.64 1.82-1.05 1.82-2.06z"
                    />
                  </svg>
                  {{ $t('onboarding.restartTour') }}
                </button>
              </div>

              <div class="border-t border-gray-100 py-1 dark:border-dark-700">
                <button data-testid="layout-app-header-button-handle-logout"
                  @click="handleLogout"
                  class="dropdown-item w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  {{ t('nav.logout') }}
                </button>
              </div>
          </FloatingDropdown>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore, useOnboardingStore } from '@/stores'
import { useAdminSettingsStore } from '@/stores/adminSettings'
import externalSubscriptionsAPI, { type ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import SubscriptionProgressMini from '@/components/common/SubscriptionProgressMini.vue'
import AnnouncementBell from '@/components/common/AnnouncementBell.vue'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import AISearchBox from '@/components/layout/AISearchBox.vue'
import Icon from '@/components/icons/Icon.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const adminSettingsStore = useAdminSettingsStore()
const onboardingStore = useOnboardingStore()

const user = computed(() => authStore.user)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownButtonRef = ref<HTMLElement | null>(null)
const balanceChipRef = ref<HTMLElement | null>(null)
const balanceDropdownOpen = ref(false)
const balanceCarouselIndex = ref(0)
const externalSubscriptions = ref<ExternalSubscriptionStatus[]>([])
const externalSubscriptionsLoading = ref(false)
let balanceCarouselTimer: ReturnType<typeof setInterval> | null = null
let balanceDropdownCloseTimer: ReturnType<typeof setTimeout> | null = null
const contactInfo = computed(() => appStore.contactInfo)
const docUrl = computed(() => appStore.docUrl)
const avatarUrl = computed(() => user.value?.avatar_url?.trim() || '')

// 只在标准模式的管理员下显示新手引导按钮
const showOnboardingButton = computed(() => {
  return !authStore.isSimpleMode && user.value?.role === 'admin'
})

const userInitials = computed(() => {
  if (!user.value) return ''
  // Prefer username, fallback to email
  if (user.value.username) {
    return user.value.username.substring(0, 2).toUpperCase()
  }
  if (user.value.email) {
    // Get the part before @ and take first 2 chars
    const localPart = user.value.email.split('@')[0]
    return localPart.substring(0, 2).toUpperCase()
  }
  return ''
})

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.username || user.value.email?.split('@')[0] || ''
})

const formattedSystemBalance = computed(() => {
  return `$${(user.value?.balance ?? 0).toFixed(2)}`
})

const visibleExternalSubscriptions = computed(() => {
  if (!authStore.isAdmin) return []
  return externalSubscriptions.value.filter(subscription => subscription.enabled && subscription.configured)
})

const balanceSlotCount = computed(() => {
  return 1 + visibleExternalSubscriptions.value.length
})

const currentBalanceSlot = computed(() => {
  return balanceCarouselIndex.value % balanceSlotCount.value
})

const currentExternalSubscriptionInChip = computed(() => {
  const offset = 1
  const externalIndex = currentBalanceSlot.value - offset
  if (externalIndex < 0) return null
  return visibleExternalSubscriptions.value[externalIndex] ?? null
})

const balanceChipClass = computed(() => {
  if (currentExternalSubscriptionInChip.value) {
    return `balance-chip-${providerClassSuffix(currentExternalSubscriptionInChip.value.provider)}`
  }
  return 'balance-chip-system'
})

const balanceIconClass = computed(() => {
  if (currentExternalSubscriptionInChip.value) {
    return balanceProviderTextClass(currentExternalSubscriptionInChip.value)
  }
  return 'balance-system-text'
})

const headerRoleLabel = computed(() => {
  if (!user.value) return ''
  return user.value.role === 'admin' ? 'ADMIN' : 'USER'
})

const headerRouteLabel = computed(() => {
  const path = route.path || '/'
  if (path === '/') return 'ROOT'
  const segments = path.replace(/^\/+/, '').split('/').filter(Boolean)
  const visibleSegments = segments[0] === 'admin' || segments[0] === 'user'
    ? segments.slice(1)
    : segments
  if (!visibleSegments.length) return 'CONSOLE'
  return `CONSOLE / ${visibleSegments.join(' / ').toUpperCase()}`
})

const pageTitle = computed(() => {
  // For custom pages, use the menu item's label instead of generic "自定义页面"
  if (route.name === 'CustomPage') {
    const id = route.params.id as string
    const publicItems = appStore.cachedPublicSettings?.custom_menu_items ?? []
    const menuItem = publicItems.find((item) => item.id === id)
      ?? (authStore.isAdmin ? adminSettingsStore.customMenuItems.find((item) => item.id === id) : undefined)
    if (menuItem?.label) return menuItem.label
  }
  const titleKey = route.meta.titleKey as string
  if (titleKey) {
    return t(titleKey)
  }
  return (route.meta.title as string) || ''
})

const pageDescription = computed(() => {
  const descKey = route.meta.descriptionKey as string
  if (descKey) {
    return t(descKey)
  }
  return (route.meta.description as string) || ''
})

function toggleMobileSidebar() {
  appStore.toggleMobileSidebar()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
  dropdownOpen.value = false
}

function openBalanceDropdown() {
  cancelBalanceDropdownClose()
  balanceDropdownOpen.value = true
}

function closeBalanceDropdown() {
  balanceDropdownOpen.value = false
}

function cancelBalanceDropdownClose() {
  if (balanceDropdownCloseTimer) {
    clearTimeout(balanceDropdownCloseTimer)
    balanceDropdownCloseTimer = null
  }
}

function scheduleCloseBalanceDropdown() {
  cancelBalanceDropdownClose()
  balanceDropdownCloseTimer = setTimeout(() => {
    closeBalanceDropdown()
  }, 120)
}

async function fetchExternalSubscriptions() {
  if (!authStore.isAdmin || externalSubscriptionsLoading.value) return
  externalSubscriptionsLoading.value = true
  try {
    const statuses = await externalSubscriptionsAPI.getDisplayStatuses()
    if (statuses.length > 0 || externalSubscriptions.value.length === 0) {
      externalSubscriptions.value = statuses
    }
  } catch (error) {
    if (externalSubscriptions.value.length === 0) {
      externalSubscriptions.value = []
    }
    console.error('Failed to fetch external subscriptions:', error)
  } finally {
    externalSubscriptionsLoading.value = false
  }
}

const unsubscribeExternalSubscriptions = externalSubscriptionsAPI.subscribeDisplayStatuses((statuses) => {
  if (statuses.length > 0 || externalSubscriptions.value.length === 0) {
    externalSubscriptions.value = statuses
  }
})

const externalSubscriptionLabels: Record<string, string> = {
  qlhazycoder: 'QL',
  buzz: 'Buzz',
  packycode: 'Packy',
  xhyapi: 'XHY',
  pixel: 'Pixel',
  liust: 'LIUST',
  tcdmx: 'TCDMX',
  openrouter: 'OpenRouter',
  cloudflare: 'Cloudflare',
}

function providerClassSuffix(provider?: string | null) {
  const normalized = (provider || '').trim().toLowerCase()
  if (normalized === 'buzz') return 'buzz'
  if (normalized === 'qlhazycoder') return 'qlhazycoder'
  if (normalized === 'packycode') return 'packycode'
  if (normalized === 'xhyapi') return 'xhyapi'
  if (normalized === 'pixel') return 'pixel'
  if (normalized === 'liust') return 'liust'
  if (normalized === 'tcdmx') return 'tcdmx'
  if (normalized === 'openrouter') return 'openrouter'
  if (normalized === 'cloudflare') return 'cloudflare'
  return 'external'
}

function externalSubscriptionChipLabel(subscription: ExternalSubscriptionStatus) {
  return externalSubscriptionLabels[subscription.provider] || subscription.name || subscription.provider
}

function externalSubscriptionLogoProvider(subscription: ExternalSubscriptionStatus) {
  return [
    subscription.provider,
    subscription.name,
    subscription.site_url,
    ...subscription.match_keywords,
  ].join(' ')
}

function balanceProviderTextClass(subscription: ExternalSubscriptionStatus) {
  return `balance-${providerClassSuffix(subscription.provider)}-text`
}

function formatExternalSubscriptionBalance(
  subscription?: ExternalSubscriptionStatus | null,
  canShow = false,
  options: { walletOnly?: boolean } = {},
) {
  if (!canShow || !subscription) return '未配置'
  if (subscription.error_code) {
    return isExternalSubscriptionInvalidToken(subscription.error_code) ? 'Token 失效' : '读取失败'
  }
  if (options.walletOnly && typeof subscription.remaining_usd === 'number') {
    return formatExternalSubscriptionMoney(subscription.remaining_usd, subscription.currency)
  }
  const remaining = subscription.remaining_usd
  const total = subscription.total_limit_usd
  if (typeof remaining === 'number' && typeof total === 'number') {
    return `$${remaining.toFixed(2)} / $${total.toFixed(2)}`
  }
  if (typeof remaining === 'number') {
    return formatExternalSubscriptionMoney(remaining, subscription.currency)
  }
  if (typeof total === 'number') return '余额未知'
  return '余额未知'
}

function formatExternalSubscriptionMoney(value: number, currency?: string | null) {
  const normalized = (currency || '').trim().toUpperCase()
  if (normalized === 'USD' || normalized === '') return `$${value.toFixed(2)}`
  if (normalized === 'CNY' || normalized === 'RMB') return `¥${value.toFixed(2)}`
  if (normalized === 'JPY') return `¥${value.toFixed(0)}`
  return `${normalized} ${value.toFixed(2)}`
}

function formatExternalSubscriptionExpiry(
  subscription?: ExternalSubscriptionStatus | null,
  canShow = false,
) {
  if (!canShow || !subscription) return '期限未配置'
  if (subscription.error_code) {
    return isExternalSubscriptionInvalidToken(subscription.error_code) ? '请更新 Token' : (subscription.error_message || '请检查配置')
  }
  return formatExternalExpiry(subscription.expires_at)
}

function isExternalSubscriptionInvalidToken(code?: string | null) {
  const normalized = (code || '').trim().toUpperCase()
  return normalized === 'INVALID_TOKEN' || normalized === 'TOKEN_EXPIRED' || normalized === '401'
}

function formatExternalExpiry(value?: string | null) {
  if (!value) return '长期'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '长期'
  return `期限 ${parsed.toISOString().slice(0, 10)}`
}

function startBalanceCarousel() {
  if (balanceCarouselTimer) return
  balanceCarouselTimer = setInterval(() => {
    if (balanceSlotCount.value > 1) {
      balanceCarouselIndex.value += 1
    } else {
      balanceCarouselIndex.value = 0
    }
  }, 7000)
}

function stopBalanceCarousel() {
  if (balanceCarouselTimer) {
    clearInterval(balanceCarouselTimer)
    balanceCarouselTimer = null
  }
}

async function handleLogout() {
  closeDropdown()
  try {
    await authStore.logout()
  } catch (error) {
    // Ignore logout errors - still redirect to login
    console.error('Logout error:', error)
  }
  await router.push('/login')
}

function handleReplayGuide() {
  closeDropdown()
  onboardingStore.replay()
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  void fetchExternalSubscriptions()
  startBalanceCarousel()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  stopBalanceCarousel()
  cancelBalanceDropdownClose()
  unsubscribeExternalSubscriptions()
})

watch(
  () => [authStore.isAdmin, user.value?.id],
  () => {
    balanceCarouselIndex.value = 0
    externalSubscriptions.value = []
    void fetchExternalSubscriptions()
  }
)
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}

.app-header-atelier {
  --buzz-balance-yellow: #c79a3a;
  --buzz-balance-yellow-dark: #8e6c1f;
  --buzz-balance-yellow-soft: #efe0bf;
  --buzz-balance-yellow-soft-dark: rgba(199, 154, 58, 0.18);
  height: 4rem;
  min-height: 4rem;
  border: 0 !important;
  background: var(--atelier-paper-2) !important;
  box-shadow: none !important;
  font-family: var(--atelier-font-sans);
}

.app-header-atelier::after {
  content: "";
  position: absolute;
  right: 1.5rem;
  bottom: 0;
  left: 1.5rem;
  height: 1px;
  background: var(--atelier-console-rule);
  pointer-events: none;
}

.app-header-context {
  color: var(--atelier-ink);
}

.app-header-context-dot {
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 0.5rem;
  border-radius: 999px;
  background: var(--atelier-blue);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--atelier-blue) 10%, transparent);
}

.app-header-role-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.25rem;
  border: 1px solid var(--atelier-line);
  border-radius: 999px;
  padding: 0 0.45rem;
  background: var(--atelier-paper);
  color: var(--atelier-blue);
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.app-header-meta-line {
  margin-top: 0.125rem;
  color: var(--atelier-muted);
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.app-header-meta-line span + span {
  padding-left: 0.5rem;
  border-left: 1px dotted var(--atelier-line-strong);
}

.user-menu-trigger:hover {
  background: var(--atelier-ui-hover-surface);
  color: var(--atelier-ink);
}

.user-avatar {
  background: var(--atelier-blue);
  box-shadow: 0 8px 18px -14px rgba(201, 100, 66, 0.5);
}

.header-balance-chip-fixed {
  display: grid !important;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  width: 14.4rem;
  min-width: 14.4rem;
  max-width: 14.4rem;
  align-items: center;
  column-gap: 0.5rem;
  justify-content: stretch;
}

.header-balance-chip-fixed .header-balance-provider-logo {
  flex: 0 0 auto;
}

.header-balance-chip-identity {
  grid-column: 1;
  display: flex;
  min-width: 0;
  max-width: 8.4rem;
  align-items: center;
  justify-self: start;
  gap: 0.5rem;
  border: 0;
  background: transparent;
  background-color: transparent;
  box-shadow: none;
}

.header-balance-provider-name {
  flex: 1 1 auto;
  max-width: 7.4rem;
  text-align: left;
}

.header-balance-chip-amount {
  grid-column: 2;
  width: 100%;
  justify-self: stretch;
  min-width: 0;
  max-width: none;
  border: 0;
  background: transparent;
  background-color: transparent;
  box-shadow: none;
  line-height: 1.25;
  text-align: center;
}

.header-balance-system-amount {
  grid-column: 2;
  width: 100%;
  justify-self: stretch;
  min-width: 0;
  max-width: none;
  border: 0;
  background: transparent;
  background-color: transparent;
  box-shadow: none;
  line-height: 1.25;
  text-align: center;
}

.balance-chip-system {
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--atelier-ink);
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.balance-chip-buzz,
.balance-chip-qlhazycoder,
.balance-chip-packycode,
.balance-chip-xhyapi,
.balance-chip-pixel,
.balance-chip-liust,
.balance-chip-tcdmx,
.balance-chip-openrouter,
.balance-chip-cloudflare,
.balance-chip-external {
  border: 0;
  border-left: 1px dotted var(--atelier-line-strong);
  border-radius: 0;
  background: transparent;
  color: var(--atelier-ink);
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.balance-chip-system:hover,
.balance-chip-buzz:hover,
.balance-chip-qlhazycoder:hover,
.balance-chip-packycode:hover,
.balance-chip-xhyapi:hover,
.balance-chip-pixel:hover,
.balance-chip-liust:hover,
.balance-chip-tcdmx:hover,
.balance-chip-openrouter:hover,
.balance-chip-cloudflare:hover,
.balance-chip-external:hover {
  background: var(--atelier-ui-hover-surface);
  color: var(--atelier-ink);
}

.balance-row {
  border: 1px solid var(--atelier-line);
}

.balance-row-system {
  background: var(--atelier-butter-soft);
  color: var(--atelier-muted);
}

.balance-row-buzz,
.balance-row-qlhazycoder,
.balance-row-packycode,
.balance-row-xhyapi,
.balance-row-pixel,
.balance-row-liust,
.balance-row-tcdmx,
.balance-row-openrouter,
.balance-row-cloudflare,
.balance-row-external {
  background: var(--atelier-butter-soft);
}

.balance-system-text {
  color: var(--atelier-ink);
}

.balance-buzz-text,
.balance-qlhazycoder-text,
.balance-packycode-text,
.balance-xhyapi-text,
.balance-pixel-text,
.balance-liust-text,
.balance-tcdmx-text,
.balance-openrouter-text,
.balance-cloudflare-text,
.balance-external-text {
  color: var(--atelier-ink);
}

.balance-expiry-text {
  color: var(--atelier-muted);
  font-family: var(--atelier-font-mono);
}

.dark .balance-chip-system,
.dark .balance-row-system {
  background: transparent;
}

.dark .balance-chip-buzz,
.dark .balance-chip-qlhazycoder,
.dark .balance-chip-packycode,
.dark .balance-chip-xhyapi,
.dark .balance-chip-pixel,
.dark .balance-chip-liust,
.dark .balance-chip-tcdmx,
.dark .balance-chip-openrouter,
.dark .balance-chip-cloudflare,
.dark .balance-chip-external,
.dark .balance-row-buzz,
.dark .balance-row-qlhazycoder,
.dark .balance-row-packycode,
.dark .balance-row-xhyapi,
.dark .balance-row-pixel,
.dark .balance-row-liust,
.dark .balance-row-tcdmx,
.dark .balance-row-openrouter,
.dark .balance-row-cloudflare,
.dark .balance-row-external {
  background: transparent;
}

.dark .balance-chip-system:hover,
.dark .balance-chip-buzz:hover,
.dark .balance-chip-qlhazycoder:hover,
.dark .balance-chip-packycode:hover,
.dark .balance-chip-xhyapi:hover,
.dark .balance-chip-pixel:hover,
.dark .balance-chip-liust:hover,
.dark .balance-chip-tcdmx:hover,
.dark .balance-chip-openrouter:hover,
.dark .balance-chip-cloudflare:hover,
.dark .balance-chip-external:hover {
  background: var(--buzz-balance-yellow-soft-dark);
}

.dark .balance-system-text {
  color: var(--atelier-ink);
}

.dark .balance-buzz-text,
.dark .balance-qlhazycoder-text,
.dark .balance-packycode-text,
.dark .balance-xhyapi-text,
.dark .balance-pixel-text,
.dark .balance-liust-text,
.dark .balance-tcdmx-text,
.dark .balance-openrouter-text,
.dark .balance-cloudflare-text,
.dark .balance-external-text {
  color: var(--atelier-ink);
}
</style>

<template>
  <template v-if="!headless">
  <aside
    class="sidebar app-sider sidebar-surface sidebar-motion-rail"
    :class="[
      sidebarCollapsed ? 'w-[72px]' : 'w-64',
      { '-translate-x-full min-[769px]:translate-x-0': !mobileOpen, 'is-collapsed': sidebarCollapsed }
    ]"
  >
    <!-- Logo/Brand -->
    <div class="sidebar-header" :class="{ 'sidebar-header-collapsed': sidebarCollapsed }">
      <!-- Custom Logo or Default Logo -->
      <router-link
        :to="homePath"
        class="sidebar-logo flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-glow transition-opacity hover:opacity-80"
        @click="handleMenuItemClick(homePath)"
      >
        <img v-if="settingsLoaded" :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
      </router-link>
      <div class="sidebar-brand" :class="{ 'sidebar-brand-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">
        <router-link
          :to="homePath"
          class="sidebar-brand-title text-lg font-bold text-gray-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
          @click="handleMenuItemClick(homePath)"
        >
          {{ siteName }}
        </router-link>
        <span class="kreepai-brand-caption">服务控制台</span>
      </div>
      <div v-if="!sidebarCollapsed" class="kreepai-brand-version"><VersionBadge :version="siteVersion" /></div>
    </div>

    <!-- 侧边栏 / 组件绘制动画：与控制台共用原Motion菜单，权限/功能开关/原导航事件由AI保留。 -->
    <nav ref="sidebarNavRef" class="sidebar-nav sidebar-menu">
      <!-- 填写框：筛选与菜单在同一个原生滚动轨道。 -->
      <div v-if="!sidebarCollapsed" class="kreepai-sidebar-filter">
        <input v-model="navigationQuery" type="search" :placeholder="t('common.search')" :aria-label="t('common.search')" @keydown.esc="navigationQuery = ''" />
      </div>
      <!-- 提示信息：无匹配占用原结果轨道，清空恢复原权限树。 -->
      <div v-if="navigationQuery.trim() && !nativeMenuOptions.length" class="sidebar-search-empty" role="status">{{ t('common.noData') }}</div>
      <KreeperSidebarMenu v-else :options="nativeMenuOptions" :value="route.path"
        :collapsed="sidebarCollapsed" :reveal-matches="!!navigationQuery.trim()"
        :expanded-keys="nativeExpandedKeys" @update:expanded-keys="updateNativeExpandedKeys"
        @update:value="navigateNative" />
    </nav>

    <!-- Bottom Section -->
    <div class="kreepai-sidebar-footer">
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="sidebar-link mb-2 w-full"
        :class="{ 'sidebar-link-collapsed': sidebarCollapsed }"
        :title="sidebarCollapsed ? (isDark ? t('nav.lightMode') : t('nav.darkMode')) : undefined"
      >
        <SunIcon v-if="isDark" class="h-5 w-5 flex-shrink-0 text-amber-500" />
        <MoonIcon v-else class="h-5 w-5 flex-shrink-0" />
        <span class="sidebar-label" :class="{ 'sidebar-label-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">{{
          isDark ? t('nav.lightMode') : t('nav.darkMode')
        }}</span>
      </button>

      <!-- Collapse Button -->
      <button
        @click="toggleSidebar"
        class="sidebar-link w-full"
        :class="{ 'sidebar-link-collapsed': sidebarCollapsed }"
        :title="sidebarCollapsed ? t('nav.expand') : t('nav.collapse')"
      >
        <Icon name="collapse" size="sm" :filled="!sidebarCollapsed" class="flex-shrink-0" :class="{ 'rotate-180': sidebarCollapsed }" />
        <span class="sidebar-label" :class="{ 'sidebar-label-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">{{ t('nav.collapse') }}</span>
      </button>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <transition name="fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-[139] bg-black/50 min-[769px]:hidden"
      @click="closeMobile"
    ></div>
  </transition>
  </template>
</template>

<script setup lang="ts">
import { useConsoleNavigation, type ConsoleNavigationItem } from '@/runtime/console-actions'
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminSettingsStore, useAppStore, useAuthStore, useOnboardingStore } from '@/stores'
import KreeperSidebarMenu from './KreeperSidebarMenu.vue'
import { useWindowSize } from '@vueuse/core'
import '@/styles/design-system/native-sidebar.css'
import '@/styles/design-system/sidebar-motion.css'
import type { MenuOption } from './sidebar-options'
import VersionBadge from '@/components/common/VersionBadge.vue'
import Icon from '@/components/icons/SfIcon.vue'
import SidebarIcon from '@/components/icons/SidebarIcon.vue'
import type { SfIconName } from '@/components/icons/sf-symbols'
import { sanitizeSvg } from '@/utils/sanitize'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, makeSidebarFlag } from '@/utils/featureFlags'
import { resolveSiteBillingMode } from '@/utils/siteBillingMode'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'

const props = defineProps<{ headless?: boolean }>()

interface NavItem {
  path: string
  label: string
  icon: unknown
  iconSvg?: string
  hideInSimpleMode?: boolean
  children?: NavItem[]
  /**
   * When true, the parent item only toggles the expand/collapse state and
   * does NOT navigate to its `path`. The `path` is purely a stable key.
   */
  expandOnly?: boolean
  /**
   * 可选的功能开关 getter。返回 false 时菜单项被隐藏；返回 undefined/true 时显示。
   * 宽容策略（undefined → 显示）避免 public settings 未加载完成时菜单闪烁消失。
   * Getter 里访问的 reactive 来源（store / composable）会被 computed 自动追踪，
   * 开关切换时菜单自动更新。
   */
  featureFlag?: () => boolean | undefined
}

// applyFeatureFlags 递归过滤掉 featureFlag() === false 的节点（含子节点）。
// 使用 `!== false` 宽容语义：undefined（设置未加载）或 true 都视为显示。
function applyFeatureFlags(items: NavItem[]): NavItem[] {
  const out: NavItem[] = []
  for (const item of items) {
    if (item.featureFlag && item.featureFlag() === false) continue
    if (item.children) {
      out.push({ ...item, children: applyFeatureFlags(item.children) })
    } else {
      out.push(item)
    }
  }
  return out
}

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()
const adminSettingsStore = useAdminSettingsStore()
const { canUseBatchImage, refreshBatchImageAccess, batchImageAccessLoading } = useBatchImageAccess()

const { width: sidebarViewportWidth } = useWindowSize()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed && sidebarViewportWidth.value > 768)
const mobileOpen = computed(() => appStore.mobileOpen)
const isAdmin = computed(() => authStore.isAdmin)
const sidebarNavRef = ref<HTMLElement | null>(null)
const isDark = ref(document.documentElement.classList.contains('dark'))

const homePath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))

// Per-group expand/collapse overrides. A group with no entry follows the
// automatic behavior (expanded while the active route is one of its children);
// a chevron click records the user's choice, which wins over the automatic
// state so an active group can still be collapsed manually.
const groupExpandOverrides = ref<Map<string, boolean>>(new Map())

// Site settings from appStore (cached, no flicker)
const siteName = computed(() => appStore.siteName)
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteVersion = computed(() => appStore.siteVersion)
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

// 侧边栏 / 卡片SVG：原权限树与Motion保持；路由选中或实际展开时才切换真实SF Fill。
function sidebarIcon(name: SfIconName) {
  return { render: () => h(SidebarIcon, { name }) }
}
const DashboardIcon = sidebarIcon('grid')
const KeyIcon = sidebarIcon('key')
const BatchImageIcon = sidebarIcon('photo')
const ChartIcon = sidebarIcon('chart')
const GiftIcon = sidebarIcon('gift')
const UserIcon = sidebarIcon('user')
const UsersIcon = sidebarIcon('users')
const FolderIcon = sidebarIcon('folder')
const ChannelIcon = sidebarIcon('swap')
const CreditCardIcon = sidebarIcon('creditCard')
const RechargeSubscriptionIcon = sidebarIcon('banknote')
const GlobeIcon = sidebarIcon('globe')
const ServerIcon = sidebarIcon('server')
const PluginIcon = sidebarIcon('plugin')
const MCPIcon = { render: () => h(Icon, { name: 'mcp' }) }
const BellIcon = sidebarIcon('bell')
const TicketIcon = sidebarIcon('ticket')
const CogIcon = sidebarIcon('cog')
const SunIcon = { render: () => h(Icon, { name: 'sun' }) }
const MoonIcon = { render: () => h(Icon, { name: 'moon' }) }
const OrderIcon = sidebarIcon('banknote')
const OrderListIcon = sidebarIcon('receipt')
const SignalIcon = sidebarIcon('antenna')
const ShieldIcon = sidebarIcon('shield')
const PriceTagIcon = sidebarIcon('tag')

// Public-settings flags go through the registry in utils/featureFlags.ts,
// which handles the opt-in vs opt-out fallback when settings haven't loaded
// yet. Admin-only flags (not in public settings) stay inline below.
const flagChannelMonitor = makeSidebarFlag(FeatureFlags.channelMonitor)
const flagPayment = makeSidebarFlag(FeatureFlags.payment)
const flagAvailableChannels = makeSidebarFlag(FeatureFlags.availableChannels)
const flagSubscription = makeSidebarFlag(FeatureFlags.subscription)

// 购买入口文案随站点计费模式切换：仅充值 → 「充值」，仅订阅 → 「订阅」，否则「充值/订阅」。
const purchaseNavLabel = computed(() => {
  switch (resolveSiteBillingMode(appStore.cachedPublicSettings)) {
    case 'recharge_only':
      return t('nav.recharge')
    case 'subscription_only':
      return t('nav.subscribe')
    default:
      return t('nav.buySubscription')
  }
})
const flagAffiliate = makeSidebarFlag(FeatureFlags.affiliate)
const flagRiskControl = makeSidebarFlag(FeatureFlags.riskControl)
const flagPluginManagement = makeSidebarFlag(FeatureFlags.pluginManagement)
const flagMCP = makeSidebarFlag(FeatureFlags.mcp)
const flagOpsMonitoring = () => adminSettingsStore.opsMonitoringEnabled
const flagAdminPayment = () => adminSettingsStore.paymentEnabled
const flagBatchImageAccess = () => canUseBatchImage.value

// buildSelfNavItems 构造用户自己的导航项（用户端主菜单和管理员的"我的账户"子菜单共享这组声明）。
// withDashboard=true 时包含仪表盘（用户端），false 时不含（管理员的个人区已经有独立仪表盘入口）。
//
// 条目顺序：密钥 → 用量 → 可用渠道 → 渠道状态 → 订阅/支付 → 兑换/资料。
// 可用渠道紧挨渠道状态之上，让用户"先看自己能用什么、再看对应状态"。
function buildSelfNavItems(withDashboard: boolean): NavItem[] {
  const items: NavItem[] = []
  if (withDashboard) {
    items.push({ path: '/dashboard', label: t('nav.dashboard'), icon: DashboardIcon })
  }
  items.push(
    { path: '/keys', label: t('nav.apiKeys'), icon: KeyIcon },
    { path: '/batch-image', label: t('nav.batchImage'), icon: BatchImageIcon, hideInSimpleMode: true, featureFlag: flagBatchImageAccess },
    { path: '/usage', label: t('nav.usage'), icon: ChartIcon, hideInSimpleMode: true },
    { path: '/available-channels', label: t('nav.availableChannels'), icon: ChannelIcon, hideInSimpleMode: true, featureFlag: flagAvailableChannels },
    { path: '/monitor', label: t('nav.channelStatus'), icon: SignalIcon, featureFlag: flagChannelMonitor },
    { path: '/subscriptions', label: t('nav.mySubscriptions'), icon: CreditCardIcon, hideInSimpleMode: true, featureFlag: flagSubscription },
    { path: '/purchase', label: purchaseNavLabel.value, icon: RechargeSubscriptionIcon, hideInSimpleMode: true, featureFlag: flagPayment },
    { path: '/orders', label: t('nav.myOrders'), icon: OrderListIcon, hideInSimpleMode: true, featureFlag: flagPayment },
    { path: '/redeem', label: t('nav.redeem'), icon: GiftIcon, hideInSimpleMode: true },
    { path: '/affiliate', label: t('nav.affiliate'), icon: UsersIcon, hideInSimpleMode: true, featureFlag: flagAffiliate },
    { path: '/profile', label: t('nav.profile'), icon: UserIcon },
    { path: '/settings/mcp', label: t('mcp.title'), icon: MCPIcon, featureFlag: flagMCP },
    ...customMenuItemsForUser.value.map((item): NavItem => ({
      path: `/custom/${item.id}`,
      label: item.label,
      icon: null,
      iconSvg: item.icon_svg,
    })),
  )
  return items
}

// finalizeNav 合并三重过滤：featureFlag 过滤 + simple 模式过滤。
function finalizeNav(items: NavItem[]): NavItem[] {
  const visible = applyFeatureFlags(items)
  return authStore.isSimpleMode ? visible.filter(item => !item.hideInSimpleMode) : visible
}

// User navigation items (for regular users)
const userNavItems = computed((): NavItem[] => finalizeNav(buildSelfNavItems(true)))

// Personal navigation items (for admin's "My Account" section, without Dashboard).
// Admins access 可用渠道 from this section just like regular users — there is no
// separate admin entry, since the page is purely a user-facing view.
const personalNavItems = computed((): NavItem[] => finalizeNav(buildSelfNavItems(false)))

// Custom menu items filtered by visibility
const customMenuItemsForUser = computed(() => {
  const items = appStore.cachedPublicSettings?.custom_menu_items ?? []
  return items
    .filter((item) => item.visibility === 'user')
    .sort((a, b) => a.sort_order - b.sort_order)
})

const customMenuItemsForAdmin = computed(() => {
  return adminSettingsStore.customMenuItems
    .filter((item) => item.visibility === 'admin')
    .sort((a, b) => a.sort_order - b.sort_order)
})

// Admin navigation items
const adminNavItems = computed((): NavItem[] => {
  const baseItems: NavItem[] = [
    { path: '/admin/dashboard', label: t('nav.dashboard'), icon: DashboardIcon },
    { path: '/admin/ops', label: t('nav.ops'), icon: ChartIcon, featureFlag: flagOpsMonitoring },
    { path: '/admin/users', label: t('nav.users'), icon: UsersIcon, hideInSimpleMode: true },
    { path: '/admin/groups', label: t('nav.groups'), icon: FolderIcon },
    {
      path: '/admin/channels',
      label: t('nav.channelManagement'),
      icon: ChannelIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      children: [
        { path: '/admin/channels/pricing', label: t('nav.channelPricing'), icon: PriceTagIcon },
        { path: '/admin/channels/monitor', label: t('nav.channelMonitor'), icon: SignalIcon, featureFlag: flagChannelMonitor },
      ],
    },
    // 「仅充值」站点连管理端的「订阅管理」入口也一并收起（路由本身不拦截）。
    { path: '/admin/subscriptions', label: t('nav.subscriptions'), icon: CreditCardIcon, hideInSimpleMode: true, featureFlag: flagSubscription },
    { path: '/admin/accounts', label: t('nav.accounts'), icon: GlobeIcon },
    { path: '/admin/plugins', label: t('nav.plugins'), icon: PluginIcon, featureFlag: flagPluginManagement },
    { path: '/admin/announcements', label: t('nav.announcements'), icon: BellIcon },
    { path: '/admin/proxies', label: t('nav.proxies'), icon: ServerIcon },
    {
      path: '/admin/security-audit',
      label: t('nav.securityAudit'),
      icon: ShieldIcon,
      expandOnly: true,
      featureFlag: flagRiskControl,
      children: [
        { path: '/admin/risk-control', label: t('nav.contentModeration'), icon: ShieldIcon },
        { path: '/admin/prompt-audit', label: t('nav.promptAudit'), icon: ShieldIcon },
      ],
    },
    { path: '/admin/redeem', label: t('nav.redeemCodes'), icon: TicketIcon, hideInSimpleMode: true },
    { path: '/admin/promo-codes', label: t('nav.promoCodes'), icon: GiftIcon, hideInSimpleMode: true },
    {
      path: '/admin/affiliates',
      label: t('nav.affiliateManagement'),
      icon: UsersIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      featureFlag: flagAffiliate,
      children: [
        { path: '/admin/affiliates/invites', label: t('nav.affiliateInviteRecords'), icon: UsersIcon },
        { path: '/admin/affiliates/rebates', label: t('nav.affiliateRebateRecords'), icon: OrderIcon },
        { path: '/admin/affiliates/transfers', label: t('nav.affiliateTransferRecords'), icon: CreditCardIcon },
      ],
    },
    {
      path: '/admin/orders',
      label: t('nav.orderManagement'),
      icon: OrderIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      featureFlag: flagAdminPayment,
      children: [
        { path: '/admin/orders/dashboard', label: t('nav.paymentDashboard'), icon: ChartIcon },
        { path: '/admin/orders', label: t('nav.orderManagement'), icon: OrderIcon },
        { path: '/admin/orders/plans', label: t('nav.paymentPlans'), icon: CreditCardIcon },
      ],
    },
    { path: '/admin/usage', label: t('nav.usage'), icon: ChartIcon },
    { path: '/admin/audit-logs', label: t('nav.auditLogs'), icon: ShieldIcon, hideInSimpleMode: true }
  ]

  const visible = applyFeatureFlags(baseItems)

  // 简单模式下，在系统设置前插入 API密钥
  if (authStore.isSimpleMode) {
    const filtered = visible.filter(item => !item.hideInSimpleMode)
    filtered.push({ path: '/keys', label: t('nav.apiKeys'), icon: KeyIcon })
    if (flagMCP()) filtered.push({ path: '/settings/mcp', label: t('mcp.title'), icon: MCPIcon })
    filtered.push({ path: '/admin/settings', label: t('nav.settings'), icon: CogIcon, children: [{ path: '/admin/settings', label: t('nav.settings'), icon: CogIcon }, { path: '/admin/settings/external-subscriptions', label: t('customization.externalSubscriptions'), icon: CreditCardIcon }] })
    for (const cm of customMenuItemsForAdmin.value) {
      filtered.push({ path: `/custom/${cm.id}`, label: cm.label, icon: null, iconSvg: cm.icon_svg })
    }
    return filtered
  }

  visible.push({ path: '/admin/settings', label: t('nav.settings'), icon: CogIcon, children: [{ path: '/admin/settings', label: t('nav.settings'), icon: CogIcon }, { path: '/admin/settings/external-subscriptions', label: t('customization.externalSubscriptions'), icon: CreditCardIcon }] })
  for (const cm of customMenuItemsForAdmin.value) {
    visible.push({ path: `/custom/${cm.id}`, label: cm.label, icon: null, iconSvg: cm.icon_svg })
  }
  return visible
})

// 侧边栏：只筛选原树，不改变功能开关、权限或发布给Host的菜单。
const navigationQuery = ref('')
function filterNavigation(items: NavItem[]): NavItem[] {
  const query = navigationQuery.value.trim().toLowerCase()
  if (!query) return items
  return items.flatMap(item => {
    const children = item.children ? filterNavigation(item.children) : undefined
    if (item.label.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)) return [item]
    return children?.length ? [{ ...item, children }] : []
  })
}
const filteredAdminNavItems = computed(() => filterNavigation(adminNavItems.value))
const filteredPersonalNavItems = computed(() => filterNavigation(personalNavItems.value))
const filteredUserNavItems = computed(() => filterNavigation(userNavItems.value))

// 侧边栏：只把现有权限树转换为共享菜单输入；不生成新的业务入口。
function nativeOptions(items: NavItem[]): MenuOption[] {
  return items.map(item => ({
    key: item.path, label: item.label,
    icon: item.iconSvg ? () => h('span', { class: 'sidebar-svg-icon', innerHTML: sanitizeSvg(item.iconSvg!) }) : item.icon ? () => h(item.icon!) : undefined,
    children: item.children ? nativeOptions(item.children) : undefined,
  }))
}
const nativeMenuOptions = computed<MenuOption[]>(() => {
  if (!isAdmin.value) return appStore.backendModeEnabled ? [] : nativeOptions(filteredUserNavItems.value)
  const entries = nativeOptions(filteredAdminNavItems.value)
  const admin: MenuOption[] = entries.length ? [{ key: 'admin', type: 'group', label: '管理后台', children: entries }] : []
  if (authStore.isSimpleMode || !filteredPersonalNavItems.value.length) return admin
  return [...admin, { key: 'personal', type: 'group', label: () => h('span', { class: 'menu-group-label' }, [h('span', { class: 'menu-group-text' }, t('nav.myAccount')), h('span', { class: 'menu-group-dot' })]), children: nativeOptions(filteredPersonalNavItems.value) }]
})
const nativeExpandedKeys = computed(() => sidebarCollapsed.value ? [] : adminNavItems.value.filter(item => item.children && isGroupExpanded(item)).map(item => item.path))
function updateNativeExpandedKeys(keys: Array<string | number>) {
  if (sidebarCollapsed.value) appStore.toggleSidebar()
  const expanded = new Set(keys.map(String))
  for (const item of adminNavItems.value) if (item.children) groupExpandOverrides.value.set(item.path, expanded.has(item.path))
}
function navigateNative(path: string) {
  void router.push(path)
  handleMenuItemClick(path)
}

const initialNavigationPending = ref(true)
// 多项目路由导航：无头模式只计算和发布原菜单，绝不挂第二套侧栏 DOM。
function describeNavigation(items: NavItem[]): ConsoleNavigationItem[] {
  return items.map(item => ({
    key: item.path, label: item.label,
    icon: item.iconSvg ? () => h('span', { class: 'sidebar-original-svg', innerHTML: sanitizeSvg(item.iconSvg!) }) : item.icon ? () => h(item.icon!) : undefined,
    path: item.expandOnly ? undefined : item.path,
    expanded: item.children ? isGroupExpanded(item) : undefined,
    children: item.children ? describeNavigation(item.children) : undefined,
  }))
}
useConsoleNavigation(() => !authStore.isAuthenticated ? [] : isAdmin.value ? [
  { key: 'admin', label: '管理后台', group: true, children: describeNavigation(adminNavItems.value) },
  { key: 'personal', label: t('nav.myAccount'), group: true, children: describeNavigation(personalNavItems.value) },
] : describeNavigation(userNavItems.value), () => !initialNavigationPending.value && !batchImageAccessLoading.value && (!isAdmin.value || !adminSettingsStore.loading))

function toggleSidebar() {
  appStore.toggleSidebar()
  navigationQuery.value = ''
  for (const item of adminNavItems.value) if (item.children) groupExpandOverrides.value.set(item.path, false)
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function closeMobile() {
  appStore.setMobileOpen(false)
}

function handleMenuItemClick(itemPath: string) {
  if (mobileOpen.value) {
    setTimeout(() => {
      appStore.setMobileOpen(false)
    }, 150)
  }

  // Map paths to tour selectors
  const pathToSelector: Record<string, string> = {
    '/admin/groups': '#sidebar-group-manage',
    '/admin/accounts': '#sidebar-channel-manage',
    '/keys': '[data-tour="sidebar-my-keys"]'
  }

  const selector = pathToSelector[itemPath]
  if (selector && onboardingStore.isCurrentStep(selector)) {
    onboardingStore.nextStep(500)
  }
}


function isGroupActive(item: NavItem): boolean {
  if (!item.children) return false
  return item.children.some(child => route.path === child.path)
}

function isGroupExpanded(item: NavItem): boolean {
  const override = groupExpandOverrides.value.get(item.path)
  if (override !== undefined) return override
  return isGroupActive(item)
}


// Initialize theme
const savedTheme = localStorage.getItem('theme')
if (
  !props.headless && (savedTheme === 'dark' ||
  (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches))
) {
  isDark.value = true
  document.documentElement.classList.add('dark')
}

// Fetch admin settings (for feature-gated nav items like Ops).
watch(
  isAdmin,
  (v) => {
    if (v) {
      adminSettingsStore.fetch()
    }
  },
  { immediate: true }
)

onMounted(() => {
  void refreshBatchImageAccess().finally(() => { initialNavigationPending.value = false })
  if (isAdmin.value) {
    adminSettingsStore.fetch()
  }
  // Restore sidebar scroll position after route change re-mounts the component
  if (appStore.sidebarScrollTop > 0 && sidebarNavRef.value) {
    void nextTick(() => {
      if (sidebarNavRef.value) {
        sidebarNavRef.value.scrollTop = appStore.sidebarScrollTop
      }
    })
  }
})

onBeforeUnmount(() => {
  if (sidebarNavRef.value) {
    appStore.sidebarScrollTop = sidebarNavRef.value.scrollTop
  }
})
</script>

<style scoped>
.sidebar-logo {
  flex: 0 0 2.25rem;
  min-width: 2.25rem;
}

.sidebar-header-collapsed {
  gap: 0;
  padding-left: 1.125rem;
  padding-right: 1.125rem;
}

.sidebar-brand {
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  transition:
    max-width 0.22s ease,
    opacity 0.14s ease,
    transform 0.14s ease;
  max-width: 12rem;
}

.sidebar-brand-collapsed {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-4px);
  pointer-events: none;
}

.sidebar-brand-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-link-collapsed {
  gap: 0;
  padding-left: 0.875rem;
  padding-right: 0.875rem;
}

.sidebar-section-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 1.25rem;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-section-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.sidebar-section-title::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  top: 50%;
  height: 1px;
  background: rgb(229 231 235);
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.18s ease;
}

.dark .sidebar-section-title::after {
  background: rgb(55 65 81);
}

.sidebar-section-title-text-collapsed {
  opacity: 0;
  transform: translateX(-4px);
}

.sidebar-section-title-collapsed::after {
  opacity: 1;
  transition-delay: 0.08s;
}

.sidebar-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    max-width 0.2s ease,
    opacity 0.12s ease,
    transform 0.12s ease;
  max-width: 12rem;
}

.sidebar-label-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sidebar-label-collapsed {
  max-width: 0;
  opacity: 0;
  transform: translateX(-4px);
  pointer-events: none;
}

/* Custom SVG icon in sidebar: constrain size without overriding uploaded SVG colors */
.sidebar-svg-icon {
  color: currentColor;
}

.sidebar-svg-icon :deep(svg) {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}
</style>

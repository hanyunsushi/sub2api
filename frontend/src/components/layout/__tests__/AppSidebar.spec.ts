import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppSidebar.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')
const zhLocaleSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../i18n/locales/zh.ts'), 'utf8')
const enLocaleSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../i18n/locales/en.ts'), 'utf8')
const navTemplateSource = componentSource.slice(
  componentSource.indexOf('<nav ref="sidebarNavRef"'),
  componentSource.indexOf('</nav>') + '</nav>'.length,
)

describe('AppSidebar nav icon rendering', () => {
  it('renders built-in navigation entries with their SVG icon components', () => {
    expect(navTemplateSource).toContain('<component :is="item.icon" class="sidebar-icon"')
    expect(navTemplateSource).toContain('<component :is="child.icon" class="sidebar-icon sidebar-child-icon"')
    expect(navTemplateSource).not.toContain('sidebar-initial')
    expect(navTemplateSource).not.toContain('{{ getNavInitial(item.label) }}')
    expect(navTemplateSource).not.toContain('{{ getNavInitial(child.label) }}')
  })

  it('uses the compact CSS caret controls for collapsible groups', () => {
    expect(navTemplateSource).toContain('sidebar-group-caret')
    expect(componentSource).toContain('.sidebar-group-caret::before')
    expect(componentSource).toContain('.sidebar-collapse-mark')
    expect(componentSource).toContain('const DashboardIcon')
    expect(componentSource).toContain('const ChevronDoubleLeftIcon')
    expect(componentSource).toContain('const ChevronDoubleRightIcon')
  })
})

describe('AppSidebar custom menu open mode', () => {
  it('renders redirect custom menu entries as external anchors without routing through the iframe page', () => {
    expect(componentSource).toContain("openMode?: 'iframe' | 'redirect'")
    expect(componentSource).toContain("openMode: item.open_mode === 'redirect' ? 'redirect' : 'iframe'")
    expect(componentSource).toContain("v-if=\"item.openMode === 'redirect'\"")
    expect(componentSource).toContain(':href="item.path"')
    expect(componentSource).toContain('target="_blank"')
    expect(componentSource).toContain('rel="noopener noreferrer"')
    expect(componentSource).toContain('@click="handleMenuItemClick(item.path)"')
  })
})

describe('AppSidebar system settings group', () => {
  it('renders system settings through the standard collapsible group', () => {
    expect(componentSource).toContain('function systemSettingsNavItem')
    expect(componentSource).toContain('expandOnly: true')
    expect(componentSource).toContain("label: t('nav.settings')")
    expect(componentSource).toContain("{ path: '/admin/settings', label: t('nav.settingsGeneral')")
    expect(componentSource).toContain("{ path: '/admin/settings/external-subscriptions', label: t('nav.externalSubscriptions')")
    expect(componentSource).not.toContain('adminSystemSectionItems')
    expect(componentSource).not.toContain("item.path !== '/admin/settings'")
    expect(navTemplateSource).toContain('v-for="item in adminPrimaryNavItems"')
    expect(navTemplateSource).toContain('v-if="item.children?.length"')
  })

  it('uses the same active-route logic as other collapsible groups', () => {
    expect(navTemplateSource).toContain("'sidebar-link-active': route.path === child.path")
    expect(componentSource).toContain('function isGroupActive')
    expect(componentSource).toContain('function isGroupExpanded')
  })
})

describe('AppSidebar scroll position persistence', () => {
  it('binds a template ref to the sidebar nav element', () => {
    expect(componentSource).toContain('ref="sidebarNavRef"')
    expect(componentSource).toContain('sidebar-nav')
  })

  it('declares sidebarNavRef in script setup', () => {
    expect(componentSource).toContain("const sidebarNavRef = ref<HTMLElement | null>(null)")
  })

  it('saves scroll position on beforeUnmount', () => {
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('sidebarNavRef.value.scrollTop')
  })

  it('restores scroll position on mount', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('nextTick')
  })
})

describe('AppSidebar header styles', () => {
  it('links the static expanded Kreeper wordmark to the public welcome page', () => {
    const homeLinkMatch = componentSource.match(/<router-link[^>]*:to="homePath"[^>]*class="sidebar-home-link sidebar-logo-link"[\s\S]*?<\/router-link>/)

    expect(componentSource).toContain("const homePath = computed(() => '/home')")
    expect(componentSource).not.toContain("isAdmin.value ? '/admin/dashboard' : '/dashboard'")
    expect(homeLinkMatch).not.toBeNull()
    expect(homeLinkMatch?.[0]).toContain('sidebar-home-link')
    expect(homeLinkMatch?.[0]).toContain('aria-label="Kreepai"')
    expect(homeLinkMatch?.[0]).toContain('sidebar-logo')
    expect(homeLinkMatch?.[0]).not.toContain('lottie')
    expect(homeLinkMatch?.[0]).not.toContain('sidebar-brand-title-collapsed')
    expect(homeLinkMatch?.[0]).not.toContain('VersionBadge')
  })

  it('does not clip the version badge dropdown', () => {
    const sidebarHeaderBlockMatch = styleSource.match(/\.sidebar-header\s*\{[\s\S]*?\n {2}\}/)
    const sidebarBrandBlockMatch = componentSource.match(/\.sidebar-brand\s*\{[\s\S]*?\n\}/)

    expect(sidebarHeaderBlockMatch).not.toBeNull()
    expect(sidebarBrandBlockMatch).not.toBeNull()
    expect(sidebarHeaderBlockMatch?.[0]).not.toContain('@apply overflow-hidden;')
    expect(sidebarBrandBlockMatch?.[0]).not.toContain('overflow: hidden;')
  })

  it('keeps the version badge borderless on the same sidebar paper surface', () => {
    const versionButtonBlock = styleSource.match(/\.sidebar-brand {1}\.relative > button\s*\{[\s\S]*?\n {2}\}/)
    const versionAmberBlock = styleSource.match(/\.sidebar-brand {1}\.relative > button:where\(\[class~="text-amber-700"\][\s\S]*?\n {2}\}/)
    const versionNeutralBlock = styleSource.match(/\.sidebar-brand {1}\.relative > button:where\(\[class~="text-gray-600"\][\s\S]*?\n {2}\}/)

    expect(versionButtonBlock).not.toBeNull()
    expect(versionAmberBlock).not.toBeNull()
    expect(versionNeutralBlock).not.toBeNull()
    expect(versionButtonBlock?.[0]).toContain('background: var(--anthropic-page) !important;')
    expect(versionButtonBlock?.[0]).toContain('border: 0 !important;')
    expect(versionButtonBlock?.[0]).toContain('box-shadow: none !important;')
    expect(versionButtonBlock?.[0]).toContain('color: var(--sidebar-muted) !important;')
    expect(versionAmberBlock?.[0]).toContain('background: var(--anthropic-page) !important;')
    expect(versionAmberBlock?.[0]).not.toContain('#fff9ef')
    expect(versionAmberBlock?.[0]).not.toContain('#eda100')
    expect(versionNeutralBlock?.[0]).toContain('background: var(--anthropic-page) !important;')
    expect(versionNeutralBlock?.[0]).not.toContain('#e8e6dc')
  })

  it('uses the website expanded wordmark dimensions and brand color', () => {
    const sidebarBrandTitleTemplateMatch = componentSource.match(/<router-link[^>]*class="[^"]*sidebar-brand-title[^"]*"[\s\S]*?<\/router-link>/)
    const sidebarBrandMotionBlockMatch = componentSource.match(/\.sidebar-brand-title\s*\{[\s\S]*?\n\}/)

    expect(sidebarBrandTitleTemplateMatch).not.toBeNull()
    expect(sidebarBrandTitleTemplateMatch?.[0]).toContain('{{ siteName }}')
    expect(sidebarBrandMotionBlockMatch).not.toBeNull()
    expect(sidebarBrandMotionBlockMatch?.[0]).toContain('font-size: 1.25rem;')
    expect(componentSource).not.toContain('lottie-web')
  })
})

describe('AppSidebar atelier palette', () => {
  it('matches the official smooth sidebar collapse transition contract', () => {
    const sidebarBlock = styleSource.slice(
      styleSource.indexOf('.sidebar {'),
      styleSource.indexOf('.dark .sidebar {'),
    )
    const sidebarLinkBlock = styleSource.slice(
      styleSource.indexOf('.sidebar-link {'),
      styleSource.indexOf('.sidebar .sidebar-link:hover {'),
    )

    expect(sidebarBlock).toContain('width 0.3s ease')
    expect(sidebarBlock).toContain('transform 0.3s ease')
    expect(sidebarBlock).toContain('will-change: width, transform;')
    expect(sidebarLinkBlock).toContain('transition: all 0.2s ease')
    expect(styleSource).toContain('opacity 0.12s ease')
    expect(styleSource).toContain('max-width 0.2s ease')
    expect(componentSource).toContain('max-width 0.22s ease')
  })

  it('uses the compact app sidebar rail width instead of the wider default Tailwind rail', () => {
    const sidebarBlock = styleSource.slice(
      styleSource.indexOf('.sidebar {'),
      styleSource.indexOf('.dark .sidebar {'),
    )

    expect(componentSource).toContain("sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'")
    expect(componentSource).not.toContain("sidebarCollapsed ? 'w-[72px]' : 'w-64'")
    expect(sidebarBlock).toContain('width: 220px;')
    expect(sidebarBlock).not.toContain('@apply w-64;')
  })

  it('labels the admin and personal sidebar sections with the same title treatment', () => {
    const adminSectionTitleIndex = navTemplateSource.indexOf("{{ t('nav.adminInterface') }}")
    const firstAdminItemIndex = navTemplateSource.indexOf('v-for="item in adminPrimaryNavItems"')
    const personalSectionTitleIndex = navTemplateSource.indexOf("{{ t('nav.myAccount') }}")
    const firstPersonalItemIndex = navTemplateSource.indexOf('v-for="item in personalPrimaryNavItems"')

    expect(adminSectionTitleIndex).toBeGreaterThan(-1)
    expect(personalSectionTitleIndex).toBeGreaterThan(-1)
    expect(adminSectionTitleIndex).toBeLessThan(firstAdminItemIndex)
    expect(personalSectionTitleIndex).toBeLessThan(firstPersonalItemIndex)
    expect(navTemplateSource.match(/sidebar-section-title/g)?.length).toBeGreaterThanOrEqual(2)
    expect(zhLocaleSource).toContain("adminInterface: '管理员界面'")
    expect(enLocaleSource).toContain("adminInterface: 'Admin Interface'")
  })

  it('uses docs-sidebar paper states without colored active blocks', () => {
    const sidebarBlock = styleSource.slice(
      styleSource.indexOf('.sidebar {'),
      styleSource.indexOf('.sidebar-header {')
    )

    expect(componentSource).toContain('class="sidebar-children mb-1 ml-4 pl-2"')
    expect(componentSource).toContain('class="sidebar-footer mt-auto p-3"')
    expect(componentSource).not.toContain('border-l border-accent-200 pl-2')
    expect(componentSource).not.toContain('mt-auto border-t border-gray-100 p-3')
    expect(componentSource).not.toContain('text-gray-900 dark:text-white')
    expect(sidebarBlock).toContain('--sidebar-bg: var(--anthropic-page);')
    expect(sidebarBlock).toContain('--sidebar-bg-strong: var(--anthropic-page);')
    expect(sidebarBlock).toContain('--sidebar-text: var(--anthropic-muted);')
    expect(sidebarBlock).toContain('--sidebar-line: var(--anthropic-border-faint);')
    expect(sidebarBlock).toContain('--sidebar-hover: var(--anthropic-section);')
    expect(sidebarBlock).toContain('--sidebar-active-bg: var(--anthropic-section);')
    expect(sidebarBlock).toContain('--sidebar-active-text: var(--anthropic-fg);')
    expect(sidebarBlock).toContain('--sidebar-active-border: transparent;')
    expect(sidebarBlock).toContain('background: var(--sidebar-bg);')
    expect(sidebarBlock).toContain('border-right: 1px solid var(--sidebar-line);')
    expect(styleSource).toContain('--anthropic-border-faint: rgba(20, 19, 19, 0.04);')
    expect(sidebarBlock).not.toContain('--sidebar-bg: var(--atelier-ink);')
    expect(sidebarBlock).not.toContain('--sidebar-bg-strong: #050505;')
    expect(sidebarBlock).not.toContain('--sidebar-hover: var(--atelier-butter);')
    expect(sidebarBlock).not.toContain('--sidebar-active-bg: var(--atelier-blue);')
    expect(sidebarBlock).not.toContain('--sidebar-active-text: var(--atelier-white);')
    expect(sidebarBlock).not.toContain('--sidebar-active-border: var(--atelier-blue);')
    expect(sidebarBlock).not.toContain('linear-gradient(90deg, rgba(23, 21, 18, 0.04) 1px, transparent 1px)')
    expect(sidebarBlock).not.toContain('linear-gradient(180deg, rgba(0, 47, 167, 0.98), rgba(0, 26, 107, 0.98))')
    expect(styleSource).toContain('.sidebar .sidebar-link-active')
    expect(styleSource).toContain('.sidebar .sidebar-link-active::after')
    expect(styleSource).toContain('display: none;')
    expect(styleSource).toContain('content: none;')
    expect(styleSource).toContain('padding-left: 0.5rem;')
    expect(styleSource).not.toContain('background: var(--sidebar-active-text);')
    expect(styleSource).not.toContain('margin-left: 0.625rem;')
    expect(styleSource).not.toContain('border-right: 1px dotted var(--sidebar-line-strong);')
    expect(styleSource).not.toContain('border-top: 1px dotted var(--sidebar-line-strong);')
    expect(styleSource).not.toContain('border-bottom: 1px dotted var(--sidebar-line-strong);')
    expect(styleSource).not.toContain('inset 3px 0 0 var(--sidebar-active-border)')
    expect(styleSource).not.toContain('color-mix(in srgb, var(--atelier-butter) 58%, transparent)')
    expect(componentSource).not.toContain('color-mix(in srgb, var(--atelier-butter)')
    expect(componentSource).not.toContain('0 10px 22px rgba(0, 30, 110, 0.24)')
    expect(componentSource).toContain('box-shadow: none;')
    expect(componentSource).toContain('filter: none;')
    expect(styleSource).toContain('.sidebar-children')
    expect(styleSource).toContain('.sidebar .sidebar-section-title')
  })

  it('renders the two channel-management entries directly without a parent or third channel-list item', () => {
    expect(componentSource).toContain("{ path: '/admin/channels/pricing', label: t('nav.channelPricing')")
    expect(componentSource).toContain("{ path: '/admin/channels/monitor', label: t('nav.channelMonitor')")
    expect(componentSource).toContain('const adminPrimaryNavItems = computed(() =>')
    expect(componentSource).not.toContain('function channelManagementNavItem()')
    expect(componentSource).not.toContain("path: '/admin/channels', label: t('nav.channelList')")
    expect(componentSource).not.toContain("t('nav.channelList')")
    expect(componentSource).not.toContain('const adminChannelSectionItems')
    expect(navTemplateSource).toContain('v-for="item in adminPrimaryNavItems"')
    expect(navTemplateSource).not.toContain('v-if="adminChannelSectionItems.length"')
    expect(navTemplateSource).not.toContain("{{ t('nav.channelManagement') }}")
    expect(zhLocaleSource).not.toContain("channelList: '渠道列表'")
    expect(enLocaleSource).not.toContain("channelList: 'Channel List'")
  })

  it('uses the same font size for system-settings children as the other sidebar entries', () => {
    expect(componentSource).toContain("{ path: '/admin/settings', label: t('nav.settingsGeneral')")
    expect(componentSource).toContain("{ path: '/admin/settings/external-subscriptions', label: t('nav.externalSubscriptions')")
    expect(styleSource).toContain('.sidebar .sidebar-system-child-link')
    const systemChildBlock = styleSource.match(/\.sidebar \.sidebar-system-child-link\s*\{[\s\S]*?\n {2}\}/)
    expect(systemChildBlock).not.toBeNull()
    expect(systemChildBlock?.[0]).toContain('font-size: 0.875rem;')
    expect(styleSource).toContain('.sidebar .sidebar-system-child-link .sidebar-child-initial')
  })

  it('groups custom external pages under a dedicated 其他 small-title section for admin and personal areas', () => {
    expect(componentSource).toContain('const customUserNavItems = computed(() =>')
    expect(componentSource).toContain('const customAdminNavItems = computed(() =>')
    expect(componentSource).toContain('const userOtherNavItems = computed(() =>')
    expect(componentSource).toContain('const personalOtherNavItems = computed(() =>')
    expect(componentSource).toContain('const adminOtherNavItems = computed(() =>')
    expect(navTemplateSource).toContain("v-if=\"adminOtherNavItems.length\"")
    expect(navTemplateSource).toContain("v-if=\"personalOtherNavItems.length\"")
    expect(navTemplateSource).toContain("v-if=\"userOtherNavItems.length\"")
    expect(navTemplateSource).toContain("{{ t('nav.other') }}")
    expect(styleSource).toContain('.sidebar .sidebar-other-child-link')
    expect(zhLocaleSource).toContain("other: '其他'")
    expect(enLocaleSource).toContain("other: 'Other'")
  })

  it('keeps active sidebar descendants readable when the selected item is hovered', () => {
    expect(styleSource).toContain('.sidebar .sidebar-link-active:hover')
    expect(styleSource).toContain('.sidebar .sidebar-link-active:hover :where(.sidebar-initial, .sidebar-label, span)')
    expect(styleSource).toContain('color: var(--sidebar-active-text) !important;')
    expect(styleSource).toContain('-webkit-text-fill-color: currentColor !important;')
    expect(styleSource).not.toContain('background: var(--sidebar-active-text);')
  })

  it('uses rounded hover and active surfaces instead of square full-width slabs', () => {
    const sidebarLinkBlock = styleSource.slice(
      styleSource.indexOf('.sidebar-link {'),
      styleSource.indexOf('.sidebar .sidebar-link:hover {'),
    )
    const sidebarHoverBlock = styleSource.slice(
      styleSource.indexOf('.sidebar .sidebar-link:hover {'),
      styleSource.indexOf('.sidebar .sidebar-link-active {'),
    )
    const sidebarActiveBlock = styleSource.slice(
      styleSource.indexOf('.sidebar .sidebar-link-active {'),
      styleSource.indexOf('.sidebar .sidebar-link-active :where'),
    )
    expect(sidebarLinkBlock).toContain('min-height: 2rem;')
    expect(sidebarLinkBlock).toContain('border-radius: 0.5rem;')
    expect(sidebarLinkBlock).toContain('padding: 0.375rem 0.5rem;')
    expect(sidebarLinkBlock).toContain('font-size: 0.875rem;')
    expect(sidebarLinkBlock).toContain('line-height: 1.25rem;')
    expect(sidebarHoverBlock).toContain('border-color:')
    expect(sidebarHoverBlock).toContain('background: var(--sidebar-hover);')
    expect(sidebarHoverBlock).toContain('text-decoration-line: none;')
    expect(sidebarHoverBlock).toContain('text-decoration-color: transparent;')
    expect(sidebarHoverBlock).toContain('padding-left: 0.5rem;')
    expect(sidebarActiveBlock).toContain('border-radius: 0.5rem;')
    expect(sidebarActiveBlock).toContain('background: var(--sidebar-active-bg);')
    expect(sidebarActiveBlock).toContain('border-color: var(--sidebar-active-border);')
    expect(sidebarActiveBlock).toContain('padding-left: 0.5rem;')
    expect(sidebarActiveBlock).toContain('padding-right: 0.5rem;')
    expect(styleSource).not.toContain(':root.theme-cloudflare .sidebar .sidebar-link:hover')
    expect(sidebarHoverBlock).not.toContain('border-bottom-color')
    expect(sidebarActiveBlock).not.toContain('border-bottom-color')
  })

  it('matches the design-system sidebar spacing and typography scale', () => {
    const sidebarHeaderBlock = styleSource.slice(
      styleSource.indexOf('.sidebar-header {'),
      styleSource.indexOf('.sidebar-nav {'),
    )
    const sidebarNavBlock = styleSource.slice(
      styleSource.indexOf('.sidebar-nav {'),
      styleSource.indexOf('.sidebar-link {'),
    )
    const sectionBlock = styleSource.slice(
      styleSource.indexOf('.sidebar-section {'),
      styleSource.indexOf('.sidebar .sidebar-section-title {'),
    )
    const sectionTitleBlock = styleSource.slice(
      styleSource.indexOf('.sidebar .sidebar-section-title {'),
      styleSource.indexOf('.sidebar .sidebar-section-title::after {'),
    )
    const sectionRuleBlock = styleSource.slice(
      styleSource.indexOf('.sidebar .sidebar-section-title::after {'),
      styleSource.indexOf('/* ============ 页面头部 ============ */'),
    )

    expect(sidebarHeaderBlock).toContain('@apply h-16 px-3;')
    expect(sidebarHeaderBlock).toContain('border-bottom: 1px solid var(--sidebar-line);')
    expect(sidebarNavBlock).toContain('@apply flex-1 overflow-y-auto px-3 py-[18px];')
    expect(sectionBlock).toContain('@apply mb-[18px];')
    expect(sectionTitleBlock).toContain('font-size: 0.75rem;')
    expect(sectionTitleBlock).toContain('font-weight: 500;')
    expect(sectionTitleBlock).toContain('line-height: 1rem;')
    expect(sectionTitleBlock).toContain('letter-spacing: 0;')
    expect(sectionTitleBlock).toContain('text-transform: none;')
    expect(sectionRuleBlock).toContain('display: none;')
    expect(sectionRuleBlock).not.toContain('repeating-linear-gradient')
    expect(styleSource).toContain('border-right-width: 1px;')
    expect(styleSource).toContain('border-right-style: solid;')
    expect(styleSource).toContain('border-right-color: var(--sidebar-line, var(--anthropic-border-faint));')
    expect(styleSource).toContain('border-bottom-width: 1px;')
    expect(styleSource).toContain('border-bottom-style: solid;')
    expect(styleSource).toContain('border-bottom-color: var(--sidebar-line, var(--anthropic-border-faint));')
    expect(styleSource).toContain('border-top-width: 1px;')
    expect(styleSource).toContain('border-top-style: solid;')
    expect(styleSource).toContain('border-top-color: var(--sidebar-line, var(--anthropic-border-faint));')
  })
})

describe('AppSidebar scroll position', () => {
  it('preserves the scroll position across route-click render and focus updates', () => {
    expect(componentSource).toContain('ref="sidebarNavRef"')
    expect(componentSource).toContain('function captureSidebarScroll')
    expect(componentSource).toContain('function restoreSidebarScroll')
    expect(componentSource).toContain('function restoreSidebarScrollSoon')
    expect(componentSource).toContain('watch(() => route.fullPath')
    expect(componentSource).toContain('onBeforeUnmount(() =>')
    expect(componentSource).toContain('requestAnimationFrame')
    expect(componentSource).toContain('SIDEBAR_SCROLL_RESTORE_ATTEMPTS')
    expect(componentSource).toContain('SIDEBAR_SCROLL_RESTORE_SETTLE_MS')
    expect(componentSource).toContain('style.scrollBehavior = \'auto\'')
    expect(componentSource).toContain('appStore.setSidebarNavScrollTop')
    expect(componentSource).toContain('appStore.sidebarNavScrollTop')
    expect(componentSource).toContain('latestSidebarScrollTop')
    expect(componentSource).not.toContain('let preservedSidebarScrollTop')
    expect(componentSource).toContain('captureSidebarScroll()')
    expect(styleSource).not.toMatch(/\\.sidebar-nav,\\n\\s*\\.modal-body/)
  })

  it('does not bind a scroll handler to the sidebar navigation hot path', () => {
    expect(componentSource).not.toContain('@scroll=')
    expect(componentSource).not.toContain('function handleSidebarNavScroll')
    expect(componentSource).not.toContain('function scheduleSidebarScrollCommit')
    expect(componentSource).not.toContain('sidebarScrollCommitFrame')
    expect(componentSource).toContain('appStore.setSidebarNavScrollTop(latestSidebarScrollTop)')
    expect(styleSource).toContain('contain: layout paint;')
  })
})

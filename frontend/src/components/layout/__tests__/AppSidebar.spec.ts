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
  it('renders sidebar navigation as text without SVG or custom uploaded icon surfaces', () => {
    expect(navTemplateSource).toContain('sidebar-initial')
    expect(navTemplateSource).toContain('{{ getNavInitial(item.label) }}')
    expect(navTemplateSource).toContain('{{ getNavInitial(child.label) }}')
    expect(navTemplateSource).not.toContain('<component :is="item.icon"')
    expect(navTemplateSource).not.toContain('<component :is="child.icon"')
    expect(navTemplateSource).not.toContain('renderCustomMenuIcon(item.iconSvg)')
    expect(navTemplateSource).not.toContain('isCustomMenuIconURL(item.iconSvg)')
    expect(navTemplateSource).not.toContain('v-html="sanitizeSvg(item.iconSvg)"')
    expect(navTemplateSource).not.toContain('sidebar-svg-icon')
    expect(navTemplateSource).not.toContain('<img')
  })

  it('uses text caret controls instead of sidebar SVG arrow components', () => {
    expect(navTemplateSource).toContain('sidebar-group-caret')
    expect(componentSource).toContain('.sidebar-group-caret::before')
    expect(componentSource).toContain('.sidebar-collapse-mark')
    expect(componentSource).toContain('function getNavInitial')
    expect(componentSource).not.toContain('sanitizeSvg')
    expect(componentSource).not.toContain('isCustomMenuIconURL')
    expect(componentSource).not.toContain('renderCustomMenuIcon')
    expect(componentSource).not.toContain('const ChevronDownIcon')
    expect(componentSource).not.toContain('const ChevronDoubleLeftIcon')
    expect(componentSource).not.toContain('const ChevronDoubleRightIcon')
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
  it('renders system settings as an expandable parent with the external subscriptions child route', () => {
    expect(componentSource).toContain('function systemSettingsNavItem')
    expect(componentSource).toContain('expandOnly: true')
    expect(componentSource).toContain("label: t('nav.settings')")
    expect(componentSource).toContain("{ path: '/admin/settings', label: t('nav.settingsGeneral')")
    expect(componentSource).toContain("{ path: '/admin/settings/external-subscriptions', label: t('nav.externalSubscriptions')")
    expect(componentSource).toContain('systemSettingsNavItem()')
    expect(componentSource).toContain("'sidebar-system-child-link': item.path === '/admin/settings'")
  })
})

describe('AppSidebar header styles', () => {
  it('links only the top-left logo to the public welcome page', () => {
    const homeLinkMatch = componentSource.match(/<router-link[^>]*to="\/home"[^>]*>[\s\S]*?<\/router-link>/)

    expect(homeLinkMatch).not.toBeNull()
    expect(homeLinkMatch?.[0]).toContain('sidebar-home-link')
    expect(homeLinkMatch?.[0]).toContain('sidebar-logo-link')
    expect(homeLinkMatch?.[0]).toContain('aria-label="Home"')
    expect(homeLinkMatch?.[0]).toContain('sidebar-logo')
    expect(homeLinkMatch?.[0]).not.toContain('sidebar-brand')
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
})

describe('AppSidebar atelier palette', () => {
  it('labels the admin and personal sidebar sections with the same title treatment', () => {
    const adminSectionTitleIndex = navTemplateSource.indexOf("{{ t('nav.adminInterface') }}")
    const firstAdminItemIndex = navTemplateSource.indexOf('v-for="item in adminNavItems"')
    const personalSectionTitleIndex = navTemplateSource.indexOf("{{ t('nav.myAccount') }}")
    const firstPersonalItemIndex = navTemplateSource.indexOf('v-for="item in personalNavItems"')

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
    expect(sidebarBlock).toContain('--sidebar-bg: var(--atelier-paper-2);')
    expect(sidebarBlock).toContain('--sidebar-bg-strong: var(--atelier-paper-2);')
    expect(sidebarBlock).toContain('--sidebar-text: var(--atelier-ink);')
    expect(sidebarBlock).toContain('--sidebar-line-strong: rgba(23, 21, 18, 0.36);')
    expect(sidebarBlock).toContain('--sidebar-hover: var(--atelier-paper-2);')
    expect(sidebarBlock).toContain('--sidebar-active-bg: var(--atelier-paper-2);')
    expect(sidebarBlock).toContain('--sidebar-active-text: var(--atelier-ink);')
    expect(sidebarBlock).toContain('--sidebar-active-border: var(--atelier-line);')
    expect(sidebarBlock).toContain('background: var(--sidebar-bg);')
    expect(sidebarBlock).toContain('border-right: 1px dotted var(--sidebar-line-strong);')
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
    expect(styleSource).toContain('padding-left: 0.625rem;')
    expect(styleSource).not.toContain('background: var(--sidebar-active-text);')
    expect(styleSource).not.toContain('margin-left: 0.625rem;')
    expect(styleSource).not.toContain('inset 3px 0 0 var(--sidebar-active-border)')
    expect(styleSource).not.toContain('color-mix(in srgb, var(--atelier-butter) 58%, transparent)')
    expect(componentSource).not.toContain('color-mix(in srgb, var(--atelier-butter)')
    expect(componentSource).not.toContain('0 10px 22px rgba(0, 30, 110, 0.24)')
    expect(componentSource).toContain('box-shadow: none;')
    expect(componentSource).toContain('filter: none;')
    expect(styleSource).toContain('.sidebar-children')
    expect(styleSource).toContain('.sidebar .sidebar-section-title')
  })

  it('uses a smaller dedicated font size for the two channel-management children', () => {
    expect(componentSource).toContain("'sidebar-channel-child-link': item.path === '/admin/channels'")
    expect(componentSource).toContain("{ path: '/admin/channels/pricing', label: t('nav.channelPricing')")
    expect(componentSource).toContain("{ path: '/admin/channels/monitor', label: t('nav.channelMonitor')")
    expect(styleSource).toContain('.sidebar .sidebar-channel-child-link')
    expect(styleSource).toContain('font-size: 0.75rem;')
    expect(styleSource).toContain('.sidebar .sidebar-channel-child-link .sidebar-child-initial')
  })

  it('uses a smaller dedicated font size for the system-settings children', () => {
    expect(componentSource).toContain("'sidebar-system-child-link': item.path === '/admin/settings'")
    expect(componentSource).toContain("{ path: '/admin/settings', label: t('nav.settingsGeneral')")
    expect(componentSource).toContain("{ path: '/admin/settings/external-subscriptions', label: t('nav.externalSubscriptions')")
    expect(styleSource).toContain('.sidebar .sidebar-system-child-link')
    expect(styleSource).toContain('font-size: 0.75rem;')
    expect(styleSource).toContain('.sidebar .sidebar-system-child-link .sidebar-child-initial')
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
    expect(sidebarLinkBlock).toContain('border-radius: 0.625rem;')
    expect(sidebarLinkBlock).toContain('padding-left: 0.625rem;')
    expect(sidebarLinkBlock).toContain('padding-right: 0.625rem;')
    expect(sidebarHoverBlock).toContain('border-color:')
    expect(sidebarHoverBlock).toContain('background: var(--sidebar-hover);')
    expect(sidebarHoverBlock).toContain('text-decoration-line: none;')
    expect(sidebarHoverBlock).toContain('text-decoration-color: transparent;')
    expect(sidebarHoverBlock).toContain('padding-left: 0.625rem;')
    expect(sidebarActiveBlock).toContain('border-radius: 0.625rem;')
    expect(sidebarActiveBlock).toContain('background: var(--sidebar-active-bg);')
    expect(sidebarActiveBlock).toContain('border-color: var(--sidebar-active-border);')
    expect(sidebarActiveBlock).toContain('padding-left: 0.625rem;')
    expect(sidebarActiveBlock).toContain('padding-right: 0.625rem;')
    expect(styleSource).not.toContain(':root.theme-cloudflare .sidebar .sidebar-link:hover')
    expect(styleSource).not.toContain('border-bottom-color')
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

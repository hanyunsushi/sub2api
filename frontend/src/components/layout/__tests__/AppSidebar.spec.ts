import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppSidebar.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')

describe('AppSidebar custom SVG styles', () => {
  it('does not override uploaded SVG fill or stroke colors', () => {
    expect(componentSource).toContain('.sidebar-svg-icon {')
    expect(componentSource).toContain('color: currentColor;')
    expect(componentSource).toContain('display: block;')
    expect(componentSource).not.toContain('stroke: currentColor;')
    expect(componentSource).not.toContain('fill: none;')
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
  it('uses paper-2 sidebar material from the color guidance and keeps Klein blue isolated to active structure', () => {
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
    expect(sidebarBlock).toContain('--sidebar-hover: var(--atelier-butter);')
    expect(sidebarBlock).toContain('--sidebar-active-bg: var(--atelier-blue);')
    expect(sidebarBlock).toContain('--sidebar-active-text: var(--atelier-white);')
    expect(sidebarBlock).toContain('--sidebar-active-border: var(--atelier-blue);')
    expect(sidebarBlock).toContain('background: var(--sidebar-bg);')
    expect(sidebarBlock).toContain('border-right: 1px dotted var(--sidebar-line-strong);')
    expect(sidebarBlock).not.toContain('--sidebar-bg: var(--atelier-ink);')
    expect(sidebarBlock).not.toContain('--sidebar-bg-strong: #050505;')
    expect(sidebarBlock).not.toContain('linear-gradient(90deg, rgba(23, 21, 18, 0.04) 1px, transparent 1px)')
    expect(sidebarBlock).not.toContain('linear-gradient(180deg, rgba(0, 47, 167, 0.98), rgba(0, 26, 107, 0.98))')
    expect(styleSource).toContain('.sidebar .sidebar-link-active')
    expect(styleSource).toContain('.sidebar .sidebar-link-active::after')
    expect(styleSource).toContain('background: var(--sidebar-active-text);')
    expect(styleSource).toContain('padding-left: 0.375rem;')
    expect(styleSource).toContain('margin-left: 0.625rem;')
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
    expect(styleSource).toContain('.sidebar .sidebar-channel-child-link :where(svg, .sidebar-svg-icon)')
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

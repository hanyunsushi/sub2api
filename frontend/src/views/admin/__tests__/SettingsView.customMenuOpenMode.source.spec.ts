import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const settingsSource = readFileSync(resolve(frontendRoot, 'views/admin/SettingsView.vue'), 'utf8')
const typesSource = readFileSync(resolve(frontendRoot, 'types/index.ts'), 'utf8')
const adminSettingsApiSource = readFileSync(resolve(frontendRoot, 'api/admin/settings.ts'), 'utf8')
const styleSource = readFileSync(resolve(frontendRoot, 'style.css'), 'utf8')
const zhLocaleSource = readFileSync(resolve(frontendRoot, 'i18n/locales/zh.ts'), 'utf8')
const enLocaleSource = readFileSync(resolve(frontendRoot, 'i18n/locales/en.ts'), 'utf8')

const cssBlock = (source: string, selector: string, fromIndex = 0) => {
  const selectorIndex = source.indexOf(selector, fromIndex)
  expect(selectorIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
  const openBraceIndex = source.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

describe('SettingsView custom menu open mode contract', () => {
  it('exposes an iframe-or-redirect selector for every custom menu item', () => {
    expect(settingsSource).toContain('v-model="item.open_mode"')
    expect(settingsSource).toContain('admin.settings.customMenu.openMode')
    expect(settingsSource).toContain('admin.settings.customMenu.openModeIframe')
    expect(settingsSource).toContain('admin.settings.customMenu.openModeRedirect')
    expect(settingsSource).toContain('admin.settings.customMenu.openModeHint')
  })

  it('defaults new and legacy custom menu items to iframe mode', () => {
    expect(settingsSource).toContain('open_mode: "iframe"')
    expect(settingsSource).toContain("open_mode: item.open_mode === \"redirect\" ? \"redirect\" : \"iframe\"")
  })

  it('carries open_mode through frontend API types', () => {
    expect(typesSource).toContain("open_mode?: 'iframe' | 'redirect'")
    expect(adminSettingsApiSource).toContain('custom_menu_items?: CustomMenuItem[]')
  })

  it('describes redirect mode as opening a new browser tab', () => {
    expect(zhLocaleSource).toContain('跳转会从侧边栏在新标签页打开目标链接')
    expect(enLocaleSource).toContain('redirect opens the target URL in a new browser tab from the sidebar')
  })
})

describe('SettingsView custom menu ordering and SVG icon presets', () => {
  it('exposes a dedicated order panel so admins can reorder menus without hunting card header icons', () => {
    expect(settingsSource).toContain('admin.settings.customMenu.orderTitle')
    expect(settingsSource).toContain('admin.settings.customMenu.orderDescription')
    expect(settingsSource).toContain('custom-menu-order-list')
    expect(settingsSource).toContain('v-for="(item, index) in form.custom_menu_items"')
    expect(settingsSource).toContain('@click="moveMenuItem(index, -1)"')
    expect(settingsSource).toContain('@click="moveMenuItem(index, 1)"')
  })

  it('uses the custom menu icon picker instead of raw SVG upload alone', () => {
    expect(settingsSource).toContain("import CustomMenuIconPicker from '@/components/common/CustomMenuIconPicker.vue'")
    expect(settingsSource).toContain('<CustomMenuIconPicker')
    expect(settingsSource).toContain('custom_menu_svg_icon_presets')
    expect(settingsSource).toContain('@update:model-value="(v: string) => (item.icon_svg = v)"')
    expect(settingsSource).toContain("setCustomMenuIconRuntimeConfig")
  })

  it('carries custom menu SVG icon presets through frontend API types', () => {
    expect(typesSource).toContain('custom_menu_svg_icon_presets?: string[]')
    expect(adminSettingsApiSource).toContain('custom_menu_svg_icon_presets: string[]')
    expect(adminSettingsApiSource).toContain('custom_menu_svg_icon_presets?: string[]')
  })

  it('localizes the ordering and SVG URL picker labels', () => {
    expect(zhLocaleSource).toContain('菜单顺序')
    expect(zhLocaleSource).toContain('SVG 图床链接')
    expect(zhLocaleSource).toContain('已保存的 SVG 图标')
    expect(enLocaleSource).toContain('Menu order')
    expect(enLocaleSource).toContain('SVG image URL')
    expect(enLocaleSource).toContain('Saved SVG icons')
  })
})

describe('SettingsView route-tabs settings tabs', () => {
  it('uses text-only route tab buttons with a shared moving indicator', () => {
    const tabsTemplate = settingsSource.slice(
      settingsSource.indexOf('ref="settingsTabsRef"'),
      settingsSource.indexOf('</nav>', settingsSource.indexOf('ref="settingsTabsRef"')),
    )
    const tabsConfig = settingsSource.slice(
      settingsSource.indexOf('const settingsTabs = ['),
      settingsSource.indexOf('];', settingsSource.indexOf('const settingsTabs = [')),
    )

    expect(tabsTemplate).toContain('class="settings-tabs route-tabs settings-route-tabs"')
    expect(tabsTemplate).toContain('data-route-tabs="admin-settings"')
    expect(tabsTemplate).toContain('role="tablist"')
    expect(tabsTemplate).toContain(':data-route-id="tab.key"')
    expect(tabsTemplate).toContain('@mouseenter="moveSettingsTabIndicatorFromEvent"')
    expect(tabsTemplate).toContain('@focus="moveSettingsTabIndicatorFromEvent"')
    expect(tabsTemplate).toContain('@mouseleave="moveSettingsTabIndicatorToSelected"')
    expect(tabsTemplate).toContain('class="settings-tab-label"')
    expect(tabsTemplate).not.toContain('settings-tab-icon')
    expect(tabsTemplate).not.toContain('<Icon')
    expect(tabsConfig).not.toContain('icon:')
    expect(settingsSource).toContain('tabs.style.setProperty(')
    expect(settingsSource).toContain('"--route-indicator-x"')
    expect(settingsSource).toContain('"--route-indicator-w"')
  })

  it('keeps the parent settings menu as system settings while styling tabs as Anthropic route-tabs', () => {
    const genericSurfaceBlock = styleSource.slice(
      styleSource.indexOf('.app-layout-content :where(.card, .paper-card'),
      styleSource.indexOf('#app .app-layout-content .settings-tabs-shell'),
    )
    const tabsShellBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tabs-shell {')
    const tabsScrollBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tabs-scroll {')
    const tabsInnerBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tabs {')
    const tabsIndicatorBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tabs::before')
    const settingsTabBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tab {')
    const hiddenIconBlock = cssBlock(styleSource, '#app .app-layout-content .settings-tab svg,')

    expect(zhLocaleSource).toContain("settings: '系统设置'")
    expect(zhLocaleSource).toContain("settingsGeneral: '常规设置'")
    expect(zhLocaleSource).toContain("title: '常规设置'")
    expect(enLocaleSource).toContain("settings: 'Settings'")
    expect(enLocaleSource).toContain("settingsGeneral: 'General Settings'")
    expect(enLocaleSource).toContain("title: 'General Settings'")
    expect(genericSurfaceBlock).not.toContain('.settings-tabs-shell')
    expect(tabsShellBlock).toContain('border: 0 !important;')
    expect(tabsShellBlock).toContain('border-radius: 0 !important;')
    expect(tabsShellBlock).toContain('background: var(--anthropic-page) !important;')
    expect(tabsShellBlock).toContain('box-shadow: none !important;')
    expect(tabsScrollBlock).toContain('display: flex;')
    expect(tabsScrollBlock).toContain('width: 100%;')
    expect(tabsScrollBlock).toContain('justify-content: center;')
    expect(tabsScrollBlock).toContain('align-items: center;')
    expect(tabsInnerBlock).toContain('--route-indicator-x: 0.25rem;')
    expect(tabsInnerBlock).toContain('--route-indicator-w: 0px;')
    expect(tabsInnerBlock).toContain('width: fit-content;')
    expect(tabsInnerBlock).toContain('padding: 0.25rem !important;')
    expect(tabsInnerBlock).toContain('border-radius: 16px !important;')
    expect(tabsInnerBlock).toContain('background: var(--anthropic-raised) !important;')
    expect(tabsInnerBlock).toContain('box-shadow: inset 0 0 0 1px var(--anthropic-border-soft) !important;')
    expect(tabsIndicatorBlock).toContain('width: var(--route-indicator-w);')
    expect(tabsIndicatorBlock).toContain('background: var(--anthropic-page);')
    expect(tabsIndicatorBlock).toContain('transform: translateX(var(--route-indicator-x));')
    expect(settingsTabBlock).toContain('border-radius: 12px !important;')
    expect(settingsTabBlock).toContain('justify-content: center;')
    expect(settingsTabBlock).toContain('text-align: center;')
    expect(settingsTabBlock).toContain('background: transparent !important;')
    expect(settingsTabBlock).toContain('text-decoration-line: none !important;')
    expect(hiddenIconBlock).toContain('display: none !important;')
  })
})

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

describe('SettingsView rounded settings tabs', () => {
  it('uses rounded hover and active tab surfaces in the final global override layer', () => {
    const settingsTabBlock = styleSource.slice(
      styleSource.indexOf('#app .app-layout-content .settings-tab {'),
      styleSource.indexOf('#app .app-layout-content .settings-tab::before {'),
    )
    const settingsTabBeforeBlock = styleSource.slice(
      styleSource.indexOf('#app .app-layout-content .settings-tab::before {'),
      styleSource.indexOf('#app .app-layout-content .settings-tab >'),
    )
    const settingsTabActiveBlock = styleSource.slice(
      styleSource.indexOf('#app .app-layout-content .settings-tab-active,'),
      styleSource.indexOf('#app .app-layout-content .settings-tab-active::before {'),
    )

    expect(settingsTabBlock).toContain('border-radius: 0.625rem !important;')
    expect(settingsTabBeforeBlock).toContain('border-radius: inherit !important;')
    expect(settingsTabActiveBlock).toContain('border-radius: 0.625rem !important;')
    expect(styleSource).toContain('#app .app-layout-content .settings-tab-active:hover::before')
    expect(styleSource).toContain('#app .app-layout-content .settings-tab-active:focus-visible::before')
    expect(settingsTabBlock).not.toContain('border-radius: 0 !important;')
  })

  it('keeps the parent settings menu as system settings while centering the general settings page tabs', () => {
    const tabsShellBlock = styleSource.slice(
      styleSource.indexOf('#app .app-layout-content .settings-tabs-shell,'),
      styleSource.indexOf('#app .app-layout-content .settings-tab {', styleSource.indexOf('#app .app-layout-content .settings-tabs-shell,')),
    )

    expect(zhLocaleSource).toContain("settings: '系统设置'")
    expect(zhLocaleSource).toContain("settingsGeneral: '常规设置'")
    expect(zhLocaleSource).toContain("title: '常规设置'")
    expect(enLocaleSource).toContain("settings: 'Settings'")
    expect(enLocaleSource).toContain("settingsGeneral: 'General Settings'")
    expect(enLocaleSource).toContain("title: 'General Settings'")
    expect(tabsShellBlock).toContain('display: flex;')
    expect(tabsShellBlock).toContain('justify-content: center;')
    expect(tabsShellBlock).toContain('width: 100%;')
    expect(tabsShellBlock).toContain('margin-inline: auto;')
    expect(tabsShellBlock).toContain('align-items: center;')
  })
})

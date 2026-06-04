import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const settingsSource = readFileSync(resolve(frontendRoot, 'views/admin/SettingsView.vue'), 'utf8')
const typesSource = readFileSync(resolve(frontendRoot, 'types/index.ts'), 'utf8')
const adminSettingsApiSource = readFileSync(resolve(frontendRoot, 'api/admin/settings.ts'), 'utf8')
const styleSource = readFileSync(resolve(frontendRoot, 'style.css'), 'utf8')

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
    expect(settingsTabBlock).not.toContain('border-radius: 0 !important;')
  })
})

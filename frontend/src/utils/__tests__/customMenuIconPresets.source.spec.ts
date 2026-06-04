import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const utilPath = resolve(__dirname, '../customMenuIconPresets.ts')
const utilSource = existsSync(utilPath) ? readFileSync(utilPath, 'utf8') : ''

describe('custom menu icon preset utilities', () => {
  it('provides a server-backed runtime preset library for SVG icon URLs', () => {
    expect(existsSync(utilPath)).toBe(true)
    expect(utilSource).toContain('custom_menu_svg_icon_presets')
    expect(utilSource).toContain('setCustomMenuIconRuntimeConfig')
    expect(utilSource).toContain('rememberCustomMenuSVGIconPreset')
    expect(utilSource).toContain('getMergedCustomMenuSVGIconPresets')
    expect(utilSource).toContain('normalizeCustomMenuSVGIconPresetURLs')
    expect(utilSource).not.toContain('localStorage')
  })
})

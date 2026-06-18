import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const pickerSource = readFileSync(resolve(__dirname, '../CustomMenuIconPicker.vue'), 'utf8')
const apiSource = readFileSync(resolve(__dirname, '../../../api/customMenuIconPresets.ts'), 'utf8')

describe('CustomMenuIconPicker preset deletion contract', () => {
  it('lets admins delete saved custom-menu SVG URL presets from the shared library', () => {
    expect(apiSource).toContain('deleteCustomMenuSVGIconPreset')
    expect(apiSource).toContain("apiClient.delete")
    expect(apiSource).toContain("'/settings/custom-menu-svg-icon-presets'")
    expect(pickerSource).toContain('deleteCustomMenuSVGIconPreset')
    expect(pickerSource).toContain('@click.stop="deletePreset(preset.url)"')
    expect(pickerSource).toContain('custom-menu-icon-picker-preset-delete')
    expect(pickerSource).toContain('aria-label="Delete custom menu SVG icon"')
    expect(pickerSource).toContain('function deletePreset(url: string)')
    expect(pickerSource).toContain("emit('update:modelValue', '')")
  })
})

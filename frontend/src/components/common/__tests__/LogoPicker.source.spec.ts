import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const logoPickerSource = readFileSync(resolve(__dirname, '../LogoPicker.vue'), 'utf8')
const providerBrandSource = readFileSync(resolve(__dirname, '../../../utils/providerBrandIcon.ts'), 'utf8')

describe('LogoPicker preset gallery contract', () => {
  it('offers the shared CDN AI logo gallery as direct selectable presets', () => {
    expect(logoPickerSource).toContain("import { aiLogoPresets } from '@/utils/providerBrandIcon'")
    expect(logoPickerSource).toContain('v-for="preset in aiLogoPresets"')
    expect(logoPickerSource).toContain('logo-picker-preset')
    expect(logoPickerSource).toContain('@click="selectPreset(preset.url)"')
    expect(providerBrandSource).toContain('https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/light')
    expect(providerBrandSource).toContain('/openai.png')
    expect(logoPickerSource).toContain('Custom URL')
  })
})

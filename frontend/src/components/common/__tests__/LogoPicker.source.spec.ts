import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const logoPickerSource = readFileSync(resolve(__dirname, '../LogoPicker.vue'), 'utf8')
const providerBrandSource = readFileSync(resolve(__dirname, '../../../utils/providerBrandIcon.ts'), 'utf8')

describe('LogoPicker preset gallery contract', () => {
  it('offers the shared CDN AI logo gallery as direct selectable presets', () => {
    expect(logoPickerSource).toContain('getMergedAILogoPresets')
    expect(logoPickerSource).toContain('rememberCustomAILogoPreset')
    expect(logoPickerSource).toContain('mergedLogoPresets')
    expect(logoPickerSource).toContain('v-for="preset in mergedLogoPresets"')
    expect(logoPickerSource).toContain('logo-picker-preset')
    expect(logoPickerSource).toContain('@click="selectPreset(preset.url)"')
    expect(logoPickerSource).toContain('@blur="rememberCurrentValue"')
    expect(logoPickerSource).toContain('@change="rememberCurrentValue"')
    expect(providerBrandSource).toContain('https://unpkg.com/@lobehub/icons-static-png@1.91.0/light')
    expect(providerBrandSource).toContain("slug: 'openai'")
    expect(providerBrandSource).toContain("slug: 'bailian-color'")
    expect(providerBrandSource).toContain("slug: 'claudecode-color'")
    expect(logoPickerSource).toContain('Custom URL')
  })

  it('fills provider icon image and svg art inside the fixed icon wrapper', () => {
    const providerBrandIconSource = readFileSync(resolve(__dirname, '../ProviderBrandIcon.vue'), 'utf8')
    expect(providerBrandIconSource).toContain('overflow-hidden')
    expect(providerBrandIconSource).toContain('size="100%"')
    expect(providerBrandIconSource).toContain('@apply h-full w-full flex-shrink-0 object-cover')
    expect(providerBrandIconSource).toContain(':deep(.model-icon)')
    expect(providerBrandIconSource).toContain('width: 100%;')
    expect(providerBrandIconSource).toContain('height: 100%;')
  })

  it('remembers custom URL only after the field value is committed or a preset is selected', () => {
    expect(logoPickerSource).toContain('function handleInput(value: string)')
    expect(logoPickerSource).toContain("emit('update:modelValue', value)")
    expect(logoPickerSource).toContain('function rememberCurrentValue()')
    expect(logoPickerSource).toContain('rememberLogoURL(props.modelValue)')
    expect(logoPickerSource).toContain('function selectPreset(url: string)')
    expect(logoPickerSource).toContain('rememberLogoURL(url)')
    expect(logoPickerSource).not.toContain('function handleInput(value: string) {\n  emit(\'update:modelValue\', value)\n  rememberLogoURL(value)\n}')
  })
})

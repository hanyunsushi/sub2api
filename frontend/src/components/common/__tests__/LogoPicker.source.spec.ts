import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const logoPickerSource = readFileSync(resolve(__dirname, '../LogoPicker.vue'), 'utf8')
const providerBrandSource = readFileSync(resolve(__dirname, '../../../utils/providerBrandIcon.ts'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')

describe('LogoPicker preset gallery contract', () => {
  it('offers the shared CDN AI logo gallery as direct selectable presets', () => {
    expect(logoPickerSource).toContain('getMergedAILogoPresets')
    expect(logoPickerSource).toContain('rememberCustomAILogoPreset')
    expect(logoPickerSource).toContain('appendCustomAILogoPreset')
    expect(logoPickerSource).toContain('fetchPublicSettings')
    expect(logoPickerSource).toContain('setAILogoRuntimeConfig')
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
    expect(providerBrandSource).toContain('defaultAILogoCDNBaseURL')
    expect(providerBrandSource).toContain('custom_ai_logo_presets')
    expect(providerBrandSource).not.toContain('localStorage')
    expect(providerBrandSource).not.toContain('sub2api.customAiLogoPresets')
    expect(logoPickerSource).toContain('Custom URL')
  })

  it('keeps system CDN logo art contained while custom logo URLs fill the icon wrapper', () => {
    const providerBrandIconSource = readFileSync(resolve(__dirname, '../ProviderBrandIcon.vue'), 'utf8')
    expect(providerBrandIconSource).toContain('overflow-hidden')
    expect(providerBrandIconSource).toContain('isSystemAILogoPresetURL')
    expect(providerBrandIconSource).toContain('provider-brand-image-system')
    expect(providerBrandIconSource).toContain('provider-brand-image-custom')
    expect(providerBrandIconSource).toContain('object-contain')
    expect(providerBrandIconSource).toContain('object-cover')
    expect(providerBrandIconSource).toContain(':deep(.model-icon)')
    expect(providerBrandSource).toContain('isSystemAILogoPresetURL')
    expect(providerBrandSource).toContain('buildAILogoPresets()')
    expect(providerBrandSource).toContain('aiLogoPresets')
    expect(providerBrandIconSource).not.toContain('border shadow-sm')
    expect(providerBrandIconSource).not.toContain('box-shadow:')

    expect(logoPickerSource).toContain('previewImageClass')
    expect(logoPickerSource).toContain('isSystemAILogoPresetURL(normalizedValue.value)')
    expect(logoPickerSource).toContain('logo-picker-preview-image-system')
    expect(logoPickerSource).toContain('logo-picker-preview-image-custom')
    expect(styleSource).toContain('.logo-picker-preview-image-system')
    expect(styleSource).toContain('object-fit: contain;')
    expect(styleSource).toContain('.logo-picker-preview-image-custom')
    expect(styleSource).toContain('width: 100%;')
    expect(styleSource).not.toContain('.logo-picker-preview img {\n  display: block;\n  height: 95%;')
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

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../SettingsView.vue'), 'utf8')

describe('SettingsView AI logo settings contract', () => {
  it('exposes server-side AI logo CDN and shared custom preset controls', () => {
    expect(source).toContain('form.ai_logo_cdn_base_url')
    expect(source).toContain('customAILogoPresetsInput')
    expect(source).toContain('AI logo 图床基础 URL')
    expect(source).toContain('共享自定义 AI logo')
    expect(source).toContain('https://unpkg.com/@lobehub/icons-static-png@1.91.0/light')
  })

  it('saves AI logo settings through the admin settings payload', () => {
    expect(source).toContain('normalizeCustomAILogoPresetsInput')
    expect(source).toContain('ai_logo_cdn_base_url: form.ai_logo_cdn_base_url')
    expect(source).toContain('custom_ai_logo_presets: form.custom_ai_logo_presets')
  })
})

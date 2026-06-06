import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const keysViewSource = readFileSync(resolve(__dirname, '../views/user/KeysView.vue'), 'utf8')
const groupsViewSource = readFileSync(resolve(__dirname, '../views/admin/GroupsView.vue'), 'utf8')
const channelsViewSource = readFileSync(resolve(__dirname, '../views/admin/ChannelsView.vue'), 'utf8')
const providerBrandIconSource = readFileSync(resolve(__dirname, '../components/common/ProviderBrandIcon.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')

describe('entity AI logo rendering contract', () => {
  it('uses the shared ProviderBrandIcon for API keys, groups, and channels', () => {
    for (const source of [keysViewSource, groupsViewSource, channelsViewSource]) {
      expect(source).toMatch(/import ProviderBrandIcon from ['"]@\/components\/common\/ProviderBrandIcon\.vue['"]/)
      expect(source).toContain('<ProviderBrandIcon')
      expect(source).toContain(':logo-url=')
      expect(source).not.toContain('class="entity-logo"')
      expect(source).not.toContain('<img\n                v-if="row.logo_url"')
    }
  })

  it('keeps system AI logos contained while custom logos fill the shared entity shell', () => {
    expect(providerBrandIconSource).toContain('provider-brand-image-system')
    expect(providerBrandIconSource).toContain('provider-brand-image-custom')
    expect(providerBrandIconSource).toContain('object-contain')
    expect(providerBrandIconSource).toContain('object-cover')

    expect(styleSource).toContain('.entity-logo-shell .provider-brand-icon')
    expect(styleSource).toContain('.entity-logo-shell .provider-brand-image-system')
    expect(styleSource).toContain('.entity-logo-shell .provider-brand-image-custom')
    expect(styleSource).toContain('object-fit: contain !important;')
    expect(styleSource).toContain('object-fit: cover !important;')
  })

  it('removes the colored backing shell from transparent OpenAI and Anthropic system logos', () => {
    expect(providerBrandIconSource).toContain('provider-brand-transparent-shell')
    expect(providerBrandIconSource).toContain("['openai', 'claude', 'anthropic']")
    expect(providerBrandIconSource).toContain("backgroundColor: shouldUseTransparentShell ? 'transparent' : brand.background")
    expect(providerBrandIconSource).toContain("borderColor: shouldUseTransparentShell ? 'transparent' : brand.border")
  })
})

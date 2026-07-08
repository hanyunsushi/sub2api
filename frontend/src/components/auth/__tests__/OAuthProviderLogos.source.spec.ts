import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const authComponentRoot = resolve(__dirname, '..')
const providerLogoMarkSource = readFileSync(resolve(authComponentRoot, 'ProviderLogoMark.vue'), 'utf8')
const googleMarkSource = readFileSync(resolve(authComponentRoot, 'GoogleMark.vue'), 'utf8')
const dingTalkSource = readFileSync(resolve(authComponentRoot, 'DingTalkOAuthSection.vue'), 'utf8')
const wechatSource = readFileSync(resolve(authComponentRoot, 'WechatOAuthSection.vue'), 'utf8')
const oidcSource = readFileSync(resolve(authComponentRoot, 'OidcOAuthSection.vue'), 'utf8')
const profileBindingLogoSource = readFileSync(
  resolve(__dirname, '../../user/profile/ProviderBindingLogo.vue'),
  'utf8',
)

describe('OAuth provider logo marks', () => {
  it('uses shared provider logo marks instead of temporary letter placeholders', () => {
    for (const source of [dingTalkSource, wechatSource, oidcSource]) {
      expect(source).toContain('ProviderLogoMark')
      expect(source).toContain('auth-provider-logo-mark')
    }

    expect(dingTalkSource).toContain('provider="dingtalk"')
    expect(wechatSource).toContain('provider="wechat"')
    expect(oidcSource).toContain('provider="oidc"')
    expect(dingTalkSource).not.toContain('<text')
    expect(dingTalkSource).not.toContain('>D</text>')
    expect(wechatSource).not.toContain('>W')
    expect(oidcSource).not.toContain('providerInitial')
  })

  it('keeps profile binding logos on the same provider mark source', () => {
    expect(profileBindingLogoSource).toContain("import ProviderLogoMark from '@/components/auth/ProviderLogoMark.vue'")
    expect(profileBindingLogoSource).toContain('<ProviderLogoMark')
    expect(providerLogoMarkSource).toContain('provider === \'github\'')
    expect(providerLogoMarkSource).toContain('provider === \'google\'')
    expect(providerLogoMarkSource).toContain('provider === \'dingtalk\'')
    expect(providerLogoMarkSource).toContain('provider === \'wechat\'')
    expect(providerLogoMarkSource).toContain('provider === \'linuxdo\'')
    expect(providerLogoMarkSource).toContain('data:image/svg+xml;base64,')
    expect(providerLogoMarkSource).not.toContain('https://linux.do/uploads/default/original/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994.png')
    expect(providerLogoMarkSource).toContain('https://gw.alicdn.com/imgextra/i1/O1CN01v0jO6U1J7o3hkhmNt_!!6000000000982-2-tps-240-240.png')
    expect(providerLogoMarkSource).toContain('https://openid.net/wp-content/uploads/2022/11/df-l-oix-l-openid_rgb-300dpi.png')
    expect(providerLogoMarkSource).toContain('viewBox="0 0 82 82"')
    expect(providerLogoMarkSource).toContain('fill="#07C160"')
    expect(providerLogoMarkSource).toContain('<circle cx="38.6734" cy="27.757"')
    expect(providerLogoMarkSource).not.toContain('<rect width="82" height="82" rx="18"')
    expect(providerLogoMarkSource).not.toContain('wechatLogoURL')
    expect(providerLogoMarkSource).not.toContain(':src="wechatLogoURL"')
    expect(providerLogoMarkSource).toContain(':src="linuxDoLogoURL"')
    expect(providerLogoMarkSource).toContain('referrerpolicy="no-referrer"')
    expect(providerLogoMarkSource).not.toContain('#1677ff')
    expect(providerLogoMarkSource).not.toContain('#1677FF')
    expect(providerLogoMarkSource).not.toContain('>W')
    expect(providerLogoMarkSource).not.toContain('>L')
    expect(googleMarkSource).toContain('viewBox="0 0 268.1522 273.8827"')
    expect(googleMarkSource).toContain('<linearGradient id="google-g-a">')
    expect(googleMarkSource).toContain('<radialGradient')
    expect(googleMarkSource).not.toContain('M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26')
  })
})

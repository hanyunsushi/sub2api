import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../SettingsView.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('SettingsView external quota settings placement', () => {
  it('labels the shared BuzzAI and TCDMX quota card as external subscriptions', () => {
    expect(source).toContain('localText("外部订阅", "External subscriptions")')
    expect(source).not.toContain('localText("BuzzAI 余额", "BuzzAI Balance")')
  })

  it('keeps BuzzAI, TCDMX, qlhazycoder, and XHYAPI external quota settings in the same gateway card', () => {
    const buzzIndex = source.indexOf('<!-- BuzzAI Balance Settings -->')
    const tcdmxIndex = source.indexOf('启用 TCDMX 订阅额度')
    const qlhazycoderIndex = source.indexOf('启用 qlhazycoder 订阅额度')
    const xhyapiIndex = source.indexOf('启用 XHYAPI 订阅额度')
    const gatewaySchedulingIndex = source.indexOf('<!-- Gateway Scheduling Settings -->')
    const securityEndIndex = source.indexOf('<!-- /Tab: Security')

    expect(buzzIndex).toBeGreaterThan(-1)
    expect(tcdmxIndex).toBeGreaterThan(buzzIndex)
    expect(qlhazycoderIndex).toBeGreaterThan(tcdmxIndex)
    expect(xhyapiIndex).toBeGreaterThan(qlhazycoderIndex)
    expect(xhyapiIndex).toBeLessThan(gatewaySchedulingIndex)
    expect(qlhazycoderIndex).toBeLessThan(gatewaySchedulingIndex)
    expect(tcdmxIndex).toBeLessThan(gatewaySchedulingIndex)
    expect(source.slice(0, securityEndIndex)).not.toContain('启用 TCDMX 订阅额度')
    expect(source.slice(0, securityEndIndex)).not.toContain('启用 qlhazycoder 订阅额度')
    expect(source.slice(0, securityEndIndex)).not.toContain('启用 XHYAPI 订阅额度')
  })

  it('explains that TCDMX quota lookup needs a subscription access token, not the normal model API key', () => {
    expect(source).toContain('localText("TCDMX 订阅访问 Token", "TCDMX subscription access token")')
    expect(source).toContain('粘贴可访问 TCDMX 订阅接口的 Token')
    expect(source).toContain('普通 sk- 调用密钥只能调用模型接口，不能读取订阅额度')
    expect(source).not.toContain('localText("TCDMX API Key", "TCDMX API Key")')
    expect(source).not.toContain("localText('粘贴 TCDMX API Key', 'Paste TCDMX API key')")
  })

  it('collects the TCDMX refresh_token separately for automatic auth_token renewal', () => {
    expect(source).toContain('tcdmx_subscription_refresh_token')
    expect(source).toContain('tcdmx_subscription_refresh_token_configured')
    expect(source).toContain('localText("TCDMX refresh_token", "TCDMX refresh_token")')
    expect(source).toContain('auth_token 过期后自动刷新')
    expect(source).toContain('不是 sk- API 密钥')
  })

  it('collects the qlhazycoder user token without asking for a missing refresh_token', () => {
    expect(source).toContain('qlhazycoder_subscription_enabled')
    expect(source).toContain('qlhazycoder_subscription_api_base_url')
    expect(source).toContain('qlhazycoder_subscription_api_token')
    expect(source).toContain('qlhazycoder_subscription_api_token_configured')
    expect(source).not.toContain('qlhazycoder_subscription_refresh_token')
    expect(source).not.toContain('qlhazycoder_subscription_refresh_token_configured')
    expect(source).toContain('localText("qlhazycoder 用户令牌", "qlhazycoder user token")')
    expect(source).toContain('个人设置')
    expect(source).toContain('生成/重新生成令牌')
    expect(source).toContain('{id, token} JSON')
    expect(source).toContain('https://api.qlhazycoder.top')
    expect(source).toContain('不是 sk- API 密钥')
    expect(source).not.toContain('qlhazycoder refresh_token')
    expect(source).not.toContain('localStorage.user JSON')
    expect(source).not.toContain('localStorage.user_token')
  })

  it('collects XHYAPI subscription token and refresh_token like the shared New API subscription flow', () => {
    expect(source).toContain('xhyapi_subscription_enabled')
    expect(source).toContain('xhyapi_subscription_api_base_url')
    expect(source).toContain('xhyapi_subscription_api_token')
    expect(source).toContain('xhyapi_subscription_api_token_configured')
    expect(source).toContain('xhyapi_subscription_refresh_token')
    expect(source).toContain('xhyapi_subscription_refresh_token_configured')
    expect(source).toContain('localText("XHYAPI 订阅访问 Token", "XHYAPI subscription access token")')
    expect(source).toContain('localText("XHYAPI refresh_token", "XHYAPI refresh_token")')
    expect(source).toContain('https://xhyapi.com')
  })
})

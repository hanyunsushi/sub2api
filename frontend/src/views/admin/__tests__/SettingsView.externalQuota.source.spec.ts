import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../SettingsView.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('SettingsView external subscription placement', () => {
  it('links to the dedicated external subscriptions settings subpage instead of editing providers inline', () => {
    expect(source).toContain('localText("外部订阅", "External subscriptions")')
    expect(source).toContain('/admin/settings/external-subscriptions')
    expect(source).toContain('localText("管理外部订阅", "Manage external subscriptions")')
    expect(source).not.toContain('启用 TCDMX 订阅额度')
    expect(source).not.toContain('启用 qlhazycoder 订阅额度')
    expect(source).not.toContain('启用 XHYAPI 订阅额度')
    expect(source).not.toContain('启用 Pixel 订阅额度')
    expect(source).not.toContain('启用 liust 订阅额度')
    expect(source).not.toContain('启用 PackyCode 订阅额度')
  })

  it('keeps legacy provider fields out of the generic settings page', () => {
    const templateSource = source.slice(0, source.indexOf('<script setup'))

    for (const legacyField of [
      'buzz_balance_api_token',
      'tcdmx_subscription_api_token',
      'qlhazycoder_subscription_api_token',
      'xhyapi_subscription_api_token',
      'pixel_subscription_api_token',
      'liust_subscription_api_token',
      'packycode_subscription_api_token',
    ]) {
      expect(templateSource).not.toContain(legacyField)
      expect(source).not.toContain(legacyField)
    }
  })
})

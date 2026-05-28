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

  it('keeps BuzzAI and TCDMX external quota settings in the same gateway card', () => {
    const buzzIndex = source.indexOf('<!-- BuzzAI Balance Settings -->')
    const tcdmxIndex = source.indexOf('启用 TCDMX 订阅额度')
    const gatewaySchedulingIndex = source.indexOf('<!-- Gateway Scheduling Settings -->')
    const securityEndIndex = source.indexOf('<!-- /Tab: Security')

    expect(buzzIndex).toBeGreaterThan(-1)
    expect(tcdmxIndex).toBeGreaterThan(buzzIndex)
    expect(tcdmxIndex).toBeLessThan(gatewaySchedulingIndex)
    expect(source.slice(0, securityEndIndex)).not.toContain('启用 TCDMX 订阅额度')
  })
})

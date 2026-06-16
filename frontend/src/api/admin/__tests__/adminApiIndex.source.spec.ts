import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const adminApiDir = resolve(__dirname, '..')
const indexSource = readFileSync(resolve(adminApiDir, 'index.ts'), 'utf8')

describe('admin API index external subscriptions cleanup', () => {
  it('only exposes the unified external subscriptions API', () => {
    expect(indexSource).toContain("import externalSubscriptionsAPI from './externalSubscriptions'")
    expect(indexSource).toContain('externalSubscriptions: externalSubscriptionsAPI')
    expect(indexSource).toContain('externalSubscriptionsAPI')

    for (const legacy of [
      'buzzBalance',
      'tcdmxSubscription',
      'qlhazycoderSubscription',
      'xhyapiSubscription',
      'pixelSubscription',
      'liustSubscription',
      'packycodeSubscription',
      'BuzzBalance',
      'TCDMXSubscription',
      'QLHazyCoderSubscription',
      'XHYAPISubscription',
      'PixelSubscription',
      'LiustSubscription',
      'PackyCodeSubscription',
    ]) {
      expect(indexSource).not.toContain(legacy)
    }
  })

  it('does not keep provider-specific external subscription API modules', () => {
    for (const file of [
      'buzzBalance.ts',
      'tcdmxSubscription.ts',
      'qlhazycoderSubscription.ts',
      'xhyapiSubscription.ts',
      'pixelSubscription.ts',
      'liustSubscription.ts',
      'packycodeSubscription.ts',
    ]) {
      expect(existsSync(resolve(adminApiDir, file))).toBe(false)
    }
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const adminMonitorSource = readFileSync(resolve(__dirname, '../views/admin/ChannelMonitorView.vue'), 'utf8')
const userMonitorCardSource = readFileSync(resolve(__dirname, '../components/user/monitor/MonitorCard.vue'), 'utf8')

describe('channel monitor AI logo contract', () => {
  it('uses the shared AI logo resolver on admin and user channel monitor surfaces', () => {
    for (const source of [adminMonitorSource, userMonitorCardSource]) {
      expect(source).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
      expect(source).toContain('<ProviderBrandIcon')
    }

    expect(adminMonitorSource).toContain(':provider="row.provider"')
    expect(adminMonitorSource).toContain(':model="row.primary_model"')
    expect(userMonitorCardSource).toContain(':provider="item.provider"')
    expect(userMonitorCardSource).toContain(':model="item.primary_model"')
    expect(userMonitorCardSource).not.toContain("import ProviderIcon from './ProviderIcon.vue'")
  })
})

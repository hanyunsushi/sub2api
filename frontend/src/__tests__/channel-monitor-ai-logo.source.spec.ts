import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const adminMonitorSource = readFileSync(resolve(__dirname, '../views/admin/ChannelMonitorView.vue'), 'utf8')
const userMonitorCardSource = readFileSync(resolve(__dirname, '../components/user/monitor/MonitorCard.vue'), 'utf8')
const primaryModelCellSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorPrimaryModelCell.vue'), 'utf8')
const filtersBarSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorFiltersBar.vue'), 'utf8')
const monitorFormDialogSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorFormDialog.vue'), 'utf8')
const templateManagerSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorTemplateManagerDialog.vue'), 'utf8')
const templateApplyPickerSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorTemplateApplyPickerDialog.vue'), 'utf8')
const adminMonitorApiSource = readFileSync(resolve(__dirname, '../api/admin/channelMonitor.ts'), 'utf8')
const userMonitorApiSource = readFileSync(resolve(__dirname, '../api/channelMonitor.ts'), 'utf8')
const providerBrandIconSource = readFileSync(resolve(__dirname, '../components/common/ProviderBrandIcon.vue'), 'utf8')

describe('channel monitor AI logo contract', () => {
  it('uses the shared AI logo resolver on admin and user channel monitor surfaces', () => {
    for (const source of [
      adminMonitorSource,
      userMonitorCardSource,
      primaryModelCellSource,
      filtersBarSource,
      monitorFormDialogSource,
      templateManagerSource,
      templateApplyPickerSource,
    ]) {
      expect(source).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
      expect(source).toContain('<ProviderBrandIcon')
    }

    expect(adminMonitorSource).toContain(':provider="row.provider"')
    expect(adminMonitorSource).toContain(':model="row.primary_model"')
    expect(userMonitorCardSource).toContain(':provider="item.provider"')
    expect(userMonitorCardSource).toContain(':model="item.primary_model"')
    expect(primaryModelCellSource).toContain(':provider="row.provider"')
    expect(primaryModelCellSource).toContain(':model="row.primary_model"')
    expect(filtersBarSource).toContain('<template #selected="{ option }">')
    expect(filtersBarSource).toContain('<template #option="{ option }">')
    expect(filtersBarSource).toContain(':provider="String(option.value)"')
    expect(filtersBarSource).toContain(':model="String(option.value)"')
    expect(monitorFormDialogSource).toContain(':provider="opt.value"')
    expect(monitorFormDialogSource).toContain(':model="form.primary_model || opt.value"')
    expect(templateManagerSource).toContain(':provider="tab.value"')
    expect(templateManagerSource).toContain(':model="tab.value"')
    expect(templateManagerSource).toContain(':provider="opt.value"')
    expect(templateApplyPickerSource).toContain(':provider="m.provider"')
    expect(templateApplyPickerSource).toContain(':model="m.provider"')
    expect(userMonitorCardSource).not.toContain("import ProviderIcon from './ProviderIcon.vue'")
    expect(monitorFormDialogSource).not.toContain("import ProviderIcon from '@/components/user/monitor/ProviderIcon.vue'")
  })

  it('persists custom AI logo URLs and exposes the shared logo picker in monitor editing', () => {
    expect(adminMonitorApiSource).toContain('logo_url: string')
    expect(adminMonitorApiSource).toContain('logo_url?: string')
    expect(userMonitorApiSource).toContain('logo_url: string')
    expect(providerBrandIconSource).toContain('logoUrl?: string | null')
    expect(providerBrandIconSource).toContain('props.logoUrl?.trim()')

    expect(monitorFormDialogSource).toContain("import LogoPicker from '@/components/common/LogoPicker.vue'")
    expect(monitorFormDialogSource).toContain('<LogoPicker')
    expect(monitorFormDialogSource).toContain('v-model="form.logo_url"')
    expect(monitorFormDialogSource).toContain('input-test-id="channel-monitor-logo-url"')
    expect(monitorFormDialogSource).toContain('logo_url: string')
    expect(monitorFormDialogSource).toContain("form.logo_url = m.logo_url || ''")
    expect(monitorFormDialogSource).toContain('logo_url: form.logo_url.trim()')
    expect(monitorFormDialogSource).toContain(':logo-url="form.logo_url"')

    expect(adminMonitorSource).toContain(':logo-url="row.logo_url"')
    expect(primaryModelCellSource).toContain(':logo-url="row.logo_url"')
    expect(userMonitorCardSource).toContain(':logo-url="item.logo_url"')
  })
})

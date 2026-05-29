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
})

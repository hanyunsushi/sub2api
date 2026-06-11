import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const apiSource = readFileSync(resolve(__dirname, '../../../api/admin/channelMonitor.ts'), 'utf8')
const dialogSource = readFileSync(resolve(__dirname, '../../../components/admin/monitor/MonitorFormDialog.vue'), 'utf8')
const settingsSource = readFileSync(resolve(__dirname, '../SettingsView.vue'), 'utf8')

describe('channel monitor account auto scheduling source contract', () => {
  it('exposes an account binding on channel monitor API payloads and form', () => {
    expect(apiSource).toContain('account_id: number | null')
    expect(apiSource).toContain('account_id?: number | null')
    expect(apiSource).toContain('account_ids: number[]')
    expect(apiSource).toContain('account_ids?: number[]')
    expect(dialogSource).toContain('account_ids')
    expect(dialogSource).toContain('matchingAccountIDsForMonitorName')
    expect(dialogSource).toContain('applyCreateAccountBindingSuggestion')
    expect(dialogSource).toContain('toggleAccountBinding')
    expect(dialogSource).toContain('loadAccountsForBinding')
    expect(dialogSource).toContain("t('admin.channelMonitor.form.accountBinding')")
  })

  it('adds one global settings switch for channel monitor account auto scheduling', () => {
    expect(settingsSource).toContain('channel_monitor_account_auto_schedule_enabled')
    expect(settingsSource).toContain("t('admin.settings.features.channelMonitor.accountAutoSchedule')")
    expect(settingsSource).toContain("t('admin.settings.features.channelMonitor.accountAutoScheduleHint')")
  })
})

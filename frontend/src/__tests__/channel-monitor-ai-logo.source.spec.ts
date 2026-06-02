import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const adminMonitorSource = readFileSync(resolve(__dirname, '../views/admin/ChannelMonitorView.vue'), 'utf8')
const userMonitorCardSource = readFileSync(resolve(__dirname, '../components/user/monitor/MonitorCard.vue'), 'utf8')
const userMonitorTimelineSource = readFileSync(resolve(__dirname, '../components/user/monitor/MonitorTimeline.vue'), 'utf8')
const primaryModelCellSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorPrimaryModelCell.vue'), 'utf8')
const filtersBarSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorFiltersBar.vue'), 'utf8')
const monitorFormDialogSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorFormDialog.vue'), 'utf8')
const templateManagerSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorTemplateManagerDialog.vue'), 'utf8')
const templateApplyPickerSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorTemplateApplyPickerDialog.vue'), 'utf8')
const adminMonitorApiSource = readFileSync(resolve(__dirname, '../api/admin/channelMonitor.ts'), 'utf8')
const userMonitorApiSource = readFileSync(resolve(__dirname, '../api/channelMonitor.ts'), 'utf8')
const providerBrandIconSource = readFileSync(resolve(__dirname, '../components/common/ProviderBrandIcon.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')

const cssBlock = (source: string, selector: string) => {
  const selectorIndex = source.indexOf(`${selector} {`)
  expect(selectorIndex).toBeGreaterThan(-1)

  const openBraceIndex = source.indexOf('{', selectorIndex)
  expect(openBraceIndex).toBeGreaterThan(-1)

  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') {
      depth += 1
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(openBraceIndex + 1, index)
      }
    }
  }

  throw new Error(`CSS block not closed for ${selector}`)
}

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

  it('aligns the monitor provider logo shell with the shared brand icon tile', () => {
    expect(userMonitorCardSource).toContain('monitor-provider-logo-shell')

    const shellBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-provider-logo-shell'
    )
    expect(shellBlock).toContain('width: 2.25rem !important;')
    expect(shellBlock).toContain('height: 2.25rem !important;')
    expect(shellBlock).toContain('padding: 0 !important;')

    const brandIconBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-provider-logo-shell .provider-brand-icon'
    )
    expect(brandIconBlock).toContain('width: 100% !important;')
    expect(brandIconBlock).toContain('height: 100% !important;')
    expect(brandIconBlock).toContain('border: 0 !important;')
    expect(brandIconBlock).toContain('border-radius: inherit !important;')
    expect(brandIconBlock).toContain('box-shadow: none !important;')

    const systemImageBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-provider-logo-shell .provider-brand-image-system'
    )
    expect(systemImageBlock).toContain('width: 1.25rem !important;')
    expect(systemImageBlock).toContain('height: 1.25rem !important;')
    expect(systemImageBlock).toContain('object-fit: contain !important;')

    const customImageBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-provider-logo-shell .provider-brand-image-custom'
    )
    expect(customImageBlock).toContain('width: 100% !important;')
    expect(customImageBlock).toContain('height: 100% !important;')
    expect(customImageBlock).toContain('object-fit: cover !important;')
  })

  it('keeps monitor timeline status bars on explicit health colors', () => {
    expect(userMonitorTimelineSource).toContain('monitor-timeline-bar flex-1')
    expect(userMonitorTimelineSource).toContain("operational: 'monitor-timeline-bar--operational'")
    expect(userMonitorTimelineSource).toContain("degraded: 'monitor-timeline-bar--degraded'")
    expect(userMonitorTimelineSource).not.toContain("operational: 'bg-emerald-500'")
    expect(userMonitorTimelineSource).not.toContain("degraded: 'bg-amber-500'")

    const operationalBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-timeline-bar--operational'
    )
    expect(operationalBlock).toContain('background: #10a37f !important;')

    const degradedBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card .monitor-timeline-bar--degraded'
    )
    expect(degradedBlock).toContain('background: var(--atelier-butter) !important;')
  })
})

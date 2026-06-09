import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const viewSource = readFileSync(resolve(__dirname, '../ChannelStatusView.vue'), 'utf8')
const componentSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCapacityOverview.vue'), 'utf8')

describe('ChannelStatusView shared capacity overview source', () => {
  it('loads external subscription display statuses and renders a monitor group capacity overview', () => {
    expect(viewSource).toContain("import MonitorCapacityOverview")
    expect(viewSource).toContain("import externalSubscriptionsAPI")
    expect(viewSource).toContain("type ExternalSubscriptionStatus")
    expect(viewSource).toContain("externalSubscriptionsAPI.getDisplayStatuses()")
    expect(viewSource).toContain("<MonitorCapacityOverview")
    expect(viewSource).toContain(":items=\"items\"")
    expect(viewSource).toContain(":statuses=\"externalSubscriptionStatuses\"")
  })

  it('aggregates known monitor groups by total external balance instead of availability windows', () => {
    expect(componentSource).toContain("const GROUP_ORDER = ['gpt', 'claude', 'mimo', 'rawchat', 'free']")
    expect(componentSource).toContain("remaining_usd")
    expect(componentSource).toContain("balanceTotal")
    expect(componentSource).toContain("matchedStatuses")
    expect(componentSource).toContain("groupExternalKeywords")
    expect(componentSource).toContain("buzz")
    expect(componentSource).toContain("rawchat: ['rawchat', 'rawchat.cn', 'rawc', 'codex']")
    expect(componentSource).toContain("free: ['free']")
    expect(componentSource).not.toContain("free: ['free', 'rawchat'")
    expect(componentSource).toContain("ProviderBrandIcon")
    expect(componentSource).toContain('shouldRenderCapacityGroup(group, monitors, matchedStatuses)')
    expect(componentSource).not.toContain("availability_7d")
    expect(componentSource).not.toContain("5h")
  })

  it('falls back to monitor logo_url for capacity card logos when no external status matches', () => {
    expect(componentSource).toContain('previewLogos')
    expect(componentSource).toContain('buildPreviewLogos(matchedStatuses, monitors)')
    expect(componentSource).toContain('function buildPreviewLogos(')
    expect(componentSource).toContain('function monitorLogoText(')
    expect(componentSource).toContain('function logoVisualKey(')
    expect(componentSource).toContain('function logoProviderKey(')
    expect(componentSource).toContain('logoVisualKey(logo)')
    expect(componentSource).toContain('logoProviderKey(logo)')
    expect(componentSource).toContain('return `url:${logoUrl}`')
    expect(componentSource).toContain('seenProviderKeys')
    expect(componentSource).toContain('item.logo_url')
    expect(componentSource).toContain(':logo-url="logo.logoUrl"')
    expect(componentSource).not.toContain('v-for="subscription in card.previewStatuses"')
  })

  it('renders monitor status distribution bars like the reference monitor overview', () => {
    expect(componentSource).toContain('statusSegments')
    expect(componentSource).toContain('monitor-capacity-status-bar')
    expect(componentSource).toContain('monitor-capacity-status-segment')
    expect(componentSource).toContain("localText('可用', 'Available')")
    expect(componentSource).toContain("localText('限流', 'Limited')")
    expect(componentSource).toContain("localText('错误', 'Error')")
    expect(componentSource).toContain("localText('停用', 'Disabled')")
  })
})

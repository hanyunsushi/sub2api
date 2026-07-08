import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const viewSource = readFileSync(resolve(__dirname, '../ChannelStatusView.vue'), 'utf8')
const componentSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCapacityOverview.vue'), 'utf8')
const monitorGridSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCardGrid.vue'), 'utf8')
const monitorCardSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCard.vue'), 'utf8')
const targetedRepairSource = readFileSync(resolve(__dirname, '../../../styles/targeted-visual-repair.css'), 'utf8')

const cssBlock = (content: string, selector: string): string => {
  const start = content.indexOf(selector)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const open = content.indexOf('{', start)
  expect(open, `Expected CSS selector ${selector} to open`).toBeGreaterThan(start)
  let depth = 0
  for (let index = open; index < content.length; index += 1) {
    const char = content[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return content.slice(open + 1, index)
    }
  }
  throw new Error(`Expected CSS selector ${selector} to close`)
}

describe('ChannelStatusView shared capacity overview source', () => {
  it('loads external subscription display statuses and renders a monitor group capacity overview', () => {
    expect(viewSource).toContain("import MonitorCapacityOverview")
    expect(viewSource).toContain("import externalSubscriptionsAPI")
    expect(viewSource).toContain("type ExternalSubscriptionStatus")
    expect(viewSource).toContain("externalSubscriptionsAPI.getDisplayStatuses()")
    expect(viewSource).toContain("<MonitorCapacityOverview")
    expect(viewSource).toContain(":items=\"items\"")
    expect(viewSource).toContain(":statuses=\"externalSubscriptionStatuses\"")
    expect(viewSource).toContain('class="monitor-page-linked-hover-group"')
    expect(viewSource.indexOf('class="monitor-page-linked-hover-group"')).toBeLessThan(
      viewSource.indexOf('<MonitorCapacityOverview')
    )
    expect(viewSource.indexOf('class="monitor-page-linked-hover-group"')).toBeLessThan(
      viewSource.indexOf('<MonitorCardGrid')
    )
  })

  it('aggregates channel monitor groups dynamically by total external balance instead of availability windows', () => {
    expect(componentSource).toContain('type MonitorCapacityGroup')
    expect(componentSource).toContain('Array.from(groups.values())')
    expect(componentSource).toContain("remaining_usd")
    expect(componentSource).toContain("balanceTotal")
    expect(componentSource).toContain("matchedStatuses")
    expect(componentSource).toContain("knownGroupExternalKeywords")
    expect(componentSource).toContain("buzz")
    expect(componentSource).toContain("qlhazycoder")
    expect(componentSource).toContain("rawchat.cn")
    expect(componentSource).toContain('matchStatusesForGroup(group.key, monitors, props.statuses)')
    expect(componentSource).toContain('resolveGroupExternalKeywords(group, monitors)')
    expect(componentSource).not.toContain('const GROUP_ORDER')
    expect(componentSource).not.toContain('if (!GROUP_ORDER.includes(group)) continue')
    expect(componentSource).not.toContain("rawchat: ['rawchat'")
    expect(componentSource).not.toContain("free: ['free', 'rawchat'")
    expect(componentSource).toContain("ProviderBrandIcon")
    expect(componentSource).not.toContain('shouldRenderCapacityGroup(group, monitors, matchedStatuses)')
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
    expect(componentSource).toContain("import { systemAILogoPresetIDFromURL } from '@/utils/providerBrandIcon'")
    expect(componentSource).toContain('systemAILogoPresetIDFromURL(logo.logoUrl)')
    expect(componentSource).toContain('function canonicalLogoProviderKey(')
    expect(componentSource).toContain('return `url:${logoUrl}`')
    expect(componentSource).toContain('seenProviderKeys')
    expect(componentSource).toContain("['cloudflare', ['cloudflare'")
    expect(componentSource).toContain("['openrouter', ['openrouter', 'openrouter.ai']]")
    expect(componentSource).toContain('item.logo_url')
    expect(componentSource).toContain(':logo-url="logo.logoUrl"')
    expect(componentSource).not.toContain('v-for="subscription in card.previewStatuses"')
  })

  it('renders monitor status distribution bars like the reference monitor overview', () => {
    expect(componentSource).toContain('statusSegments')
    expect(componentSource).toContain('monitor-capacity-status-bar')
    expect(componentSource).toContain('monitor-capacity-status-segment')
    expect(componentSource).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(componentSource).toContain('grid-template-columns: 0.5rem minmax(0, 1fr) 1.5rem;')
    expect(componentSource).toContain("localText('可用', 'Available')")
    expect(componentSource).toContain("localText('限流', 'Limited')")
    expect(componentSource).toContain("localText('错误', 'Error')")
    expect(componentSource).toContain("localText('停用', 'Disabled')")
  })

  it('uses the Anthropic tutorial-card single-card hover contract for shared capacity cards', () => {
    const capacityBaseBlock = cssBlock(componentSource, '.monitor-capacity-card')
    const capacityHoverBlock = cssBlock(componentSource, '.monitor-capacity-card:hover')
    const capacityMetricHoverBlock = cssBlock(
      componentSource,
      '.monitor-capacity-card:hover .monitor-capacity-metric-tile'
    )
    const pageMetricHoverBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .monitor-page-linked-hover-group .monitor-linked-card:where(:hover, :focus-visible, :focus-within) :where(.monitor-capacity-metric-tile, .monitor-metric-tile)'
    )

    expect(componentSource).toContain('monitor-capacity-overview mb-5')
    expect(componentSource).not.toContain('monitor-capacity-overview monitor-card-linked-hover-group')
    expect(componentSource).toContain('monitor-capacity-card monitor-linked-card')
    expect(componentSource).toContain('monitor-capacity-metric-tile')
    expect(capacityBaseBlock).not.toContain('--creepee-home-card-hover-shadow')
    expect(capacityBaseBlock).not.toContain('--creepee-home-card-hover-transform')
    expect(capacityBaseBlock).toContain('border-color: var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08));')
    expect(capacityBaseBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(capacityBaseBlock).toContain('box-shadow: none;')
    expect(capacityBaseBlock).toContain('transition: box-shadow 0.25s ease;')
    expect(capacityBaseBlock).not.toContain('transform')
    expect(capacityHoverBlock).toContain('border-color: var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08));')
    expect(capacityHoverBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(capacityHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);')
    expect(capacityHoverBlock).toContain('text-decoration: none;')
    expect(capacityHoverBlock).not.toContain('translate')
    expect(capacityHoverBlock).not.toContain('--creepee-home-card-hover')
    expect(capacityMetricHoverBlock).toContain('border-color: var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08));')
    expect(capacityMetricHoverBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(componentSource).not.toContain('.monitor-capacity-overview:has(.monitor-capacity-card:hover)')
    expect(targetedRepairSource).not.toContain('.monitor-page-linked-hover-group:has(.monitor-linked-card:hover)')
    expect(pageMetricHoverBlock).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(pageMetricHoverBlock).toContain('background: var(--anthropic-page) !important;')
    expect(pageMetricHoverBlock).toContain('box-shadow: none !important;')
  })

  it('applies the same single-card hover treatment to channel monitor cards', () => {
    const linkedBaseBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content :where(.monitor-page-linked-hover-group .monitor-linked-card)'
    )
    const linkedHoverBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content :where(.monitor-page-linked-hover-group .monitor-linked-card:hover'
    )

    expect(monitorGridSource).toContain('monitor-channel-card-grid grid gap-5')
    expect(monitorGridSource).not.toContain('monitor-channel-card-grid monitor-card-linked-hover-group')
    expect(monitorCardSource).toContain('monitor-channel-card monitor-linked-card')
    expect(monitorCardSource).not.toContain('shadow-card')
    expect(monitorCardSource).not.toContain('shadow-card-hover')
    expect(monitorCardSource).not.toContain('hover:border')
    expect(monitorCardSource).not.toContain('dark:hover:border')
    expect(linkedBaseBlock).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(linkedBaseBlock).toContain('background: var(--anthropic-page) !important;')
    expect(linkedBaseBlock).toContain('box-shadow: none !important;')
    expect(linkedBaseBlock).toContain('transform: none !important;')
    expect(linkedBaseBlock).toContain('opacity: 1 !important;')
    expect(linkedBaseBlock).toContain('transition: box-shadow 0.25s ease !important;')
    expect(linkedBaseBlock).not.toContain('--creepee-home-card-hover')
    expect(linkedBaseBlock).not.toContain('translate3d')
    expect(linkedHoverBlock).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(linkedHoverBlock).toContain('background: var(--anthropic-page) !important;')
    expect(linkedHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08) !important;')
    expect(linkedHoverBlock).toContain('transform: none !important;')
    expect(linkedHoverBlock).toContain('text-decoration: none !important;')
    expect(linkedHoverBlock).not.toContain('--creepee-home-card-hover')
    expect(linkedHoverBlock).not.toContain('translate')
    expect(targetedRepairSource).not.toContain('.monitor-page-linked-hover-group:has(.monitor-linked-card:hover) .monitor-linked-card:not(:hover)')
  })

  it('keeps monitor metric tiles paper-colored while preserving semantic status and provider colors', () => {
    const metricTileBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .monitor-page-linked-hover-group :where(.monitor-capacity-metric-tile, .monitor-metric-tile)'
    )
    const statusErrorBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content :where(.monitor-status-badge.monitor-status-failed, .monitor-status-badge.monitor-status-error)'
    )
    const providerOpenAIBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .monitor-provider-badge.monitor-provider-openai'
    )
    const groupGPTBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .monitor-group-badge.monitor-group-gpt'
    )

    expect(componentSource).toContain('class="monitor-capacity-metric-tile')
    expect(monitorCardSource).toContain('monitor-model-token')
    expect(monitorCardSource).toContain('monitor-group-badge')
    expect(monitorCardSource).toContain('function monitorGroupClass')
    expect(monitorCardSource).toContain("return 'monitor-group-gpt'")
    expect(metricTileBlock).toContain('background: var(--anthropic-page) !important;')
    expect(metricTileBlock).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(statusErrorBlock).toContain('color: var(--anthropic-error) !important;')
    expect(statusErrorBlock).toContain('background: transparent !important;')
    expect(providerOpenAIBlock).toContain('color: var(--anthropic-success) !important;')
    expect(groupGPTBlock).toContain('color: var(--anthropic-info) !important;')
  })
})

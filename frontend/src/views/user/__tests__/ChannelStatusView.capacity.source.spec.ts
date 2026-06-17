import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const viewSource = readFileSync(resolve(__dirname, '../ChannelStatusView.vue'), 'utf8')
const componentSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCapacityOverview.vue'), 'utf8')
const monitorCardSource = readFileSync(resolve(__dirname, '../../../components/user/monitor/MonitorCard.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const creepeeHoverTransform = 'var(--creepee-home-card-hover-transform)'
const creepeeHoverShadow = 'var(--creepee-home-card-hover-shadow)'
const homepageHoverTransform = '--creepee-home-card-hover-transform: translate3d(0, -4px, 0);'
const homepageHoverShadow =
  '--creepee-home-card-hover-shadow: 0 18px 36px -20px rgba(17, 24, 39, 0.30), 12px 0 28px -24px rgba(17, 24, 39, 0.22), -12px 0 28px -24px rgba(17, 24, 39, 0.22);'

const cssBlock = (content: string, selector: string): string => {
  const start = content.indexOf(`${selector} {`)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const end = content.indexOf('\n}', start)
  expect(end, `Expected CSS selector ${selector} to close`).toBeGreaterThan(start)
  return content.slice(start, end + 2)
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

  it('keeps shared capacity card styling intact while adding only a neutral hover shadow', () => {
    const capacityBaseBlock = cssBlock(componentSource, '.monitor-capacity-card')
    const capacityBeforeBlock = cssBlock(componentSource, '.monitor-capacity-card::before')
    const capacityHoverBlock = cssBlock(componentSource, '.monitor-capacity-card:hover')
    const globalBaseBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr)'
    )
    const globalHoverBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )
    const themedGlobalHoverBlock = cssBlock(
      styleSource,
      ':root:is(.theme-cloudflare, .theme-anthropic, [data-theme="cloudflare"], [data-theme="anthropic"]) #app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )

    expect(styleSource).not.toContain(':where(.codex-account-card, .monitor-capacity-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr)')
    expect(capacityBaseBlock).not.toContain('--creepee-home-card-hover-shadow')
    expect(capacityBaseBlock).not.toContain('--creepee-card-hover-surface')
    expect(capacityBaseBlock).not.toContain('--creepee-card-stable-border')
    expect(capacityBaseBlock).not.toContain('box-shadow: none')
    expect(capacityBaseBlock).toContain('transition: box-shadow 0.26s var(--atelier-ease);')
    expect(capacityBaseBlock).not.toContain('transform')
    expect(capacityBaseBlock).not.toContain('background:')
    expect(capacityBaseBlock).not.toContain('border-color')
    expect(capacityBeforeBlock).toContain('linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent 45%, rgba(16, 163, 127, 0.08))')
    expect(capacityHoverBlock).not.toContain(`transform: ${creepeeHoverTransform};`)
    expect(capacityHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow};`)
    expect(capacityHoverBlock).not.toContain('background')
    expect(capacityHoverBlock).not.toContain('border-color')
    expect(globalBaseBlock).toContain(homepageHoverShadow)
    expect(globalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(globalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(themedGlobalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(themedGlobalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
  })

  it('matches the Creepee homepage recommendation-card hover treatment on channel status cards', () => {
    const localHoverBlock = cssBlock(componentSource, '.monitor-capacity-card:hover')
    const globalHoverBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )
    const themedGlobalHoverBlock = cssBlock(
      styleSource,
      ':root:is(.theme-cloudflare, .theme-anthropic, [data-theme="cloudflare"], [data-theme="anthropic"]) #app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )
    const globalBaseBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-channel-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr)'
    )
    const monitorChannelBaseBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card'
    )
    const monitorChannelHoverBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .monitor-channel-card:hover,\n#app .app-layout-content .monitor-channel-card:focus-visible'
    )

    expect(componentSource).not.toContain('shadow-card')
    expect(monitorCardSource).toContain('monitor-channel-card')
    expect(monitorCardSource).not.toContain('shadow-card')
    expect(monitorCardSource).not.toContain('shadow-card-hover')
    expect(monitorCardSource).not.toContain('hover:border')
    expect(monitorCardSource).not.toContain('dark:hover:border')
    expect(styleSource).toContain('.monitor-channel-card')
    expect(styleSource).toContain(homepageHoverTransform)
    expect(styleSource).toContain(homepageHoverShadow)
    expect(cssBlock(componentSource, '.monitor-capacity-card')).not.toContain(homepageHoverShadow)
    expect(monitorChannelBaseBlock).toContain('border-color: var(--creepee-card-stable-border) !important;')
    expect(monitorChannelBaseBlock).toContain('background: var(--creepee-card-hover-surface) !important;')
    expect(monitorChannelBaseBlock).toContain('box-shadow: none !important;')
    expect(monitorChannelBaseBlock).not.toContain('hover:border')
    expect(monitorChannelBaseBlock).not.toContain('shadow-card')
    expect(monitorChannelHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(monitorChannelHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(monitorChannelHoverBlock).toContain('border-color: var(--creepee-card-stable-border) !important;')
    expect(monitorChannelHoverBlock).toContain('background: var(--creepee-card-hover-surface) !important;')
    expect(monitorChannelHoverBlock).not.toContain('translate3d(0, -2px, 0)')
    expect(monitorChannelHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(monitorChannelHoverBlock).not.toContain('var(--atelier-butter')
    expect(monitorChannelHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(localHoverBlock).not.toContain(`transform: ${creepeeHoverTransform};`)
    expect(localHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow};`)
    expect(localHoverBlock).not.toContain('translateY(-2px)')
    expect(localHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(localHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(localHoverBlock).not.toContain('var(--atelier-butter')
    expect(localHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(localHoverBlock).not.toContain('linear-gradient')
    expect(localHoverBlock).not.toContain('border-color')
    expect(localHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(globalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(globalBaseBlock).toContain(homepageHoverShadow)
    expect(globalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(globalHoverBlock).not.toContain('translateY(-2px)')
    expect(globalHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(globalHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(globalHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(globalHoverBlock).not.toContain('var(--atelier-butter')
    expect(globalHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(globalHoverBlock).not.toContain('border-color')
    expect(globalHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(themedGlobalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(themedGlobalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(themedGlobalHoverBlock).not.toContain('var(--atelier-material-shadow')
    expect(themedGlobalHoverBlock).not.toContain('rgba(20, 20, 19, 0.024)')
    expect(themedGlobalHoverBlock).not.toContain('translateY(-2px)')
    expect(themedGlobalHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(themedGlobalHoverBlock).not.toContain('border-color')
    expect(themedGlobalHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(styleSource).toContain(':not(.monitor-capacity-card):not(.external-subscription-card)')
  })
})

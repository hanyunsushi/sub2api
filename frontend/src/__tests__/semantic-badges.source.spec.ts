import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')
const targetedRepairSource = readFileSync(resolve(__dirname, '../styles/targeted-visual-repair.css'), 'utf8')
const accountStatusSource = readFileSync(resolve(__dirname, '../components/account/AccountStatusIndicator.vue'), 'utf8')
const monitorFormatSource = readFileSync(resolve(__dirname, '../composables/useChannelMonitorFormat.ts'), 'utf8')
const platformColorsSource = readFileSync(resolve(__dirname, '../utils/platformColors.ts'), 'utf8')
const adminChannelTypesSource = readFileSync(resolve(__dirname, '../components/admin/channel/types.ts'), 'utf8')
const toastSource = readFileSync(resolve(__dirname, '../components/common/Toast.vue'), 'utf8')
const statusBadgeSource = readFileSync(resolve(__dirname, '../components/common/StatusBadge.vue'), 'utf8')
const groupBadgeSource = readFileSync(resolve(__dirname, '../components/common/GroupBadge.vue'), 'utf8')
const platformTypeBadgeSource = readFileSync(resolve(__dirname, '../components/common/PlatformTypeBadge.vue'), 'utf8')
const orderStatusBadgeSource = readFileSync(resolve(__dirname, '../components/payment/OrderStatusBadge.vue'), 'utf8')
const orderUtilsSource = readFileSync(resolve(__dirname, '../components/payment/orderUtils.ts'), 'utf8')
const userConcurrencyCellSource = readFileSync(resolve(__dirname, '../components/user/UserConcurrencyCell.vue'), 'utf8')
const userSubscriptionsViewSource = readFileSync(resolve(__dirname, '../views/user/SubscriptionsView.vue'), 'utf8')
const adminSubscriptionsViewSource = readFileSync(resolve(__dirname, '../views/admin/SubscriptionsView.vue'), 'utf8')

const cssBlock = (source: string, selector: string) => {
  const selectorIndex = source.indexOf(selector)
  expect(selectorIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
  const openBraceIndex = source.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

describe('Anthropic semantic status system', () => {
  it('keeps semantic status source classes instead of inventing badge APIs', () => {
    expect(accountStatusSource).toContain("return 'badge-success'")
    expect(accountStatusSource).toContain("return 'badge-warning'")
    expect(accountStatusSource).toContain("return 'badge-danger'")
    expect(accountStatusSource).toContain("return 'badge-gray'")
    expect(accountStatusSource).not.toContain('semantic-badge')
    expect(monitorFormatSource).not.toContain('semantic-badge')
    expect(monitorFormatSource).toContain('bg-transparent text-[var(--anthropic-success)]')
    expect(monitorFormatSource).toContain('bg-transparent text-[var(--anthropic-warning)]')
    expect(monitorFormatSource).toContain('bg-transparent text-[var(--anthropic-error)]')
    expect(monitorFormatSource).toContain("return 'var(--anthropic-success)'")
    expect(monitorFormatSource).not.toMatch(/bg-(emerald|green|amber|yellow|orange|red|sky|blue|gray|slate)-/)
    expect(monitorFormatSource).not.toMatch(/text-(emerald|green|amber|yellow|orange|red|sky|blue|gray|slate)-/)
    expect(monitorFormatSource).not.toContain('hsl(')
  })

  it('keeps platform color helpers transparent and on the approved semantic palette', () => {
    for (const source of [platformColorsSource, adminChannelTypesSource]) {
      expect(source).toContain('bg-transparent')
      expect(source).toContain('var(--anthropic-success)')
      expect(source).toContain('var(--anthropic-info)')
      expect(source).toContain('var(--anthropic-warning)')
      expect(source).not.toMatch(/bg-(emerald|green|amber|yellow|orange|red|sky|blue|gray|slate|accent)-/)
      expect(source).not.toMatch(/text-(emerald|green|amber|yellow|orange|red|sky|blue|gray|slate|accent)-/)
      expect(source).not.toContain('atelier-material-butter')
      expect(source).not.toContain('atelier-butter')
      expect(source).not.toContain('atelier-status')
    }
  })

  it('maps badge families to Anthropic semantic colors in the shared contract', () => {
    for (const source of [styleSource, targetedRepairSource]) {
      expect(source).toContain('--anthropic-success: #6ea100;')
      expect(source).toContain('--anthropic-info: #6396d6;')
      expect(source).toContain('--anthropic-warning: #eda100;')
      expect(source).toContain('--anthropic-error: #b53333;')
      expect(cssBlock(source, '.app-layout-content :where(.badge-success')).toContain('var(--anthropic-success)')
      expect(cssBlock(source, '.app-layout-content :where(.badge-primary')).toContain('var(--anthropic-info)')
      expect(cssBlock(source, '.app-layout-content :where(.badge-warning')).toContain('var(--anthropic-warning)')
      expect(cssBlock(source, '.app-layout-content :where(.badge-danger')).toContain('var(--anthropic-error)')
      expect(cssBlock(source, '.app-layout-content :where(.badge-gray')).toContain('background: transparent;')
    }
  })

  it('keeps shared badges transparent and free of raw Tailwind status fills', () => {
    for (const source of [
      statusBadgeSource,
      groupBadgeSource,
      platformTypeBadgeSource,
      orderStatusBadgeSource,
      userConcurrencyCellSource
    ]) {
      expect(source).toMatch(/background: transparent|bg-transparent/)
      expect(source).not.toMatch(/bg-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
      expect(source).not.toMatch(/text-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
      expect(source).not.toMatch(/dark:bg-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
      expect(source).not.toMatch(/dark:text-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
    }

    expect(statusBadgeSource).toContain('status-badge__dot--success')
    expect(statusBadgeSource).toContain('status-badge__dot--info')
    expect(statusBadgeSource).toContain('status-badge__dot--warning')
    expect(statusBadgeSource).toContain('status-badge__dot--error')
    expect(statusBadgeSource).toContain('status-badge__dot--neutral')
    expect(groupBadgeSource).toContain('group-token-label--anthropic')
    expect(groupBadgeSource).toContain('group-token-label--openai')
    expect(groupBadgeSource).toContain('group-token-label--gemini')
    expect(platformTypeBadgeSource).toContain('platform-type-badge__segment--platform')
    expect(platformTypeBadgeSource).toContain('platform-type-badge__status--success')
    expect(platformTypeBadgeSource).toContain('platform-type-badge__status--warning')
    expect(platformTypeBadgeSource).toContain('platform-type-badge__status--error')

    const subscriptionStatusChip = userSubscriptionsViewSource.match(/<span\s+:class="\[[\s\S]*?t\(`userSubscriptions\.status\.\$\{subscription\.status\}`\)[\s\S]*?<\/span>/)
    expect(subscriptionStatusChip).not.toBeNull()
    expect(subscriptionStatusChip?.[0]).toContain('rounded-full border bg-transparent')
    expect(subscriptionStatusChip?.[0]).not.toMatch(/bg-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
    expect(subscriptionStatusChip?.[0]).not.toMatch(/dark:bg-(green|yellow|amber|orange|red|gray|zinc|accent|sky|blue)-/)
  })

  it('keeps payment order utility statuses on defined semantic badge classes', () => {
    expect(orderUtilsSource).toContain("PAID: 'badge-primary'")
    expect(orderUtilsSource).toContain("REFUNDED: 'badge-primary'")
    expect(orderUtilsSource).toContain("EXPIRED: 'badge-gray'")
    expect(orderUtilsSource).toContain("CANCELLED: 'badge-gray'")
    expect(orderUtilsSource).toContain("return STATUS_BADGE_MAP[status] || 'badge-gray'")
    expect(orderUtilsSource).not.toContain('badge-info')
    expect(orderUtilsSource).not.toContain('badge-secondary')
  })

  it('uses Anthropic semantic variables for subscription progress and expiry states', () => {
    for (const source of [userSubscriptionsViewSource, adminSubscriptionsViewSource]) {
      expect(source).toContain('usage-progress-fill--safe bg-[var(--anthropic-success)]')
      expect(source).toContain('usage-progress-fill--warning bg-[var(--anthropic-warning)]')
      expect(source).toContain('usage-progress-fill--danger bg-[var(--anthropic-error)]')
      expect(source).not.toMatch(/return 'bg-(green|emerald|orange|amber|yellow|red|gray)-500'/)
      expect(source).not.toMatch(/text-(orange|red)-600/)
      expect(source).not.toMatch(/dark:text-(orange|red)-400/)
    }
  })

  it('keeps progress, timeline, and switch colors semantic instead of theme-tinted', () => {
    for (const source of [styleSource, targetedRepairSource]) {
      expect(cssBlock(source, '.app-layout-content :where(.usage-progress-fill--safe')).toContain('var(--anthropic-success)')
      expect(cssBlock(source, '.app-layout-content :where(.usage-progress-fill--warning')).toContain('var(--anthropic-warning)')
      expect(cssBlock(source, '.app-layout-content :where(.usage-progress-fill--danger')).toContain('var(--anthropic-error)')
      expect(cssBlock(source, '.app-layout-content :where(.batch-switch input:checked + .batch-switch__track')).toContain('var(--anthropic-focus)')
      expect(source).not.toContain('background: #22c55e !important;')
      expect(source).not.toContain('background: #f59e0b !important;')
      expect(source).not.toContain('background: #ef4444 !important;')
      expect(source).not.toContain('background: #22C55E !important;')
      expect(source).not.toContain('background: #F59E0B !important;')
      expect(source).not.toContain('background: #EF4444 !important;')
    }

    expect(cssBlock(targetedRepairSource, '#app .app-layout-content .accounts-table-page .usage-progress-fill--safe')).toContain('var(--anthropic-success)')
    expect(cssBlock(targetedRepairSource, '#app .app-layout-content .accounts-table-page .usage-progress-fill--warning')).toContain('var(--anthropic-warning)')
    expect(cssBlock(targetedRepairSource, '#app .app-layout-content .accounts-table-page .usage-progress-fill--danger')).toContain('var(--anthropic-error)')
    expect(cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--safe)')).toContain('var(--anthropic-success)')
    expect(cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--warning)')).toContain('var(--anthropic-warning)')
    expect(cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--danger)')).toContain('var(--anthropic-error)')
  })

  it('uses composed toast states without thick shadows or theme remapping', () => {
    expect(toastSource).toContain('--toast-status-color: var(--atelier-status-info);')
    expect(toastSource).toContain('--toast-status-color: var(--atelier-status-success);')
    expect(toastSource).toContain('--toast-status-color: var(--atelier-status-danger);')
    expect(toastSource).toContain('--toast-status-color: var(--atelier-status-warning);')
    expect(toastSource).toContain('box-shadow: var(--anthropic-dropdown-shadow')
    expect(toastSource).not.toContain('0 18px 44px')
    expect(toastSource).not.toContain('#52c41a')
    expect(toastSource).not.toContain('#ff4d4f')
  })

  it('does not depend on old final palette lock markers', () => {
    for (const source of [styleSource, targetedRepairSource]) {
      expect(source).not.toContain('Final EOF Anthropic 81k authoritative status/platform palette lock')
      expect(source).not.toContain('Final EOF semantic badge lock')
      expect(source).not.toContain('semantic-badge--provider-')
      expect(source).not.toContain('--api-key-group-color')
      expect(source).not.toContain('--account-status-color: #10a37f;')
    }
  })
})

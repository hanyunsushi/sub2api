import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const indexHtmlSource = readFileSync(resolve(__dirname, '../../index.html'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')
const targetedRepairSource = readFileSync(resolve(__dirname, '../styles/targeted-visual-repair.css'), 'utf8')
const skeletonSource = readFileSync(resolve(__dirname, '../components/common/Skeleton.vue'), 'utf8')
const keyUsageSource = readFileSync(resolve(__dirname, '../views/KeyUsageView.vue'), 'utf8')
const globalPricingSource = readFileSync(resolve(__dirname, '../views/user/GlobalPricingView.vue'), 'utf8')

const cssBlock = (source: string, selector: string, fromIndex = 0) => {
  const selectorIndex = source.indexOf(selector, fromIndex)
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

describe('Anthropic loading placeholders', () => {
  it('renders a warm paper pre-mount shell before Vue takes over', () => {
    expect(indexHtmlSource).toContain('<div id="app">')
    expect(indexHtmlSource).toContain('app-boot-placeholder')
    expect(indexHtmlSource).toContain('app-boot-sidebar')
    expect(indexHtmlSource).toContain('app-boot-topbar')
    expect(indexHtmlSource).toContain('app-boot-filter')
    expect(indexHtmlSource).toContain('app-boot-card')
    expect(indexHtmlSource).toContain('app-boot-table')
    expect(indexHtmlSource).toContain('role="status"')
    expect(indexHtmlSource).toContain('aria-busy="true"')

    const bootTokenBlock = cssBlock(indexHtmlSource, ':root {')
    expect(bootTokenBlock).toContain('--boot-page: #faf9f5;')
    expect(bootTokenBlock).toContain('--boot-section: #f0eee6;')
    expect(bootTokenBlock).toContain('--boot-raised: #e8e6dc;')
    expect(bootTokenBlock).toContain('--boot-fg: #141413;')
    expect(bootTokenBlock).toContain('--boot-border: rgba(20, 19, 19, 0.08);')

    const bootLineBlock = cssBlock(indexHtmlSource, '.app-boot-line')
    expect(bootLineBlock).toContain('linear-gradient(90deg, var(--boot-section), var(--boot-raised), var(--boot-section))')
    expect(bootLineBlock).toContain('background-size: 220% 100%;')
    expect(bootLineBlock).toContain('animation: app-boot-sweep 1.2s')
    expect(indexHtmlSource).toContain('@keyframes app-boot-sweep')
    expect(indexHtmlSource).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('keeps runtime skeletons on the design-system loading-line contract', () => {
    expect(skeletonSource).toContain("'skeleton loading-line'")
    expect(skeletonSource).toContain('skeleton-circle')
    expect(skeletonSource).toContain('skeleton-text')
    expect(skeletonSource).toContain('skeleton-rect')
    expect(skeletonSource).not.toContain('bg-[var(--anthropic-raised)]')
    expect(skeletonSource).toContain('var(--anthropic-section), var(--anthropic-raised), var(--anthropic-section)')
    expect(skeletonSource).toContain('@media (prefers-reduced-motion: reduce)')

    for (const source of [styleSource, targetedRepairSource]) {
      expect(source).toContain('--anthropic-loading-gradient: linear-gradient(90deg, var(--anthropic-section), var(--anthropic-raised), var(--anthropic-section));')
      expect(source).toContain('.app-layout-content :where(.loading-line, .skeleton-line, .skeleton, .skeleton-icon)')
      expect(source).toContain('.animate-pulse[class*="bg-[var(--anthropic-raised)]"]')
      expect(source).toContain('@keyframes anthropic-loading-sweep')
      expect(source).toContain('@media (prefers-reduced-motion: reduce)')
      expect(source).not.toContain('.app-layout-content :where(.loading-line, .skeleton-line, .skeleton, .animate-pulse) {')
    }
  })

  it('removes local gray and dark shimmer skeletons from loading views', () => {
    expect(keyUsageSource).toContain('var(--anthropic-loading-gradient')
    expect(keyUsageSource).not.toContain('linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)')
    expect(keyUsageSource).not.toContain('linear-gradient(90deg, #334155 25%, #1e293b 50%, #334155 75%)')

    expect(globalPricingSource).toContain('.skeleton-line')
    expect(globalPricingSource).toContain('.skeleton-icon')
    expect(globalPricingSource).toContain('var(--anthropic-loading-gradient')
    expect(globalPricingSource).not.toContain('@apply h-4 animate-pulse rounded bg-gray-200 dark:bg-dark-700;')
    expect(globalPricingSource).not.toContain('@apply mx-auto h-7 w-7 animate-pulse rounded-md bg-gray-200 dark:bg-dark-700;')
  })
})

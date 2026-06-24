import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('mobile page scrolling', () => {
  it('supports page scrolling for table pages that must not trap vertical scroll in a module', () => {
    const source = readFile('components/layout/TablePageLayout.vue')
    const accountsSource = readFile('views/admin/AccountsView.vue')

    expect(source).toContain('scrollMode')
    expect(source).toContain("'page'")
    expect(source).toContain('table-page-layout--page-scroll')
    expect(source).toContain('overflow-y: visible;')
    expect(accountsSource).toContain('scroll-mode="page"')
    expect(accountsSource).toContain('class="accounts-table-page"')
    expect(accountsSource).toContain('vertical-scroll-mode="page"')
  })

  it('lets table page cards use the global material surface instead of overriding it with plain backgrounds', () => {
    const source = readFile('components/layout/TablePageLayout.vue')
    const globalStyle = readFile('style.css')

    expect(source).toContain('<div class="card table-scroll-container">')
    expect(source).not.toContain('bg-white dark:bg-dark-800 rounded-lg border border-accent-200')
    expect(globalStyle).toContain(':where(.table-wrapper, .table-scroll-container, .table-container)')
    expect(globalStyle).toContain('.dark .app-layout-shell :where(.card, .paper-card, .paper-surface, .stat-card, .summary-tile')
    expect(globalStyle).toContain('.table-scroll-container')
    expect(globalStyle).not.toContain('.app-layout-content .table-wrapper,')
    expect(globalStyle).not.toContain('.dark .app-layout-content .table-wrapper,')
    expect(globalStyle).toContain('background:')
    expect(globalStyle).toContain('!important')
  })

  it('lets table pages grow naturally on mobile instead of trapping scroll in the table body', () => {
    const source = readFile('components/layout/TablePageLayout.vue')

    expect(source).toContain('.table-page-layout.mobile-mode {')
    expect(source).toContain('height: auto;')
    expect(source).toContain('.table-page-layout.mobile-mode .table-scroll-container :deep(.table-wrapper)')
    expect(source).toContain('overflow-x: auto;')
    expect(source).toContain('overflow-y: visible;')
  })

  it('keeps closed Creepee sidecar and account row effects from widening mobile pages', () => {
    const globalStyle = readFile('style.css')
    const electricBorderSource = readFile('components/common/ElectricBorder.vue')

    expect(globalStyle).toContain('.ai-search-sidecar:not(.ai-search-sidecar-open):not(.ai-search-sidecar-fullscreen)')
    expect(globalStyle).toContain('left: 100%;')
    expect(globalStyle).toContain('right: auto;')
    expect(globalStyle).toContain('width: min(100vw, var(--ai-search-sidecar-width));')
    expect(globalStyle).toContain('min-width: 0;')
    expect(globalStyle).toContain('transform: translate3d(0, 0, 0);')
    expect(globalStyle).toContain('#app .app-layout-content .accounts-table-page > .space-y-3 > .account-electric-border {')
    expect(globalStyle).toContain('overflow: clip;')
    expect(electricBorderSource).toContain('const canvasOutset = computed(() => Math.max(props.thickness * 3, 8))')
    expect(electricBorderSource).toContain('const borderOffset = canvasOutset.value')
    expect(electricBorderSource).not.toContain('const borderOffset = 60')
  })

  it('lets custom markdown pages use document scrolling on mobile', () => {
    const source = readFile('views/user/CustomPageView.vue')

    expect(source).toContain('@media (max-width: 640px)')
    expect(source).toContain('.custom-page-layout')
    expect(source).toContain('custom-markdown-shell')
    expect(source).toContain('.custom-markdown-shell')
    expect(source).toContain('height: auto;')
    expect(source).toContain('.markdown-page-content')
    expect(source).toContain('overflow: visible;')
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('global scrolling behavior', () => {
  it('does not install a document-wide wheel interceptor', () => {
    const mainSource = readFile('src/main.ts')

    expect(mainSource).not.toContain('installSmoothWheelScrolling')
    expect(mainSource).not.toContain("from '@/utils/smoothWheel'")
  })

  it('uses Lenis for document smoothing without restoring the old wheel hijacker', () => {
    const mainSource = readFile('src/main.ts')
    const styleSource = readFile('src/style.css')
    const packageJson = readFile('package.json')
    const lockfile = readFile('pnpm-lock.yaml')

    expect(mainSource).not.toContain('installInertialScrolling')
    expect(mainSource).not.toContain('@/utils/inertialScroll')
    expect(mainSource).toContain("import Lenis from 'lenis'")
    expect(mainSource).toContain('autoRaf: true')
    expect(mainSource).toContain('prevent: (node) =>')
    expect(mainSource).toContain('allowNestedScroll: true')
    expect(mainSource).toContain("const lenisNestedScrollSelector = '[data-lenis-scroll]'")
    expect(mainSource).not.toContain(
      '.table-wrapper, .table-container, .table-scroll-container, .overflow-auto, .overflow-y-auto, .overflow-x-auto'
    )
    expect(styleSource).toContain('html.lenis')
    expect(packageJson).toContain('"lenis"')
    expect(lockfile).toContain('lenis@')
  })

  it('enables Lenis on table scroll containers instead of excluding them globally', () => {
    const dataTableSource = readFile('src/components/common/DataTable.vue')
    const mainSource = readFile('src/main.ts')
    const accountsSource = readFile('src/views/admin/AccountsView.vue')
    const userUsageSource = readFile('src/views/user/UsageView.vue')
    const globalPricingSource = readFile('src/views/user/GlobalPricingView.vue')

    expect(dataTableSource).toContain(':data-lenis-scroll="lenisScroll ?')
    expect(dataTableSource).toContain('lenisScroll?: boolean')
    expect(dataTableSource).toContain('lenisScroll: true')
    expect(accountsSource).toContain(':lenis-scroll="false"')
    expect(userUsageSource).toContain(':lenis-scroll="false"')
    expect(userUsageSource).toContain('vertical-scroll-mode="page"')
    expect(globalPricingSource).toContain('scroll-mode="page"')
    expect(mainSource).toContain('new MutationObserver(scheduleNestedLenisSync)')
    expect(mainSource).toContain('syncNestedLenisPreventAttributes(wrapper)')
    expect(mainSource).toContain("wrapper.toggleAttribute('data-lenis-prevent-horizontal', hasHorizontalOverflow)")
    expect(mainSource).toContain("wrapper.toggleAttribute('data-lenis-prevent-vertical', hasVerticalOverflow)")
    expect(mainSource).toContain('wrapper.dataset.lenisOrientation = orientation')
    expect(mainSource).toContain('eventsTarget: wrapper')
    expect(mainSource).toContain('orientation,')
    expect(mainSource).toContain('gestureOrientation: orientation')
    expect(mainSource).toContain('overscroll: false')
  })

  it('keeps native smooth behavior as a safe fallback', () => {
    const styleSource = readFile('src/style.css')

    expect(styleSource).toContain('scroll-behavior: smooth;')
    expect(styleSource).toContain('overscroll-behavior')
  })
})

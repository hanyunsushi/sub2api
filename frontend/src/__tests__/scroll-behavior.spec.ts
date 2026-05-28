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

  it('does not load Lenis smooth scrolling anywhere in the console shell', () => {
    const mainSource = readFile('src/main.ts')
    const styleSource = readFile('src/style.css')
    const packageJson = readFile('package.json')
    const lockfile = readFile('pnpm-lock.yaml')

    expect(mainSource).not.toContain('installInertialScrolling')
    expect(mainSource).not.toContain('@/utils/inertialScroll')
    expect(mainSource).not.toContain("from 'lenis'")
    expect(mainSource).not.toContain('new Lenis(')
    expect(mainSource).not.toContain('data-lenis-scroll')
    expect(styleSource).not.toContain('html.lenis')
    expect(packageJson).not.toContain('"lenis"')
    expect(lockfile).not.toContain('lenis@')
  })

  it('keeps data tables on native scrolling instead of nested Lenis scrollers', () => {
    const dataTableSource = readFile('src/components/common/DataTable.vue')
    const accountsSource = readFile('src/views/admin/AccountsView.vue')
    const userUsageSource = readFile('src/views/user/UsageView.vue')
    const globalPricingSource = readFile('src/views/user/GlobalPricingView.vue')

    expect(dataTableSource).not.toContain('data-lenis-scroll')
    expect(dataTableSource).not.toContain('lenisScroll')
    expect(accountsSource).not.toContain('lenis-scroll')
    expect(userUsageSource).not.toContain('lenis-scroll')
    expect(userUsageSource).toContain('vertical-scroll-mode="page"')
    expect(globalPricingSource).toContain('scroll-mode="page"')
  })

  it('keeps native smooth behavior as a safe fallback', () => {
    const styleSource = readFile('src/style.css')

    expect(styleSource).toContain('scroll-behavior: smooth;')
    expect(styleSource).toContain('overscroll-behavior')
  })
})

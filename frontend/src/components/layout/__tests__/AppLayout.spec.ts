import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppLayout.vue')
const componentSource = readFileSync(componentPath, 'utf8')

describe('AppLayout route transition', () => {
  it('marks only the right-side page content as the transition target', () => {
    expect(componentSource).toContain(':class="[\'app-route-page p-4 md:p-6 lg:p-8\', pageEntering && \'app-route-page-entering\']"')
    expect(componentSource).toContain('useRoute')
    expect(componentSource).toContain('watch(() => route.fullPath')
    expect(componentSource).toContain('requestAnimationFrame')
    expect(componentSource).not.toContain('routePageKey')
    expect(componentSource).not.toContain('<Transition name="app-page"')
    expect(componentSource).toContain('transform-origin: top center')
    expect(componentSource).toContain('opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1)')
    expect(componentSource).toContain('will-change: opacity, transform')
    expect(componentSource).toContain('animation: app-route-page-enter 0.72s cubic-bezier(0.16, 1, 0.3, 1) both')
    expect(componentSource).toContain('@keyframes app-route-page-enter')
    expect(componentSource).toContain('translateY(20px) scale(0.982)')
  })
})

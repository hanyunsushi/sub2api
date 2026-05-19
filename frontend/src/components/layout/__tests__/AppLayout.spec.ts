import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppLayout.vue')
const componentSource = readFileSync(componentPath, 'utf8')

describe('AppLayout route transition', () => {
  it('stages only the right-side page content with a visible route reveal', () => {
    expect(componentSource).toContain(':class="[')
    expect(componentSource).toContain('`app-route-page-${pageTransitionPhase}`')
    expect(componentSource).toContain('useRoute')
    expect(componentSource).toContain('watch(() => route.fullPath')
    expect(componentSource).toContain('requestAnimationFrame')
    expect(componentSource).toContain('onMounted(() => {')
    expect(componentSource).toContain('void triggerPageEnter()')
    expect(componentSource).toContain("const pageTransitionPhase = ref<'preparing' | 'entering' | 'settled'>('preparing')")
    expect(componentSource).toContain("pageTransitionPhase.value = 'preparing'")
    expect(componentSource).toContain("pageTransitionPhase.value = 'entering'")
    expect(componentSource).toContain("pageTransitionPhase.value = 'settled'")
    expect(componentSource).not.toContain('routePageKey')
    expect(componentSource).not.toContain('<Transition name="app-page"')
    expect(componentSource).toContain('transform-origin: top center')
    expect(componentSource).toContain('--route-enter-duration: 0.92s;')
    expect(componentSource).toContain('will-change: opacity, transform, filter')
    expect(componentSource).toContain('animation: app-route-page-enter var(--route-enter-duration) var(--route-enter-easing) both')
    expect(componentSource).toContain('.app-route-page-entering > *')
    expect(componentSource).toContain('animation: app-route-page-child-enter 0.78s var(--route-enter-easing) both')
    expect(componentSource).toContain('@keyframes app-route-page-enter')
    expect(componentSource).toContain('@keyframes app-route-page-child-enter')
    expect(componentSource).toContain('translate3d(0, 30px, 0) scale(0.982)')
  })
})

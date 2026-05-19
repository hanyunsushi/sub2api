import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppLayout.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const styleSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css'), 'utf8')

describe('AppLayout route transition', () => {
  it('stages only the right-side page content with route phase classes', () => {
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
    expect(componentSource).not.toContain('@keyframes app-route-page-enter')
  })

  it('ships the visible route reveal from global CSS so production assets include it', () => {
    expect(styleSource).toContain('transform-origin: top center')
    expect(styleSource).toContain('--route-enter-duration: 0.92s;')
    expect(styleSource).toContain('will-change: opacity, transform, filter')
    expect(styleSource).toContain('animation: app-route-page-enter var(--route-enter-duration) var(--route-enter-easing) both')
    expect(styleSource).toContain('.app-route-page-entering > *')
    expect(styleSource).toContain('animation: app-route-page-child-enter 0.78s var(--route-enter-easing) both')
    expect(styleSource).toContain('@keyframes app-route-page-enter')
    expect(styleSource).toContain('@keyframes app-route-page-child-enter')
    expect(styleSource).toContain('translate3d(0, 30px, 0) scale(0.982)')
    expect(styleSource).toContain('@media (prefers-reduced-motion: reduce)')
  })
})

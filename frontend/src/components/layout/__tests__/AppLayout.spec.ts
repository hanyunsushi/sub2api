import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppLayout.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const styleSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css'), 'utf8')
const targetedStyleSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../styles/targeted-visual-repair.css'),
  'utf8',
)

describe('AppLayout route transition', () => {
  it('offsets desktop content by the design-system sidebar rail width', () => {
    expect(componentSource).toContain("sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[248px]'")
    expect(componentSource).not.toContain("'lg:ml-64'")
  })

  it('does not animate AI sidecar margin squeeze across the whole page', () => {
    expect(componentSource).toContain('transition-[margin-left]')
    expect(componentSource).not.toContain('transition-[margin-left,margin-right]')
    expect(styleSource).toContain('body.ai-search-panel-open:not(.ai-search-panel-fullscreen) .app-layout-content')
    expect(styleSource).toContain('margin-right: var(--ai-search-sidecar-width);')
    expect(styleSource).not.toContain('transition-property: margin-left, margin-right;')
  })

  it('skips offscreen account-card layout work during sidecar squeeze', () => {
    const accountCardBlockStart =
      '#app .app-layout-content .accounts-table-page .table-wrapper tbody tr {'
    const accountCardBlock = targetedStyleSource.slice(
      targetedStyleSource.indexOf(accountCardBlockStart),
      targetedStyleSource.indexOf(
        '#app .app-layout-content .accounts-table-page .table-wrapper tbody tr:hover'
      )
    )
    expect(accountCardBlock).toContain('content-visibility: auto;')
    expect(accountCardBlock).toContain('contain-intrinsic-size:')
  })

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
    expect(styleSource).toContain('--route-enter-duration: 0.28s;')
    expect(styleSource).toContain('animation: app-route-page-enter var(--route-enter-duration) var(--route-enter-easing) both')
    expect(styleSource).toContain('@keyframes app-route-page-enter')
    expect(styleSource).toContain('translate3d(0, 10px, 0)')
    expect(styleSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styleSource).not.toContain('@keyframes app-route-page-child-enter')
    expect(styleSource).not.toContain('.app-route-page-entering > *')
  })
})

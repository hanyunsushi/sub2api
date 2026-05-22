import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('home and auth contrast on Atelier warm paper background', () => {
  it('uses themed footer microcopy and links on auth pages', () => {
    const authLayout = readFile('src/components/layout/AuthLayout.vue')
    const style = readFile('src/style.css')

    expect(authLayout).toContain('auth-footer-link')
    expect(authLayout).toContain('color: var(--atelier-muted);')
    expect(authLayout).toContain('color: var(--atelier-blue);')
    expect(style).toContain('.auth-ascii-shell,')
    expect(style).toContain('var(--atelier-paper);')
  })

  it('keeps default home header and CTA readable on the ASCII background', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain('<router-link to="/home" class="flex items-center" aria-label="Home">')
    expect(home).toContain('<LocaleSwitcher tone="on-deep" />')
    expect(home).toContain('class="home-hero-subtitle mb-8 text-lg md:text-xl"')
    expect(home).toContain('class="home-cta inline-flex items-center rounded-lg px-8 py-3 text-base font-semibold shadow-glow transition-colors"')
    expect(home).toContain('background: var(--atelier-blue);')
    expect(home).toContain('color: var(--atelier-ink);')
    expect(home).not.toContain('class="btn btn-primary px-8 py-3 text-base"')
  })

  it('applies Zero Landing style reveal motion to every visible home module', () => {
    const home = readFile('src/views/HomeView.vue')

    expect((home.match(/data-home-reveal/g) ?? []).length).toBeGreaterThanOrEqual(20)
    expect(home).toContain('data-home-module="topbar"')
    expect(home).toContain('data-home-module="nav"')
    expect(home).toContain('data-home-module="hero-label"')
    expect(home).toContain('data-home-module="hero-title"')
    expect(home).toContain('data-home-module="hero-lead"')
    expect(home).toContain('data-home-module="hero-copy"')
    expect(home).toContain('data-home-module="hero-cta"')
    expect(home).toContain('data-home-module="hero-index"')
    expect(home).toContain('data-home-module="terminal-plate"')
    expect(home).toContain('data-home-module="metric-ring"')
    expect(home).toContain('data-home-module="feature-section-label"')
    expect(home).toContain('data-home-module="provider-section-label"')
    expect(home).toContain('class="home-feature-tag')
    expect(home).toContain('class="home-feature-card')
    expect(home).toContain('class="home-provider-chip')
    expect(home).toContain('.home-ascii-shell .home-feature-tag')
    expect(home).toContain('.home-ascii-shell .home-feature-card')
    expect(home).toContain('.home-ascii-shell .home-provider-chip')
    expect(home).toContain('.home-ascii-shell [data-home-reveal]')
    expect(home).toContain('[data-home-reveal].is-visible')
    expect(home).toContain('transition-delay: var(--home-reveal-delay, 0ms);')
    expect(home).toContain('IntersectionObserver')
    expect(home).toContain('observer.observe(item)')
    expect(home).toContain('entry.target.classList.add(\'is-visible\')')
    expect(home).toContain("rootMargin: '0px 0px 18% 0px'")
    expect(home).not.toContain('animation: home-component-reveal')
    expect(home).not.toContain('@keyframes home-component-reveal')
    expect(home).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('rebuilds the default home page with the Atelier IKB hierarchy instead of a warm yellow wash', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain('.home-ascii-shell {')
    expect(home).toContain('radial-gradient(circle at 12% 18%, rgba(0, 47, 167, 0.08), transparent 28rem)')
    expect(home).toContain('radial-gradient(circle at 84% 9%, rgba(199, 154, 58, 0.1), transparent 24rem)')
    expect(home).toContain('linear-gradient(90deg, rgba(23, 21, 18, 0.035) 1px, transparent 1px)')
    expect(home).toContain('.home-site-frame::before')
    expect(home).toContain('.home-site-frame::after')
    expect(home).toContain('.home-section-label::after')
    expect(home).toContain('.home-hero-grid')
    expect(home).toContain('.home-hero-plate')
    expect(home).toContain('.home-shape-arch')
    expect(home).toContain('.home-shape-disk')
    expect(home).toContain('.home-shape-leaf')
    expect(home).toContain('.home-index-row')
    expect(home).toContain('.home-ring')
    expect(home).toContain('.home-feature-card.home-feature-card-featured')
    expect(home).toContain('background: var(--atelier-blue);')
    expect(home).toContain('--home-card-accent: var(--atelier-dust);')
    expect(home).toContain('--home-card-accent: var(--atelier-blue);')
    expect(home).toContain('--home-card-accent: var(--atelier-butter);')
    expect(home).toContain('border-top: 1px solid var(--atelier-ink);')
    expect(home).toContain('color-mix(in srgb, var(--home-card-accent) 14%, var(--atelier-paper))')
    expect(home).toContain('home-provider-intro')
    expect(home).toContain('border-top: 1px solid var(--atelier-ink);')
    expect(home).not.toContain('linear-gradient(115deg, transparent 0 52%, rgba(0, 47, 167, 0.94) 52.2% 100%)')
  })

  it('keeps dark home overrides scoped to the home shell', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain(':global(.dark .home-ascii-shell)')
    expect(home).toContain(':global(.dark .home-ascii-shell .terminal-window)')
    expect(home).toContain(':global(.dark .home-ascii-shell .home-logo)')
    expect(home).not.toContain(':global(.dark) .home-ascii-shell')
    expect(home).not.toContain(':global(.dark) .home-logo')
    expect(home).not.toContain(':deep(.dark) .terminal-window')
  })

  it('hides the default home scrollbar without disabling the page content', () => {
    const css = readFile('src/style.css')

    expect(css).toContain('html:has(.home-ascii-shell)')
    expect(css).toContain('body:has(.home-ascii-shell)')
    expect(css).toContain('::-webkit-scrollbar')
  })

  it('keeps native smooth scrolling without Lenis or the old wheel hijacker', () => {
    const css = readFile('src/style.css')
    const main = readFile('src/main.ts')

    expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
    expect(css).toContain('scroll-behavior: smooth;')
    expect(css).toContain('.sidebar-nav')
    expect(css).toContain('.overflow-y-auto')
    expect(css).toContain('.overflow-auto')
    expect(css).toContain('overscroll-behavior')
    expect(main).not.toContain('installInertialScrolling')
    expect(css).not.toContain('html.lenis')
    expect(main).not.toContain('installSmoothWheelScrolling')
  })
})

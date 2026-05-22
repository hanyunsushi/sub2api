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

  it('applies Zero Landing style reveal motion to concrete home components', () => {
    const home = readFile('src/views/HomeView.vue')

    expect((home.match(/data-home-reveal/g) ?? []).length).toBeGreaterThanOrEqual(12)
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
    expect(home).not.toContain('animation: home-component-reveal')
    expect(home).not.toContain('@keyframes home-component-reveal')
    expect(home).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('adds stronger home-specific color layers beyond the warm paper base', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain('.home-ascii-shell {')
    expect(home).toContain('linear-gradient(115deg, transparent 0 52%, rgba(0, 47, 167, 0.94) 52.2% 100%)')
    expect(home).toContain('radial-gradient(circle at 18% 24%, rgba(79, 106, 140, 0.2), transparent 24rem)')
    expect(home).toContain('radial-gradient(circle at 88% 58%, rgba(199, 154, 58, 0.2), transparent 21rem)')
    expect(home).toContain('repeating-linear-gradient(to right, rgba(23, 21, 18, 0.12), rgba(23, 21, 18, 0.12) 2px, transparent 2px, transparent 8px)')
    expect(home).toContain('.home-ascii-shell::before')
    expect(home).toContain('.home-ascii-shell::after')
    expect(home).toContain('--home-card-accent: var(--atelier-blue);')
    expect(home).toContain('--home-card-accent: var(--atelier-dust);')
    expect(home).toContain('--home-card-accent: var(--atelier-butter);')
    expect(home).toContain('border-top: 4px solid var(--home-card-accent);')
    expect(home).toContain('color-mix(in srgb, var(--home-card-accent) 16%, var(--atelier-paper))')
    expect(home).toContain('home-provider-intro')
    expect(home).toContain('border-bottom: 3px solid var(--atelier-butter);')
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

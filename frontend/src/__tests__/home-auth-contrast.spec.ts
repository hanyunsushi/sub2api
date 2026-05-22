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

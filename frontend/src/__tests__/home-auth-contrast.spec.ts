import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('home and auth contrast on Klein blue background', () => {
  it('uses white footer microcopy and links on login and register pages', () => {
    const login = readFile('src/views/auth/LoginView.vue')
    const register = readFile('src/views/auth/RegisterView.vue')

    expect(login).toContain('class="text-white/90"')
    expect(login).toContain('class="font-medium text-white underline-offset-4 transition-colors hover:text-white hover:underline"')
    expect(register).toContain('class="text-white/90"')
    expect(register).toContain('class="font-medium text-white underline-offset-4 transition-colors hover:text-white hover:underline"')
  })

  it('keeps default home header and CTA readable on the ASCII background', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain('<router-link to="/home" class="flex items-center" aria-label="Home">')
    expect(home).toContain('<LocaleSwitcher tone="on-deep" />')
    expect(home).toContain('class="mb-8 text-lg text-white md:text-xl"')
    expect(home).toContain('bg-white px-8 py-3 text-base font-semibold text-primary-600')
    expect(home).not.toContain('class="btn btn-primary px-8 py-3 text-base"')
  })

  it('hides the default home scrollbar without disabling the page content', () => {
    const css = readFile('src/style.css')

    expect(css).toContain('html:has(.home-ascii-shell)')
    expect(css).toContain('body:has(.home-ascii-shell)')
    expect(css).toContain('::-webkit-scrollbar')
  })

  it('enables smooth scrolling for document and common internal scroll containers', () => {
    const css = readFile('src/style.css')

    expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
    expect(css).toContain('scroll-behavior: smooth;')
    expect(css).toContain('.sidebar-nav')
    expect(css).toContain('.overflow-y-auto')
    expect(css).toContain('.overflow-auto')
  })
})

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('Claude ASCII background', () => {
  it('provides a Vue canvas implementation of the ASCII wave field', () => {
    const componentPath = resolve(frontendRoot, 'src/components/common/GuizangAsciiBackground.vue')

    expect(existsSync(componentPath)).toBe(true)

    const source = readFile('src/components/common/GuizangAsciiBackground.vue')
    expect(source).toContain('const chars = "   ...:::---+++***ooo0011"')
    expect(source).toContain("tone?: 'deep' | 'light'")
    expect(source).toContain('backgroundClass')
    expect(source).toContain('isDarkMode')
    expect(source).toContain('MutationObserver')
    expect(source).toContain('inkColor')
    expect(source).toContain('Math.min(window.devicePixelRatio || 1, 2)')
    expect(source).toContain('Math.sin(column * 0.18 + time)')
    expect(source).toContain('Math.sin(row * 0.25 - time * 0.78)')
    expect(source).toContain('Math.sin((column + row) * 0.11 + time * 0.42)')
    expect(source).toContain('Math.sin(radial * 0.16 - time * 0.62)')
    expect(source).toContain('requestAnimationFrame(render)')
    expect(source).toContain('* 0.58')
    expect(source).toContain('cancelAnimationFrame')
  })

  it('keeps the animated background out of the public home, auth page, and right-side app content area', () => {
    const home = readFile('src/views/HomeView.vue')
    const authLayout = readFile('src/components/layout/AuthLayout.vue')
    const appLayout = readFile('src/components/layout/AppLayout.vue')

    expect(home).not.toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(home).not.toContain('<GuizangAsciiBackground class="home-ascii-background" />')
    expect(home).not.toContain('<GuizangAsciiBackground tone="light" class="home-ascii-background" />')
    expect(authLayout).not.toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(authLayout).not.toContain('<GuizangAsciiBackground tone="light" class="auth-ascii-background" />')
    expect(appLayout).not.toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(appLayout).not.toContain('<GuizangAsciiBackground tone="light" class="app-layout-ascii-background" />')
    expect(appLayout).toContain('app-layout-content')
  })

  it('keeps the reusable canvas implementation dormant without auth-specific wave hooks', () => {
    const css = readFile('src/style.css')
    const source = readFile('src/components/common/GuizangAsciiBackground.vue')

    expect(css).toContain('.guizang-site-background')
    expect(css).toContain('background: var(--atelier-blue, #c96442)')
    expect(css).not.toContain('background: #001f66')
    expect(css).toContain('.guizang-site-background--light')
    expect(css).toContain('.dark .guizang-site-background--light')
    expect(css).toContain('background: #050505')
    expect(css).toContain('.guizang-site-background__canvas')
    expect(css).not.toContain('mix-blend-mode: screen')
    expect(css).toContain('.guizang-site-background--light .guizang-site-background__canvas')
    expect(css).toContain('mix-blend-mode: normal')
    expect(css).not.toContain('mix-blend-mode: multiply')
    expect(css).not.toContain('.auth-ascii-background')
    expect(css).not.toContain('opacity: 0.2;')
    expect(css).not.toContain('opacity: 0.04;')
    expect(source).not.toContain('guizang-site-background__grid')
    expect(source).not.toContain('guizang-site-background__dots')
    expect(css).not.toContain('.guizang-site-background__grid')
    expect(css).not.toContain('.guizang-site-background__dots')
    expect(css).not.toContain('.dark .guizang-site-background--light .guizang-site-background__canvas')
    expect(css).toContain('.app-layout-content')
    expect(css).toContain('background: var(--atelier-canvas);')
    expect(css).not.toContain('linear-gradient(90deg, rgba(23, 21, 18, 0.035) 1px, transparent 1px)')
    expect(css).not.toContain('linear-gradient(0deg, rgba(23, 21, 18, 0.025) 1px, transparent 1px)')
    expect(css).toContain('.dark .app-layout-content')
    expect(css).toContain('background: #050505')
    expect(css).not.toContain('@keyframes guizang')
  })
})

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('Klein blue ASCII background', () => {
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

  it('mounts the background on the public home page, auth layout, and right-side app content area', () => {
    const home = readFile('src/views/HomeView.vue')
    const authLayout = readFile('src/components/layout/AuthLayout.vue')
    const appLayout = readFile('src/components/layout/AppLayout.vue')

    expect(home).toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(home).toContain('<GuizangAsciiBackground class="home-ascii-background" />')
    expect(home).not.toContain('<GuizangAsciiBackground tone="light" class="home-ascii-background" />')
    expect(authLayout).toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(authLayout).toContain('<GuizangAsciiBackground class="auth-ascii-background" />')
    expect(appLayout).toContain("import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'")
    expect(appLayout).toContain('<GuizangAsciiBackground tone="light" class="app-layout-ascii-background" />')
    expect(appLayout).toContain('app-layout-content')
  })

  it('defines the fixed canvas, grid, and dot texture layers without relying on CSS keyframes', () => {
    const css = readFile('src/style.css')

    expect(css).toContain('.guizang-site-background')
    expect(css).toContain('background: #002fa7')
    expect(css).not.toContain('background: #001f66')
    expect(css).toContain('.guizang-site-background--light')
    expect(css).toContain('.dark .guizang-site-background--light')
    expect(css).toContain('linear-gradient(180deg, #050505, #0a0a0a)')
    expect(css).toContain('radial-gradient(circle at 78% 6%, rgba(79, 106, 140, 0.08), transparent 24rem)')
    expect(css).toContain('radial-gradient(circle at 90% 36%, rgba(199, 154, 58, 0.045), transparent 20rem)')
    expect(css).toContain('var(--atelier-paper)')
    expect(css).toContain('background-size: auto, auto, auto, 32px 32px, 32px 32px, auto')
    expect(css).toContain('.guizang-site-background__canvas')
    expect(css).toContain('mix-blend-mode: screen')
    expect(css).toContain('.guizang-site-background--light .guizang-site-background__canvas')
    expect(css).toContain('mix-blend-mode: multiply')
    expect(css).toContain('.guizang-site-background__grid')
    expect(css).toContain('background-size: 96px 96px')
    expect(css).toContain('.guizang-site-background__dots')
    expect(css).toContain('background-size: 18px 18px')
    expect(css).toContain('.app-layout-content')
    expect(css).toContain('radial-gradient(circle at 16% 0%, rgba(0, 47, 167, 0.09), transparent 28rem)')
    expect(css).toContain('radial-gradient(circle at 86% 8%, rgba(79, 106, 140, 0.07), transparent 24rem)')
    expect(css).toContain('.dark .app-layout-content')
    expect(css).toContain('background: #050505')
    expect(css).not.toContain('@keyframes guizang')
  })
})

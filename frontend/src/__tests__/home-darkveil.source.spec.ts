import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')
const fileExists = (file: string) => existsSync(resolve(frontendRoot, file))

describe('home DarkVeil background integration', () => {
  it('mounts the pasted DarkVeil WebGL effect as the default hero background', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain("import DarkVeil from '@/components/home/DarkVeil.vue'")
    expect(home).toContain('<DarkVeil')
    expect(home).toContain('class="home-darkveil"')
    expect(home).toContain(':hue-shift="219"')
    expect(home).toContain(':speed="1.1"')
    expect(home).toContain(':noise-intensity="0.08"')
    expect(home).toContain(':scanline-intensity="0.12"')
    expect(home).toContain(':scanline-frequency="0.5"')
    expect(home).toContain(':warp-amount="1.2"')
    expect(home).toContain(':resolution-scale="0.72"')
    expect(home).toContain('overflow: hidden;')
    expect(home).toContain('isolation: isolate;')
    expect(home).toContain('filter: hue-rotate(14deg) saturate(1.18) contrast(1.08) brightness(1.05);')
    expect(home).toContain('background: transparent;')
    expect(home).not.toContain('home-hero-scrim')
    expect(home).not.toContain('rgba(247, 240, 224, 0.42)')
    expect(home).not.toContain('rgba(247, 240, 224, 0.18)')
    expect(home).not.toContain('rgba(247, 240, 224, 0.92)')
    expect(home).not.toContain('rgba(247, 240, 224, 0.76)')
    expect(home).toContain('.home-hero-grid {')
    expect(home).toContain('z-index: 1;')
  })

  it('keeps DarkVeil in an isolated Vue component backed by ogl', () => {
    expect(fileExists('src/components/home/DarkVeil.vue')).toBe(true)

    const component = readFile('src/components/home/DarkVeil.vue')
    const pkg = readFile('package.json')

    expect(component).toContain("import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'")
    expect(component).toContain('const vertex = `')
    expect(component).toContain('const fragment = `')
    expect(component).toContain('defineProps')
    expect(component).toContain('requestAnimationFrame')
    expect(component).toContain('cancelAnimationFrame')
    expect(component).toContain('ResizeObserver')
    expect(component).toContain('prefers-reduced-motion: reduce')
    expect(component).toContain('const maxDrawEdge = 1280')
    expect(component).toContain('const maxDrawPixels = 1_200_000')
    expect(component).toContain('renderer.setSize(drawWidth, drawHeight)')
    expect(component).toContain('canvas.style.width = `${width}px`')
    expect(component).toContain('canvas.style.height = `${height}px`')
    expect(component).toContain('program.uniforms.uResolution.value.set(drawWidth, drawHeight)')
    expect(component).toContain('.darkveil-canvas')
    expect(pkg).toContain('"ogl":')
  })
})

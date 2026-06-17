import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')
const fileExists = (file: string) => existsSync(resolve(frontendRoot, file))

function cssBlock(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`)
  expect(start, `missing CSS block for ${selector}`).toBeGreaterThanOrEqual(0)
  const end = source.indexOf('\n}', start)
  expect(end, `missing CSS block end for ${selector}`).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('home CTA StarBorder integration', () => {
  it('wraps the home console CTA with the React Bits StarBorder-style edge effect', () => {
    const home = readFile('src/views/HomeView.vue')
    const ctaBlock = cssBlock(home, '.home-cta')
    const ctaHoverBlock = cssBlock(home, '.home-cta:hover')

    expect(home).toContain("import StarBorder from '@/components/home/StarBorder.vue'")
    expect(home).toContain('<StarBorder')
    expect(home).toContain('class-name="home-cta-star"')
    expect(home).toContain('color="rgba(255, 250, 240, 0.95)"')
    expect(home).toContain('speed="5s"')
    expect(home).toContain(':thickness="2"')
    expect(home).toContain('class="home-cta inline-flex items-center rounded-lg px-8 py-3 text-base font-semibold transition-colors"')
    expect(ctaBlock).toContain('border: 1px solid var(--atelier-terracotta-action, #c96442);')
    expect(ctaBlock).toContain('background: var(--atelier-terracotta-action, #c96442);')
    expect(ctaBlock).toContain('color: var(--atelier-paper-2);')
    expect(ctaBlock).toContain('box-shadow: none;')
    expect(ctaHoverBlock).toContain('background: var(--atelier-terracotta-action-hover, #a64f34);')
    expect(ctaHoverBlock).toContain('box-shadow: none;')
    expect(home).toContain(':deep(.home-cta-star .border-gradient-bottom)')
    expect(home).toContain(':deep(.home-cta-star .border-gradient-top)')
    expect(home).not.toContain("import BorderGlow from '@/components/home/BorderGlow.vue'")
    expect(home).not.toContain('<BorderGlow')
    expect(home).not.toContain('class="home-cta-glow"')
    expect(home).not.toContain('shadow-glow transition-colors')
    expect(ctaBlock).not.toContain('background: var(--atelier-blue);')
    expect(ctaBlock).not.toContain('rgba(0, 47, 167, 0.78)')
    expect(ctaHoverBlock).not.toContain('rgba(0, 47, 167, 0.9)')
    expect(ctaBlock).not.toContain('border: 1px solid rgba(255, 250, 240, 0.32);')
    expect(ctaBlock).not.toContain('rgba(246, 130, 31, 0.82)')
  })

  it('ports the pasted React Bits StarBorder layers to Vue', () => {
    expect(fileExists('src/components/home/StarBorder.vue')).toBe(true)

    const component = readFile('src/components/home/StarBorder.vue')

    expect(component).toContain('class="star-border-container"')
    expect(component).toContain('class="border-gradient-bottom"')
    expect(component).toContain('class="border-gradient-top"')
    expect(component).toContain('class="inner-content"')
    expect(component).toContain('padding: `${props.thickness}px 0`')
    expect(component).toContain('radial-gradient(circle, ${props.color}, transparent 10%)')
    expect(component).toContain('animationDuration: props.speed')
    expect(component).toContain('animation: star-movement-bottom linear infinite alternate;')
    expect(component).toContain('animation: star-movement-top linear infinite alternate;')
    expect(component).toContain('@keyframes star-movement-bottom')
    expect(component).toContain('@keyframes star-movement-top')
    expect(component).toContain('z-index: 1;')
    expect(component).not.toContain('class="border-glow-card"')
    expect(component).not.toContain('@pointermove')
    expect(component).not.toContain('box-shadow:')
  })
})

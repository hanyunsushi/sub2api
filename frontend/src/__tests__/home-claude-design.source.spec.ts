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

describe('home Claude design source contract', () => {
  it('retires the dark WebGL stage and decorative CTA wrappers from the default home page', () => {
    const home = readFile('src/views/HomeView.vue')
    const pkg = readFile('package.json')

    expect(fileExists('src/components/home/DarkVeil.vue')).toBe(false)
    expect(fileExists('src/components/home/StarBorder.vue')).toBe(false)
    expect(fileExists('src/components/home/BorderGlow.vue')).toBe(false)
    expect(home).not.toContain("import DarkVeil from '@/components/home/DarkVeil.vue'")
    expect(home).not.toContain('<DarkVeil')
    expect(home).not.toContain('class="home-darkveil"')
    expect(home).not.toContain("import StarBorder from '@/components/home/StarBorder.vue'")
    expect(home).not.toContain('<StarBorder')
    expect(home).not.toContain('class-name="home-cta-star"')
    expect(home).not.toContain("import BorderGlow from '@/components/home/BorderGlow.vue'")
    expect(home).not.toContain('<BorderGlow')
    expect(home).not.toContain('background: #07101e;')
    expect(home).not.toContain('background: #050505;')
    expect(home).not.toContain('#9fb2d2')
    expect(pkg).not.toContain('"ogl":')
  })

  it('builds the default home page from Claude paper, ivory, ink, and terracotta tokens', () => {
    const home = readFile('src/views/HomeView.vue')
    const shellBlock = cssBlock(home, '.home-ascii-shell')
    const mastheadBlock = cssBlock(home, '.home-masthead')
    const displayBlock = cssBlock(home, '.home-display')
    const ctaBlock = cssBlock(home, '.home-cta')
    const terminalBlock = cssBlock(home, '.terminal-window')
    const footerBlock = cssBlock(home, '.home-footer')

    expect(shellBlock).toContain('--home-surface-paper: var(--atelier-paper);')
    expect(shellBlock).toContain('--home-surface-paper-2: var(--atelier-paper-2);')
    expect(shellBlock).toContain('--home-surface-accent: color-mix(in srgb, var(--atelier-blue) 10%, var(--atelier-paper));')
    expect(shellBlock).toContain('--home-muted-solid: var(--atelier-muted);')
    expect(shellBlock).toContain('--home-edge: var(--atelier-line);')
    expect(shellBlock).toContain('linear-gradient(180deg, var(--atelier-paper) 0%, color-mix(in srgb, var(--atelier-paper) 82%, var(--atelier-surface-dust)) 100%)')
    expect(shellBlock).not.toContain('background: #07101e;')

    expect(mastheadBlock).toContain('background: color-mix(in srgb, var(--atelier-paper) 86%, transparent);')
    expect(mastheadBlock).toContain('backdrop-filter: blur(18px) saturate(1.02);')
    expect(displayBlock).toContain('font-family: var(--atelier-font-serif);')
    expect(displayBlock).toContain('font-weight: 500;')
    expect(displayBlock).toContain('color: var(--atelier-ink);')
    expect(displayBlock).toContain('text-shadow: none;')
    expect(ctaBlock).toContain('background: var(--atelier-blue, #c96442);')
    expect(ctaBlock).toContain('color: var(--atelier-paper-2);')
    expect(terminalBlock).toContain('background: var(--home-surface-paper-2);')
    expect(terminalBlock).toContain('border-radius: 12px;')
    expect(terminalBlock).not.toContain('linear-gradient(145deg')
    expect(footerBlock).toContain('background: var(--home-surface-paper-2);')
    expect(footerBlock).toContain('color: var(--atelier-ink-soft);')
    expect(footerBlock).toContain('border-top: 1px solid var(--home-edge);')
  })

  it('keeps terracotta restrained to the primary action and selected brand moments', () => {
    const home = readFile('src/views/HomeView.vue')

    expect(home).toContain('<LocaleSwitcher tone="default" />')
    expect(home).toContain('background: color-mix(in srgb, var(--atelier-blue) 8%, var(--home-surface-paper-2));')
    expect(home).toContain('background: var(--home-surface-accent);')
    expect(home).toContain('background: var(--home-surface-paper);')
    expect(home).toContain('background: var(--home-surface-paper-2);')
    expect(home).not.toContain('rgba(79, 106, 140')
    expect(home).not.toContain('rgba(0, 47, 167')
    expect(home).not.toContain('backdrop-filter: blur(12px) saturate(1.08);')
  })
})

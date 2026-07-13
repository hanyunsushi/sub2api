import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')
const fileExists = (file: string) => existsSync(resolve(frontendRoot, file))

function cssBlock(source: string, selector: string) {
  const start = source.indexOf(`\n${selector} {`)
  expect(start, `missing CSS block for ${selector}`).toBeGreaterThanOrEqual(0)
  const end = source.indexOf('\n}', start + 1)
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
    expect(ctaBlock).not.toContain('background: var(--anthropic-fg, #141413);')
    expect(ctaHoverBlock).not.toContain('background: var(--anthropic-fg-hover, #3d3d3a);')
    expect(ctaBlock).not.toContain('rgba(0, 47, 167, 0.78)')
    expect(ctaHoverBlock).not.toContain('rgba(0, 47, 167, 0.9)')
    expect(ctaBlock).not.toContain('border: 1px solid rgba(255, 250, 240, 0.32);')
    expect(ctaBlock).not.toContain('rgba(246, 130, 31, 0.82)')
  })

  it('keeps the hero index module on the original translucent DarkVeil surface', () => {
    const home = readFile('src/views/HomeView.vue')
    const indexBlock = cssBlock(home, '.home-index-card')
    const indexRowBlock = cssBlock(home, '.home-index-row')
    const indexNumberBlock = cssBlock(home, '.home-index-row b')
    const indexMetaBlock = cssBlock(home, '.home-index-row span:last-child')

    expect(indexBlock).toContain('border: 1px solid rgba(255, 250, 240, 0.14);')
    expect(indexBlock).toContain('background: rgba(7, 16, 30, 0.13);')
    expect(indexBlock).toContain('backdrop-filter: blur(12px) saturate(1.08);')
    expect(indexBlock).toContain('inset 0 1px 0 rgba(255, 250, 240, 0.08),')
    expect(indexBlock).toContain('0 18px 50px -44px rgba(0, 0, 0, 0.68);')
    expect(indexRowBlock).toContain('border-bottom: 1px dotted rgba(255, 250, 240, 0.2);')
    expect(indexRowBlock).toContain('color: rgba(255, 250, 240, 0.84);')
    expect(indexNumberBlock).toContain('color: var(--atelier-butter);')
    expect(indexMetaBlock).toContain('color: rgba(255, 250, 240, 0.68);')
    expect(indexBlock).not.toContain('background: var(--anthropic-section, #f0eee6);')
    expect(indexBlock).not.toContain('backdrop-filter: none;')
    expect(indexRowBlock).not.toContain('color: var(--anthropic-fg, #141413);')
  })

  it('uses the canonical linked-hover card anatomy on warm paper sections', () => {
    const home = readFile('src/views/HomeView.vue')
    const featureSectionBlock = cssBlock(home, '.home-feature-section')
    const providerSectionBlock = cssBlock(home, '.home-provider-section')
    const capabilityKickerBlock = cssBlock(home, '.home-ascii-shell .home-capability-kicker-item')
    const capabilityCardBlock = cssBlock(home, '.home-ascii-shell .home-cap-card')
    const capabilityVisualBlock = cssBlock(home, '.home-cap-card__visual')
    const capabilityBodyBlock = cssBlock(home, '.home-cap-card__body')
    const capabilitySiblingHoverBlock = cssBlock(
      home,
      '.home-ascii-shell .home-capability-grid:has(.home-cap-card:hover) .home-cap-card:not(:hover) .home-cap-card__body,\n.home-ascii-shell .home-capability-grid:has(.home-cap-card:focus-within) .home-cap-card:not(:focus-within) .home-cap-card__body',
    )
    const capabilityCardHoverBlock = cssBlock(
      home,
      '.home-ascii-shell .home-cap-card:hover,\n.home-ascii-shell .home-cap-card:focus-within',
    )
    const gridBlock = cssBlock(home, '.home-provider-specimen-grid')
    const cardBlock = cssBlock(home, '.home-ascii-shell .home-provider-specimen')
    const siblingHoverBlock = cssBlock(
      home,
      '.home-ascii-shell .home-provider-specimen-grid:has(.home-provider-specimen:hover) .home-provider-specimen:not(:hover) .home-provider-meta,\n.home-ascii-shell .home-provider-specimen-grid:has(.home-provider-specimen:focus-within) .home-provider-specimen:not(:focus-within) .home-provider-meta',
    )
    const cardHoverBlock = cssBlock(
      home,
      '.home-ascii-shell .home-provider-specimen:hover,\n.home-ascii-shell .home-provider-specimen:focus-within',
    )
    const swatchBlock = cssBlock(home, '.home-provider-swatch')
    const metaBlock = cssBlock(home, '.home-provider-meta')
    const logoMarkBlock = cssBlock(home, '.home-provider-mark')

    expect(featureSectionBlock).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(featureSectionBlock).toContain('color: var(--atelier-ink);')
    expect(providerSectionBlock).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(providerSectionBlock).toContain('color: var(--atelier-ink);')
    expect(featureSectionBlock).toContain('width: 100%;')
    expect(providerSectionBlock).toContain('width: 100%;')
    expect(capabilityKickerBlock).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(capabilityKickerBlock).toContain('color: var(--atelier-ink);')
    expect(capabilityCardBlock).toContain('border-radius: 16px;')
    expect(capabilityCardBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(capabilityCardBlock).toContain('box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);')
    expect(capabilityVisualBlock).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(capabilityBodyBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(capabilitySiblingHoverBlock).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(capabilityCardHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);')
    expect(gridBlock).toContain('grid-template-columns: repeat(5, minmax(0, 1fr));')
    expect(cardBlock).toContain('--home-chip-text: var(--atelier-ink);')
    expect(cardBlock).toContain('border-radius: 16px;')
    expect(cardBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(cardBlock).toContain('backdrop-filter: none;')
    expect(cardBlock).toContain('box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);')
    expect(siblingHoverBlock).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(cardHoverBlock).toContain('border-color: var(--anthropic-border-hover')
    expect(cardHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);')
    expect(swatchBlock).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(metaBlock).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(logoMarkBlock).toContain('transform-origin: right bottom;')
    expect(home).toContain('transform: scale(1.045);')
    expect(home).toContain('color: #c05621 !important;')
    expect(cardBlock).not.toContain('transform: translate3d(0, -4px, 0);')
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

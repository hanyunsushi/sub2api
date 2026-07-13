import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const home = readFileSync(resolve(frontendRoot, 'src/views/HomeView.vue'), 'utf8')

function cssBlock(selector: string) {
  const start = home.indexOf(`\n${selector} {`)
  expect(start, `missing CSS block for ${selector}`).toBeGreaterThanOrEqual(0)
  const end = home.indexOf('\n}', start + 1)
  expect(end, `missing CSS block end for ${selector}`).toBeGreaterThan(start)
  return home.slice(start, end + 2)
}

describe('home design-system restoration', () => {
  it('uses explicit warm-paper surfaces for viewport two and three', () => {
    expect(cssBlock('.home-feature-section')).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(cssBlock('.home-provider-section')).toContain('background: var(--anthropic-section, #f0eee6);')
  })

  it('keeps the black masthead logo legible on a paper surface', () => {
    expect(cssBlock('.home-logo')).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(cssBlock(':global(.dark .home-ascii-shell .home-logo)')).toContain('background: var(--anthropic-page, #faf9f5);')
  })

  it('lets low-height desktop hero content determine its full height', () => {
    expect(home).toContain('.home-hero {\n    height: auto;\n    min-height: 100vh;')
  })

  it('uses the feature section background on all three capability labels', () => {
    expect(cssBlock('.home-ascii-shell .home-capability-kicker-item')).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(cssBlock('.home-ascii-shell .home-capability-kicker-item:nth-child(2)')).toContain('background: var(--anthropic-section, #f0eee6);')
    expect(cssBlock('.home-ascii-shell .home-capability-kicker-item:nth-child(3)')).toContain('background: var(--anthropic-section, #f0eee6);')
  })

  it('renders provider logos at half their previous size', () => {
    expect(cssBlock('.home-provider-mark')).toContain('width: 22px;')
    expect(cssBlock('.home-provider-mark')).toContain('height: 22px;')
    expect(home).toContain('.home-provider-mark {\n    width: 22px;\n    height: 22px;')
  })

  it('moves the metric rings down and gives every ring the same hover contract', () => {
    expect(cssBlock('.home-rings')).toContain('margin-top: 12px;')
    expect(cssBlock('.home-ring:hover')).toContain('transform: translate3d(0, -3px, 0);')
    expect(home).not.toContain('.home-ring:nth-child(2)')
    expect(home).not.toContain('.home-ring:nth-child(3)')
  })

  it('matches the canonical linked-hover card anatomy in both linked groups', () => {
    expect(home).toContain('class="home-capability-grid home-linked-card-grid"')
    expect(home).toContain('class="home-cap-card__visual"')
    expect(home).toContain('class="home-cap-card__body"')
    expect(home).toContain('class="home-provider-specimen-grid home-linked-card-grid"')

    expect(cssBlock('.home-ascii-shell .home-cap-card')).toContain('border-radius: 16px;')
    expect(cssBlock('.home-ascii-shell .home-cap-card')).toContain('box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);')
    expect(cssBlock('.home-cap-card__visual')).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(cssBlock('.home-cap-card__body')).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(home).toContain('.home-capability-grid:has(.home-cap-card:hover) .home-cap-card:not(:hover) .home-cap-card__body')
    expect(home).toContain('.home-cap-card:hover .home-cap-card__visual')
    expect(home).toContain('transform: scale(1.045);')

    expect(cssBlock('.home-ascii-shell .home-provider-specimen')).toContain('border-radius: 16px;')
    expect(cssBlock('.home-ascii-shell .home-provider-specimen')).toContain('box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);')
    expect(cssBlock('.home-provider-swatch')).toContain('background: var(--anthropic-raised, #e8e6dc);')
    expect(cssBlock('.home-provider-meta')).toContain('background: var(--anthropic-page, #faf9f5);')
    expect(home).toContain('.home-provider-specimen-grid:has(.home-provider-specimen:hover) .home-provider-specimen:not(:hover) .home-provider-meta')
    expect(home).toContain('.home-provider-specimen:hover .home-provider-mark')
  })

  it('keeps the linked-card anatomy compact inside fixed one-screen viewports', () => {
    expect(cssBlock('.home-feature-section')).toContain('align-content: start;')
    expect(cssBlock('.home-feature-section')).toContain('gap: 24px;')
    expect(cssBlock('.home-ascii-shell .home-capability-kicker-item')).toContain('min-height: 64px;')
    expect(cssBlock('.home-ascii-shell .home-cap-card')).toContain('min-height: 0;')
    expect(cssBlock('.home-cap-card__visual')).toContain('aspect-ratio: auto;')
    expect(cssBlock('.home-cap-card__visual')).toContain('min-height: 104px;')
    expect(cssBlock('.home-provider-section')).toContain('align-content: start;')
    expect(cssBlock('.home-ascii-shell .home-provider-specimen')).toContain('min-height: 0;')
    expect(cssBlock('.home-provider-swatch')).toContain('aspect-ratio: auto;')
    expect(cssBlock('.home-provider-swatch')).toContain('min-height: 96px;')
  })

  it('moves both desktop card grids down without adding mobile spacing', () => {
    expect(cssBlock('.home-capability-grid')).toContain('margin-top: 72px;')
    expect(cssBlock('.home-provider-specimen-grid')).toContain('margin-top: 72px;')
    expect(home).toContain('.home-capability-grid,\n  .home-provider-specimen-grid {\n    margin-top: 0;')
  })

  it('does not collapse low-height desktop windows into the mobile single-column layout', () => {
    expect(home).toContain('@media (max-width: 820px) {')
    expect(home).not.toContain('@media (max-width: 820px), (max-height: 679px)')
    expect(home).toContain('@media (min-width: 821px) and (max-height: 679px) {')
    expect(home).toContain('scroll-snap-type: none;')
    expect(home).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));')
    expect(home).toContain('grid-template-columns: repeat(5, minmax(0, 1fr));')
  })

  it('keeps mobile full-width paper sections inside the scroll container', () => {
    expect(home).not.toContain('width: 100vw;')
    expect(home).not.toContain('max-width: 100vw;')
    expect(home).not.toContain('margin-left: calc(50% - 50vw);')
    expect(home).not.toContain('margin-right: calc(50% - 50vw);')
  })
})

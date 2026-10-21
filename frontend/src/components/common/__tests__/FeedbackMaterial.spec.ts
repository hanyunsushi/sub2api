import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/components/common/feedback/feedback.css'), 'utf8')
const designSystemCss = readFileSync(resolve(process.cwd(), 'src/styles/design-system/kreepai.css'), 'utf8')

describe('feedback surface material', () => {
  it('uses the topbar glass only for message and notification panels', () => {
    expect(css).toMatch(/\.kf-feedback-panel\s*\{[^}]*background:\s*var\(--bg,\s*#fff\)\s*!important;/)
    expect(designSystemCss).toMatch(/--topbar-backdrop-filter:\s*blur\(22px\)\s+saturate\(1\.5\)/)
    expect(designSystemCss).toMatch(/\.kreepai-app-header:not\(\.kreepai-original-header\)\s*\{[^}]*backdrop-filter:\s*var\(--topbar-backdrop-filter\)/)
    expect(css).toMatch(/\.kf-feedback-panel\.kf-feedback-message\s*\{[^}]*background:\s*var\(--topbar-surface\)\s*!important;[^}]*backdrop-filter:\s*var\(--topbar-backdrop-filter\)/)
  })
  it('keeps neutral text and fixed rings while hover uses the shared 400ms inset animation', () => {
    expect(designSystemCss).toMatch(/\.btn-secondary[^{}]*\{[^}]*color: var\(--text-2\); background: transparent;/)
    expect(designSystemCss).toContain('--button-hover-fill: inset 0 0 32px rgb(0 7 7 / .12)')
    expect(designSystemCss).toContain('--button-hover-fill: inset 0 0 32px rgb(255 255 255 / .32)')
    expect(designSystemCss).toContain('transition: box-shadow .4s ease;')
    expect(designSystemCss).toContain('isolation: isolate')
    expect(designSystemCss).not.toContain('box-shadow: 0 0 0 2px var(--border-strong)')
    expect(designSystemCss).not.toContain('box-shadow: 0 0 0 2px var(--accent-button-hover)')
    expect(designSystemCss).toMatch(/\.btn:focus-visible\s*\{[^}]*outline: 2px solid var\(--accent\)/)
    expect(designSystemCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?::after \{ transition: none; \}/)
  })
})

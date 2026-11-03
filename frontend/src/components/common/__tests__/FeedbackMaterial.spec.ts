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
  it('uses the current 300ms surface feedback and emphasis ring without the retired inset layer', () => {
    expect(designSystemCss).toContain('--button-hover-duration: .3s;')
    expect(designSystemCss).toContain('background: var(--button-surface); color: var(--text-2)')
    expect(designSystemCss).toContain('background: var(--card-hover); color: var(--text-2); box-shadow: 0 0 0 1px var(--border)')
    expect(designSystemCss).toContain('box-shadow: 0 0 0 2px var(--accent-button-hover)')
    expect(designSystemCss).not.toContain('--button-hover-fill')
    expect(designSystemCss).toMatch(/\.btn:focus-visible\s*\{[^}]*outline: 2px solid var\(--accent\)/)
    expect(designSystemCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition-duration: \.01ms !important/)
  })
})

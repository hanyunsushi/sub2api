import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const materialBlock = styleSource.slice(
  styleSource.indexOf('.app-layout-content .card,'),
  styleSource.indexOf('.dark .paper-surface,')
)
const darkMaterialBlock = styleSource.slice(
  styleSource.indexOf('.dark .app-layout-content .card,'),
  styleSource.indexOf('.dark .app-layout-content .modal-content,')
)
const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')
const blockedLargeBlur = ['blur', '(20px)'].join('')
const blockedTableBlur = ['blur', '(16px)'].join('')

describe('right-side material surfaces', () => {
  it('applies a visible flat paper material style to maintained cards without pseudo masks or CSS blur', () => {
    expect(styleSource).toContain('background: var(--atelier-white) !important;')
    expect(styleSource).toContain('box-shadow: 0 12px 28px -24px rgba(23, 21, 18, 0.36) !important;')
    expect(styleSource).toContain('.app-layout-content :where(div, section, article):where(')
    expect(styleSource).toContain('[class~="rounded-lg"]')
    expect(styleSource).toContain('[class~="bg-white/95"]')
    expect(styleSource).toContain('[class~="bg-white/90"]')
    expect(styleSource).toContain('[class~="bg-gray-50"]')
    expect(styleSource).toContain('[class~="bg-gray-50/50"]')
    expect(styleSource).toContain(':not([class*="absolute"])')
    expect(styleSource).toContain(':not([class*="fixed"])')
    expect(styleSource).toContain(':not([class~="btn"])')
    expect(styleSource).toContain(':not([role="button"])')
    expect(styleSource).toContain('.app-layout-content .table-scroll-container')
    expect(styleSource).not.toContain(blockedBackdropFilter)
    expect(styleSource).not.toContain(blockedWebkitBackdropFilter)
    expect(styleSource).not.toContain(blockedLargeBlur)
    expect(styleSource).not.toContain(blockedTableBlur)
    expect(materialBlock).not.toContain('.app-layout-content .card::before')
    expect(materialBlock).not.toContain('.app-layout-content .card::after')
    expect(materialBlock).not.toContain('mask-image')
    expect(materialBlock).not.toContain('inset 0 -1px')
    expect(darkMaterialBlock).not.toContain('inset 0 -1px')
  })

  it('keeps deep mode dark using the same flat material layer', () => {
    expect(styleSource).toContain('background: #11100d !important;')
    expect(styleSource).toContain('box-shadow: 0 16px 34px -28px rgba(5, 5, 5, 0.82) !important;')
    expect(styleSource).toContain('[class~="bg-white"]')
    expect(styleSource).toContain('[class~="rounded-lg"]')
    expect(styleSource).not.toContain('@media (prefers-reduced-transparency: reduce)')
  })

  it('themes old white and gray component internals with the full atelier palette', () => {
    expect(styleSource).toContain('--atelier-component-muted: var(--atelier-dust);')
    expect(styleSource).toContain('--atelier-component-warning: var(--atelier-butter);')
    expect(styleSource).toContain('.app-layout-content :where([class~="text-gray-900"], [class~="text-gray-800"])')
    expect(styleSource).toContain('.app-layout-content :where([class~="text-gray-700"], [class~="text-gray-600"])')
    expect(styleSource).toContain('.app-layout-content :where([class~="border-gray-200"], [class~="border-gray-100"])')
    expect(styleSource).toContain('.app-layout-content .table-wrapper :where(thead, tbody, tr, th, td)')
    expect(styleSource).toContain('.app-layout-content .table-wrapper :where(.table-header, .sticky-header-cell)')
    expect(styleSource).toContain('.app-layout-content :where(.input, input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea, select)')
    expect(styleSource).toContain('background: color-mix(in srgb, var(--atelier-dust) 8%, var(--atelier-white)) !important;')
    expect(styleSource).toContain('background: color-mix(in srgb, var(--atelier-blue) 7%, var(--atelier-white)) !important;')
  })
})

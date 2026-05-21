import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const materialBlock = styleSource.slice(
  styleSource.indexOf('.app-layout-content .card,'),
  styleSource.indexOf('.dark .glass,')
)
const darkMaterialBlock = styleSource.slice(
  styleSource.indexOf('.dark .app-layout-content .card,'),
  styleSource.indexOf('.dark .app-layout-content .modal-content,')
)

describe('right-side material surfaces', () => {
  it('applies a visible direct material style to maintained cards without pseudo masks', () => {
    expect(styleSource).toContain('backdrop-filter: blur(20px) saturate(1.22) contrast(1.04);')
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
    expect(styleSource).toContain('backdrop-filter: blur(16px) saturate(1.12);')
    expect(materialBlock).not.toContain('.app-layout-content .card::before')
    expect(materialBlock).not.toContain('.app-layout-content .card::after')
    expect(materialBlock).not.toContain('mask-image')
    expect(materialBlock).not.toContain('inset 0 -1px')
    expect(darkMaterialBlock).not.toContain('inset 0 -1px')
  })

  it('keeps deep mode dark and provides reduced-transparency fallbacks for the same surfaces', () => {
    expect(styleSource).toContain('rgba(5, 5, 5, 0.7)')
    expect(styleSource).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(styleSource).toContain('[class~="bg-white"]')
    expect(styleSource).toContain('[class~="rounded-lg"]')
    expect(styleSource).toContain('backdrop-filter: none;')
    expect(styleSource).toContain('background: rgb(17, 16, 13) !important;')
  })
})

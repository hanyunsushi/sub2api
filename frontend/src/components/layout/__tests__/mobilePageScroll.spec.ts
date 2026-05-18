import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('mobile page scrolling', () => {
  it('lets table pages grow naturally on mobile instead of trapping scroll in the table body', () => {
    const source = readFile('components/layout/TablePageLayout.vue')

    expect(source).toContain('.table-page-layout.mobile-mode {')
    expect(source).toContain('height: auto;')
    expect(source).toContain('.table-page-layout.mobile-mode .table-scroll-container :deep(.table-wrapper)')
    expect(source).toContain('overflow-x: auto;')
    expect(source).toContain('overflow-y: visible;')
  })

  it('lets custom markdown pages use document scrolling on mobile', () => {
    const source = readFile('views/user/CustomPageView.vue')

    expect(source).toContain('@media (max-width: 640px)')
    expect(source).toContain('.custom-page-layout')
    expect(source).toContain('custom-markdown-shell')
    expect(source).toContain('.custom-markdown-shell')
    expect(source).toContain('height: auto;')
    expect(source).toContain('.markdown-page-content')
    expect(source).toContain('overflow: visible;')
  })
})

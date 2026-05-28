import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(resolve(__dirname, '../AISearchBox.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')

const cssBlock = (source: string, selector: string) => {
  const selectorIndex = source.indexOf(`${selector} {`)
  expect(selectorIndex).toBeGreaterThan(-1)
  const openBraceIndex = source.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

describe('AI Search box source contract', () => {
  it('uses the Ask AI label everywhere and clears the submitted query', () => {
    expect(componentSource).toContain('placeholder="Ask AI"')
    expect(componentSource).toContain('aria-label="Ask AI"')
    expect(componentSource).toContain('title="Ask AI"')
    expect(componentSource).toContain('clear Ask AI')
    expect(componentSource).not.toContain('placeholder="ask ai"')
    expect(componentSource).not.toContain('aria-label="ask ai"')
    expect(componentSource).toContain("query.value = ''")
    expect(componentSource.indexOf("const trimmed = query.value.trim()")).toBeLessThan(
      componentSource.indexOf("query.value = ''")
    )
  })

  it('keeps the idle search input transparent and avoids butter hover highlights', () => {
    const formBlock = cssBlock(styleSource, '.ai-search-form,\n.ai-search-mobile-form')
    const hoverBlock = cssBlock(styleSource, '.ai-search-clear:hover,\n.ai-search-mobile-trigger:hover')
    const resultHoverBlock = cssBlock(styleSource, '.ai-search-result:hover')

    expect(formBlock).toContain('background: transparent;')
    expect(formBlock).toContain('box-shadow: none;')
    expect(formBlock).not.toContain('255, 250, 240')
    expect(hoverBlock).not.toContain('var(--atelier-butter)')
    expect(resultHoverBlock).not.toContain('var(--atelier-butter)')
  })
})

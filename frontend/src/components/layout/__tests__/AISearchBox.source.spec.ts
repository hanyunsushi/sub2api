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

  it('opens a centered modal dialog instead of the old dropdown panel', () => {
    expect(componentSource).toContain('<Teleport to="body">')
    expect(componentSource).toContain('role="dialog"')
    expect(componentSource).toContain('aria-modal="true"')
    expect(componentSource).toContain('tabindex="-1"')
    expect(componentSource).toContain('@keydown.esc.prevent="closeDialog"')
    expect(componentSource).toContain('data-testid="ai-search-dialog"')
    expect(componentSource).toContain('class="ai-search-dialog-backdrop"')
    expect(componentSource).toContain('class="ai-search-dialog ai-search-dialog-official"')
    expect(componentSource).not.toContain('FloatingDropdown')
    expect(componentSource).not.toContain('ai-search-panel')

    const backdropBlock = cssBlock(styleSource, '.ai-search-dialog-backdrop')
    const dialogBlock = cssBlock(styleSource, '.ai-search-dialog')
    expect(backdropBlock).toContain('position: fixed;')
    expect(backdropBlock).toContain('place-items: center;')
    expect(dialogBlock).toContain('width: min(42rem, calc(100vw - 2rem));')
    expect(dialogBlock).toContain('max-height: min(78vh, 42rem);')
  })

  it('uses the official Cloudflare chat snippet for browser-side AI calls', () => {
    expect(componentSource).toContain("import '@cloudflare/ai-search-snippet'")
    expect(componentSource).toContain('<chat-page-snippet')
    expect(componentSource).toContain(':api-url="snippetConfig.api_url"')
    expect(componentSource).toContain('ref="chatPageRef"')
    expect(componentSource).toContain('sendMessage')
    expect(componentSource).toContain('getSnippetConfig')
    expect(componentSource).toContain('await getSnippetConfig()')
    expect(componentSource).toContain('chat-query-rewrite=\'{"enabled":true}\'')
    expect(componentSource).not.toContain('chat-query-rewrite="true"')
    expect(componentSource).not.toContain('aiSearchAPI.search')
    expect(componentSource).not.toContain('AI_SEARCH_HISTORY_KEY')
    expect(componentSource).not.toContain('sub2api.aiSearch.recentChats')
  })

  it('keeps the idle search input transparent and avoids butter hover highlights', () => {
    const formBlock = cssBlock(styleSource, '.ai-search-form,\n.ai-search-mobile-form')
    const hoverBlock = cssBlock(styleSource, '.ai-search-clear:hover,\n.ai-search-mobile-trigger:hover')

    expect(formBlock).toContain('background: transparent;')
    expect(formBlock).toContain('box-shadow: none;')
    expect(formBlock).not.toContain('255, 250, 240')
    expect(hoverBlock).not.toContain('var(--atelier-butter)')
  })
})

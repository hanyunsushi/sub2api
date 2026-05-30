import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(resolve(__dirname, '../AISearchBox.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const viteConfigSource = readFileSync(resolve(__dirname, '../../../../vite.config.ts'), 'utf8')
const vitestConfigSource = readFileSync(resolve(__dirname, '../../../../vitest.config.ts'), 'utf8')

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
  it('uses the Ask AI label on the official bar component', () => {
    expect(componentSource).toContain('placeholder="Ask AI"')
    expect(componentSource).toContain('aria-label="Ask AI"')
    expect(componentSource).toContain('title="Ask AI"')
    expect(componentSource).not.toContain('placeholder="ask ai"')
    expect(componentSource).not.toContain('aria-label="ask ai"')
  })

  it('uses Cloudflare official search bar snippet instead of modal or chat snippets', () => {
    expect(componentSource).toContain("import '@cloudflare/ai-search-snippet'")
    expect(componentSource).toContain('<search-bar-snippet')
    expect(componentSource).toContain('data-testid="ai-search-official-bar"')
    expect(componentSource).toContain(':api-url="snippetConfig.api_url"')
    expect(componentSource).toContain('max-results="10"')
    expect(componentSource).toContain('max-render-results="5"')
    expect(componentSource).toContain('debounce-ms="250"')
    expect(componentSource).toContain('hide-branding="true"')
    expect(componentSource).toContain('hide-thumbnails="true"')
    expect(componentSource).toContain('show-url="true"')
    expect(componentSource).toContain('show-date="true"')
    expect(componentSource).toContain('disable-analytics="false"')
    expect(componentSource).toContain(':translations.prop="searchTranslations"')
    expect(componentSource).toContain(':key="submittedQuery"')
    expect(componentSource).toContain("import type { Translations } from '@cloudflare/ai-search-snippet'")
    expect(componentSource).toContain('const searchTranslations: Translations = {')
    expect(viteConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(vitestConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(componentSource).not.toContain('JSON.stringify({')
    expect(componentSource).toContain('getSnippetConfig')
    expect(componentSource).toContain('refreshSnippetConfig')
    expect(componentSource).toContain('setInterval(refreshSnippetConfig')
    expect(componentSource).not.toContain('<chat-page-snippet')
    expect(componentSource).not.toContain('<chat-bubble-snippet')
    expect(componentSource).not.toContain('sendMessage')
    expect(componentSource).not.toContain('chat-query-rewrite')
    expect(componentSource).not.toContain('<Teleport to="body">')
    expect(componentSource).not.toContain('role="dialog"')
    expect(componentSource).not.toContain('FloatingDropdown')
    expect(componentSource).not.toContain('ai-search-panel')
  })

  it('keeps the same-origin auth bridge instead of direct frontend search calls', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('aiSearchAPI.getSnippetConfig()')
    expect(componentSource).not.toContain('aiSearchAPI.search')
    expect(componentSource).not.toContain('AI_SEARCH_HISTORY_KEY')
    expect(componentSource).not.toContain('sub2api.aiSearch.recentChats')
  })

  it('submits searches only through the Ask button, not while typing', () => {
    expect(componentSource).toContain('manualSearchInput')
    expect(componentSource).toContain('submittedQuery')
    expect(componentSource).toContain('handleManualAsk')
    expect(componentSource).toContain('@submit.prevent="handleManualAsk"')
    expect(componentSource).toContain('@keydown.enter.prevent')
    expect(componentSource).toContain('stripOfficialAutoSearchListeners')
    expect(componentSource).toContain("inputElement.removeEventListener('input'")
    expect(componentSource).toContain("inputElement.removeEventListener('keydown'")
    expect(componentSource).toContain("buttonElement.addEventListener('click'")
    expect(componentSource).toContain('requestAnimationFrame(stripOfficialAutoSearchListeners)')
  })

  it('styles the official bar as a resident header control', () => {
    const boxBlock = cssBlock(styleSource, '.ai-search-box')
    const formBlock = cssBlock(styleSource, '.ai-search-manual-form')
    const barBlock = cssBlock(styleSource, '.ai-search-official-bar')

    expect(boxBlock).toContain('width: clamp(13rem, 24vw, 22rem);')
    expect(formBlock).toContain('background: transparent;')
    expect(barBlock).toContain('--search-snippet-background: var(--atelier-paper);')
    expect(barBlock).toContain('--search-snippet-surface: var(--atelier-paper-2);')
    expect(barBlock).toContain('--search-snippet-primary-color: var(--atelier-blue);')
    expect(barBlock).toContain('--search-snippet-min-width: 0px;')
    expect(barBlock).toContain('--search-snippet-input-height: 2.25rem;')
    expect(barBlock).toContain('--search-snippet-z-dropdown: 100000025;')
    expect(styleSource).toContain('.ai-search-box.ai-search-has-query .ai-search-official-bar')
    expect(styleSource).not.toContain('.ai-search-dialog-backdrop')
    expect(styleSource).not.toContain('.ai-search-dialog-official')
    expect(barBlock).not.toContain('var(--atelier-butter)')
  })
})

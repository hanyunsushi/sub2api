import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(resolve(__dirname, '../AISearchBox.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const viteConfigSource = readFileSync(resolve(__dirname, '../../../../vite.config.ts'), 'utf8')
const vitestConfigSource = readFileSync(resolve(__dirname, '../../../../vitest.config.ts'), 'utf8')

const cssBlock = (source: string, selector: string) => {
  // Match the selector only when it begins a rule (start of file or line),
  // so descendant overrides like `:root.theme-x .ai-search-chat {` do not
  // shadow the base `.ai-search-chat {` block we are inspecting.
  const blockStart = `${selector} {`
  let selectorIndex = source.startsWith(blockStart) ? 0 : source.indexOf(`\n${selector} {`)
  if (selectorIndex > 0) selectorIndex += 1
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
  it('uses the Creepee label and crab avatar on a resident trigger', () => {
    expect(componentSource).toContain('class="ai-search-trigger"')
    expect(componentSource).toContain('aria-label="Creepee"')
    expect(componentSource).toContain('title="Creepee"')
    expect(componentSource).toContain('class="ai-search-trigger-avatar"')
    expect(componentSource).toContain('Creepee')
    expect(componentSource).toContain('智能助手')
    expect(componentSource).not.toContain('Ask Creepee.ai')
    expect(componentSource).not.toContain('placeholder="ask ai"')
    expect(componentSource).not.toContain('aria-label="ask ai"')
  })

  it('opens the official Cloudflare chat snippet for natural-language answers', () => {
    expect(componentSource).toContain("import '@cloudflare/ai-search-snippet'")
    expect(componentSource).toContain('<chat-page-snippet')
    expect(componentSource).toContain('data-testid="ai-search-chat"')
    expect(componentSource).toContain(':api-url="snippetConfig.api_url"')
    expect(componentSource).toContain('hide-branding="true"')
    expect(componentSource).toContain(':translations.prop="chatTranslations"')
    expect(componentSource).toContain("import type { Translations } from '@cloudflare/ai-search-snippet'")
    expect(componentSource).toContain('const chatTranslations: Translations = {')
    expect(componentSource).toContain('assistantAvatar: creepeeLabel')
    expect(componentSource).toContain('claudeCodeCrabAvatar')
    expect(componentSource).toContain("'/brand/claudecode-color.png'")
    expect(componentSource).toContain('installSnippetBrandStyles')
    expect(viteConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(vitestConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(componentSource).not.toContain('<search-bar-snippet')
    expect(componentSource).not.toContain('performSearch')
  })

  it('renders the chat panel through a docked right-side sidecar', () => {
    expect(componentSource).toContain('<Teleport to="body">')
    expect(componentSource).toContain('data-testid="ai-search-sidecar"')
    expect(componentSource).toContain('role="complementary"')
    expect(componentSource).not.toContain('aria-modal="true"')
    expect(componentSource).not.toContain('class="ai-search-overlay"')
    expect(componentSource).toContain('class="ai-search-panel"')
    expect(componentSource).toContain('class="ai-search-panel-brand"')
    expect(componentSource).not.toContain('点击后会在屏幕中央弹出聊天窗口')
  })

  it('closes the panel by the close button or Escape', () => {
    expect(componentSource).toContain('@click="closePanel"')
    expect(componentSource).toContain("event.key === 'Escape'")
    expect(componentSource).toContain("document.addEventListener('keydown', handleKeydown)")
    expect(componentSource).toContain("document.removeEventListener('keydown', handleKeydown)")
    expect(componentSource).toContain('function openPanel')
    expect(componentSource).toContain('function closePanel')
  })

  it('keeps the same-origin auth bridge instead of direct frontend search calls', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('aiSearchAPI.getSnippetConfig()')
    expect(componentSource).toContain('refreshSnippetConfig')
    expect(componentSource).toContain('setInterval')
    expect(componentSource).not.toContain('aiSearchAPI.search')
  })

  it('guards the chat input against IME composition so Enter does not submit mid-composition', () => {
    expect(componentSource).toContain('function handleChatKeydownCapture')
    expect(componentSource).toContain('event.isComposing || event.keyCode === 229')
    expect(componentSource).toContain('event.stopImmediatePropagation()')
    expect(componentSource).toContain('attachChatImeGuard')
    expect(componentSource).toContain('detachChatImeGuard')
    // Must listen in the capture phase on the snippet host so the component's
    // own keydown handler never runs for the composition Enter.
    expect(componentSource).toContain("addEventListener('keydown', handleChatKeydownCapture, true)")
  })

  it('styles a resident trigger plus a layout-pushing right sidecar', () => {
    const boxBlock = cssBlock(styleSource, '.ai-search-box')
    const triggerBlock = cssBlock(styleSource, '.ai-search-trigger')
    const sidecarBlock = cssBlock(styleSource, '.ai-search-sidecar')
    const panelBlock = cssBlock(styleSource, '.ai-search-panel')
    const chatBlock = cssBlock(styleSource, '.ai-search-chat')

    expect(boxBlock).toContain('display: flex;')
    expect(triggerBlock).toContain('cursor: pointer;')
    expect(sidecarBlock).toContain('position: fixed;')
    expect(sidecarBlock).toContain('right: 0;')
    expect(sidecarBlock).toContain('width: var(--ai-search-sidecar-width);')
    expect(sidecarBlock).toContain('min-width: 34.25rem;')
    expect(styleSource).toContain('--ai-search-sidecar-width: clamp(34.25rem, 42vw, 40rem);')
    expect(styleSource).toContain('@media (max-width: 560px)')
    expect(styleSource).toContain('body.ai-search-panel-open .app-layout-content')
    expect(styleSource).toContain('margin-right: var(--ai-search-sidecar-width);')
    expect(panelBlock).toContain('flex-direction: column;')
    expect(panelBlock).toContain('height: 100%;')
    expect(panelBlock).toContain('border-radius: 0;')
    expect(chatBlock).toContain('--search-snippet-background: var(--atelier-paper);')
    expect(chatBlock).toContain('--search-snippet-primary-color: var(--atelier-blue);')
    expect(styleSource).toContain('.ai-search-panel-avatar')
    expect(styleSource).toContain('background: transparent;')
    expect(styleSource).not.toContain('body.ai-search-locked')
    expect(styleSource).not.toContain('.ai-search-manual-form')
    expect(styleSource).not.toContain('.ai-search-official-bar')
    expect(chatBlock).not.toContain('var(--atelier-butter)')
  })
})

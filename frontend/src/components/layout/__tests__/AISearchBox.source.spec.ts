import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(resolve(__dirname, '../AISearchBox.vue'), 'utf8')
const panelPath = resolve(__dirname, '../AISearchPanel.vue')
const panelSource = existsSync(panelPath) ? readFileSync(panelPath, 'utf8') : ''
const appSource = readFileSync(resolve(__dirname, '../../../App.vue'), 'utf8')
const appStoreSource = readFileSync(resolve(__dirname, '../../../stores/app.ts'), 'utf8')
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
  it('uses the Ask Creepee label and crab avatar on a resident trigger', () => {
    expect(componentSource).toContain('class="ai-search-trigger"')
    expect(componentSource).toContain('aria-label="Ask Creepee"')
    expect(componentSource).toContain('title="Ask Creepee"')
    expect(componentSource).toContain('class="ai-search-trigger-avatar"')
    expect(componentSource).toContain('Ask Creepee')
    expect(panelSource).toContain('智能助手')
    expect(componentSource).not.toContain('Ask Creepee.ai')
    expect(componentSource).not.toContain('Ask AI')
    expect(componentSource).not.toContain('placeholder="ask ai"')
    expect(componentSource).not.toContain('aria-label="ask ai"')
  })

  it('opens the official Cloudflare chat snippet for natural-language answers', () => {
    expect(panelSource).toContain("import '@cloudflare/ai-search-snippet'")
    expect(panelSource).toContain('<chat-page-snippet')
    expect(panelSource).toContain('data-testid="ai-search-chat"')
    expect(panelSource).toContain(':api-url="snippetConfig.api_url"')
    expect(panelSource).toContain('hide-branding="true"')
    expect(panelSource).toContain(':translations.prop="chatTranslations"')
    expect(panelSource).toContain("import type { Translations } from '@cloudflare/ai-search-snippet'")
    expect(panelSource).toContain('const chatTranslations: Translations = {')
    expect(panelSource).toContain('assistantAvatar: creepeeLabel')
    expect(panelSource).toContain('claudeCodeCrabAvatar')
    expect(panelSource).toContain("'/brand/claudecode-color.png'")
    expect(panelSource).toContain('installSnippetBrandStyles')
    expect(viteConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(vitestConfigSource).toContain('isCustomElement: (tag) => tag.endsWith(\'-snippet\')')
    expect(panelSource).not.toContain('<search-bar-snippet')
    expect(panelSource).not.toContain('performSearch')
  })

  it('renders the chat panel through a docked right-side sidecar', () => {
    expect(panelSource).toContain('<Teleport to="body">')
    expect(panelSource).toContain('data-testid="ai-search-sidecar"')
    expect(panelSource).toContain('role="complementary"')
    expect(panelSource).not.toContain('aria-modal="true"')
    expect(panelSource).not.toContain('class="ai-search-overlay"')
    expect(panelSource).toContain('class="ai-search-panel"')
    expect(panelSource).toContain('class="ai-search-panel-brand"')
    expect(panelSource).not.toContain('点击后会在屏幕中央弹出聊天窗口')
  })

  it('keeps the sidecar mounted outside route-keyed pages so internal navigation does not close it', () => {
    expect(appStoreSource).toContain('const aiSearchPanelOpen = ref<boolean>(false)')
    expect(appStoreSource).toContain('function openAISearchPanel')
    expect(appStoreSource).toContain('function closeAISearchPanel')
    expect(appStoreSource).toContain('function setAISearchPanelOpen')
    expect(appSource).toContain("import AISearchPanel from '@/components/layout/AISearchPanel.vue'")
    expect(appSource).toContain('<AISearchPanel v-if="authStore.isAuthenticated" />')
    expect(appSource.indexOf('<AISearchPanel')).toBeGreaterThan(appSource.indexOf('</RouterView>'))
    expect(componentSource).toContain('appStore.openAISearchPanel()')
    expect(componentSource).not.toContain('const open = ref(false)')
    expect(componentSource).not.toContain('<Teleport to="body">')
  })

  it('closes the panel by the close button or Escape', () => {
    expect(panelSource).toContain('@click="closePanel"')
    expect(panelSource).toContain("event.key === 'Escape'")
    expect(panelSource).toContain("document.addEventListener('keydown', handleKeydown)")
    expect(panelSource).toContain("document.removeEventListener('keydown', handleKeydown)")
    expect(componentSource).toContain('function openPanel')
    expect(panelSource).toContain('function closePanel')
  })

  it('keeps the same-origin auth bridge instead of direct frontend search calls', () => {
    expect(panelSource).toContain('onMounted')
    expect(panelSource).toContain('onBeforeUnmount')
    expect(panelSource).toContain('aiSearchAPI.getSnippetConfig()')
    expect(panelSource).toContain('refreshSnippetConfig')
    expect(panelSource).toContain('setInterval')
    expect(panelSource).not.toContain('aiSearchAPI.search')
  })

  it('guards the chat input against IME composition so Enter does not submit mid-composition', () => {
    expect(panelSource).toContain('function handleChatKeydownCapture')
    expect(panelSource).toContain('event.isComposing || event.keyCode === 229')
    expect(panelSource).toContain('event.stopImmediatePropagation()')
    expect(panelSource).toContain('attachChatImeGuard')
    expect(panelSource).toContain('detachChatImeGuard')
    // Must listen in the capture phase on the snippet host so the component's
    // own keydown handler never runs for the composition Enter.
    expect(panelSource).toContain("addEventListener('keydown', handleChatKeydownCapture, true)")
  })

  it('collapses Cloudflare conversation history behind the built-in top-left button', () => {
    expect(panelSource).toContain('collapseSnippetHistorySidebar')
    expect(panelSource).toContain('handleDocumentPointerDown')
    expect(panelSource).toContain('document.addEventListener(\'pointerdown\', handleDocumentPointerDown, true)')
    expect(panelSource).toContain('document.removeEventListener(\'pointerdown\', handleDocumentPointerDown, true)')
    expect(panelSource).toContain('isSnippetHistorySidebarExpanded')
    expect(panelSource).toContain("root.querySelector('.chat-sidebar')")
    expect(panelSource).toContain("root.querySelector<HTMLButtonElement>('.toggle-sidebar-button')")
    expect(panelSource).toContain("sidebar.classList.contains('collapsed')")
    expect(panelSource).toContain('toggleButton.click()')
    expect(panelSource).toContain('function collapseSnippetHistorySidebar(root: ShadowRoot): boolean')
    expect(panelSource).toContain('return false')
    expect(panelSource).toContain('return true')
    expect(panelSource).toContain('!collapseSnippetHistorySidebar(root) && attempt < 20')
    expect(panelSource).toContain('.chat-page-container')
    expect(panelSource).toContain('.chat-sidebar')
    expect(panelSource).toContain('position: absolute !important;')
    expect(panelSource).toContain('.chat-main')
    expect(panelSource).toContain('width: 100% !important;')
  })

  it('renders a CF-style Creepee welcome state with timed greeting and prompt suggestions', () => {
    expect(panelSource).toContain('renderCreepeeWelcomeState')
    expect(panelSource).toContain('ensureDefaultWelcomeSession')
    expect(panelSource).toContain('getTimeGreeting')
    expect(panelSource).toContain('Good morning.')
    expect(panelSource).toContain('Good afternoon.')
    expect(panelSource).toContain('Good evening.')
    expect(panelSource).toContain('What are we doing today?')
    expect(panelSource).toContain('creepee-welcome')
    expect(panelSource).toContain('creepee-welcome-orb')
    expect(panelSource).toContain('creepee-welcome-suggestion')
    expect(panelSource).toContain('handleWelcomeSuggestionClick')
    expect(panelSource).toContain("root.querySelector<HTMLTextAreaElement>('.chat-input')")
    expect(panelSource).toContain("root.querySelector<HTMLButtonElement>('.chat-send-button')")
    expect(panelSource).toContain("new Event('input', { bubbles: true, composed: true })")
    expect(panelSource).toContain('sendButton.click()')
    expect(panelSource).toContain('customizeSnippetWelcomeState')
    expect(panelSource).toContain('.chat-empty-icon {')
    expect(panelSource).toContain('display: none !important;')
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

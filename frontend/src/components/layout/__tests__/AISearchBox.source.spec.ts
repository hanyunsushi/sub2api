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

describe('Creepee Obsidian bridge source contract', () => {
  it('keeps the resident Ask Creepee trigger and opens the global sidecar', () => {
    expect(componentSource).toContain('class="ai-search-trigger"')
    expect(componentSource).toContain('aria-label="Ask Creepee"')
    expect(componentSource).toContain('title="Ask Creepee"')
    expect(componentSource).toContain('class="ai-search-trigger-avatar"')
    expect(componentSource).toContain('Ask Creepee')
    expect(componentSource).toContain('appStore.openAISearchPanel()')
    expect(componentSource).not.toContain('Ask AI')
    expect(componentSource).not.toContain('Ask Creepee.ai')
  })

  it('renders Obsidian Codex Bridge in the sidecar iframe instead of Cloudflare AI Search', () => {
    expect(panelSource).toContain('data-testid="obsidian-bridge-frame"')
    expect(panelSource).toContain('ref="bridgeFrameRef"')
    expect(panelSource).toContain(':src="bridgeUrl"')
    expect(panelSource).toContain('@load="handleBridgeFrameLoad"')
    expect(panelSource).toContain('VITE_OBSIDIAN_CODEX_BRIDGE_URL')
    expect(panelSource).toContain('http://127.0.0.1:43110/')
    expect(panelSource).toContain('Obsidian Codex Bridge')
    expect(panelSource).toContain("authAPI.issueCreepeeSSOTicket()")
    expect(panelSource).toContain("type: 'sub2api:creepee-sso'")
    expect(panelSource).toContain('bridgeFrameRef.value?.contentWindow?.postMessage')
    expect(panelSource).toContain('bridgeFrameReady')
    expect(panelSource).toContain('function handleBridgeFrameLoad')
    expect(panelSource).toContain('bridgeOrigin')
    expect(panelSource).toContain('ticketIssuedForOpen')
    expect(panelSource).not.toContain('ticket=')
    expect(panelSource).not.toContain('auth_token')
    expect(panelSource).not.toContain("@cloudflare/ai-search-snippet")
    expect(panelSource).not.toContain('<chat-page-snippet')
    expect(panelSource).not.toContain('data-testid="ai-search-chat"')
    expect(panelSource).not.toContain('aiSearchAPI')
    expect(panelSource).not.toContain('snippetConfig')
    expect(panelSource).not.toContain('runSnippetEnhancement')
    expect(panelSource).not.toContain('MutationObserver')
    expect(panelSource).not.toContain('handleChatKeydownCapture')
    expect(panelSource).not.toContain('cf-ai-search-source')
    expect(viteConfigSource).not.toContain("tag.endsWith('-snippet')")
    expect(vitestConfigSource).not.toContain("tag.endsWith('-snippet')")
  })

  it('keeps the sidecar mounted outside route-keyed pages so internal navigation does not close it', () => {
    expect(panelSource).toContain('<Teleport to="body">')
    expect(panelSource).toContain('data-testid="ai-search-sidecar"')
    expect(panelSource).toContain(':data-open="open ? \'true\' : \'false\'"')
    expect(panelSource).toContain(':aria-hidden="!open"')
    expect(panelSource).toContain('ai-search-sidecar-open')
    expect(panelSource).not.toContain('v-if="open"')
    expect(panelSource).toContain('role="complementary"')
    expect(panelSource).not.toContain('aria-modal="true"')
    expect(panelSource).not.toContain('class="ai-search-overlay"')
    expect(appStoreSource).toContain('const aiSearchPanelOpen = ref<boolean>(false)')
    expect(appStoreSource).toContain('function openAISearchPanel')
    expect(appStoreSource).toContain('function closeAISearchPanel')
    expect(appSource).toContain("import AISearchPanel from '@/components/layout/AISearchPanel.vue'")
    expect(appSource).toContain('<AISearchPanel v-if="authStore.isAuthenticated" />')
    expect(appSource.indexOf('<AISearchPanel')).toBeGreaterThan(appSource.indexOf('</RouterView>'))
  })

  it('closes the panel by the close button or Escape without touching iframe state', () => {
    expect(panelSource).toContain('@click="closePanel"')
    expect(panelSource).toContain("event.key === 'Escape'")
    expect(panelSource).toContain("document.addEventListener('keydown', handleKeydown)")
    expect(panelSource).toContain("document.removeEventListener('keydown', handleKeydown)")
    expect(panelSource).toContain('document.body.classList.toggle')
    expect(panelSource).not.toContain('setInterval')
    expect(panelSource).not.toContain('requestAnimationFrame')
  })

  it('styles a resident trigger plus a layout-pushing right sidecar and full-height bridge frame', () => {
    const boxBlock = cssBlock(styleSource, '.ai-search-box')
    const triggerBlock = cssBlock(styleSource, '.ai-search-trigger')
    const sidecarBlock = cssBlock(styleSource, '.ai-search-sidecar')
    const panelBlock = cssBlock(styleSource, '.ai-search-panel')
    const frameBlock = cssBlock(styleSource, '.ai-search-bridge-frame')

    expect(boxBlock).toContain('display: flex;')
    expect(triggerBlock).toContain('cursor: pointer;')
    expect(sidecarBlock).toContain('position: fixed;')
    expect(sidecarBlock).toContain('right: 0;')
    expect(sidecarBlock).toContain('width: var(--ai-search-sidecar-width);')
    expect(sidecarBlock).toContain('min-width: 34.25rem;')
    expect(sidecarBlock).toContain('transform: translate3d(100%, 0, 0);')
    expect(sidecarBlock).toContain('contain: layout paint style;')
    expect(styleSource).toContain('.ai-search-sidecar.ai-search-sidecar-open')
    expect(styleSource).toContain('transform: translate3d(0, 0, 0);')
    expect(styleSource).toContain('--ai-search-sidecar-width: clamp(34.25rem, 42vw, 40rem);')
    expect(styleSource).toContain('@media (max-width: 560px)')
    expect(styleSource).toContain('body.ai-search-panel-open .app-layout-content')
    expect(styleSource).toContain('margin-right: var(--ai-search-sidecar-width);')
    expect(panelBlock).toContain('flex-direction: column;')
    expect(panelBlock).toContain('height: 100%;')
    expect(frameBlock).toContain('width: 100%;')
    expect(frameBlock).toContain('height: 100%;')
    expect(frameBlock).toContain('border: 0;')
    expect(styleSource).not.toContain('.ai-search-chat')
    expect(styleSource).not.toContain('search-snippet')
  })
})

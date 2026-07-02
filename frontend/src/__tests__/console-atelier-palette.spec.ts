import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')
const targetedRepairSource = readFileSync(resolve(__dirname, '../styles/targeted-visual-repair.css'), 'utf8')
const mainSource = readFileSync(resolve(__dirname, '../main.ts'), 'utf8')
const tailwindConfigSource = readFileSync(resolve(__dirname, '../../tailwind.config.js'), 'utf8')
const localFontsPath = resolve(__dirname, '../assets/fonts/local-fonts.css')
const localFontsSource = existsSync(localFontsPath) ? readFileSync(localFontsPath, 'utf8') : ''
const runtimeSourceRoot = resolve(__dirname, '..')
const docsToGuard = [
  'components/layout/README.md',
  'components/layout/EXAMPLES.md',
  'components/layout/INTEGRATION.md',
  'views/auth/README.md',
  'views/auth/VISUAL_GUIDE.md',
]

type SourceEntry = {
  path: string
  source: string
}

const forbiddenOldLockNeedles = [
  'Final EOF',
  'Authoritative EOF',
  'Global hover/highlight logic',
  'complete de-slab pass',
  '2026-06 UI regression pass',
  'Anthropic 81k authoritative status/platform palette lock',
  '#app .app-layout-content.app-layout-content',
  '#app#app',
  '--claude-system',
]

const forbiddenAiDefaults = [
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#8b5cf6',
  '#7c3aed',
  '#a855f7',
  '#1677ff',
  '#52c41a',
  '#faad14',
  '#ff4d4f',
]

const forbiddenRuntimeColors = [
  '#8D58EE',
  '#8d58ee',
  '#7c3aed',
  '#6366f1',
  '#4290F0',
  '#4290f0',
  '#B9D6FF',
  '#b9d6ff',
  '#E8649D',
  '#e8649d',
  '#50C3B6',
  '#50c3b6',
  'rgba(59, 130, 246',
  'rgba(0, 47, 167',
  'rgb(0, 47, 167',
  '#10A37F',
  '#10a37f',
]

const runtimeAntiPatterns = [
  /\b(?:from|to|via)-primary-\d/g,
  /\bbg-gradient-to-[trbl][^\n]*\bprimary-/g,
  /\bshadow-primary(?:-\w+)?/g,
  /\bfocus:ring-primary-/g,
  /\bpeer-focus:ring-primary-/g,
  /\bfocus:border-primary-/g,
  /\bpeer-checked:bg-primary-/g,
  /\bbg-white\b[^\n]{0,100}\bshadow-(?:xl|lg)\b/g,
]

const collectRuntimeSources = (directory: string): SourceEntry[] => {
  const entries: SourceEntry[] = []
  for (const dirent of readdirSync(directory)) {
    const absolutePath = resolve(directory, dirent)
    const relativePath = relative(runtimeSourceRoot, absolutePath).replaceAll('\\', '/')
    if (
      relativePath.includes('/__tests__/') ||
      relativePath.endsWith('.spec.ts') ||
      relativePath.endsWith('.test.ts') ||
      relativePath.includes('/test/')
    ) {
      continue
    }

    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      entries.push(...collectRuntimeSources(absolutePath))
      continue
    }

    if (!/\.(vue|ts|css)$/.test(relativePath) || relativePath.endsWith('.d.ts')) {
      continue
    }

    entries.push({
      path: relativePath,
      source: readFileSync(absolutePath, 'utf8'),
    })
  }
  return entries
}

const runtimeSources = collectRuntimeSources(runtimeSourceRoot)
const runtimeUiSources = runtimeSources.filter((entry) => entry.path !== 'components/common/ModelIcon.vue')
const guardedDocs = docsToGuard.map((path) => ({
  path,
  source: readFileSync(resolve(runtimeSourceRoot, path), 'utf8'),
}))

const cssBlock = (source: string, selector: string) => {
  const selectorIndex = source.indexOf(selector)
  expect(selectorIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
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

describe('Anthropic design-system component contract', () => {
  it('loads the local Anthropic font and runtime contract in the correct order', () => {
    expect(mainSource).toContain("import './assets/fonts/local-fonts.css'")
    expect(mainSource).toContain("import './style.css'")
    expect(mainSource).toContain("import './styles/targeted-visual-repair.css'")
    expect(mainSource.indexOf("import './assets/fonts/local-fonts.css'")).toBeLessThan(
      mainSource.indexOf("import './style.css'"),
    )
    expect(mainSource.indexOf("import './style.css'")).toBeLessThan(
      mainSource.indexOf("import './styles/targeted-visual-repair.css'"),
    )
    expect(localFontsSource).toContain("font-family: 'Anthropic Sans'")
    expect(localFontsSource).toContain("font-family: 'Anthropic Serif'")
    expect(localFontsSource).toContain("font-family: 'Anthropic Mono'")
    expect(localFontsSource).not.toContain('fonts.googleapis.com')
  })

  it('binds the official Anthropic palette and type roles at token source', () => {
    const baseThemeBlock = cssBlock(styleSource, '/* Base appearance tokens */\n:root')
    for (const needle of [
      '--atelier-paper: #faf9f5;',
      '--atelier-paper-2: #f0eee6;',
      '--atelier-surface-muted: #e8e6dc;',
      '--atelier-surface-panel: var(--atelier-paper-2);',
      '--atelier-ink: #141413;',
      '--atelier-dark: #3d3d3a;',
      '--atelier-muted: #5e5d59;',
      '--atelier-dust: #87867f;',
      '--atelier-ring: #d1cfc5;',
      '--atelier-focus: #2c84db;',
      '--atelier-blue: #141413;',
      '--atelier-blue-dark: #3d3d3a;',
      '--atelier-butter: #d97757;',
      '--atelier-butter-dark: #c6613f;',
      '--atelier-status-success: #6ea100;',
      '--atelier-status-info: #6396d6;',
      '--atelier-status-warning: #eda100;',
      '--atelier-status-danger: #b53333;',
      '--sans: "Anthropic Sans",',
      '--serif: "Anthropic Serif",',
      '--mono: "Anthropic Mono",',
    ]) {
      expect(baseThemeBlock).toContain(needle)
    }
  })

  it('maps Tailwind primary to Slate actions, not Clay or old AI colors', () => {
    expect(tailwindConfigSource).toContain("const anthropicSlate = '#141413'")
    expect(tailwindConfigSource).toContain("500: anthropicSlate")
    expect(tailwindConfigSource).toContain("600: anthropicSlate")
    expect(tailwindConfigSource).toContain("700: anthropicSlateHover")
    for (const color of forbiddenAiDefaults) {
      expect(tailwindConfigSource).not.toContain(color)
    }
  })

  it('uses a taxonomy-based component contract in both CSS entry points', () => {
    for (const source of [styleSource, targetedRepairSource]) {
      expect(source).toContain('Anthropic design-system component')
      expect(source).toContain('--anthropic-page: #faf9f5;')
      expect(source).toContain('--anthropic-cookbook-hover: #f5f4ed;')
      expect(source).toContain('--anthropic-section: #f0eee6;')
      expect(source).toContain('--anthropic-raised: #e8e6dc;')
      expect(source).toContain('--anthropic-cookbook-border: rgba(20, 19, 19, 0.08);')
      expect(source).toContain('--anthropic-cookbook-border-hover: rgba(20, 19, 19, 0.16);')
      expect(source).toContain('--anthropic-fg: #141413;')
      expect(source).toContain('--anthropic-focus: #2c84db;')
      expect(source).toContain('--anthropic-dropdown-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);')
      expect(source).toContain('--anthropic-button-ring:')
      expect(source).toContain('.app-layout-content :where(.btn-primary')
      expect(source).toContain('.app-layout-content :where(.btn-secondary')
      expect(source).toContain('.app-layout-content :where(.input')
      expect(source).toContain(':where(.dropdown, .floating-dropdown-portal, .select-dropdown-portal')
      expect(source).toContain('background: var(--anthropic-cookbook-hover);')
      expect(source).toContain('#app .app-layout-content :where(.admin-dashboard-atelier, .ops-dashboard-atelier)')
      expect(source).toContain('.app-layout-content :where(.filter-menu-button, .ops-toolbar-text-button)')
      expect(source).toContain('.app-layout-content :where(.route-tabs')
      expect(source).toContain('.app-layout-content :where(.badge')
      expect(source).toContain('.app-layout-content :where(.state-card, .empty-state')
    }
    expect(targetedRepairSource).toContain('#app .app-layout-content .accounts-table-page .account-card-table-frame')
  })

  it('guards the admin-console rules that are easy to misread from the examples', () => {
    for (const source of [styleSource, targetedRepairSource]) {
      expect(source).toContain('--anthropic-control-gap: 0.75rem;')
      expect(source).toContain('--anthropic-control-group-gap: 1rem;')
      expect(source).toContain('row-gap: var(--anthropic-control-group-gap);')
      expect(source).toContain('column-gap: var(--anthropic-control-gap);')
      expect(source).toContain('text-decoration-color: transparent;')
      expect(source).toContain('text-decoration-color: currentColor;')
      expect(source).toContain(':where(:focus-visible)')
      expect(source).toContain(':where(:focus, .select-trigger-open, .date-picker-trigger-open):not(:focus-visible)')
      expect(source).toContain('outline: 0;')
      expect(source).not.toContain('--sidebar-active-bg: var(--atelier-blue);')
      expect(source).not.toContain('--sidebar-active-text: var(--atelier-white);')
      expect(source).not.toContain('background: var(--sidebar-active-text);')
    }
    expect(targetedRepairSource).toContain('grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));')
    expect(targetedRepairSource).toContain('background: var(--account-card-bg) !important;')
    expect(targetedRepairSource).toContain('background: var(--account-card-resting-bg) !important;')
    expect(targetedRepairSource).toContain('transform: none !important;')
    expect(targetedRepairSource).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08) !important;')
    expect(targetedRepairSource).not.toContain('rgba(201, 100, 66, 0.62)')
    expect(targetedRepairSource).not.toContain('rgba(201, 100, 66, 0.72)')
  })

  it('removes old page-level paint-lock stacks and AI-slop patterns', () => {
    for (const needle of forbiddenOldLockNeedles) {
      expect(styleSource).not.toContain(needle)
      expect(targetedRepairSource).not.toContain(needle)
    }
    for (const color of forbiddenAiDefaults) {
      expect(styleSource).not.toContain(color)
      expect(targetedRepairSource).not.toContain(color)
    }
    expect(styleSource).not.toContain('border-l-4 border-primary')
    expect(styleSource).not.toContain('bg-gradient-to-r from-primary')
    expect(styleSource).not.toContain('0 12px 42px rgba(201, 100, 66')
  })

  it('keeps high-risk AI theme colors and primary effects out of runtime UI chrome', () => {
    for (const entry of runtimeUiSources) {
      for (const color of forbiddenRuntimeColors) {
        expect(entry.source, `${entry.path} should not contain ${color}`).not.toContain(color)
      }
      for (const pattern of runtimeAntiPatterns) {
        pattern.lastIndex = 0
        expect(entry.source, `${entry.path} should not match ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('allows provider SVG brand colors only inside the model icon asset map', () => {
    const modelIconSource = runtimeSources.find((entry) => entry.path === 'components/common/ModelIcon.vue')?.source
    expect(modelIconSource).toBeTruthy()
    expect(modelIconSource).toContain("color: '#10A37F'")
    for (const entry of runtimeUiSources) {
      expect(entry.source, `${entry.path} should not use OpenAI green as interface chrome`).not.toMatch(/#10A37F|#10a37f/)
    }
  })

  it('keeps project implementation docs from teaching the retired blue SaaS theme', () => {
    for (const entry of guardedDocs) {
      expect(entry.source, `${entry.path} should not mention retired Klein guidance`).not.toMatch(/Klein|#002FA7|#001A6B/i)
      expect(entry.source, `${entry.path} should not teach indigo defaults`).not.toMatch(/\bindigo-\d{2,3}\b|indigo primary/i)
      expect(entry.source, `${entry.path} should not teach white shadow cards`).not.toMatch(/\bbg-white\b|\bshadow-(?:xl|2xl|lg)?\b/)
      expect(entry.source, `${entry.path} should reference Anthropic contract`).toMatch(/Anthropic|anthropic|#141413|#faf9f5/)
    }
  })
})

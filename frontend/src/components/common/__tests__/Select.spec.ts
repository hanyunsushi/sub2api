import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../Select.vue'),
  'utf8'
)

describe('Select portal styles', () => {
  it('keeps teleported dark option hover states readable outside page scopes', () => {
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option:hover')
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option-focused')
    expect(componentSource).toContain('.dark .select-dropdown-portal .select-option-selected:hover')
    expect(componentSource).toContain('--select-option-text: var(--atelier-muted);')
    expect(componentSource).toContain('--select-option-hover-text: var(--atelier-ink);')
    expect(componentSource).toContain('--select-option-selected-text: var(--atelier-white);')
    expect(componentSource).toContain('color: var(--select-option-hover-text);')
    expect(componentSource).not.toContain('--select-surface: #111827;')
    expect(componentSource).not.toContain('color: var(--atelier-blue-dark);')
    expect(componentSource).not.toContain('.admin-dashboard-atelier .select-dropdown-portal')
  })

  it('uses atelier surface tokens for trigger, portal, option states, and reveal motion', () => {
    expect(componentSource).toContain('--select-surface: var(--atelier-paper-2);')
    expect(componentSource).toContain('--select-muted-surface: var(--atelier-paper-2);')
    expect(componentSource).toContain('--select-option-selected-surface: var(--atelier-blue);')
    expect(componentSource).toContain('--select-option-focused-surface: var(--atelier-ui-hover-surface);')
    expect(componentSource).toContain('background: var(--select-surface);')
    expect(componentSource).toContain('border-color: var(--atelier-line);')
    expect(componentSource).toContain('background: var(--select-option-selected-surface);')
    expect(componentSource).toContain('.select-dropdown-portal .select-option-selected :where(.select-option-label, svg)')
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('transform: scale(')
  })
})

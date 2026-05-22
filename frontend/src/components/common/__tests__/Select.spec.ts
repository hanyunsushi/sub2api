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
    expect(componentSource).toContain('color: #f7f1e6;')
    expect(componentSource).not.toContain('.admin-dashboard-atelier .select-dropdown-portal')
  })

  it('uses atelier surface tokens for trigger, portal, option states, and reveal motion', () => {
    expect(componentSource).toContain('--select-surface: var(--atelier-white);')
    expect(componentSource).toContain('--select-muted-surface: color-mix(in srgb, var(--atelier-dust) 12%, var(--atelier-white));')
    expect(componentSource).toContain('background: var(--select-surface);')
    expect(componentSource).toContain('border-color: var(--atelier-line);')
    expect(componentSource).toContain('background: color-mix(in srgb, var(--atelier-blue) 9%, var(--select-surface));')
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('transform: scale(')
  })
})

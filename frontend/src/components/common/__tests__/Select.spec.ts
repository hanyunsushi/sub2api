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
    expect(componentSource).toContain('color: rgb(229, 231, 235);')
    expect(componentSource).not.toContain('.admin-dashboard-liquid .select-dropdown-portal')
  })
})

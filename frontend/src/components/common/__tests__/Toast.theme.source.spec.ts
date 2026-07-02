import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../Toast.vue'), 'utf8')

describe('Toast theme source', () => {
  it('uses shared 81k status tokens for notification chrome', () => {
    expect(source).toContain('toast-themed')
    expect(source).toContain('toast-themed--${toast.type}')
    expect(source).toContain('toast-themed--success')
    expect(source).toContain('toast-themed--error')
    expect(source).toContain('toast-themed--warning')
    expect(source).toContain('toast-themed--info')
    expect(source).toContain('toast-icon')
    expect(source).toContain('--toast-status-color: var(--atelier-status-info);')
    expect(source).toContain('--toast-status-color: var(--atelier-status-success);')
    expect(source).toContain('--toast-status-color: var(--atelier-status-danger);')
    expect(source).toContain('--toast-status-color: var(--atelier-status-warning);')
    expect(source).toContain('border-radius: 16px;')
    expect(source).toContain('box-shadow: var(--anthropic-dropdown-shadow')
    expect(source).not.toContain('0 18px 44px')
    expect(source).not.toContain('--atelier-terracotta-action')
    expect(source).not.toContain('text-primary-600')
    expect(source).not.toContain('bg-primary-500')
  })
})

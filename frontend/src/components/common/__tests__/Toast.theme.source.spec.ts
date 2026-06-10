import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../Toast.vue'), 'utf8')

describe('Toast theme source', () => {
  it('uses terracotta themed notification chrome instead of blue-white primary styling', () => {
    expect(source).toContain('toast-themed')
    expect(source).toContain('toast-icon')
    expect(source).toContain('--atelier-terracotta-action')
    expect(source).toContain('--atelier-terracotta-action-hover')
    expect(source).not.toContain('text-primary-600')
    expect(source).not.toContain('bg-primary-500')
  })
})

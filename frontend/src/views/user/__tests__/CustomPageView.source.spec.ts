import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../CustomPageView.vue'), 'utf8')

describe('CustomPageView iframe source', () => {
  it('keeps iframe custom menu pages full-height on mobile instead of collapsing into a tiny window', () => {
    expect(source).toContain('.custom-page-layout--embed')
    expect(source).toContain('height: calc(100dvh - 64px - 4rem);')
    expect(source).toContain('min-height: min(720px, calc(100dvh - 64px - 4rem));')
    expect(source).toContain('.custom-page-layout--embed > .card')
    expect(source).toContain('.custom-page-layout--embed .custom-embed-shell')
    expect(source).toContain('.custom-page-layout--embed .custom-embed-frame')
  })
})

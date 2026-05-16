import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('global scrolling behavior', () => {
  it('does not install a document-wide wheel interceptor', () => {
    const mainSource = readFile('src/main.ts')

    expect(mainSource).not.toContain('installSmoothWheelScrolling')
    expect(mainSource).not.toContain("from '@/utils/smoothWheel'")
  })

  it('keeps smooth behavior declarative so native wheel and nested scroll areas remain stable', () => {
    const styleSource = readFile('src/style.css')

    expect(styleSource).toContain('scroll-behavior: smooth;')
    expect(styleSource).toContain('overscroll-behavior')
  })
})

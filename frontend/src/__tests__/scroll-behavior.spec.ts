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

  it('uses native scrolling without installing Lenis on the whole document', () => {
    const mainSource = readFile('src/main.ts')
    const styleSource = readFile('src/style.css')
    const packageJson = readFile('package.json')
    const lockfile = readFile('pnpm-lock.yaml')

    expect(mainSource).not.toContain('installInertialScrolling')
    expect(mainSource).not.toContain('@/utils/inertialScroll')
    expect(styleSource).not.toContain('html.lenis')
    expect(packageJson).not.toContain('"lenis"')
    expect(lockfile).not.toContain('lenis@')
  })

  it('keeps native smooth behavior as a safe fallback', () => {
    const styleSource = readFile('src/style.css')

    expect(styleSource).toContain('scroll-behavior: smooth;')
    expect(styleSource).toContain('overscroll-behavior')
  })
})

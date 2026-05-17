import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function readFileIfExists(path: string) {
  const absolutePath = resolve(process.cwd(), path)
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : ''
}

describe('global scrolling behavior', () => {
  it('does not install a document-wide wheel interceptor', () => {
    const mainSource = readFile('src/main.ts')

    expect(mainSource).not.toContain('installSmoothWheelScrolling')
    expect(mainSource).not.toContain("from '@/utils/smoothWheel'")
  })

  it('installs GSAP-like inertial page scrolling without taking over nested scroll areas', () => {
    const mainSource = readFile('src/main.ts')
    const inertialScrollSource = readFileIfExists('src/utils/inertialScroll.ts')

    expect(mainSource).toContain('installInertialScrolling')
    expect(inertialScrollSource).toContain("from 'lenis'")
    expect(inertialScrollSource).toContain('data-lenis-prevent')
    expect(inertialScrollSource).toContain('.sidebar-nav')
    expect(inertialScrollSource).toContain('.modal-body')
    expect(inertialScrollSource).toContain('prefers-reduced-motion: reduce')
  })

  it('keeps native smooth behavior as a safe fallback', () => {
    const styleSource = readFile('src/style.css')

    expect(styleSource).toContain('scroll-behavior: smooth;')
    expect(styleSource).toContain('overscroll-behavior')
  })
})

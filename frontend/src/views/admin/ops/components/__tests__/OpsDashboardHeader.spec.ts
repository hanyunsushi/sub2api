import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../OpsDashboardHeader.vue')
const componentSource = readFileSync(componentPath, 'utf8')

describe('OpsDashboardHeader title icon', () => {
  it('does not render a decorative logo before the title', () => {
    const headingMatch = componentSource.match(/<h1[\s\S]*?<\/h1>/)

    expect(headingMatch).not.toBeNull()
    expect(headingMatch?.[0]).not.toContain('<svg')
    expect(headingMatch?.[0]).not.toContain('<Icon')
    expect(componentSource).not.toContain('M9 19v-6a2 2 0 00-2-2H5')
  })
})

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const appPath = resolve(dirname(fileURLToPath(import.meta.url)), '../App.vue')
const appSource = readFileSync(appPath, 'utf8')

describe('authenticated route transition', () => {
  it('does not unmount the whole authenticated app shell during route changes', () => {
    expect(appSource).toContain('<RouterView v-slot="{ Component, route: viewRoute }">')
    expect(appSource).toContain(':key="viewRoute.path"')
    expect(appSource).toContain('<component :is="Component" :key="viewRoute.path" />')
    expect(appSource).not.toContain('mode="out-in"')
    expect(appSource).not.toContain('app-route-shell')
    expect(appSource).not.toContain('appRouteTransitionDuration')
  })
})

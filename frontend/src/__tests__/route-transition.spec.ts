import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const appPath = resolve(dirname(fileURLToPath(import.meta.url)), '../App.vue')
const appSource = readFileSync(appPath, 'utf8')

describe('authenticated route transition', () => {
  it('applies Buzz-style timing to the routed app page area only', () => {
    expect(appSource).toContain('<RouterView v-slot="{ Component, route: viewRoute }">')
    expect(appSource).toContain("viewRoute.meta.requiresAuth === false ? 'route-page-none' : 'app-route-shell'")
    expect(appSource).toContain(':duration="viewRoute.meta.requiresAuth === false ? 0 : appRouteTransitionDuration"')
    expect(appSource).toContain('appRouteTransitionDuration = { enter: 350, leave: 200 }')
    expect(appSource).toContain(':key="viewRoute.path"')
    expect(appSource).toContain('.app-route-shell-enter-from .app-route-page')
    expect(appSource).toContain('.app-route-shell-leave-to .app-route-page')
    expect(appSource).toContain('animation: none;')
    expect(appSource).toContain('translateY(8px) scale(0.98)')
    expect(appSource).toContain('scale(0.98)')
    expect(appSource).toContain('cubic-bezier(0.4, 0, 0.2, 1)')
    expect(appSource).toContain('cubic-bezier(0.4, 0, 1, 1)')
  })
})

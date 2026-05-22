import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import FloatingDropdown from '../FloatingDropdown.vue'

const componentSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../FloatingDropdown.vue'),
  'utf8'
)
const backdropFilterProperty = ['backdrop', 'filter'].join('-')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('FloatingDropdown', () => {
  it('teleports interactive dropdown content to body with fixed high z-index positioning', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.getBoundingClientRect = () => ({
      x: 24,
      y: 32,
      top: 32,
      left: 24,
      right: 224,
      bottom: 72,
      width: 200,
      height: 40,
      toJSON: () => ({})
    } as DOMRect)

    mount(FloatingDropdown, {
      props: {
        show: true,
        triggerEl: trigger,
        matchWidth: true,
        panelClass: 'test-dropdown-panel'
      },
      slots: {
        default: '<button type="button">Action</button>'
      },
      attachTo: document.body
    })

    await new Promise(resolve => requestAnimationFrame(resolve))

    const panel = document.body.querySelector('.floating-dropdown-portal') as HTMLElement | null
    expect(panel).not.toBeNull()
    expect(panel?.classList.contains('test-dropdown-panel')).toBe(true)
    expect(panel?.style.position).toBe('fixed')
    expect(panel?.style.zIndex).toBe('100000040')
    expect(panel?.style.left).toBe('24px')
    expect(panel?.style.top).toBe('76px')
    expect(panel?.style.width).toBe('200px')
  })

  it('uses the atelier translate-opacity reveal without scale or glass effects', () => {
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('scale(')
    expect(componentSource).not.toContain(backdropFilterProperty)
  })
})

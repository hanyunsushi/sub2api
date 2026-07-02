import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

    const wrapper = mount(FloatingDropdown, {
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

    wrapper.unmount()
  })

  it('keeps only one floating dropdown portal visible and asks stale owners to close', async () => {
    const firstTrigger = document.createElement('button')
    const secondTrigger = document.createElement('button')
    document.body.append(firstTrigger, secondTrigger)
    firstTrigger.getBoundingClientRect = () => ({
      x: 10,
      y: 10,
      top: 10,
      left: 10,
      right: 110,
      bottom: 40,
      width: 100,
      height: 30,
      toJSON: () => ({})
    } as DOMRect)
    secondTrigger.getBoundingClientRect = () => ({
      x: 130,
      y: 10,
      top: 10,
      left: 130,
      right: 230,
      bottom: 40,
      width: 100,
      height: 30,
      toJSON: () => ({})
    } as DOMRect)
    const firstClose = vi.fn()

    const first = mount(FloatingDropdown, {
      props: {
        show: true,
        triggerEl: firstTrigger,
        panelClass: 'first-dropdown-panel',
        onClose: firstClose
      },
      slots: {
        default: '<span>First</span>'
      },
      attachTo: document.body
    })
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(document.body.querySelectorAll('.floating-dropdown-portal')).toHaveLength(1)
    expect(document.body.querySelector('.first-dropdown-panel')).not.toBeNull()

    const second = mount(FloatingDropdown, {
      props: {
        show: true,
        triggerEl: secondTrigger,
        panelClass: 'second-dropdown-panel'
      },
      slots: {
        default: '<span>Second</span>'
      },
      attachTo: document.body
    })
    await new Promise(resolve => requestAnimationFrame(resolve))

    expect(firstClose).toHaveBeenCalledTimes(1)
    expect(document.body.querySelectorAll('.floating-dropdown-portal')).toHaveLength(1)
    expect(document.body.querySelector('.first-dropdown-panel')).toBeNull()
    expect(document.body.querySelector('.second-dropdown-panel')).not.toBeNull()

    first.unmount()
    second.unmount()
  })

  it('uses the atelier translate-opacity reveal without scale or glass effects', () => {
    expect(componentSource).toContain('transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);')
    expect(componentSource).toContain('transform: translate3d(0, -8px, 0);')
    expect(componentSource).not.toContain('scale(')
    expect(componentSource).not.toContain(backdropFilterProperty)
  })
})

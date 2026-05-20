import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import FloatingDropdown from '../FloatingDropdown.vue'

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
})

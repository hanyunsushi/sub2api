import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installSmoothWheelScrolling } from '../smoothWheel'

let rafCallbacks: FrameRequestCallback[] = []
let rafId = 0

function makeScrollable(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.overflowY = 'auto'
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 })
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 })
  document.body.appendChild(el)
  return el
}

function runAnimationFrame(time = 120) {
  const callbacks = rafCallbacks
  rafCallbacks = []
  callbacks.forEach((callback) => callback(time))
}

describe('installSmoothWheelScrolling', () => {
  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      rafId += 1
      return rafId
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('animates manual wheel scrolling inside scrollable containers', () => {
    const stop = installSmoothWheelScrolling()
    const el = makeScrollable()

    const event = new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true })
    const dispatched = el.dispatchEvent(event)
    runAnimationFrame(window.performance.now() + 140)

    expect(dispatched).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(el.scrollTop).toBeGreaterThan(0)
    expect(el.scrollTop).toBeLessThanOrEqual(240)

    stop()
  })

  it('keeps native scrolling for text inputs and reduced-motion users', () => {
    const stop = installSmoothWheelScrolling()
    const el = makeScrollable()
    const input = document.createElement('input')
    el.appendChild(input)

    const inputWheel = new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true })
    input.dispatchEvent(inputWheel)

    expect(inputWheel.defaultPrevented).toBe(false)
    expect(el.scrollTop).toBe(0)

    stop()

    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const reducedStop = installSmoothWheelScrolling()
    const reducedWheel = new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true })
    el.dispatchEvent(reducedWheel)

    expect(reducedWheel.defaultPrevented).toBe(false)
    expect(el.scrollTop).toBe(0)

    reducedStop()
  })
})

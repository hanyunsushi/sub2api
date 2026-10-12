import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

import { findRowIndexByDomPosition, useSwipeSelect } from '../useSwipeSelect'

it('starts a horizontal card drag on the card under the pointer', () => {
  const selected = new Set<number>()
  const width = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1200)
  const height = vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(900)
  const wrapper = mount({
    setup() {
      const container = ref<HTMLElement | null>(null)
      useSwipeSelect(container, {
        isSelected: id => selected.has(id),
        select: id => { selected.add(id) },
        deselect: id => { selected.delete(id) },
      }, undefined, { layout: 'cards' })
      return { container }
    },
    template: '<div ref="container"><div data-row-id="1"></div><div data-row-id="2"></div></div>',
  }, { attachTo: document.body })
  wrapper.findAll('[data-row-id]').forEach((card, index) => {
    vi.spyOn(card.element, 'getBoundingClientRect').mockReturnValue({ left: index * 320, right: index * 320 + 300, top: 100, bottom: 300 } as DOMRect)
  })
  wrapper.get('[data-row-id="2"]').element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 400, clientY: 150 }))
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 410, clientY: 150 }))
  expect([...selected]).toEqual([2])
  document.dispatchEvent(new MouseEvent('mouseup'))
  wrapper.unmount()
  width.mockRestore()
  height.mockRestore()
})

/**
 * Build a fake scroll element whose `tbody tr[data-index]` rows expose stubbed
 * vertical rects, so we can exercise findRowIndexByDomPosition without a real DOM.
 * `index` is the value placed in the row's data-index attribute (its absolute
 * position in the sorted data), which need not equal the array position.
 */
function makeScrollEl(rows: Array<{ index: number; top: number; bottom: number }>): Element {
  const trs = rows.map((r) => ({
    getAttribute: (name: string) => (name === 'data-index' ? String(r.index) : null),
    getBoundingClientRect: () => ({
      top: r.top,
      bottom: r.bottom,
      left: 0,
      right: 0,
      width: 0,
      height: r.bottom - r.top,
      x: 0,
      y: r.top,
      toJSON: () => ({})
    })
  })) as unknown as HTMLElement[]

  return {
    querySelectorAll: (sel: string) =>
      (sel === 'tbody tr[data-index]' ? trs : []) as unknown as NodeListOf<Element>
  } as unknown as Element
}

describe('findRowIndexByDomPosition (swipe-select full-render fallback)', () => {
  // Variable row heights on purpose — the third row is taller.
  const rows = [
    { index: 0, top: 100, bottom: 200 },
    { index: 1, top: 200, bottom: 300 },
    { index: 2, top: 300, bottom: 450 }
  ]
  const el = makeScrollEl(rows)

  it('returns -1 when no rows are rendered', () => {
    expect(findRowIndexByDomPosition(makeScrollEl([]), 250)).toBe(-1)
  })

  it('locates the row whose rect contains the Y coordinate', () => {
    expect(findRowIndexByDomPosition(el, 150)).toBe(0)
    expect(findRowIndexByDomPosition(el, 250)).toBe(1)
    expect(findRowIndexByDomPosition(el, 400)).toBe(2) // inside the tall row
  })

  it('clamps to the first/last row when Y is outside the rendered range', () => {
    expect(findRowIndexByDomPosition(el, 50)).toBe(0) // above the first row
    expect(findRowIndexByDomPosition(el, 999)).toBe(2) // below the last row
  })

  it('picks the closer row when Y falls in a gap between rows', () => {
    const gapped = makeScrollEl([
      { index: 0, top: 100, bottom: 180 },
      { index: 1, top: 220, bottom: 300 }
    ])
    expect(findRowIndexByDomPosition(gapped, 190)).toBe(0) // 10px from row0.bottom vs 30px from row1.top
    expect(findRowIndexByDomPosition(gapped, 215)).toBe(1) // 35px from row0.bottom vs 5px from row1.top
  })

  it('returns the data-index attribute value, not the array position', () => {
    const remapped = makeScrollEl([
      { index: 5, top: 100, bottom: 200 },
      { index: 9, top: 200, bottom: 300 }
    ])
    expect(findRowIndexByDomPosition(remapped, 150)).toBe(5)
    expect(findRowIndexByDomPosition(remapped, 250)).toBe(9)
  })
})

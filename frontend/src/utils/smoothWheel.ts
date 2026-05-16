const SCROLLABLE_OVERFLOW_RE = /(auto|scroll|overlay)/
const SMOOTH_WHEEL_DURATION_MS = 260
const LINE_DELTA_PX = 48
const NATIVE_WHEEL_TARGET_SELECTOR = 'input, textarea, select, option, [contenteditable="true"], [data-smooth-wheel="off"]'

interface SmoothScrollState {
  frame: number
  fromLeft: number
  fromTop: number
  startedAt: number
  targetLeft: number
  targetTop: number
}

const activeScrolls = new WeakMap<Element, SmoothScrollState>()
const installedDocuments = new WeakMap<Document, EventListener>()

export function installSmoothWheelScrolling(doc: Document = document): () => void {
  if (installedDocuments.has(doc)) return () => {}

  const onWheel = (event: Event) => {
    handleSmoothWheel(event as WheelEvent, doc)
  }

  doc.addEventListener('wheel', onWheel, { passive: false })
  installedDocuments.set(doc, onWheel)

  return () => {
    doc.removeEventListener('wheel', onWheel)
    installedDocuments.delete(doc)
  }
}

function handleSmoothWheel(event: WheelEvent, doc: Document) {
  if (!event.cancelable || event.defaultPrevented || event.ctrlKey || prefersReducedMotion(doc)) return

  const delta = wheelDeltaPixels(event, doc)
  if (!delta.x && !delta.y) return

  const scrollTarget = findScrollableTarget(event.target, doc, delta.x, delta.y)
  if (!scrollTarget) return

  const state = activeScrolls.get(scrollTarget)
  const baseLeft = state?.targetLeft ?? scrollTarget.scrollLeft
  const baseTop = state?.targetTop ?? scrollTarget.scrollTop
  const targetLeft = clamp(baseLeft + delta.x, 0, maxScrollLeft(scrollTarget))
  const targetTop = clamp(baseTop + delta.y, 0, maxScrollTop(scrollTarget))

  if (targetLeft === scrollTarget.scrollLeft && targetTop === scrollTarget.scrollTop) return

  event.preventDefault()
  animateScroll(scrollTarget, targetLeft, targetTop, doc)
}

function prefersReducedMotion(doc: Document): boolean {
  return doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function wheelDeltaPixels(event: WheelEvent, doc: Document): { x: number; y: number } {
  if (event.deltaMode === 1) {
    return { x: event.deltaX * LINE_DELTA_PX, y: event.deltaY * LINE_DELTA_PX }
  }
  if (event.deltaMode === 2) {
    const page = doc.documentElement.clientHeight || doc.defaultView?.innerHeight || 800
    return { x: event.deltaX * page, y: event.deltaY * page }
  }
  return { x: event.deltaX, y: event.deltaY }
}

function findScrollableTarget(target: EventTarget | null, doc: Document, deltaX: number, deltaY: number): Element | null {
  if (!(target instanceof Element)) return rootScrollTarget(doc, deltaX, deltaY)
  if (shouldUseNativeWheel(target)) return null

  for (let element: Element | null = target; element; element = element.parentElement) {
    if (element === doc.documentElement || element === doc.body) break
    if (canScrollInDirection(element, deltaX, deltaY, doc)) return element
  }

  return rootScrollTarget(doc, deltaX, deltaY)
}

function rootScrollTarget(doc: Document, deltaX: number, deltaY: number): Element | null {
  const root = doc.scrollingElement || doc.documentElement
  return canScrollInDirection(root, deltaX, deltaY, doc) ? root : null
}

function shouldUseNativeWheel(target: Element): boolean {
  return Boolean(target.closest(NATIVE_WHEEL_TARGET_SELECTOR))
}

function canScrollInDirection(element: Element, deltaX: number, deltaY: number, doc: Document): boolean {
  const dominantY = Math.abs(deltaY) >= Math.abs(deltaX)
  if (dominantY && canScrollY(element, deltaY, doc)) return true
  if (!dominantY && canScrollX(element, deltaX, doc)) return true
  return canScrollY(element, deltaY, doc) || canScrollX(element, deltaX, doc)
}

function canScrollY(element: Element, deltaY: number, doc: Document): boolean {
  if (!deltaY || !hasScrollableOverflow(element, 'y', doc)) return false
  const maxTop = maxScrollTop(element)
  if (maxTop <= 1) return false
  return deltaY > 0 ? element.scrollTop < maxTop - 1 : element.scrollTop > 1
}

function canScrollX(element: Element, deltaX: number, doc: Document): boolean {
  if (!deltaX || !hasScrollableOverflow(element, 'x', doc)) return false
  const maxLeft = maxScrollLeft(element)
  if (maxLeft <= 1) return false
  return deltaX > 0 ? element.scrollLeft < maxLeft - 1 : element.scrollLeft > 1
}

function hasScrollableOverflow(element: Element, axis: 'x' | 'y', doc: Document): boolean {
  if (element === doc.scrollingElement || element === doc.documentElement || element === doc.body) return true
  const style = doc.defaultView?.getComputedStyle(element)
  const overflow = axis === 'y' ? style?.overflowY : style?.overflowX
  return Boolean(overflow && SCROLLABLE_OVERFLOW_RE.test(overflow))
}

function animateScroll(element: Element, targetLeft: number, targetTop: number, doc: Document) {
  const win = doc.defaultView || window
  const existing = activeScrolls.get(element)
  if (existing) win.cancelAnimationFrame(existing.frame)

  const startedAt = win.performance?.now?.() ?? Date.now()
  const state: SmoothScrollState = {
    frame: 0,
    fromLeft: element.scrollLeft,
    fromTop: element.scrollTop,
    startedAt,
    targetLeft,
    targetTop,
  }

  const tick = (time: number) => {
    const progress = clamp((time - state.startedAt) / SMOOTH_WHEEL_DURATION_MS, 0, 1)
    const eased = easeOutCubic(progress)
    element.scrollLeft = lerp(state.fromLeft, state.targetLeft, eased)
    element.scrollTop = lerp(state.fromTop, state.targetTop, eased)

    if (progress < 1) {
      state.frame = win.requestAnimationFrame(tick)
      return
    }
    activeScrolls.delete(element)
  }

  activeScrolls.set(element, state)
  state.frame = win.requestAnimationFrame(tick)
}

function maxScrollTop(element: Element): number {
  return Math.max(0, element.scrollHeight - element.clientHeight)
}

function maxScrollLeft(element: Element): number {
  return Math.max(0, element.scrollWidth - element.clientWidth)
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3)
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

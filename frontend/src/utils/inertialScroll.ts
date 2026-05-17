import Lenis from 'lenis'

const NESTED_SCROLL_SELECTOR = [
  '[data-lenis-prevent]',
  '.sidebar-nav',
  '.modal-body',
  '.dialog-body',
  '.table-wrapper',
  '.table-container',
  '.overflow-auto',
  '.overflow-y-auto',
  '.overflow-x-auto'
].join(',')

let lenis: Lenis | null = null

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isNestedScrollable(node: HTMLElement): boolean {
  return Boolean(node.closest(NESTED_SCROLL_SELECTOR))
}

export function installInertialScrolling(): Lenis | null {
  if (lenis || typeof window === 'undefined' || prefersReducedMotion()) {
    return lenis
  }

  lenis = new Lenis({
    smoothWheel: true,
    wheelMultiplier: 0.88,
    touchMultiplier: 1.08,
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: {
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    },
    overscroll: false,
    prevent: isNestedScrollable,
    autoRaf: true
  })

  return lenis
}

export function destroyInertialScrolling(): void {
  lenis?.destroy()
  lenis = null
}

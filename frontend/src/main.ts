import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Lenis from 'lenis'
import App from './App.vue'
import router from './router'
import i18n, { initI18n } from './i18n'
import { useAppStore } from '@/stores/app'
import { isChunkLoadError, reloadAfterChunkLoadError } from '@/utils/chunkLoadRecovery'
import './style.css'

const lenisNestedScrollSelector = '[data-lenis-scroll]'
const lenisNativePreventSelector = '.modal-body, .dialog-body, [data-lenis-prevent]'
type NestedLenisOrientation = 'horizontal' | 'vertical'

function resolveNestedLenisContent(wrapper: HTMLElement) {
  const firstChild = wrapper.firstElementChild
  return firstChild instanceof HTMLElement ? firstChild : wrapper
}

function resolveNestedLenisOrientation(wrapper: HTMLElement): NestedLenisOrientation {
  const hasHorizontalOverflow = wrapper.scrollWidth > wrapper.clientWidth + 1
  const hasVerticalOverflow = wrapper.scrollHeight > wrapper.clientHeight + 1
  return hasHorizontalOverflow && !hasVerticalOverflow ? 'horizontal' : 'vertical'
}

function syncNestedLenisPreventAttributes(wrapper: HTMLElement) {
  const hasHorizontalOverflow = wrapper.scrollWidth > wrapper.clientWidth + 1
  const hasVerticalOverflow = wrapper.scrollHeight > wrapper.clientHeight + 1

  wrapper.toggleAttribute('data-lenis-prevent-horizontal', hasHorizontalOverflow)
  wrapper.toggleAttribute('data-lenis-prevent-vertical', hasVerticalOverflow)
}

function initLenisSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.08,
    wheelMultiplier: 0.86,
    touchMultiplier: 0.9,
    smoothWheel: true,
    anchors: true,
    allowNestedScroll: true,
    prevent: (node) => node.closest(lenisNativePreventSelector) !== null
  })

  const nestedLenis = new Map<HTMLElement, Lenis>()
  let nestedSyncFrame = 0

  const syncNestedLenisScrollers = () => {
    nestedSyncFrame = 0

    nestedLenis.forEach((instance, wrapper) => {
      if (!wrapper.isConnected || !wrapper.matches(lenisNestedScrollSelector)) {
        instance.destroy()
        nestedLenis.delete(wrapper)
      }
    })

    document.querySelectorAll<HTMLElement>(lenisNestedScrollSelector).forEach((wrapper) => {
      syncNestedLenisPreventAttributes(wrapper)
      const orientation = resolveNestedLenisOrientation(wrapper)
      const currentOrientation = wrapper.dataset.lenisOrientation as NestedLenisOrientation | undefined
      const existingInstance = nestedLenis.get(wrapper)

      if (existingInstance && currentOrientation === orientation) return

      existingInstance?.destroy()
      wrapper.dataset.lenisOrientation = orientation
      nestedLenis.set(
        wrapper,
        new Lenis({
          wrapper,
          content: resolveNestedLenisContent(wrapper),
          eventsTarget: wrapper,
          orientation,
          gestureOrientation: orientation,
          autoRaf: true,
          lerp: 0.08,
          wheelMultiplier: 0.86,
          touchMultiplier: 0.9,
          smoothWheel: true,
          overscroll: false
        })
      )
    })
  }

  const scheduleNestedLenisSync = () => {
    if (nestedSyncFrame) return
    nestedSyncFrame = window.requestAnimationFrame(syncNestedLenisScrollers)
  }

  const nestedScrollObserver = new MutationObserver(scheduleNestedLenisSync)

  const startNestedLenisObserver = () => {
    syncNestedLenisScrollers()
    nestedScrollObserver.observe(document.body, { childList: true, subtree: true })
  }

  if (document.body) {
    startNestedLenisObserver()
  } else {
    window.addEventListener('DOMContentLoaded', startNestedLenisObserver, { once: true })
  }

  window.addEventListener(
    'beforeunload',
    () => {
      if (nestedSyncFrame) window.cancelAnimationFrame(nestedSyncFrame)
      nestedScrollObserver.disconnect()
      nestedLenis.forEach((instance) => instance.destroy())
      nestedLenis.clear()
      lenis.destroy()
    },
    { once: true }
  )
}

function initThemeClass() {
  const savedTheme = localStorage.getItem('theme')
  const shouldUseDark =
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', shouldUseDark)
}

async function bootstrap() {
  // Apply theme class globally before app mount to keep all routes consistent.
  initThemeClass()
  initLenisSmoothScroll()

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // Initialize settings from injected config BEFORE mounting (prevents flash)
  // This must happen after pinia is installed but before router and i18n
  const appStore = useAppStore()
  appStore.initFromInjectedConfig()

  // Set document title immediately after config is loaded
  if (appStore.siteName && appStore.siteName !== 'Sub2API') {
    document.title = `${appStore.siteName} - AI API Gateway`
  }

  await initI18n()

  app.use(router)
  app.use(i18n)

  // 等待路由器完成初始导航后再挂载，避免竞态条件导致的空白渲染
  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap app:', error)

  if (isChunkLoadError(error)) {
    reloadAfterChunkLoadError()
  }
})

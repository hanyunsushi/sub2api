import type { InjectionKey } from 'vue'

// 展示信息模块：认证路由在嵌入模式共享外壳，原视图只提供表单和辅助入口。
export const embeddedAuthShellKey: InjectionKey<boolean> = Symbol('embedded-auth-shell')

declare global {
  // eslint-disable-next-line no-var -- globalThis augmentation requires a global var declaration.
  var __SUB2API_MICROFRONTEND__: boolean | undefined
}
let navigateEmbedded: ((path: string) => void) | null = null
export function isMicrofrontend() {
  return globalThis.__SUB2API_MICROFRONTEND__ === true
}
export function setEmbeddedNavigator(navigate: ((path: string) => void) | null) {
  navigateEmbedded = navigate
}
export function navigateFromMicrofrontend(path: string) {
  if (isMicrofrontend()) navigateEmbedded?.(path)
  else window.location.href = path
}

let requestScope: AbortController | null = null
export function beginEmbeddedRequests() { requestScope = new AbortController() }
export function endEmbeddedRequests() { requestScope?.abort(); requestScope = null }
export function embeddedRequestSignal(signal?: AbortSignal | null): AbortSignal | undefined {
  if (!requestScope) return signal ?? undefined
  return signal ? AbortSignal.any([signal, requestScope.signal]) : requestScope.signal
}

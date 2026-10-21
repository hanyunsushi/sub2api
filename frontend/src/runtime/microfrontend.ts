import { watchEffect, createApp, ref, type App } from 'vue'
import { createPinia, disposePinia } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding'
import { setEmbeddedNavigator, beginEmbeddedRequests, endEmbeddedRequests } from './environment'
import { createConsoleActionBridge, consoleBridgeKey, type ConsoleAction, type ConsoleSession, type ConsoleNavigationItem } from './console-actions'
import { consolePublicNavigation } from './console-navigation'
import { beginPageLoad, cancelPageLoad } from '@/utils/page-loading'
import { prepareShift5Route, resetShift5Transition } from '@/utils/shift5'
import { consoleTopbarActions } from './console-topbar'
import '@/style.css'
import '@/styles/design-system/kreepai.css'
import './page-layout.css'

export interface KreepaiMicrofrontendContext {
  onVersionStatus?: (status: {state: 'checking'|'current'|'available'|'error';latest?: string}) => void
  onVersion?: (version: string) => void
  onPageLayout?: (layout: 'page' | 'content') => void
  onSession?: (session: ConsoleSession) => void
  onNavigation?: (items: ConsoleNavigationItem[]) => void
  topbarTarget?: HTMLElement
  onHeader?: (header: { mounted: boolean; title: string; ready?: boolean }) => void
  initialPath: string
  onNavigate: (path: string) => void
  onTopbarActions: (actions: ConsoleAction[]) => void
}

export async function mount(container: HTMLElement, context: KreepaiMicrofrontendContext) {
  globalThis.__SUB2API_MICROFRONTEND__ = true
  beginEmbeddedRequests()
  resetShift5Transition()
  prepareShift5Route('content')
  beginPageLoad()
  container.classList.add('console-kreepai-surface', 'kreepai-design-system')
  const overlays = document.createElement('div')
  overlays.id = 'console-kreepai-overlays'
  overlays.className = 'console-kreepai-surface kreepai-design-system'
  overlays.style.display = 'contents'
  document.body.appendChild(overlays)
  const pinia = createPinia()
  let app: App | null = null
  let disposed = false

  let stopSession = () => {}
  let ready = false
  let removeNavigationBridge = () => {}
  let stopBackgroundTasks = () => {}
  const unmount = () => {
    if (disposed) return
    disposed = true
    stopSession()
    resetShift5Transition()
    cancelPageLoad()
    removeNavigationBridge()
    setEmbeddedNavigator(null)
    endEmbeddedRequests()
    // 提示信息 / 浮层：跨项目卸载结束原Driver实例，释放body标记/键盘监听，原项目内切页继续引导。
    useOnboardingStore(pinia).getDriverInstance()?.destroy()
    useOnboardingStore(pinia).setDriverInstance(null)
    app?.unmount()
    stopBackgroundTasks()
    disposePinia(pinia)
    overlays.remove()
    container.classList.remove('console-kreepai-surface', 'kreepai-design-system', 'dark')
    globalThis.__SUB2API_MICROFRONTEND__ = undefined
  }
  try {
    const [{ default: Root }, routerModule, i18nModule, appModule, authModule, subscriptionModule] = await Promise.all([
      import('@/App.vue'), import('@/router'), import('@/i18n'), import('@/stores/app'),
      import('@/stores/auth'), import('@/stores/subscriptions'),
    ])
    const router = routerModule.default
    app = createApp(Root)
    app.use(pinia)
    const auth = authModule.useAuthStore(pinia)
    const appStore = appModule.useAppStore(pinia)
  // 数字展示 / 提示信息：版本检查仍由原应用权限和后端负责，只读，不执行更新。
  const checkVersion = async () => {
    if (disposed || !auth.isAdmin) return
    context.onVersionStatus?.({state:'checking'})
    try {
      const info = await appStore.fetchVersion(true)
      if (!disposed) context.onVersionStatus?.(info ? {state:info.has_update ? 'available':'current',latest:info.latest_version} : {state:'error'})
    } catch { if (!disposed) context.onVersionStatus?.({state:'error'}) }
  }

    const switchingLocale = ref(false)
    const headerMounted = ref(false)
    let headerOwner: symbol | null = null
    const actions = createConsoleActionBridge(() => headerMounted.value ? [] : consoleTopbarActions({
      authenticated: auth.isAuthenticated, isAdmin: auth.isAdmin,
      settings: appStore.cachedPublicSettings, docUrl: appStore.docUrl,
      locale: i18nModule.default.global.locale.value, switchingLocale: switchingLocale.value,
      path: router.currentRoute.value.path, publicPage: router.currentRoute.value.meta.requiresAuth === false,
      navigate: path => router.push(path),
      openDocument: url => window.open(url, '_blank', 'noopener,noreferrer'),
      switchLocale: async locale => {
        switchingLocale.value = true
        try { await i18nModule.setLocale(locale); window.location.reload() }
        finally { switchingLocale.value = false }
      },
    }), items => { if (!disposed) context.onTopbarActions(items) })
    let completeNavigation = () => {}
    const navigationPrepared = new Promise<void>(resolve => { completeNavigation = resolve })
    let applicationNavigation: ConsoleNavigationItem[] = []
    const publishNavigation = () => context.onNavigation?.([
      ...consolePublicNavigation(auth.isAuthenticated, appStore.cachedPublicSettings),
      ...(auth.isAuthenticated ? applicationNavigation : []),
    ])
    stopBackgroundTasks = () => {
      authModule.useAuthStore(pinia).stopBackgroundRefresh()
      subscriptionModule.useSubscriptionStore(pinia).stopPolling()
      routerModule.stopEmbeddedRouteTasks()
    }
    app.provide(consoleBridgeKey, {
      requestLogout: () => window.dispatchEvent(new CustomEvent('console-session-action', { detail: { project: 'kreepai', key: 'logout' } })),
      topbarTarget: context.topbarTarget,
      setHeader: (owner, header) => {
        if (disposed || (!header && owner !== headerOwner)) return
        headerOwner = header ? owner : null
        headerMounted.value = header?.mounted ?? false
        context.onHeader?.(header ?? { mounted: false, title: '' })
        actions.update()
      },
      setNavigationReady: value => { if (value) completeNavigation() },
      setNavigation: items => { if (!disposed) { applicationNavigation = items; publishNavigation() } },
      setActions: items => { if (!disposed) actions.setActions(items) },
      register: actions.register,
    })
    appModule.useAppStore(pinia).initFromInjectedConfig()
    // 顶栏 / 加载反馈：刷新当前挂载的真实公开配置，避免语言/登录/注册分批出现。
    await appStore.fetchPublicSettings(true)
    await i18nModule.initI18n()
    app.use(i18nModule.default)
    removeNavigationBridge = router.afterEach((to, _from, failure) => {
      if (ready && !disposed && !failure) {
        const hasLayout = to.meta.requiresAuth !== false || (to.path === '/model-plaza' && to.query.embedded === '1' && auth.isAuthenticated)
        context.onPageLayout?.(hasLayout ? 'content' : 'page')
        context.onNavigate(to.fullPath)
      }
    })
    setEmbeddedNavigator(path => { if (!disposed) void router.push(path) })
    await router.replace(context.initialPath)
    app.use(router)
    await router.isReady()
    const initialRoute = router.currentRoute.value
    const hasLayout = initialRoute.meta.requiresAuth !== false || (initialRoute.path === '/model-plaza' && initialRoute.query.embedded === '1' && auth.isAuthenticated)
    context.onPageLayout?.(hasLayout ? 'content' : 'page')
    stopSession = watchEffect(() => {
      context.onVersion?.(appStore.siteVersion)
      context.onSession?.({ authenticated: auth.isAuthenticated, isAdmin: auth.isAdmin, username: auth.user?.username || auth.user?.email || '' })
      if (!auth.isAuthenticated) applicationNavigation = []
      publishNavigation()
      actions.update()
    })
    app.mount(container)
    // 多项目路由导航：首次原菜单及功能开关准备完毕再交给Host，避免首页回退成少量入口。
    await navigationPrepared
    if (disposed) throw new Error('Application unmounted while preparing navigation')
    ready = true
    context.onNavigate(router.currentRoute.value.fullPath)
    return {
      navigate: async (path: string) => { await router.replace(path) },
      logout: async () => { await auth.logout(); await router.replace('/login') },
      checkVersion,
      dispatchTopbarAction: actions.dispatch,
      unmount,
    }
  } catch (error) {
    unmount()
    throw error
  }
}

import type { PublicSettings } from '@/types'
import type { ConsoleActionBinding } from './console-actions'
import { sanitizeUrl } from '@/utils/url'

// 顶栏 / 普通按钮 / 强调按钮：保留原认证入口、文档与双语切换，由应用执行。
export function consoleTopbarActions(options: {
  authenticated: boolean
  isAdmin: boolean
  settings: Partial<PublicSettings> | null
  docUrl: string
  locale: string
  switchingLocale: boolean
  path: string
  publicPage: boolean
  navigate: (path: string) => unknown
  openDocument: (url: string) => unknown
  switchLocale: (locale: string) => unknown
}): ConsoleActionBinding[] {
  const { authenticated, isAdmin, settings, path, publicPage, navigate } = options
  const docUrl = sanitizeUrl(settings?.doc_url || options.docUrl || '')
  return [
    { key: 'console.language', label: options.locale === 'zh' ? 'English' : '中文', icon: 'language', loading: () => options.switchingLocale, run: () => options.switchLocale(options.locale === 'zh' ? 'en' : 'zh') },
    ...(docUrl ? [{ key: 'console.docs', label: '文档', icon: 'book' as const, run: () => options.openDocument(docUrl) }] : []),
    ...(authenticated
      ? publicPage ? [{ key: 'console.dashboard', label: '控制台', run: () => navigate(isAdmin ? '/admin/dashboard' : '/dashboard') }] : []
      : [
        ...(path !== '/login' ? [{ key: 'console.login', label: '登录', variant: 'primary' as const, run: () => navigate(path === '/model-plaza' ? '/login?redirect=%2Fmodel-plaza' : '/login') }] : []),
        ...(settings?.backend_mode_enabled !== true && settings?.registration_enabled === true && path !== '/register'
          ? [{ key: 'console.register', label: '注册', run: () => navigate('/register') }] : []),
      ]),
  ]
}

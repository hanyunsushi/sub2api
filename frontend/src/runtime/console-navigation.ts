import type { PublicSettings } from '@/types'
import type { ConsoleNavigationItem } from './console-actions'

// 多项目路由导航：只发布业务页面，遵循原站后台模式和模型广场开关。
export function consolePublicNavigation(authenticated: boolean, settings: Partial<PublicSettings> | null): ConsoleNavigationItem[] {
  const backendMode = settings?.backend_mode_enabled === true
  return [
    ...(!backendMode ? [{ key: 'home', label: '首页', path: '/home', public: true }] : []),
    { key: 'key-usage', label: 'Key 用量查询', path: '/key-usage', public: true, sidebar: false },
    ...(!backendMode && settings?.model_plaza_enabled === true && (authenticated || settings?.model_plaza_require_auth !== true)
      ? [{ key: 'model-plaza', label: '模型广场', path: '/model-plaza', sidebar: false, public: settings?.model_plaza_require_auth !== true }] : []),
  ]
}

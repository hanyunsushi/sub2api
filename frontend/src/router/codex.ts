import type { RouteRecordRaw } from 'vue-router'

export const codexRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/codex',
    redirect: '/admin/codex/accounts',
  },
  {
    path: '/admin/codex/accounts',
    name: 'AdminCodexAccounts',
    component: () => import('@/views/codex/CodexAccounts.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'CPA Management',
      titleKey: 'admin.codex.accounts.title',
      descriptionKey: 'admin.codex.accounts.description',
    },
  },
]

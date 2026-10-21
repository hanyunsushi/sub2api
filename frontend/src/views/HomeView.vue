<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="hasHomeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Compact Home Page -->
  <div
    v-else-if="compactHomeEnabled"
    data-testid="compact-home"
    class="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-dark-950 dark:text-white"
  >
    <!-- 顶栏：嵌入模式由宿主管理，独立站保留原导航。 -->
    <header v-if="!embedded" class="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-dark-800">
      <nav class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <img
            :src="siteLogo || '/logo.svg'"
            alt="Logo"
            class="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span class="min-w-0 truncate text-base font-semibold">{{ siteName }}</span>
        </div>
        <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <router-link
            v-if="showModelPlazaEntry"
            to="/model-plaza"
            class="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('nav.modelPlaza')"
          >
            <Icon name="grid" size="md" />
            <span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span>
          </router-link>
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex min-w-0 flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div class="min-w-0 max-w-2xl text-center">
        <img
          :src="siteLogo || '/logo.svg'"
          alt="Logo"
          class="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain"
        />
        <h1 class="[overflow-wrap:anywhere] text-3xl font-bold md:text-4xl">{{ siteName }}</h1>
        <p class="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-base text-gray-600 dark:text-dark-300">{{ siteSubtitle }}</p>
        <router-link
          :to="isAuthenticated ? dashboardPath : '/login'"
          class="mt-8 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          {{ isAuthenticated ? t('home.goToDashboard') : t('home.login') }}
        </router-link>
      </div>
    </main>

    <footer class="min-w-0 border-t border-gray-200 px-4 py-5 text-center text-sm text-gray-500 [overflow-wrap:anywhere] sm:px-6 dark:border-dark-800 dark:text-dark-400">
      &copy; {{ currentYear }} {{ siteName }}
    </footer>
  </div>

  <!-- Default Home Page -->
  <div
    v-else
    class="home-page min-h-screen"
  >
    <!-- Header -->
    <!-- 顶栏：嵌入模式由宿主管理，独立站保留原导航。 -->
    <header v-if="!embedded" class="relative z-20 px-6 py-4">
      <nav class="home-navigation mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <!-- Logo -->
        <div class="flex items-center">
          <div class="h-10 w-10 overflow-hidden rounded-lg">
            <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
          </div>
        </div>

        <!-- Nav Actions -->
        <div class="flex max-w-full flex-wrap items-center gap-3">
          <!-- Language Switcher -->
          <LocaleSwitcher />

          <!-- Doc Link -->
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>

          <!-- Model Plaza Link -->
          <router-link
            v-if="showModelPlazaEntry"
            to="/model-plaza"
            class="inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('nav.modelPlaza')"
          >
            <Icon name="grid" size="md" />
            <span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span>
          </router-link>

          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>

          <!-- Login / Dashboard Button -->
          <router-link
            v-if="isAuthenticated"
            :to="dashboardPath"
            class="inline-flex items-center gap-1.5 rounded-full bg-gray-900 py-1 pl-1 pr-2.5 transition-colors hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white"
            >
              {{ userInitial }}
            </span>
            <span class="text-xs font-medium text-white">{{ t('home.dashboard') }}</span>
            <svg
              class="h-3 w-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          </router-link>
          <router-link
            v-else
            to="/login"
            class="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {{ t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <!-- 展示信息模块：默认公开首页按原内容留白排版，页面底面无渐变。 -->
    <main class="home-main">
      <div class="home-content">
        <!-- Hero Section - Left/Right Layout -->
        <div class="home-hero">
          <!-- Left: Text Content -->
          <div class="home-hero-copy">
            <h1
              class="home-title mb-4"
            >
              {{ siteName }}
            </h1>
            <p class="home-subtitle mb-8">
              {{ siteSubtitle }}
            </p>

            <!-- 强调按钮：沿用原登录/控制台目的地与公共按钮连续外环。 -->
            <div>
              <router-link
                :to="isAuthenticated ? dashboardPath : '/login'"
                class="btn btn-primary"
              >
                {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                <Icon name="arrowRight" size="md" :stroke-width="2" />
              </router-link>
            </div>
          </div>

          <!-- 展示信息模块 / 数字展示：代码深色表面例外，等宽字与静止几何。 -->
          <div class="home-terminal-column">
            <div class="terminal-container">
              <div class="terminal-window">
                <!-- Window header -->
                <div class="terminal-header">
                  <Icon name="terminal" size="sm" aria-hidden="true" />
                  <span class="terminal-title">terminal</span>
                </div>
                <!-- Terminal content -->
                <div class="terminal-body">
                  <div class="code-line line-1">
                    <span class="code-prompt">$</span>
                    <span class="code-cmd">curl</span>
                    <span class="code-flag">-X POST</span>
                    <span class="code-url">/v1/messages</span>
                  </div>
                  <div class="code-line line-2">
                    <span class="code-comment"># Routing to upstream...</span>
                  </div>
                  <div class="code-line line-3">
                    <span class="code-success">200 OK</span>
                    <span class="code-response">{ "content": "Hello!" }</span>
                  </div>
                  <div class="code-line line-4">
                    <span class="code-prompt">$</span>
                    <span class="cursor"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 区分-信息牌：能力说明，不用状态或健康色。 -->
        <div class="home-tags">
          <div
            class="badge badge-primary"
          >
            <Icon name="swap" size="sm" aria-hidden="true" />
            <span>{{
              t('home.tags.subscriptionToApi')
            }}</span>
          </div>
          <div
            class="badge badge-primary"
          >
            <Icon name="shield" size="sm" aria-hidden="true" />
            <span>{{
              t('home.tags.stickySession')
            }}</span>
          </div>
          <div
            class="badge badge-primary"
          >
            <Icon name="chart" size="sm" aria-hidden="true" />
            <span>{{
              t('home.tags.realtimeBilling')
            }}</span>
          </div>
        </div>

        <!-- 展示卡片 / 悬浮效果：一级浅灰模块，共用250ms中性阴影，无位移与彩色光晕。 -->
        <div class="home-features">
          <!-- 卡片SVG：三项功能均为中性单色描边SVG，图标不表达业务状态。 -->
          <!-- Feature 1: Unified Gateway -->
          <div
            class="home-feature card card-hover"
          >
            <div
              class="home-feature-icon"
            >
              <Icon name="server" size="lg" aria-hidden="true" />
            </div>
            <h3 class="mb-2 text-lg font-semibold">
              {{ t('home.features.unifiedGateway') }}
            </h3>
            <p class="home-feature-description">
              {{ t('home.features.unifiedGatewayDesc') }}
            </p>
          </div>

          <!-- Feature 2: Account Pool -->
          <div
            class="home-feature card card-hover"
          >
            <div
              class="home-feature-icon"
            >
              <svg
                class="h-6 w-6"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold">
              {{ t('home.features.multiAccount') }}
            </h3>
            <p class="home-feature-description">
              {{ t('home.features.multiAccountDesc') }}
            </p>
          </div>

          <!-- Feature 3: Billing & Quota -->
          <div
            class="home-feature card card-hover"
          >
            <div
              class="home-feature-icon"
            >
              <svg
                class="h-6 w-6"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold">
              {{ t('home.features.balanceQuota') }}
            </h3>
            <p class="home-feature-description">
              {{ t('home.features.balanceQuotaDesc') }}
            </p>
          </div>
        </div>

        <!-- Supported Providers -->
        <div class="mb-8 text-center">
          <h2 class="mb-3 text-2xl font-bold">
            {{ t('home.providers.title') }}
          </h2>
          <p class="home-feature-description">
            {{ t('home.providers.description') }}
          </p>
        </div>

        <!-- 展示信息模块 / 区分-信息牌：官方品牌图像保持原图，能力标签不作为健康状态；卡片无装饰边框。 -->
        <div class="home-providers">
          <div v-for="provider in providers" :key="provider.id" class="home-provider card">
            <img :src="provider.logo" alt="" width="32" height="32" class="home-provider-logo" />
            <span class="home-provider-name">{{ provider.labelKey ? t(provider.labelKey) : provider.label }}</span>
            <span class="badge badge-primary">{{ t('home.providers.supported') }}</span>
          </div>
          <div class="home-provider card">
            <Icon name="plus" size="lg" class="home-provider-more" aria-hidden="true" />
            <span class="home-provider-name">{{ t('home.providers.more') }}</span>
            <span class="badge badge-gray">{{ t('home.providers.soon') }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="home-footer">
      <div
        class="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 text-center sm:flex-row sm:text-left"
      >
        <p class="text-sm text-gray-500 dark:text-dark-400">
          &copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}
        </p>
        <div class="flex items-center gap-4">
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-dark-400 dark:hover:text-white"
          >
            {{ t('home.docs') }}
          </a>
          <a
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-dark-400 dark:hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { isMicrofrontend } from '@/runtime/environment'
import claudeLogo from '@/assets/provider-logos/claude.png'
import openaiLogo from '@/assets/provider-logos/openai.png'
import geminiLogo from '@/assets/provider-logos/gemini.svg'
import antigravityLogo from '@/assets/provider-logos/antigravity.svg'

// 展示信息模块：本地打包的官方品牌标识，来源与摘要见assets/provider-logos/SOURCES.md。
const providers = [
  { id: 'claude', logo: claudeLogo, labelKey: 'home.providers.claude' },
  { id: 'gpt', logo: openaiLogo, label: 'GPT' },
  { id: 'gemini', logo: geminiLogo, labelKey: 'home.providers.gemini' },
  { id: 'antigravity', logo: antigravityLogo, labelKey: 'home.providers.antigravity' },
]

const embedded = isMicrofrontend()

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelPlazaRequiresAuth = computed(
  () => appStore.cachedPublicSettings?.model_plaza_require_auth === true,
)
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || !modelPlazaRequiresAuth.value),
)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const userInitial = computed(() => {
  const user = authStore.user
  if (!user || !user.email) return ''
  return user.email.charAt(0).toUpperCase()
})

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme
function toggleTheme() {
  if (embedded) return
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  if (embedded) return
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>

<style scoped>
/* 展示信息模块：页面纯色，保留原应用的1152px正文上限与24px侧距。 */
.home-page { display: flex; flex-direction: column; min-width: 0; background: var(--bg); color: var(--text); }
.home-main { flex: 1; min-width: 0; padding: 64px 24px; }
.home-content { container: home-content / inline-size; width: 100%; max-width: 1152px; margin-inline: auto; }
.home-hero { display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 48px; margin-bottom: 48px; }
.home-hero-copy { min-width: 0; text-align: center; overflow-wrap: anywhere; }
.home-subtitle { font-size: 18px; line-height: 1.6; color: var(--text-2); white-space: pre-wrap; }
.home-terminal-column { display: flex; justify-content: center; min-width: 0; }
.home-tags { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; margin-bottom: 48px; }
.home-tags .badge { white-space: normal; }
.home-footer { min-width: 0; padding: 32px 24px; border-top: 1px solid var(--border); overflow-wrap: anywhere; }

/* 展示卡片：实际正文容器决定列数，不用含宿主侧栏的视口宽度强塞三列。 */
.home-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 24px; margin-bottom: 48px; }
.home-feature { min-width: 0; padding: 24px; overflow-wrap: anywhere; }
.home-feature-description { font-size: 14px; line-height: 1.65; color: var(--text-2); }
/* 卡片SVG：42px中性图标框、12px圆角，无缩放/彩色光晕。 */
.home-feature-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; margin-bottom: 16px; border-radius: 12px; background: var(--card-hover); color: var(--text-2); }
.home-feature-icon :deep(svg) { width: 24px; height: 24px; }
/* 展示信息模块 / 区分-信息牌：品牌与能力分离，标识保持原始比例。 */
.home-providers { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px; margin-bottom: 64px; }
.home-provider { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: 100%; padding: 12px 20px; }
.home-provider-logo, .home-provider-more { flex: none; width: 32px; height: 32px; object-fit: contain; }
.home-provider-more { color: var(--text-3); }
.home-provider-name { min-width: 0; overflow-wrap: anywhere; font-size: 14px; font-weight: 500; color: var(--text-2); }

/* 展示信息模块 / 数字展示：深色代码例外#1e1e1e/#eee，18px角与12.5px等宽，不使用透视/光晕。 */
.terminal-container { width: 100%; max-width: 420px; min-width: 0; }
.terminal-window { width: 100%; border: 0; border-radius: 18px; background: #1e1e1e; color: #eee; overflow: hidden; }
.terminal-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #383838; color: #bfbfbf; }
.terminal-title { font: 400 12.5px/20px var(--ff-mono); }
.terminal-body { padding: 12px 14px; font: 400 12.5px/2 var(--ff-mono); overflow-x: auto; }
.code-line { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; opacity: 0; animation: line-appear .5s ease forwards; overflow-wrap: anywhere; }
.line-1 { animation-delay: .3s; }
.line-2 { animation-delay: 1s; }
.line-3 { animation-delay: 1.8s; }
.line-4 { animation-delay: 2.5s; }
.code-comment { color: #bfbfbf; }
/* 区分-状态牌：HTTP响应示例的真实成功含义，使用系统success，不将命令染成状态色。 */
.code-success { padding: 0 8px; border-radius: 6px; background: rgba(52,199,89,.18); color: #34c759; }
/* 组件绘制动画：保留代码逐行展示；减少动态时直接显示完整内容。 */
.cursor { display: inline-block; width: 8px; height: 16px; background: currentColor; animation: blink 1s step-end infinite; }
@keyframes line-appear { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
@container home-content (min-width: 720px) {
  .home-hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; }
  .home-hero-copy { text-align: left; }
  .home-terminal-column { justify-content: end; }
}
@media (max-width: 640px) {
  .home-main { padding-block: 40px; }
  .home-hero { gap: 32px; }
  .home-features { gap: 16px; }
  .home-feature { padding: 20px; }
  .home-feature-icon { width: 38px; height: 38px; }
}
@media (prefers-reduced-motion: reduce) {
  .code-line { opacity: 1; transform: none; animation: none; }
  .cursor { animation: none; }
}
</style>

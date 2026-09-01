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
    <header class="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-dark-800">
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
    ref="revealRoot"
    class="home-ascii-shell relative min-h-screen"
  >
    <div class="home-site-frame">
      <DarkVeil
        class="home-darkveil"
        :hue-shift="219"
        :speed="1.1"
        :noise-intensity="0.08"
        :scanline-intensity="0.12"
        :scanline-frequency="0.5"
        :warp-amount="1.2"
        :resolution-scale="0.72"
      />

      <header
        class="home-masthead"
        data-home-reveal
        data-home-module="nav"
        style="--home-reveal-delay: 40ms"
      >
        <router-link to="/home" class="flex items-center" aria-label="Home">
          <span class="home-logo h-10 w-10 overflow-hidden">
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </span>
          <span class="home-brand-name">{{ siteName }}</span>
        </router-link>

        <div class="home-masthead-meta">
          <span>Routing</span>
          <b>/v1</b>
          <span>Subscriptions</span>
        </div>

        <div class="home-nav-actions">
          <LocaleSwitcher tone="on-deep" />
          <a data-testid="home-link-a"
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="home-nav-icon"
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

          <!-- Login / Dashboard Button -->
          <router-link
            v-if="isAuthenticated"
            :to="dashboardPath"
            class="home-nav-action"
          >
            <span class="home-nav-dot">{{ userInitial }}</span>
            <span>{{ t('home.dashboard') }}</span>
          </router-link>
          <router-link
            v-else
            to="/login"
            class="home-nav-action"
          >
            <i aria-hidden="true"></i>
            <span>{{ t('home.login') }}</span>
          </router-link>
        </div>
      </header>

      <main class="home-main">
        <section class="home-section home-hero" aria-labelledby="home-title">
          <div class="home-hero-grid">
            <div class="home-hero-copy">
              <div
                class="home-section-label"
                data-home-reveal
                data-home-module="hero-label"
                style="--home-reveal-delay: 80ms"
              >
                <span>I</span>
                <span>Opening Index</span>
              </div>

              <h1
                id="home-title"
                class="home-display home-dot"
                data-home-reveal
                data-home-module="hero-title"
                style="--home-reveal-delay: 140ms"
              >
                {{ siteName }}
              </h1>

              <div
                class="home-hero-lead"
                data-home-reveal
                data-home-module="hero-lead"
                style="--home-reveal-delay: 220ms"
              >
                <p class="home-hero-subtitle mb-8 text-lg md:text-xl">
                  {{ siteSubtitle }}
                </p>
                <div
                  class="home-hero-copy-note"
                  data-home-reveal
                  data-home-module="hero-copy"
                  style="--home-reveal-delay: 280ms"
                >
                  <p class="home-body-copy">
                    {{ t('home.features.unifiedGatewayDesc') }}
                  </p>
                  <div
                    class="home-btn-row"
                    data-home-reveal
                    data-home-module="hero-cta"
                    style="--home-reveal-delay: 340ms"
                  >
                    <StarBorder
                      as="span"
                      class-name="home-cta-star"
                      color="rgba(255, 250, 240, 0.95)"
                      speed="5s"
                      :thickness="2"
                    >
                      <router-link
                        :to="isAuthenticated ? dashboardPath : '/login'"
                        class="home-cta inline-flex items-center rounded-lg px-8 py-3 text-base font-semibold transition-colors"
                      >
                        {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                        <Icon name="arrowRight" size="md" class="ml-2" :stroke-width="2" />
                      </router-link>
                    </StarBorder>
                  </div>
                </div>
              </div>

              <div
                class="home-index-card"
                data-home-reveal
                data-home-module="hero-index"
                style="--home-reveal-delay: 420ms"
                aria-label="Home index"
              >
                <div class="home-index-row"><b>01</b><span>{{ t('home.features.unifiedGateway') }}</span><span>/v1</span></div>
                <div class="home-index-row"><b>02</b><span>{{ t('home.features.multiAccount') }}</span><span>Pool</span></div>
                <div class="home-index-row"><b>03</b><span>{{ t('home.features.balanceQuota') }}</span><span>Ledger</span></div>
                <div class="home-index-row"><b>04</b><span>{{ t('home.providers.title') }}</span><span>Matrix</span></div>
              </div>
            </div>

            <aside class="home-hero-aside">
              <div
                class="home-terminal-stage"
                data-home-reveal
                data-home-module="terminal-console"
                style="--home-reveal-delay: 500ms"
              >
                <div class="terminal-container">
                  <div class="terminal-window">
                    <div class="terminal-toolbar">
                      <span class="terminal-controls" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      <span class="terminal-title">
                        <span class="terminal-path">terminal</span>
                      </span>
                    </div>
                    <div class="terminal-screen">
                      <div class="terminal-stream">
                        <div class="terminal-block">
                          <div class="terminal-row">
                            <span class="terminal-prompt">$</span>
                            <span class="terminal-input">curl <span class="terminal-flag">-X POST</span> /v1/messages</span>
                          </div>
                          <span class="terminal-output-block"># Routing to upstream...</span>
                          <span class="terminal-output-block success">200 OK <span class="terminal-response">{ "content": "Hello" }</span></span>
                          <div class="terminal-row">
                            <span class="terminal-prompt">$</span>
                            <span class="terminal-input"><span class="terminal-cursor"></span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="home-rings" aria-label="Gateway metrics">
                <div
                  class="home-ring"
                  data-home-reveal
                  data-home-module="metric-ring"
                  style="--home-reveal-delay: 580ms"
                >
                  <strong>/v1</strong>
                  <span>OpenAI format</span>
                </div>
                <div
                  class="home-ring"
                  data-home-reveal
                  data-home-module="metric-ring"
                  style="--home-reveal-delay: 640ms"
                >
                  <strong>AI</strong>
                  <span>Provider pool</span>
                </div>
                <div
                  class="home-ring"
                  data-home-reveal
                  data-home-module="metric-ring"
                  style="--home-reveal-delay: 700ms"
                >
                  <strong>$</strong>
                  <span>Usage ledger</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section class="home-section home-feature-section" aria-labelledby="home-features-title">
          <div class="home-section-layout">
            <div
              class="home-section-copy home-feature-copy"
              data-home-reveal
              data-home-module="feature-copy"
            >
              <div class="home-section-label" data-home-module="feature-section-label">
                <span>II</span>
                <span>Capabilities</span>
              </div>

              <div class="home-section-intro">
                <h2 id="home-features-title" class="home-section-title">
                  {{ t('home.solutions.title') }}
                </h2>
                <p class="home-section-copy-text">
                  {{ t('home.solutions.subtitle') }}
                </p>
              </div>

              <div class="home-capability-kicker" aria-label="Feature tags">
                <div class="home-capability-kicker-item">
                  <Icon name="swap" size="sm" />
                  <b>01</b>
                  <span>{{ t('home.tags.subscriptionToApi') }}</span>
                </div>
                <div class="home-capability-kicker-item">
                  <Icon name="shield" size="sm" />
                  <b>02</b>
                  <span>{{ t('home.tags.stickySession') }}</span>
                </div>
                <div class="home-capability-kicker-item">
                  <Icon name="chart" size="sm" />
                  <b>03</b>
                  <span>{{ t('home.tags.realtimeBilling') }}</span>
                </div>
              </div>
            </div>

            <div class="home-capability-grid home-linked-card-grid">
              <article
                class="home-cap-card home-cap-card-featured"
                data-home-reveal
                data-home-module="cap-card"
                style="--home-reveal-delay: 160ms"
              >
                <div class="home-cap-card__visual">
                  <span class="home-card-index">01</span>
                  <img
                    class="home-cap-card__image"
                    src="/home-illustrations/036c01a9e427ea0f4d1e6c7221e4f6dce2259bf7-1000x1000.svg"
                    alt="手托统一入口的有机线稿插图"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="home-cap-card__body">
                  <h3>{{ t('home.features.unifiedGateway') }}</h3>
                  <p>{{ t('home.features.unifiedGatewayDesc') }}</p>
                </div>
              </article>

              <article
                class="home-cap-card home-cap-card-dust"
                data-home-reveal
                data-home-module="cap-card"
                style="--home-reveal-delay: 240ms"
              >
                <div class="home-cap-card__visual">
                  <span class="home-card-index">02</span>
                  <img
                    class="home-cap-card__image"
                    src="/home-illustrations/0df729ce74e4c9dd62c3342c9549ce6c7cef1202-1000x1000.svg"
                    alt="双手协同调度的有机线稿插图"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="home-cap-card__body">
                  <h3>{{ t('home.features.multiAccount') }}</h3>
                  <p>{{ t('home.features.multiAccountDesc') }}</p>
                </div>
              </article>

              <article
                class="home-cap-card home-cap-card-ink"
                data-home-reveal
                data-home-module="cap-card"
                style="--home-reveal-delay: 320ms"
              >
                <div class="home-cap-card__visual">
                  <span class="home-card-index">03</span>
                  <img
                    class="home-cap-card__image"
                    src="/home-illustrations/1576ae23eaf481f33bd36ab468171cc69d12361a-1000x1000.svg"
                    alt="多方协同配额的有机线稿插图"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="home-cap-card__body">
                  <h3>{{ t('home.features.balanceQuota') }}</h3>
                  <p>{{ t('home.features.balanceQuotaDesc') }}</p>
                </div>
              </article>

              <article
                class="home-cap-card home-cap-card-paper"
                data-home-reveal
                data-home-module="cap-card"
                style="--home-reveal-delay: 400ms"
              >
                <div class="home-cap-card__visual">
                  <span class="home-card-index">04</span>
                  <img
                    class="home-cap-card__image"
                    src="/home-illustrations/1c3e87fd90491089b2971dc34f9f75bb8a80f713-1000x1000.svg"
                    alt="放大镜检索模型的有机线稿插图"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="home-cap-card__body">
                  <h3>{{ t('home.providers.title') }}</h3>
                  <p>{{ t('home.providers.description') }}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="home-section home-provider-section" aria-labelledby="home-providers-title">
          <div class="home-section-layout">
            <div
              class="home-section-copy home-provider-copy"
              data-home-reveal
              data-home-module="provider-copy"
            >
              <div class="home-section-label" data-home-module="provider-section-label">
                <span>III</span>
                <span>Provider Matrix</span>
              </div>

              <div class="home-section-intro home-provider-intro">
                <h2 id="home-providers-title" class="home-section-title">
                  {{ t('home.providers.title') }}
                </h2>
                <p class="home-section-copy-text">
                  {{ t('home.providers.description') }}
                </p>
              </div>
            </div>

            <div class="home-provider-specimen-grid home-linked-card-grid">
              <article
                class="home-provider-specimen home-provider-specimen-featured home-provider-specimen-claude"
                data-home-reveal
                data-home-module="provider-specimen"
                style="--home-reveal-delay: 160ms"
              >
                <div class="home-provider-swatch" data-id="Provider 01" data-hex="/v1">
                  <span class="home-provider-mark home-provider-logo-mark">
                    <ProviderBrandIcon provider="anthropic" model="claude" prefer-model-icon />
                  </span>
                </div>
                <div class="home-provider-meta">
                  <span class="home-provider-index">01</span>
                  <h3>{{ t('home.providers.claude') }}</h3>
                  <p>{{ t('home.providers.description') }}</p>
                  <b class="home-provider-status">{{ t('home.providers.supported') }}</b>
                </div>
              </article>
              <article
                class="home-provider-specimen"
                data-home-reveal
                data-home-module="provider-specimen"
                style="--home-reveal-delay: 220ms"
              >
                <div class="home-provider-swatch" data-id="Provider 02" data-hex="GPT">
                  <span class="home-provider-mark home-provider-logo-mark">
                    <ProviderBrandIcon provider="openai" model="gpt" />
                  </span>
                </div>
                <div class="home-provider-meta">
                  <span class="home-provider-index">02</span>
                  <h3>GPT</h3>
                  <p>{{ t('home.features.unifiedGatewayDesc') }}</p>
                  <b class="home-provider-status">{{ t('home.providers.supported') }}</b>
                </div>
              </article>
              <article
                class="home-provider-specimen home-provider-specimen-ink"
                data-home-reveal
                data-home-module="provider-specimen"
                style="--home-reveal-delay: 280ms"
              >
                <div class="home-provider-swatch" data-id="Provider 03" data-hex="Gemini">
                  <span class="home-provider-mark home-provider-logo-mark">
                    <ProviderBrandIcon provider="gemini" model="gemini" />
                  </span>
                </div>
                <div class="home-provider-meta">
                  <span class="home-provider-index">03</span>
                  <h3>{{ t('home.providers.gemini') }}</h3>
                  <p>{{ t('home.features.multiAccountDesc') }}</p>
                  <b class="home-provider-status">{{ t('home.providers.supported') }}</b>
                </div>
              </article>
              <article
                class="home-provider-specimen home-provider-specimen-dust"
                data-home-reveal
                data-home-module="provider-specimen"
                style="--home-reveal-delay: 340ms"
              >
                <div class="home-provider-swatch" data-id="Provider 04" data-hex="AG">
                  <span class="home-provider-mark home-provider-logo-mark">
                    <ProviderBrandIcon provider="antigravity" model="antigravity" />
                  </span>
                </div>
                <div class="home-provider-meta">
                  <span class="home-provider-index">04</span>
                  <h3>{{ t('home.providers.antigravity') }}</h3>
                  <p>{{ t('home.features.balanceQuotaDesc') }}</p>
                  <b class="home-provider-status">{{ t('home.providers.supported') }}</b>
                </div>
              </article>
              <article
                class="home-provider-specimen home-provider-specimen-muted"
                data-home-reveal
                data-home-module="provider-specimen"
                style="--home-reveal-delay: 400ms"
              >
                <div class="home-provider-swatch" data-id="Provider 05" data-hex="+">
                  <span class="home-provider-mark home-provider-logo-mark">
                    <ProviderBrandIcon provider="codex" model="codex" />
                  </span>
                </div>
                <div class="home-provider-meta">
                  <span class="home-provider-index">05</span>
                  <h3>{{ t('home.providers.more') }}</h3>
                  <p>{{ t('home.providers.description') }}</p>
                  <b class="home-provider-status">{{ t('home.providers.soon') }}</b>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer class="home-footer">
        <p class="home-footer-text">
          &copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}
        </p>
        <div class="home-footer-links">
          <a data-testid="home-link-a-2"
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="home-footer-link"
          >
            {{ t('home.docs') }}
          </a>
          <a data-testid="home-link-a-3"
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="home-footer-link"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import StarBorder from '@/components/home/StarBorder.vue'
import DarkVeil from '@/components/home/DarkVeil.vue'
import { initAppearanceTheme } from '@/composables/useAppearanceTheme'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Kreepai')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', {
  allowRelative: true,
  allowDataUrl: true,
}))
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

const revealRoot = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null
let pendingRevealItems: HTMLElement[] = []
let revealFrame = 0
let revealScrollElement: HTMLElement | null = null
let snapWheelLocked = false
let snapWheelUnlockTimer = 0

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

// Initialize theme
function initTheme() {
  initAppearanceTheme()
}

function showRevealItems(items: HTMLElement[]) {
  items.forEach((item) => item.classList.add('is-visible'))
}

function markHomeRevealVisible(item: HTMLElement) {
  item.classList.add('is-visible')
  revealObserver?.unobserve(item)
  pendingRevealItems = pendingRevealItems.filter((pendingItem) => pendingItem !== item)
}

function revealPassedHomeItems() {
  if (!pendingRevealItems.length) return
  pendingRevealItems.forEach((item) => {
    if (item.getBoundingClientRect().top <= window.innerHeight * 1.18) {
      markHomeRevealVisible(item)
    }
  })
}

function scheduleRevealPassedHomeItems() {
  if (revealFrame) return
  revealFrame = window.requestAnimationFrame(() => {
    revealFrame = 0
    revealPassedHomeItems()
  })
}

function getHomeSnapTargets() {
  const root = revealRoot.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>('.home-section, .home-footer'))
}

function shouldUseStrictHomeSnap() {
  return window.matchMedia('(min-width: 821px) and (min-height: 680px)').matches
}

function homeMaxScrollTop() {
  const root = revealRoot.value
  if (!root) return 0
  return Math.max(0, root.scrollHeight - root.clientHeight)
}

function homeSnapTopForTarget(target: HTMLElement) {
  if (target.classList.contains('home-footer')) {
    return homeMaxScrollTop()
  }
  return Math.min(target.offsetTop, homeMaxScrollTop())
}

function currentHomeSnapIndex(targets: HTMLElement[]) {
  const root = revealRoot.value
  if (!root || !targets.length) return 0
  const scrollTop = root.scrollTop
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  targets.forEach((target, index) => {
    const distance = Math.abs(homeSnapTopForTarget(target) - scrollTop)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })
  return bestIndex
}

function handleHomeWheel(event: WheelEvent) {
  const root = revealRoot.value
  if (!root || event.ctrlKey || event.metaKey || event.altKey || event.deltaY === 0) return
  if (!shouldUseStrictHomeSnap()) return

  const targets = getHomeSnapTargets()
  if (targets.length < 2) return

  event.preventDefault()
  if (snapWheelLocked) return

  const currentIndex = currentHomeSnapIndex(targets)
  const nextIndex = Math.max(0, Math.min(targets.length - 1, currentIndex + (event.deltaY > 0 ? 1 : -1)))
  if (nextIndex === currentIndex) return

  snapWheelLocked = true
  root.scrollTo({ top: homeSnapTopForTarget(targets[nextIndex]), behavior: 'smooth' })
  if (snapWheelUnlockTimer) window.clearTimeout(snapWheelUnlockTimer)
  snapWheelUnlockTimer = window.setTimeout(() => {
    snapWheelLocked = false
    snapWheelUnlockTimer = 0
  }, 520)
}

function initHomeReveal() {
  const items = Array.from(revealRoot.value?.querySelectorAll<HTMLElement>('[data-home-reveal]') ?? [])
  if (!items.length) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    showRevealItems(items)
    return
  }

  pendingRevealItems = items
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      markHomeRevealVisible(entry.target as HTMLElement)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px 18% 0px' })

  revealObserver = observer
  items.forEach((item) => observer.observe(item))
  revealScrollElement = revealRoot.value
  revealScrollElement?.addEventListener('scroll', scheduleRevealPassedHomeItems, { passive: true })
  revealScrollElement?.addEventListener('wheel', handleHomeWheel, { passive: false })
  window.addEventListener('resize', scheduleRevealPassedHomeItems)
  scheduleRevealPassedHomeItems()
}

onMounted(async () => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }

  await nextTick()
  initHomeReveal()
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
  pendingRevealItems = []
  revealScrollElement?.removeEventListener('scroll', scheduleRevealPassedHomeItems)
  revealScrollElement?.removeEventListener('wheel', handleHomeWheel)
  revealScrollElement = null
  window.removeEventListener('resize', scheduleRevealPassedHomeItems)
  if (snapWheelUnlockTimer) {
    window.clearTimeout(snapWheelUnlockTimer)
    snapWheelUnlockTimer = 0
  }
  if (revealFrame) {
    window.cancelAnimationFrame(revealFrame)
    revealFrame = 0
  }
})
</script>

<style scoped>
.home-ascii-shell {
  --home-max: 1540px;
  --home-gutter: clamp(18px, 3vw, 48px);
  --home-surface-paper: var(--atelier-paper);
  --home-surface-paper-2: var(--atelier-paper-2);
  --home-surface-solid: var(--atelier-canvas);
  --home-surface-cool: var(--atelier-surface-cool);
  --home-surface-dust: var(--atelier-surface-dust);
  --home-surface-blue: var(--atelier-surface-blue);
  --home-surface-butter: color-mix(in srgb, var(--atelier-butter) 18%, var(--atelier-paper));
  --home-surface-ink: var(--atelier-ink);
  --home-muted-solid: #5f6874;
  --home-muted-on-dark: rgba(255, 250, 240, 0.72);
  position: relative;
  isolation: isolate;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-snap-type: y mandatory;
  scroll-padding-top: 0;
  color: var(--atelier-ink);
  font-family: var(--atelier-font-sans);
  background: #07101e;
}

.home-site-frame {
  position: relative;
  z-index: 1;
  isolation: isolate;
  min-height: 100vh;
  background: transparent;
}

.home-ascii-shell [data-home-reveal] {
  opacity: 0;
  transform: translate3d(0, 26px, 0);
  transition:
    opacity 0.7s var(--atelier-ease),
    transform 0.7s var(--atelier-ease);
  transition-delay: var(--home-reveal-delay, 0ms);
  will-change: opacity, transform;
}

.home-ascii-shell [data-home-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.home-masthead {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  padding: 22px var(--home-gutter);
  border-bottom: 1px solid rgba(255, 250, 240, 0.12);
  background: rgba(7, 16, 30, 0.14);
  backdrop-filter: blur(12px) saturate(1.08);
  box-shadow: inset 0 -1px 0 rgba(255, 250, 240, 0.05);
}

.home-masthead > a {
  min-width: 0;
}

.home-logo {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  margin-right: 12px;
  border: 1px solid rgba(255, 250, 240, 0.28);
  border-radius: 50%;
  background: var(--anthropic-page, #faf9f5);
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.16);
}

.home-brand-name {
  min-width: 0;
  color: rgba(255, 250, 240, 0.92);
  font-family: var(--atelier-font-serif);
  font-size: 28px;
  letter-spacing: 0;
  white-space: nowrap;
}

.home-masthead-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 250, 240, 0.62);
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-masthead-meta b {
  color: rgba(255, 250, 240, 0.9);
  font-weight: 600;
}

.home-nav-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 0;
  gap: 12px;
  flex-wrap: nowrap;
}

.home-nav-icon,
.home-nav-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border: 1px solid rgba(255, 250, 240, 0.22);
  color: rgba(255, 250, 240, 0.9);
  background: rgba(7, 16, 30, 0.26);
  backdrop-filter: blur(14px) saturate(1.08);
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.12);
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    color 260ms var(--atelier-ease),
    box-shadow 260ms var(--atelier-ease);
}

.home-nav-icon {
  width: 38px;
  border-radius: 50%;
}

.home-nav-action {
  gap: 10px;
  border-radius: 999px;
  padding: 0 16px;
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-nav-action i,
.home-nav-dot {
  display: inline-grid;
  place-items: center;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--atelier-blue);
  color: transparent;
  font-size: 0;
}

.home-nav-dot {
  width: 18px;
  height: 18px;
  color: var(--atelier-white);
  font-size: 10px;
}

.home-nav-icon:hover,
.home-nav-action:hover {
  transform: translate3d(0, -2px, 0);
  color: var(--atelier-white);
  background: rgba(79, 106, 140, 0.46);
  box-shadow: 0 18px 36px -28px rgba(0, 0, 0, 0.62);
}

.home-main {
  position: relative;
}

.home-section {
  position: relative;
  max-width: var(--home-max);
  margin: 0 auto;
  height: 100vh;
  min-height: 100vh;
  padding: clamp(64px, 8vw, 128px) var(--home-gutter);
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.home-section + .home-section {
  border-top: 0;
}

.home-feature-section {
  max-width: none;
  width: 100%;
  box-sizing: border-box;
  align-content: center;
  gap: 24px;
  padding-top: clamp(48px, 6vh, 64px);
  padding-bottom: clamp(48px, 6vh, 64px);
  background: var(--anthropic-section, #f0eee6);
  color: var(--atelier-ink);
}

.home-provider-section {
  max-width: none;
  width: 100%;
  box-sizing: border-box;
  align-content: center;
  background: var(--anthropic-section, #f0eee6);
  color: var(--atelier-ink);
}

.home-hero {
  overflow: hidden;
  isolation: isolate;
  background: transparent;
  display: grid;
  align-items: center;
  min-height: 100vh;
  padding-top: clamp(104px, 12vh, 140px);
  padding-bottom: clamp(28px, 4vw, 56px);
}

.home-darkveil {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
  filter: hue-rotate(14deg) saturate(1.18) contrast(1.08) brightness(1.05);
}

.home-hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(330px, 0.64fr);
  align-items: center;
  gap: clamp(24px, 4.2vw, 66px);
}

.home-hero-copy {
  display: grid;
  gap: clamp(18px, 2.5vw, 30px);
}

.home-hero-copy-note {
  border-top: 1px solid rgba(255, 250, 240, 0.24);
  padding-top: 18px;
}

.home-section-label {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
  color: var(--atelier-muted);
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-section-label::before,
.home-section-label::after {
  content: "";
  height: 1px;
  background: repeating-linear-gradient(to right, var(--atelier-line-strong), var(--atelier-line-strong) 2px, transparent 2px, transparent 8px);
}

.home-hero .home-section-label {
  color: rgba(255, 250, 240, 0.68);
}

.home-hero .home-section-label::before,
.home-hero .home-section-label::after {
  background: repeating-linear-gradient(to right, rgba(255, 250, 240, 0.36), rgba(255, 250, 240, 0.36) 2px, transparent 2px, transparent 8px);
}

.home-display {
  margin: 0;
  color: rgba(255, 250, 240, 0.94);
  font-size: clamp(70px, 9.4vw, 116px);
  font-weight: 760;
  line-height: 0.86;
  letter-spacing: 0;
  text-wrap: balance;
  text-shadow: 0 18px 58px rgba(0, 0, 0, 0.46);
}

.home-dot::after {
  content: ".";
  margin-left: 0.02em;
  color: var(--atelier-butter);
  font-family: var(--atelier-font-serif);
  font-style: italic;
}

.home-hero-lead {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 430px);
  align-items: start;
  gap: clamp(20px, 3.2vw, 50px);
  max-width: 860px;
  padding-top: 8px;
}

.home-hero-subtitle {
  margin: 0;
  color: rgba(255, 250, 240, 0.9);
  font-size: 28px;
  font-weight: 560;
  line-height: 1.16;
  letter-spacing: 0;
  text-wrap: pretty;
}

.home-body-copy,
.home-section-copy-text,
.home-footer-text,
.home-footer-link {
  color: var(--home-muted-solid);
}

.home-body-copy {
  max-width: 46ch;
  margin: 0;
  color: rgba(255, 250, 240, 0.7);
  font-size: 17px;
  line-height: 1.5;
}

.home-btn-row {
  margin-top: 22px;
}

.home-cta-star {
  vertical-align: top;
}

.home-cta {
  position: relative;
  display: inline-flex;
  z-index: 1;
  border: 1px solid var(--atelier-terracotta-action, #c96442);
  background: var(--atelier-terracotta-action, #c96442);
  color: var(--atelier-paper-2);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
  box-shadow: none;
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    border-color 260ms var(--atelier-ease);
}

.home-cta:hover {
  background: var(--atelier-terracotta-action-hover, #a64f34);
  border-color: var(--atelier-terracotta-action-hover, #a64f34);
  box-shadow: none;
}

.home-index-card {
  display: grid;
  overflow: hidden;
  border: 1px solid rgba(255, 250, 240, 0.14);
  background: rgba(7, 16, 30, 0.13);
  backdrop-filter: blur(12px) saturate(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.08),
    0 18px 50px -44px rgba(0, 0, 0, 0.68);
}

.home-index-row {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: baseline;
  gap: 16px;
  padding: 9px 16px;
  border-bottom: 1px dotted rgba(255, 250, 240, 0.2);
  color: rgba(255, 250, 240, 0.84);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  letter-spacing: 0;
}

.home-index-row b {
  color: var(--atelier-butter);
  font-family: var(--atelier-font-mono);
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
}

.home-index-row span:last-child {
  color: rgba(255, 250, 240, 0.68);
}

.home-hero-aside {
  display: grid;
  gap: 12px;
}

.home-terminal-stage {
  position: relative;
  display: flex;
  justify-content: flex-end;
  min-height: 0;
}

.terminal-container {
  position: relative;
  z-index: 3;
  width: min(94%, 460px);
  transform: none;
}

.terminal-window {
  --terminal-bg: #0b0c0e;
  --terminal-ink: #f2f0e8;
  --terminal-panel: #151515;
  --terminal-chrome: #252523;
  --terminal-border: rgba(250, 249, 245, 0.16);
  --terminal-fg: #faf9f5;
  --terminal-muted: #b0aea5;
  --terminal-prompt: #d97757;
  --terminal-ok: #bcd1ca;
  overflow: hidden;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--terminal-border) 82%, black);
  border-radius: 14px;
  background: var(--terminal-chrome);
  color: var(--terminal-fg);
  box-shadow: 0 24px 64px rgba(20, 20, 19, 0.22);
  transition:
    border-color 300ms var(--atelier-ease),
    box-shadow 300ms var(--atelier-ease);
}

.terminal-window:hover {
  border-color: rgba(250, 249, 245, 0.22);
  box-shadow: 0 28px 72px rgba(20, 20, 19, 0.26);
}

.terminal-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
  gap: 14px;
  padding: 0 12px;
  border-bottom: 1px solid var(--terminal-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0)),
    var(--terminal-chrome);
  color: var(--terminal-muted);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  line-height: 1;
}

.terminal-controls {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 7px;
}

.terminal-controls span {
  width: 10px;
  height: 10px;
  border: 1px solid rgba(20, 20, 19, 0.36);
  border-radius: 999px;
  background: #ff5f57;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

.terminal-controls span:nth-child(2) {
  background: #ffbd2e;
}

.terminal-controls span:nth-child(3) {
  background: #28c840;
}

.terminal-title {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  gap: 8px;
}

.terminal-path {
  min-width: 0;
  overflow: hidden;
  color: var(--terminal-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-screen {
  position: relative;
  min-height: 218px;
  overflow: auto;
  padding: 0;
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  font-family: var(--atelier-font-mono);
  font-size: 13px;
  line-height: 1.58;
  tab-size: 2;
}

.terminal-stream {
  max-width: 100%;
  padding: 18px 18px 20px;
}

.terminal-block {
  padding: 10px 0 12px;
  border-bottom: 1px solid rgba(250, 249, 245, 0.07);
}

.terminal-block:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.terminal-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.terminal-prompt {
  color: var(--terminal-prompt);
  font-weight: 500;
  user-select: none;
}

.terminal-input {
  color: var(--terminal-fg);
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-flag {
  color: var(--terminal-prompt);
}

.terminal-output-block {
  display: block;
  margin: 5px 0 0 20px;
  color: var(--terminal-muted);
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-output-block.success {
  color: var(--terminal-ok);
}

.terminal-response {
  color: var(--terminal-fg);
}

.terminal-cursor {
  display: inline-block;
  width: 0.58em;
  height: 1.1em;
  margin-top: 0.16em;
  vertical-align: top;
  background: var(--terminal-prompt);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.home-rings {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 112px));
  justify-content: end;
  margin-top: 12px;
  gap: 12px;
}

.home-ring {
  display: grid;
  place-items: center;
  min-height: 0;
  aspect-ratio: 1;
  padding: 15px;
  border: 1px solid rgba(255, 250, 240, 0.16);
  border-radius: 50%;
  color: rgba(255, 250, 240, 0.9);
  text-align: center;
  background: rgba(7, 16, 30, 0.12);
  backdrop-filter: blur(12px) saturate(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.08),
    0 16px 42px -40px rgba(0, 0, 0, 0.66);
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    color 260ms var(--atelier-ease);
}

.home-ring:hover {
  transform: translate3d(0, -3px, 0);
  color: var(--atelier-white);
  background: rgba(79, 106, 140, 0.28);
}

.home-ring strong {
  display: block;
  color: inherit;
  font-family: var(--atelier-font-serif);
  font-size: 34px;
  font-style: italic;
  font-weight: 400;
  line-height: 0.9;
}

.home-ring span {
  display: block;
  margin-top: 7px;
  color: rgba(255, 250, 240, 0.72);
  font-family: var(--atelier-font-mono);
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-ring:hover span {
  color: var(--atelier-white);
}

.home-feature-section {
  display: grid;
  align-content: center;
}

.home-section-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.8fr);
  align-items: center;
  gap: clamp(36px, 5vw, 80px);
  width: 100%;
}

.home-section-copy {
  display: grid;
  align-content: center;
  gap: clamp(22px, 3vh, 34px);
  min-width: 0;
  max-width: 360px;
}

.home-section-intro {
  display: grid;
  gap: 18px;
}

.home-capability-kicker {
  display: grid;
  grid-template-columns: 1fr;
  border-top: 1px solid var(--atelier-line-strong);
  border-left: 1px solid var(--atelier-line-strong);
}

.home-ascii-shell .home-capability-kicker-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 14px 16px;
  border-right: 1px solid var(--atelier-line-strong);
  border-bottom: 1px solid var(--atelier-line-strong);
  background: var(--anthropic-section, #f0eee6);
  color: var(--atelier-ink);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  letter-spacing: 0;
}

.home-ascii-shell .home-capability-kicker-item:nth-child(2) {
  background: var(--anthropic-section, #f0eee6);
}

.home-ascii-shell .home-capability-kicker-item:nth-child(3) {
  background: var(--anthropic-section, #f0eee6);
  color: var(--atelier-ink);
}

.home-capability-kicker-item b {
  color: currentColor;
  font-weight: 500;
}

.home-capability-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-self: center;
  gap: 16px;
}

.home-ascii-shell .home-cap-card {
  --home-card-accent: var(--atelier-butter);
  display: grid;
  grid-template-rows: minmax(0, 1.08fr) minmax(0, 0.92fr);
  min-height: 0;
  aspect-ratio: 3 / 5;
  overflow: hidden;
  border: 1px solid var(--anthropic-border-subtle, rgba(20, 19, 19, 0.08));
  border-radius: 16px;
  background: var(--anthropic-page, #faf9f5);
  color: var(--atelier-ink);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  transition:
    background-color 350ms ease,
    color 200ms ease,
    border-color 250ms ease,
    box-shadow 250ms ease;
}

.home-cap-card__visual {
  position: relative;
  display: grid;
  aspect-ratio: auto;
  min-height: 0;
  align-items: end;
  justify-items: end;
  overflow: hidden;
  padding: 1.25rem 0 0 1.25rem;
  border-bottom: 1px solid var(--anthropic-border-subtle, rgba(20, 19, 19, 0.08));
  background: var(--anthropic-raised, #e8e6dc);
  transition: background-color 350ms ease;
}

.home-cap-card__visual .home-card-index {
  position: absolute;
  z-index: 1;
  top: 20px;
  left: 20px;
}

.home-cap-card__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 10px 0 0 0;
  object-fit: cover;
  transform: scale(1);
  transform-origin: right bottom;
  transition: transform 450ms var(--atelier-ease);
}

.home-cap-card__body {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: clamp(14px, 1.35vw, 20px);
  background: var(--anthropic-page, #faf9f5);
  transition: background-color 350ms ease;
}

.home-ascii-shell .home-capability-grid:has(.home-cap-card:hover) .home-cap-card:not(:hover) .home-cap-card__body,
.home-ascii-shell .home-capability-grid:has(.home-cap-card:focus-within) .home-cap-card:not(:focus-within) .home-cap-card__body {
  background: var(--anthropic-raised, #e8e6dc);
}

.home-ascii-shell .home-cap-card:hover,
.home-ascii-shell .home-cap-card:focus-within {
  border-color: var(--anthropic-border-hover, rgba(20, 19, 19, 0.16));
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
}

.home-ascii-shell .home-cap-card:hover .home-cap-card__visual,
.home-ascii-shell .home-cap-card:focus-within .home-cap-card__visual {
  background: var(--anthropic-page, #faf9f5);
}

.home-ascii-shell .home-cap-card:hover .home-cap-card__image,
.home-ascii-shell .home-cap-card:focus-within .home-cap-card__image {
  transform: scale(1.045);
}

.home-ascii-shell .home-cap-card-featured {
  --home-card-accent: var(--atelier-butter);
}

.home-ascii-shell .home-cap-card-dust {
  --home-card-accent: var(--atelier-dust);
}

.home-ascii-shell .home-cap-card-ink {
  --home-card-accent: var(--atelier-butter-dark);
}

.home-ascii-shell .home-cap-card-paper {
  --home-card-accent: var(--atelier-dust);
}

.home-card-index {
  color: currentColor;
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
}

.home-ascii-shell .home-cap-card svg {
  color: var(--home-card-accent);
}

.home-ascii-shell .home-cap-card h2,
.home-ascii-shell .home-cap-card h3 {
  margin: 0;
  color: currentColor;
  font-family: var(--atelier-font-serif);
  font-size: clamp(24px, 2vw, 30px);
  font-style: italic;
  font-weight: 400;
  letter-spacing: 0;
}

.home-ascii-shell .home-cap-card p {
  max-width: 46ch;
  margin: 0;
  color: currentColor;
  font-size: 15px;
  line-height: 1.55;
}

.home-provider-section {
  display: grid;
  align-content: center;
  padding-top: clamp(48px, 6vh, 64px);
  padding-bottom: clamp(48px, 6vh, 64px);
  overflow: hidden;
}

.home-provider-intro {
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 18px;
}

.home-section-title {
  margin: 0;
  color: var(--atelier-ink);
  font-size: clamp(44px, 5.8vw, 76px);
  font-weight: 760;
  line-height: 0.88;
  letter-spacing: 0;
}

.home-section-title::after {
  content: ".";
  color: var(--atelier-butter);
  font-family: var(--atelier-font-serif);
  font-style: italic;
}

.home-section-copy-text {
  margin: 0;
  max-width: 48ch;
  color: var(--atelier-muted);
  font-size: 15px;
  line-height: 1.5;
}

.home-provider-specimen-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-self: center;
  gap: 16px;
}

.home-ascii-shell .home-provider-specimen {
  --home-chip-accent: var(--atelier-butter);
  --home-chip-text: var(--atelier-ink);
  display: grid;
  grid-column: auto;
  grid-template-rows: minmax(0, 0.95fr) minmax(0, 1.05fr);
  min-height: 0;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 5;
  overflow: hidden;
  border: 1px solid var(--anthropic-border-subtle, rgba(20, 19, 19, 0.08));
  border-radius: 16px;
  background: var(--anthropic-page, #faf9f5);
  color: var(--home-chip-text);
  backdrop-filter: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  transition:
    background-color 350ms ease,
    color 200ms ease,
    border-color 250ms ease,
    box-shadow 250ms ease;
}

.home-ascii-shell .home-provider-specimen-grid:has(.home-provider-specimen:hover) .home-provider-specimen:not(:hover) .home-provider-meta,
.home-ascii-shell .home-provider-specimen-grid:has(.home-provider-specimen:focus-within) .home-provider-specimen:not(:focus-within) .home-provider-meta {
  background: var(--anthropic-raised, #e8e6dc);
}

.home-ascii-shell .home-provider-specimen:hover,
.home-ascii-shell .home-provider-specimen:focus-within {
  border-color: var(--anthropic-border-hover, rgba(20, 19, 19, 0.16));
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
}

.home-ascii-shell .home-provider-specimen:hover .home-provider-swatch,
.home-ascii-shell .home-provider-specimen:focus-within .home-provider-swatch {
  background: var(--anthropic-page, #faf9f5);
}

.home-ascii-shell .home-provider-specimen:hover .home-provider-mark,
.home-ascii-shell .home-provider-specimen:focus-within .home-provider-mark {
  transform: scale(1.045);
}

.home-ascii-shell .home-provider-specimen-featured {
  --home-chip-accent: var(--atelier-butter);
  --home-chip-surface: var(--atelier-paper);
  --home-chip-text: var(--atelier-ink);
}

.home-ascii-shell .home-provider-specimen-ink {
  --home-chip-accent: var(--atelier-butter);
  --home-chip-surface: var(--atelier-paper);
  --home-chip-text: var(--atelier-ink);
}

.home-ascii-shell .home-provider-specimen-dust {
  --home-chip-accent: var(--atelier-butter);
  --home-chip-surface: var(--atelier-paper);
}

.home-ascii-shell .home-provider-specimen-muted {
  --home-chip-accent: var(--atelier-butter);
  --home-chip-surface: var(--atelier-paper);
}

.home-provider-swatch {
  position: relative;
  display: grid;
  aspect-ratio: auto;
  align-items: end;
  justify-items: end;
  min-height: 0;
  overflow: hidden;
  padding: 1.25rem 0 0 1.25rem;
  border-bottom: 1px solid var(--anthropic-border-subtle, rgba(20, 19, 19, 0.08));
  background: var(--anthropic-raised, #e8e6dc);
  transition: background-color 350ms ease;
}

.home-provider-specimen-featured .home-provider-swatch {
  background: var(--anthropic-raised, #e8e6dc);
}

.home-provider-mark {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin: 0 16px 14px 0;
  border: 0;
  border-radius: 0;
  color: var(--atelier-ink);
  background: transparent;
  font-family: var(--atelier-font-serif);
  font-size: 18px;
  font-style: italic;
  transform: scale(1);
  transform-origin: right bottom;
  transition: transform 450ms var(--atelier-ease);
}

.home-provider-logo-mark {
  color: currentColor;
}

.home-provider-logo-mark :deep(.provider-brand-icon) {
  width: 100%;
  height: 100%;
  border-color: transparent !important;
  background: transparent !important;
}

.home-provider-logo-mark :deep(.provider-brand-image-system),
.home-provider-logo-mark :deep(.provider-brand-image-custom) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.home-provider-logo-mark :deep(.provider-brand-icon svg),
.home-provider-logo-mark :deep(.provider-brand-icon .model-icon) {
  width: 100%;
  height: 100%;
}

.home-provider-specimen-claude .home-provider-logo-mark :deep(.provider-brand-icon) {
  color: #c05621 !important;
}

.home-provider-meta {
  display: grid;
  align-content: start;
  gap: 7px;
  padding: clamp(12px, 1vw, 16px);
  background: var(--anthropic-page, #faf9f5);
  transition: background-color 350ms ease;
}

.home-provider-section .home-section-label {
  color: var(--atelier-muted);
}

.home-provider-section .home-section-label::before,
.home-provider-section .home-section-label::after {
  background: repeating-linear-gradient(to right, var(--atelier-line-strong), var(--atelier-line-strong) 2px, transparent 2px, transparent 8px);
}

.home-provider-index {
  color: currentColor;
  opacity: 0.7;
  font-family: var(--atelier-font-mono);
  font-size: 11px;
}

.home-provider-meta h3 {
  margin: 0;
  color: currentColor;
  font-family: var(--atelier-font-serif);
  font-size: clamp(21px, 1.8vw, 27px);
  font-style: italic;
  font-weight: 400;
  line-height: 1;
}

.home-provider-meta p {
  margin: 0;
  color: color-mix(in srgb, currentColor 78%, transparent);
  font-size: 13px;
  line-height: 1.35;
}

.home-provider-status {
  align-self: end;
  color: currentColor;
  font-family: var(--atelier-font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;
  width: min(1040px, calc(100% - var(--home-gutter) * 2));
  max-width: calc(100% - var(--home-gutter) * 2);
  margin: 0 auto;
  padding: 20px clamp(18px, 3vw, 34px);
  border-top: 0;
  background: #050505;
  color: rgba(255, 250, 240, 0.96);
  -webkit-text-fill-color: rgba(255, 250, 240, 0.96);
  text-shadow: none;
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  scroll-snap-align: end;
  scroll-snap-stop: always;
}

.home-footer .home-footer-text,
.home-footer .home-footer-link {
  color: rgba(255, 250, 240, 0.96);
  -webkit-text-fill-color: rgba(255, 250, 240, 0.96);
  opacity: 1;
}

.home-footer-link:hover {
  color: var(--atelier-blue);
}

.home-footer-text {
  margin: 0;
}

.home-footer-links {
  justify-content: center;
  align-items: center;
  display: flex;
  gap: 18px;
}

@media (prefers-reduced-motion: reduce) {
  .home-ascii-shell [data-home-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
    transition-delay: 0ms;
    will-change: auto;
  }

  .home-cta,
  :deep(.home-cta-star .border-gradient-bottom),
  :deep(.home-cta-star .border-gradient-top),
  .home-capability-kicker-item,
  .home-cap-card,
  .home-provider-specimen,
  .home-ring,
  .terminal-window {
    transition: none;
  }
}

@media (max-width: 1080px) {
  .home-masthead {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 16px var(--home-gutter);
  }

  .home-masthead-meta {
    display: none;
  }

  .home-nav-actions {
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }

  .home-hero-grid,
  .home-hero-lead {
    grid-template-columns: 1fr;
  }

  .home-section-layout {
    grid-template-columns: minmax(200px, 0.62fr) minmax(0, 1.38fr);
    gap: clamp(28px, 4vw, 48px);
  }

  .home-capability-grid,
  .home-capability-kicker,
  .home-provider-specimen-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-ascii-shell .home-cap-card-featured,
  .home-ascii-shell .home-provider-specimen,
  .home-ascii-shell .home-provider-specimen-featured {
    grid-column: span 1;
  }

  .home-brand-name {
    font-size: 25px;
  }

  .home-display {
    font-size: 104px;
  }

  .home-hero-subtitle {
    font-size: 25px;
  }

  .home-ring strong {
    font-size: 34px;
  }

  .home-ascii-shell .home-cap-card h2,
  .home-ascii-shell .home-cap-card h3 {
    font-size: 30px;
  }

  .home-section-title {
    font-size: 76px;
  }
}

@media (max-width: 820px) {
  .home-ascii-shell {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    scroll-snap-type: none;
  }

  .home-site-frame {
    min-height: 100vh;
  }

  .home-main {
    display: flex;
    flex-direction: column;
  }

  .home-display {
    font-size: clamp(42px, 15vw, 58px);
    line-height: 0.94;
  }

  .home-section {
    height: auto;
    min-height: auto;
    padding: 86px var(--home-gutter) 42px;
    scroll-snap-align: none;
    scroll-snap-stop: normal;
  }

  .home-hero {
    align-items: start;
    min-height: 100svh;
    padding-top: 112px;
  }

  .home-feature-section,
  .home-provider-section {
    min-height: auto;
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
  }

  .home-hero-grid,
  .home-hero-lead,
  .home-provider-intro {
    gap: 20px;
  }

  .home-feature-section,
  .home-provider-section {
    align-content: start;
    overflow: visible;
  }

  .home-section-layout {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .home-section-copy {
    max-width: 100%;
  }

  .home-capability-grid,
  .home-provider-specimen-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-capability-kicker,
  .home-rings {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-capability-grid,
  .home-provider-specimen-grid {
    margin-top: 0;
  }

  .home-ascii-shell .home-cap-card,
  .home-ascii-shell .home-provider-specimen {
    aspect-ratio: auto;
    min-height: clamp(320px, 90vw, 360px);
  }

  .home-ascii-shell .home-cap-card {
    grid-template-rows: minmax(0, 0.78fr) minmax(0, 1.22fr);
  }

  .home-ascii-shell .home-provider-specimen {
    grid-template-rows: minmax(0, 0.7fr) minmax(0, 1.3fr);
  }

  .home-cap-card__body,
  .home-provider-meta {
    padding: 12px;
  }

  .home-index-card {
    display: none;
  }

  .home-terminal-stage {
    min-height: 0;
  }

  .home-terminal-stage,
  .home-hero-aside {
    width: 100%;
  }

  .home-brand-name {
    font-size: 22px;
  }

  .home-hero-subtitle {
    font-size: 21px;
  }

  .home-body-copy,
  .home-section-copy-text {
    font-size: 15px;
  }

  .home-ring strong {
    font-size: 30px;
  }

  .home-ascii-shell .home-cap-card h2,
  .home-ascii-shell .home-cap-card h3 {
    font-size: clamp(18px, 5vw, 22px);
  }

  .home-ascii-shell .home-cap-card p {
    font-size: 12px;
    line-height: 1.45;
  }

  .home-provider-meta h3 {
    font-size: clamp(18px, 5vw, 22px);
  }

  .home-provider-meta p {
    font-size: 12px;
    line-height: 1.35;
  }

  .home-section-title {
    font-size: clamp(36px, 11vw, 52px);
    line-height: 0.96;
  }

  .terminal-container {
    width: 100%;
    transform: none;
  }

  .terminal-window {
    box-shadow:
      inset 0 1px 0 rgba(255, 250, 240, 0.1),
      0 16px 42px -34px rgba(0, 0, 0, 0.72);
  }

  .home-provider-swatch {
    min-height: clamp(76px, 24vw, 92px);
  }

  .home-provider-mark {
    width: 22px;
    height: 22px;
    font-size: 18px;
  }

  .home-footer {
    flex-direction: column;
    justify-content: center;
    width: min(100%, calc(100% - var(--home-gutter) * 2));
    margin-block: 0;
    scroll-snap-align: none;
    text-align: center;
  }
}

@media (min-width: 821px) and (max-height: 679px) {
  .home-ascii-shell {
    scroll-snap-type: none;
  }

  .home-section {
    scroll-snap-align: none;
    scroll-snap-stop: normal;
  }

  .home-hero {
    height: auto;
    min-height: 100vh;
  }
}

@media (max-width: 720px) {
  .home-masthead {
    gap: 8px;
    padding: 12px var(--home-gutter);
  }

  .home-logo {
    width: 34px;
    height: 34px;
    margin-right: 9px;
  }

  .home-brand-name {
    max-width: clamp(110px, 34vw, 150px);
    overflow: hidden;
    font-size: clamp(18px, 5vw, 22px);
    text-overflow: ellipsis;
  }

  .home-nav-actions {
    gap: 6px;
  }

  .home-nav-icon,
  .home-nav-action {
    min-height: 34px;
  }

  .home-nav-icon {
    width: 34px;
  }

  .home-nav-action {
    gap: 7px;
    padding: 0 10px;
    font-size: 10px;
  }

  .home-nav-dot {
    width: 16px;
    height: 16px;
    font-size: 9px;
  }

  .home-rings {
    gap: 8px;
  }

  .home-ring {
    padding: 8px;
  }

  .home-ring strong {
    font-size: 24px;
  }

  .home-ring span {
    margin-top: 4px;
    font-size: 8px;
    line-height: 1.2;
  }

  .home-capability-kicker {
    gap: 0;
  }

  .home-ascii-shell .home-capability-kicker-item {
    grid-template-columns: 1fr;
    align-content: start;
    justify-items: start;
    min-height: 104px;
    gap: 7px;
    padding: 12px 10px;
    font-size: 10px;
    line-height: 1.35;
  }

  .home-section {
    padding-top: 80px;
  }
}

:global(.dark .home-ascii-shell) {
  background: #050505;
  color: #fffaf0;
}

:global(.dark .home-ascii-shell .home-site-frame) {
  background: transparent;
}

:global(.dark .home-ascii-shell .home-masthead) {
  border-color: rgba(255, 250, 240, 0.12);
  background: rgba(7, 16, 30, 0.14);
}

:global(.dark .home-ascii-shell .terminal-window) {
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.12),
    0 34px 78px -44px rgba(0, 0, 0, 0.78);
}

:global(.dark .home-ascii-shell .home-logo) {
  border-color: rgba(255, 250, 240, 0.32);
  background: var(--anthropic-page, #faf9f5);
}

:global(.dark .home-ascii-shell .home-nav-icon),
:global(.dark .home-ascii-shell .home-nav-action),
:global(.dark .home-ascii-shell .home-ring) {
  border-color: rgba(255, 250, 240, 0.28);
}

:global(.dark .home-ascii-shell .home-brand-name) {
  color: #fffaf0;
}

:global(.dark .home-ascii-shell .home-hero-subtitle),
:global(.dark .home-ascii-shell .home-body-copy) {
  color: rgba(243, 239, 229, 0.72);
}

:global(.dark .home-ascii-shell .home-feature-section),
:global(.dark .home-ascii-shell .home-provider-section) {
  color: var(--atelier-ink);
}

:global(.dark .home-ascii-shell .home-feature-section) {
  background: var(--anthropic-section, #f0eee6);
}

:global(.dark .home-ascii-shell .home-provider-section) {
  background: var(--anthropic-section, #f0eee6);
}

:global(.dark .home-ascii-shell .home-footer .home-footer-text),
:global(.dark .home-ascii-shell .home-footer .home-footer-link) {
  color: rgba(255, 250, 240, 0.96);
}
</style>

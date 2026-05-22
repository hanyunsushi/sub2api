<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="homeContent" class="min-h-screen">
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

  <!-- Default Home Page -->
  <div
    v-else
    ref="revealRoot"
    class="home-ascii-shell relative min-h-screen overflow-hidden"
  >
    <GuizangAsciiBackground class="home-ascii-background" />
    <div class="home-site-frame">
      <div
        class="home-topbar"
        data-home-reveal
        data-home-module="topbar"
        style="--home-reveal-delay: 0ms"
      >
        <span>API Gateway</span>
        <span>{{ siteName }}</span>
        <span>IKB Edition</span>
      </div>

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
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="home-nav-icon"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            @click="toggleTheme"
            class="home-nav-icon"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
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
                class="home-hero-title home-display"
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
                    <router-link
                      :to="isAuthenticated ? dashboardPath : '/login'"
                      class="home-cta inline-flex items-center rounded-lg px-8 py-3 text-base font-semibold shadow-glow transition-colors"
                    >
                      {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                      <Icon name="arrowRight" size="md" class="ml-2" :stroke-width="2" />
                    </router-link>
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
                class="home-plate home-hero-plate"
                data-home-reveal
                data-home-module="terminal-plate"
                style="--home-reveal-delay: 500ms"
                data-slot="01 / Gateway console"
              >
                <span class="home-shape home-shape-arch"></span>
                <span class="home-shape home-shape-disk"></span>
                <span class="home-shape home-shape-strip"></span>
                <span class="home-shape home-shape-stem"></span>
                <span class="home-shape home-shape-leaf"></span>
                <div class="terminal-container">
                  <div class="terminal-window">
                    <div class="terminal-header">
                      <div class="terminal-buttons">
                        <span class="btn-close"></span>
                        <span class="btn-minimize"></span>
                        <span class="btn-maximize"></span>
                      </div>
                      <span class="terminal-title">terminal</span>
                    </div>
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
                        <span class="code-response">{ "content": "Hello" }</span>
                      </div>
                      <div class="code-line line-4">
                        <span class="code-prompt">$</span>
                        <span class="cursor"></span>
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
          <div
            class="home-section-label"
            data-home-reveal
            data-home-module="feature-section-label"
          >
            <span>II</span>
            <span>Capabilities</span>
          </div>

          <div class="home-feature-tags" aria-label="Feature tags">
            <div
              class="home-feature-tag"
              data-home-reveal
              data-home-module="feature-tag"
              style="--home-reveal-delay: 80ms"
            >
              <Icon name="swap" size="sm" />
              <span>{{ t('home.tags.subscriptionToApi') }}</span>
            </div>
            <div
              class="home-feature-tag"
              data-home-reveal
              data-home-module="feature-tag"
              style="--home-reveal-delay: 140ms"
            >
              <Icon name="shield" size="sm" />
              <span>{{ t('home.tags.stickySession') }}</span>
            </div>
            <div
              class="home-feature-tag"
              data-home-reveal
              data-home-module="feature-tag"
              style="--home-reveal-delay: 200ms"
            >
              <Icon name="chart" size="sm" />
              <span>{{ t('home.tags.realtimeBilling') }}</span>
            </div>
          </div>

          <div class="home-feature-grid">
            <article
              class="home-feature-card home-feature-card-featured"
              data-home-reveal
              data-home-module="feature-card"
              style="--home-reveal-delay: 260ms"
            >
              <span class="home-card-index">01</span>
              <Icon name="server" size="lg" />
              <h2 id="home-features-title">{{ t('home.features.unifiedGateway') }}</h2>
              <p>{{ t('home.features.unifiedGatewayDesc') }}</p>
            </article>

            <article
              class="home-feature-card"
              data-home-reveal
              data-home-module="feature-card"
              style="--home-reveal-delay: 340ms"
            >
              <span class="home-card-index">02</span>
              <span class="home-card-glyph">A</span>
              <h3>{{ t('home.features.multiAccount') }}</h3>
              <p>{{ t('home.features.multiAccountDesc') }}</p>
            </article>

            <article
              class="home-feature-card"
              data-home-reveal
              data-home-module="feature-card"
              style="--home-reveal-delay: 420ms"
            >
              <span class="home-card-index">03</span>
              <span class="home-card-glyph">Q</span>
              <h3>{{ t('home.features.balanceQuota') }}</h3>
              <p>{{ t('home.features.balanceQuotaDesc') }}</p>
            </article>
          </div>
        </section>

        <section class="home-section home-provider-section" aria-labelledby="home-providers-title">
          <div
            class="home-section-label"
            data-home-reveal
            data-home-module="provider-section-label"
          >
            <span>III</span>
            <span>Provider Matrix</span>
          </div>

          <div
            class="home-provider-intro"
            data-home-reveal
            data-home-module="provider-intro"
            style="--home-reveal-delay: 80ms"
          >
            <h2 id="home-providers-title" class="home-section-title">
              {{ t('home.providers.title') }}
            </h2>
            <p class="home-section-copy">
              {{ t('home.providers.description') }}
            </p>
          </div>

          <div class="home-provider-grid">
            <div
              class="home-provider-chip"
              data-home-reveal
              data-home-module="provider-chip"
              style="--home-reveal-delay: 160ms"
            >
              <span class="home-provider-mark">C</span>
              <span>{{ t('home.providers.claude') }}</span>
              <b>{{ t('home.providers.supported') }}</b>
            </div>
            <div
              class="home-provider-chip"
              data-home-reveal
              data-home-module="provider-chip"
              style="--home-reveal-delay: 220ms"
            >
              <span class="home-provider-mark">G</span>
              <span>GPT</span>
              <b>{{ t('home.providers.supported') }}</b>
            </div>
            <div
              class="home-provider-chip"
              data-home-reveal
              data-home-module="provider-chip"
              style="--home-reveal-delay: 280ms"
            >
              <span class="home-provider-mark">G</span>
              <span>{{ t('home.providers.gemini') }}</span>
              <b>{{ t('home.providers.supported') }}</b>
            </div>
            <div
              class="home-provider-chip"
              data-home-reveal
              data-home-module="provider-chip"
              style="--home-reveal-delay: 340ms"
            >
              <span class="home-provider-mark">A</span>
              <span>{{ t('home.providers.antigravity') }}</span>
              <b>{{ t('home.providers.supported') }}</b>
            </div>
            <div
              class="home-provider-chip home-provider-chip-muted"
              data-home-reveal
              data-home-module="provider-chip"
              style="--home-reveal-delay: 400ms"
            >
              <span class="home-provider-mark">+</span>
              <span>{{ t('home.providers.more') }}</span>
              <b>{{ t('home.providers.soon') }}</b>
            </div>
          </div>
        </section>
      </main>

      <footer
        class="home-footer"
        data-home-reveal
        data-home-module="footer"
        style="--home-reveal-delay: 80ms"
      >
        <p class="home-footer-text">
          &copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}
        </p>
        <div class="home-footer-links">
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="home-footer-link"
          >
            {{ t('home.docs') }}
          </a>
          <a
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
import GuizangAsciiBackground from '@/components/common/GuizangAsciiBackground.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '')
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))
const revealRoot = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
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
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

function showRevealItems(items: HTMLElement[]) {
  items.forEach((item) => item.classList.add('is-visible'))
}

function initHomeReveal() {
  const items = Array.from(revealRoot.value?.querySelectorAll<HTMLElement>('[data-home-reveal]') ?? [])
  if (!items.length) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    showRevealItems(items)
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px 18% 0px' })

  revealObserver = observer
  items.forEach((item) => observer.observe(item))
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
})
</script>

<style scoped>
.home-ascii-shell {
  --home-max: 1540px;
  --home-gutter: clamp(18px, 3vw, 48px);
  position: relative;
  isolation: isolate;
  color: var(--atelier-ink);
  font-family: "Inter Tight", "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
  background:
    radial-gradient(circle at 12% 18%, rgba(0, 47, 167, 0.1), transparent 30rem),
    radial-gradient(circle at 78% 6%, rgba(79, 106, 140, 0.08), transparent 24rem),
    radial-gradient(circle at 90% 36%, rgba(199, 154, 58, 0.045), transparent 20rem),
    linear-gradient(90deg, rgba(23, 21, 18, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(23, 21, 18, 0.025) 1px, transparent 1px),
    var(--atelier-paper);
  background-size: auto, auto, auto, 32px 32px, 32px 32px, auto;
}

.home-ascii-background {
  z-index: 0;
  opacity: 0.18;
  mix-blend-mode: multiply;
}

.home-site-frame {
  position: relative;
  z-index: 1;
  isolation: isolate;
  min-height: 100vh;
}

.home-site-frame::before,
.home-site-frame::after {
  content: "";
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: -1;
  width: 1px;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    var(--atelier-line),
    var(--atelier-line) 2px,
    transparent 2px,
    transparent 8px
  );
}

.home-site-frame::before {
  left: var(--home-gutter);
}

.home-site-frame::after {
  right: var(--home-gutter);
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

.home-topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  min-height: 38px;
  padding: 9px var(--home-gutter);
  border-bottom: 1px dotted var(--atelier-line-strong);
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-topbar span:nth-child(2) {
  color: var(--atelier-ink);
}

.home-topbar span:last-child {
  text-align: right;
}

.home-masthead {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 22px;
  padding: 22px var(--home-gutter);
  border-bottom: 1px solid var(--atelier-line);
}

.home-logo {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  margin-right: 12px;
  border: 1px solid var(--atelier-ink);
  border-radius: 50%;
  background: var(--atelier-paper-2);
}

.home-brand-name {
  min-width: 0;
  color: var(--atelier-ink);
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 28px;
  letter-spacing: 0;
  white-space: nowrap;
}

.home-masthead-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-masthead-meta b {
  color: var(--atelier-ink);
  font-weight: 600;
}

.home-nav-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.home-nav-icon,
.home-nav-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border: 1px solid var(--atelier-ink);
  color: var(--atelier-ink);
  background: var(--atelier-paper);
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
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
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
  background: var(--atelier-blue);
  box-shadow: 0 18px 36px -28px rgba(0, 47, 167, 0.8);
}

.home-main {
  position: relative;
}

.home-section {
  position: relative;
  max-width: var(--home-max);
  margin: 0 auto;
  padding: clamp(64px, 8vw, 128px) var(--home-gutter);
}

.home-section + .home-section {
  border-top: 1px dotted var(--atelier-line-strong);
}

.home-hero {
  min-height: calc(100vh - 106px);
  display: grid;
  align-items: end;
  padding-top: clamp(56px, 7vw, 108px);
}

.home-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(330px, 0.64fr);
  align-items: end;
  gap: clamp(28px, 5vw, 78px);
}

.home-hero-copy {
  display: grid;
  gap: clamp(28px, 4vw, 54px);
}

.home-section-label {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-section-label::after {
  content: "";
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    var(--atelier-line-strong),
    var(--atelier-line-strong) 2px,
    transparent 2px,
    transparent 8px
  );
}

.home-display {
  margin: 0;
  color: var(--atelier-ink);
  font-size: 152px;
  font-weight: 760;
  line-height: 0.86;
  letter-spacing: 0;
  text-wrap: balance;
}

.home-display::after {
  content: ".";
  margin-left: 0.02em;
  color: var(--atelier-blue);
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-style: italic;
}

.home-hero-title {
  color: var(--atelier-ink);
}

.home-hero-lead {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 430px);
  align-items: start;
  gap: clamp(22px, 4vw, 60px);
  max-width: 860px;
  padding-top: 8px;
}

.home-hero-subtitle {
  margin: 0;
  color: var(--atelier-ink);
  font-size: 30px;
  font-weight: 560;
  line-height: 1.16;
  letter-spacing: 0;
  text-wrap: pretty;
}

.home-body-copy,
.home-section-copy,
.home-footer-text,
.home-footer-link {
  color: var(--atelier-muted);
}

.home-body-copy {
  max-width: 46ch;
  margin: 0;
  font-size: 17px;
  line-height: 1.5;
}

.home-btn-row {
  margin-top: 22px;
}

.home-cta {
  border: 1px solid var(--atelier-ink);
  background: var(--atelier-blue);
  color: var(--atelier-white);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
  box-shadow: 0 16px 36px -26px rgba(0, 47, 167, 0.78);
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    box-shadow 260ms var(--atelier-ease);
}

.home-cta:hover {
  transform: translate3d(0, -2px, 0);
  background: var(--atelier-blue-dark);
  box-shadow: 0 24px 44px -30px rgba(0, 47, 167, 0.9);
}

.home-index-card {
  display: grid;
  border-top: 1px solid var(--atelier-ink);
}

.home-index-row {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: baseline;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px dotted var(--atelier-line-strong);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0;
}

.home-index-row b {
  color: var(--atelier-blue-dark);
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 18px;
  font-style: italic;
  font-weight: 400;
}

.home-index-row span:last-child {
  color: var(--atelier-muted);
}

.home-hero-aside {
  display: grid;
  gap: 30px;
}

.home-plate {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid var(--atelier-ink);
  background:
    linear-gradient(135deg, rgba(23, 21, 18, 0.06), transparent 36%),
    radial-gradient(circle at 68% 26%, rgba(0, 47, 167, 0.22), transparent 19%),
    var(--atelier-paper-2);
}

.home-plate::before {
  content: "";
  position: absolute;
  inset: 18px;
  border: 1px dotted rgba(23, 21, 18, 0.42);
  pointer-events: none;
}

.home-plate::after {
  content: attr(data-slot);
  position: absolute;
  left: 18px;
  bottom: 16px;
  z-index: 2;
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-hero-plate {
  min-height: clamp(500px, 58vw, 710px);
  transform: rotate(1.2deg);
  box-shadow: 18px 18px 0 rgba(23, 21, 18, 0.08);
}

.home-shape {
  position: absolute;
  display: block;
  mix-blend-mode: multiply;
}

.home-shape-arch {
  top: 12%;
  left: 18%;
  width: 54%;
  aspect-ratio: 1 / 1.25;
  border: 1px solid var(--atelier-ink);
  border-radius: 50% 50% 0 0;
  background: var(--atelier-blue);
  transform: rotate(-4deg);
}

.home-shape-disk {
  top: 7%;
  right: 7%;
  width: 38%;
  aspect-ratio: 1;
  border: 1px solid var(--atelier-ink);
  border-radius: 50%;
  background: color-mix(in srgb, var(--atelier-butter) 52%, var(--atelier-paper));
}

.home-shape-strip {
  top: 8%;
  left: 10%;
  width: 18%;
  height: 84%;
  background: var(--atelier-ink);
  opacity: 0.9;
  transform: rotate(7deg);
}

.home-shape-stem {
  top: 10%;
  left: 61%;
  width: 2px;
  height: 72%;
  background: var(--atelier-ink);
  transform: rotate(12deg);
}

.home-shape-leaf {
  right: 15%;
  bottom: 22%;
  width: 32%;
  aspect-ratio: 1.8 / 1;
  border: 1px solid var(--atelier-ink);
  border-radius: 100% 0 100% 0;
  background: color-mix(in srgb, var(--atelier-dust) 56%, var(--atelier-paper));
  transform: rotate(-20deg);
}

.terminal-container {
  position: absolute;
  right: 8%;
  bottom: 16%;
  z-index: 3;
  width: min(78%, 420px);
  transform: rotate(-1.2deg);
}

.terminal-window {
  overflow: hidden;
  width: 100%;
  border: 1px solid var(--atelier-ink);
  border-radius: 0;
  background: linear-gradient(145deg, #171512 0%, #050505 100%);
  box-shadow: 16px 16px 0 rgba(0, 47, 167, 0.22);
  transition:
    transform 300ms var(--atelier-ease),
    box-shadow 300ms var(--atelier-ease);
}

.terminal-window:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: 20px 20px 0 rgba(0, 47, 167, 0.28);
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 250, 240, 0.14);
  background: rgba(23, 21, 18, 0.92);
}

.terminal-buttons {
  display: flex;
  gap: 8px;
}

.terminal-buttons span {
  width: 11px;
  height: 11px;
  border: 1px solid rgba(255, 250, 240, 0.24);
  border-radius: 50%;
}

.btn-close {
  background: var(--atelier-blue);
}

.btn-minimize {
  background: var(--atelier-butter);
}

.btn-maximize {
  background: var(--atelier-dust);
}

.terminal-title {
  flex: 1;
  margin-right: 52px;
  color: rgba(243, 239, 229, 0.62);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px;
  text-align: center;
}

.terminal-body {
  padding: 20px 24px;
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 2;
}

.code-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: line-appear 0.5s ease forwards;
}

.line-1 {
  animation-delay: 0.3s;
}

.line-2 {
  animation-delay: 1s;
}

.line-3 {
  animation-delay: 1.8s;
}

.line-4 {
  animation-delay: 2.5s;
}

@keyframes line-appear {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.code-prompt {
  color: var(--atelier-butter);
  font-weight: 700;
}

.code-cmd {
  color: #ffffff;
}

.code-flag {
  color: #9fb2d2;
}

.code-url {
  color: #fffaf0;
}

.code-comment {
  color: rgba(243, 239, 229, 0.54);
  font-style: italic;
}

.code-success {
  padding: 2px 8px;
  border-radius: 0;
  color: #fffaf0;
  background: rgba(79, 106, 140, 0.34);
  font-weight: 600;
}

.code-response {
  color: #e9c96c;
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--atelier-butter);
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
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.home-ring {
  display: grid;
  place-items: center;
  min-height: 0;
  aspect-ratio: 1;
  padding: 18px;
  border: 1px solid var(--atelier-ink);
  border-radius: 50%;
  text-align: center;
  background: color-mix(in srgb, var(--atelier-paper) 80%, white);
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    color 260ms var(--atelier-ease);
}

.home-ring:hover {
  transform: translate3d(0, -3px, 0);
  color: var(--atelier-white);
  background: var(--atelier-blue);
}

.home-ring strong {
  display: block;
  color: inherit;
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 40px;
  font-style: italic;
  font-weight: 400;
  line-height: 0.9;
}

.home-ring span {
  display: block;
  margin-top: 8px;
  color: inherit;
  opacity: 0.78;
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-feature-section {
  display: grid;
  gap: clamp(28px, 4vw, 52px);
}

.home-feature-tags {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--atelier-ink);
  border-left: 1px solid var(--atelier-ink);
}

.home-ascii-shell .home-feature-tag {
  --home-chip-accent: var(--atelier-blue);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 18px 20px;
  border-right: 1px solid var(--atelier-ink);
  border-bottom: 1px solid var(--atelier-ink);
  background:
    linear-gradient(90deg, var(--home-chip-accent) 0 8px, transparent 8px),
    color-mix(in srgb, var(--home-chip-accent) 10%, var(--atelier-paper));
  color: var(--atelier-ink);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0;
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease);
}

.home-ascii-shell .home-feature-tag:nth-child(2) {
  --home-chip-accent: var(--atelier-dust);
}

.home-ascii-shell .home-feature-tag:nth-child(3) {
  --home-chip-accent: var(--atelier-butter);
}

.home-ascii-shell .home-feature-tag:hover {
  transform: translate3d(0, -2px, 0);
  background:
    linear-gradient(90deg, var(--home-chip-accent) 0 8px, transparent 8px),
    color-mix(in srgb, var(--home-chip-accent) 16%, var(--atelier-paper));
}

.home-feature-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 0.9fr);
  border-top: 1px solid var(--atelier-ink);
  border-left: 1px solid var(--atelier-ink);
}

.home-ascii-shell .home-feature-card {
  --home-card-accent: var(--atelier-dust);
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  align-content: start;
  gap: 18px;
  min-height: 340px;
  padding: clamp(20px, 2.5vw, 34px);
  border-right: 1px solid var(--atelier-ink);
  border-bottom: 1px solid var(--atelier-ink);
  border-top: 1px solid var(--atelier-ink);
  background: color-mix(in srgb, var(--home-card-accent) 14%, var(--atelier-paper));
  color: var(--atelier-ink);
  transition:
    transform 280ms var(--atelier-ease),
    background-color 280ms var(--atelier-ease),
    box-shadow 280ms var(--atelier-ease);
}

.home-ascii-shell .home-feature-card:nth-child(2) {
  --home-card-accent: var(--atelier-blue);
}

.home-ascii-shell .home-feature-card:nth-child(3) {
  --home-card-accent: var(--atelier-butter);
}

.home-ascii-shell .home-feature-card:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: 0 26px 44px -34px color-mix(in srgb, var(--home-card-accent) 58%, transparent);
}

.home-ascii-shell .home-feature-card.home-feature-card-featured {
  background: var(--atelier-blue);
  color: var(--atelier-white);
}

.home-card-index {
  color: currentColor;
  opacity: 0.72;
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0;
}

.home-ascii-shell .home-feature-card svg,
.home-card-glyph {
  color: currentColor;
}

.home-card-glyph {
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 42px;
  font-style: italic;
  line-height: 1;
}

.home-ascii-shell .home-feature-card h2,
.home-ascii-shell .home-feature-card h3 {
  margin: 0;
  color: currentColor;
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 34px;
  font-style: italic;
  font-weight: 400;
  letter-spacing: 0;
}

.home-ascii-shell .home-feature-card p {
  max-width: 46ch;
  margin: 0;
  color: currentColor;
  opacity: 0.78;
  font-size: 15px;
  line-height: 1.55;
}

.home-provider-section {
  display: grid;
  gap: clamp(28px, 4vw, 52px);
}

.home-provider-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(280px, 0.55fr);
  align-items: end;
  gap: clamp(24px, 4vw, 58px);
  padding-top: 18px;
  border-top: 1px solid var(--atelier-ink);
}

.home-section-title {
  margin: 0;
  color: var(--atelier-ink);
  font-size: 106px;
  font-weight: 760;
  line-height: 0.88;
  letter-spacing: 0;
}

.home-section-title::after {
  content: ".";
  color: var(--atelier-blue);
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-style: italic;
}

.home-section-copy {
  margin: 0;
  max-width: 48ch;
  font-size: 17px;
  line-height: 1.5;
}

.home-provider-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid var(--atelier-ink);
  border-left: 1px solid var(--atelier-ink);
}

.home-ascii-shell .home-provider-chip {
  --home-chip-accent: var(--atelier-blue);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  min-height: 210px;
  padding: 20px;
  border-right: 1px solid var(--atelier-ink);
  border-bottom: 1px solid var(--atelier-ink);
  background:
    linear-gradient(180deg, var(--home-chip-accent) 0 6px, transparent 6px),
    color-mix(in srgb, var(--home-chip-accent) 8%, var(--atelier-paper));
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease),
    box-shadow 260ms var(--atelier-ease);
}

.home-ascii-shell .home-provider-chip:nth-child(2) {
  --home-chip-accent: var(--atelier-dust);
}

.home-ascii-shell .home-provider-chip:nth-child(3) {
  --home-chip-accent: var(--atelier-butter);
}

.home-ascii-shell .home-provider-chip:nth-child(4) {
  --home-chip-accent: var(--atelier-blue-dark);
}

.home-ascii-shell .home-provider-chip:nth-child(5) {
  --home-chip-accent: var(--atelier-muted);
}

.home-ascii-shell .home-provider-chip:hover {
  transform: translate3d(0, -3px, 0);
  background:
    linear-gradient(180deg, var(--home-chip-accent) 0 6px, transparent 6px),
    color-mix(in srgb, var(--home-chip-accent) 14%, var(--atelier-paper));
  box-shadow: 0 24px 40px -34px color-mix(in srgb, var(--home-chip-accent) 55%, transparent);
}

.home-provider-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--atelier-ink);
  border-radius: 50%;
  color: var(--atelier-white);
  background: var(--home-chip-accent);
  font-family: "Playfair Display", "Iowan Old Style", "Charter", Georgia, serif;
  font-size: 22px;
  font-style: italic;
}

.home-provider-chip span:not(.home-provider-mark) {
  color: var(--atelier-ink);
  font-size: 17px;
  font-weight: 620;
  letter-spacing: 0;
}

.home-provider-chip b {
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-provider-chip-muted {
  opacity: 0.76;
}

.home-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  max-width: var(--home-max);
  margin: 0 auto;
  padding: 30px var(--home-gutter);
  border-top: 1px dotted var(--atelier-line-strong);
  color: var(--atelier-muted);
  font-family: ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-footer-text {
  margin: 0;
}

.home-footer-links {
  display: flex;
  gap: 18px;
}

.home-footer-link:hover {
  color: var(--atelier-blue);
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
  .home-feature-tag,
  .home-feature-card,
  .home-provider-chip,
  .home-ring,
  .terminal-window {
    transition: none;
  }
}

@media (max-width: 1080px) {
  .home-masthead,
  .home-topbar {
    grid-template-columns: 1fr;
  }

  .home-masthead-meta,
  .home-topbar span:last-child {
    display: none;
  }

  .home-nav-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .home-hero-grid,
  .home-hero-lead,
  .home-provider-intro {
    grid-template-columns: 1fr;
  }

  .home-feature-grid,
  .home-feature-tags,
  .home-provider-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .home-ascii-shell .home-feature-card h2,
  .home-ascii-shell .home-feature-card h3 {
    font-size: 30px;
  }

  .home-section-title {
    font-size: 76px;
  }
}

@media (max-width: 720px) {
  .home-display {
    font-size: 58px;
  }

  .home-section {
    padding: 54px var(--home-gutter);
  }

  .home-feature-grid,
  .home-feature-tags,
  .home-provider-grid,
  .home-rings {
    grid-template-columns: 1fr;
  }

  .home-hero-plate {
    min-height: 520px;
    transform: none;
  }

  .home-brand-name {
    font-size: 22px;
  }

  .home-hero-subtitle {
    font-size: 21px;
  }

  .home-body-copy,
  .home-section-copy {
    font-size: 15px;
  }

  .home-ring strong {
    font-size: 30px;
  }

  .home-ascii-shell .home-feature-card h2,
  .home-ascii-shell .home-feature-card h3 {
    font-size: 27px;
  }

  .home-section-title {
    font-size: 52px;
  }

  .terminal-container {
    right: 6%;
    bottom: 18%;
    width: 88%;
  }

  .home-footer {
    flex-direction: column;
  }
}

:global(.dark .home-ascii-shell) {
  background:
    radial-gradient(circle at 12% 18%, rgba(0, 47, 167, 0.14), transparent 28rem),
    radial-gradient(circle at 82% 8%, rgba(79, 106, 140, 0.1), transparent 24rem),
    radial-gradient(circle at 92% 34%, rgba(199, 154, 58, 0.045), transparent 20rem),
    linear-gradient(90deg, rgba(243, 239, 229, 0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(243, 239, 229, 0.03) 1px, transparent 1px),
    #050505;
  color: #fffaf0;
}

:global(.dark .home-ascii-shell .terminal-window) {
  box-shadow: 16px 16px 0 rgba(0, 47, 167, 0.34);
}

:global(.dark .home-ascii-shell .home-logo) {
  border-color: rgba(233, 225, 210, 0.32);
  background: #11100d;
}

:global(.dark .home-ascii-shell .home-nav-icon),
:global(.dark .home-ascii-shell .home-nav-action),
:global(.dark .home-ascii-shell .home-feature-card),
:global(.dark .home-ascii-shell .home-provider-chip),
:global(.dark .home-ascii-shell .home-ring) {
  border-color: rgba(233, 225, 210, 0.28);
}

:global(.dark .home-ascii-shell .home-hero-title),
:global(.dark .home-ascii-shell .home-section-title),
:global(.dark .home-ascii-shell .home-brand-name) {
  color: #fffaf0;
}

:global(.dark .home-ascii-shell .home-hero-subtitle),
:global(.dark .home-ascii-shell .home-section-copy),
:global(.dark .home-ascii-shell .home-footer-text),
:global(.dark .home-ascii-shell .home-footer-link),
:global(.dark .home-ascii-shell .home-body-copy) {
  color: rgba(243, 239, 229, 0.72);
}
</style>

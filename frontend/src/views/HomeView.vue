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

          <div class="home-capability-kicker" aria-label="Feature tags">
            <div
              class="home-capability-kicker-item"
              data-home-reveal
              data-home-module="capability-kicker"
              style="--home-reveal-delay: 80ms"
            >
              <Icon name="swap" size="sm" />
              <b>01</b>
              <span>{{ t('home.tags.subscriptionToApi') }}</span>
            </div>
            <div
              class="home-capability-kicker-item"
              data-home-reveal
              data-home-module="capability-kicker"
              style="--home-reveal-delay: 140ms"
            >
              <Icon name="shield" size="sm" />
              <b>02</b>
              <span>{{ t('home.tags.stickySession') }}</span>
            </div>
            <div
              class="home-capability-kicker-item"
              data-home-reveal
              data-home-module="capability-kicker"
              style="--home-reveal-delay: 200ms"
            >
              <Icon name="chart" size="sm" />
              <b>03</b>
              <span>{{ t('home.tags.realtimeBilling') }}</span>
            </div>
          </div>

          <div class="home-capability-grid">
            <article
              class="home-cap-card home-cap-card-featured"
              data-home-reveal
              data-home-module="cap-card"
              style="--home-reveal-delay: 260ms"
            >
              <span class="home-card-index">01</span>
              <Icon name="server" size="lg" />
              <h2 id="home-features-title">{{ t('home.features.unifiedGateway') }}</h2>
              <p>{{ t('home.features.unifiedGatewayDesc') }}</p>
            </article>

            <article
              class="home-cap-card home-cap-card-dust"
              data-home-reveal
              data-home-module="cap-card"
              style="--home-reveal-delay: 340ms"
            >
              <span class="home-card-index">02</span>
              <span class="home-card-glyph">A</span>
              <h3>{{ t('home.features.multiAccount') }}</h3>
              <p>{{ t('home.features.multiAccountDesc') }}</p>
            </article>

            <article
              class="home-cap-card home-cap-card-ink"
              data-home-reveal
              data-home-module="cap-card"
              style="--home-reveal-delay: 420ms"
            >
              <span class="home-card-index">03</span>
              <span class="home-card-glyph">Q</span>
              <h3>{{ t('home.features.balanceQuota') }}</h3>
              <p>{{ t('home.features.balanceQuotaDesc') }}</p>
            </article>

            <article
              class="home-cap-card home-cap-card-paper"
              data-home-reveal
              data-home-module="cap-card"
              style="--home-reveal-delay: 500ms"
            >
              <span class="home-card-index">04</span>
              <span class="home-card-glyph">M</span>
              <h3>{{ t('home.providers.title') }}</h3>
              <p>{{ t('home.providers.description') }}</p>
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

          <div class="home-provider-specimen-grid">
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

function homeMaxScrollTop() {
  const root = revealRoot.value
  if (!root) return 0
  return Math.max(0, root.scrollHeight - root.clientHeight)
}

function homeSnapTopForTarget(target: HTMLElement) {
  if (target.classList.contains('home-footer')) {
    const root = revealRoot.value
    if (!root) return 0
    const centeredTop = target.offsetTop - Math.max(0, (root.clientHeight - target.offsetHeight) / 2)
    return Math.max(0, Math.min(centeredTop, homeMaxScrollTop()))
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

.home-site-frame::after {
  content: "";
  display: block;
  height: clamp(320px, 46vh, 400px);
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
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 22px;
  padding: 22px var(--home-gutter);
  border-bottom: 1px solid rgba(255, 250, 240, 0.12);
  background: rgba(7, 16, 30, 0.14);
  backdrop-filter: blur(12px) saturate(1.08);
  box-shadow: inset 0 -1px 0 rgba(255, 250, 240, 0.05);
}

.home-logo {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  margin-right: 12px;
  border: 1px solid rgba(255, 250, 240, 0.28);
  border-radius: 50%;
  background: rgba(7, 16, 30, 0.28);
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
  gap: 12px;
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
  background: var(--home-surface-dust);
}

.home-provider-section {
  max-width: none;
  background: var(--atelier-blue);
  color: var(--atelier-white);
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
.home-section-copy,
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
  transform: rotate(-0.8deg);
}

.terminal-window {
  overflow: hidden;
  width: 100%;
  border: 1px solid rgba(255, 250, 240, 0.2);
  border-radius: 0;
  background: linear-gradient(145deg, rgba(23, 21, 18, 0.92) 0%, rgba(5, 5, 5, 0.94) 100%);
  backdrop-filter: blur(18px) saturate(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.1),
    0 28px 70px -44px rgba(0, 0, 0, 0.72);
  transition:
    transform 300ms var(--atelier-ease),
    box-shadow 300ms var(--atelier-ease);
}

.terminal-window:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.12),
    0 34px 78px -44px rgba(0, 0, 0, 0.78);
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 250, 240, 0.14);
  background: rgba(23, 21, 18, 0.86);
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
  background: var(--atelier-dust);
}

.btn-maximize {
  background: var(--atelier-butter);
}

.terminal-title {
  flex: 1;
  margin-right: 52px;
  color: var(--home-muted-on-dark);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  text-align: center;
}

.terminal-body {
  padding: 20px 24px;
  font-family: var(--atelier-font-mono);
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
  color: #9fb2d2;
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
  color: #9da9b6;
  font-style: italic;
}

.code-success {
  padding: 2px 8px;
  border-radius: 0;
  color: #fffaf0;
  background: #4f6a8c;
  font-weight: 600;
}

.code-response {
  color: var(--home-muted-on-dark);
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #9fb2d2;
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

.home-ring:nth-child(2) {
  background: rgba(23, 21, 18, 0.11);
}

.home-ring:nth-child(3) {
  border-width: 2px;
  border-color: rgba(245, 191, 93, 0.38);
  background: rgba(7, 16, 30, 0.12);
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
  gap: clamp(30px, 4vw, 56px);
}

.home-capability-kicker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--atelier-ink);
  border-left: 1px solid var(--atelier-ink);
}

.home-ascii-shell .home-capability-kicker-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 82px;
  padding: 18px 20px;
  border-right: 1px solid var(--atelier-ink);
  border-bottom: 1px solid var(--atelier-ink);
  background: var(--home-surface-paper-2);
  color: var(--atelier-ink);
  font-family: var(--atelier-font-mono);
  font-size: 12px;
  letter-spacing: 0;
  transition:
    transform 260ms var(--atelier-ease),
    background-color 260ms var(--atelier-ease);
}

.home-ascii-shell .home-capability-kicker-item:nth-child(2) {
  background: var(--home-surface-paper);
}

.home-ascii-shell .home-capability-kicker-item:nth-child(3) {
  background: var(--home-surface-ink);
  color: var(--atelier-white);
}

.home-capability-kicker-item b {
  color: currentColor;
  font-weight: 500;
}

.home-ascii-shell .home-capability-kicker-item:hover {
  transform: translate3d(0, -2px, 0);
  background: color-mix(in srgb, var(--atelier-blue) 9%, var(--home-surface-paper));
}

.home-capability-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--atelier-ink);
  border-left: 1px solid var(--atelier-ink);
}

.home-ascii-shell .home-cap-card {
  --home-card-accent: var(--atelier-blue);
  --home-card-surface: var(--home-surface-paper);
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  align-content: start;
  gap: 18px;
  min-height: 380px;
  padding: clamp(20px, 2.5vw, 34px);
  border-right: 1px solid var(--atelier-ink);
  border-bottom: 1px solid var(--atelier-ink);
  border-top: 1px solid var(--atelier-ink);
  background: var(--home-card-surface);
  color: var(--atelier-ink);
  transition:
    transform 280ms var(--atelier-ease),
    background-color 280ms var(--atelier-ease),
    box-shadow 280ms var(--atelier-ease);
}

.home-ascii-shell .home-cap-card:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: 0 26px 44px -34px rgba(20, 20, 19, 0.18);
}

.home-ascii-shell .home-cap-card-featured {
  background: var(--atelier-blue);
  color: var(--atelier-white);
}

.home-ascii-shell .home-cap-card-dust {
  --home-card-accent: var(--atelier-dust);
  background: var(--home-surface-dust);
}

.home-ascii-shell .home-cap-card-ink {
  --home-card-accent: var(--atelier-blue-dark);
  --home-card-surface: var(--home-surface-ink);
  color: var(--atelier-white);
}

.home-ascii-shell .home-cap-card-paper {
  --home-card-accent: var(--atelier-dust);
  background: var(--home-surface-paper-2);
}

.home-card-index {
  color: currentColor;
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
}

.home-ascii-shell .home-cap-card svg,
.home-card-glyph {
  color: currentColor;
}

.home-card-glyph {
  font-family: var(--atelier-font-serif);
  font-size: 42px;
  font-style: italic;
  line-height: 1;
}

.home-ascii-shell .home-cap-card h2,
.home-ascii-shell .home-cap-card h3 {
  margin: 0;
  color: currentColor;
  font-family: var(--atelier-font-serif);
  font-size: 34px;
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
  gap: clamp(12px, 2vh, 24px);
  padding-top: clamp(24px, 3.5vh, 44px);
  padding-bottom: clamp(20px, 3vh, 34px);
  overflow: hidden;
}

.home-provider-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(280px, 0.55fr);
  align-items: end;
  gap: clamp(18px, 3vw, 46px);
  padding-top: 10px;
  border-top: 1px solid rgba(255, 250, 240, 0.42);
}

.home-section-title {
  margin: 0;
  color: var(--atelier-white);
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

.home-section-copy {
  margin: 0;
  max-width: 48ch;
  color: rgba(255, 250, 240, 0.74);
  font-size: 15px;
  line-height: 1.5;
}

.home-provider-specimen-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(12px, 1.4vw, 18px);
}

.home-ascii-shell .home-provider-specimen {
  --home-chip-accent: var(--atelier-blue);
  --home-chip-surface: var(--home-surface-paper);
  --home-chip-text: var(--atelier-ink);
  display: grid;
  grid-column: auto;
  grid-template-rows: minmax(132px, 0.58fr) 1fr;
  min-height: clamp(240px, 30vh, 292px);
  width: 100%;
  height: auto;
  aspect-ratio: auto;
  overflow: hidden;
  border: 1px solid var(--atelier-ink);
  border-radius: 0;
  background: var(--home-chip-surface);
  color: var(--home-chip-text);
  transition:
    transform 280ms var(--atelier-ease),
    background-color 280ms var(--atelier-ease),
    box-shadow 280ms var(--atelier-ease);
}

.home-ascii-shell .home-provider-specimen:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: 0 26px 44px -34px rgba(20, 20, 19, 0.18);
}

.home-ascii-shell .home-provider-specimen-featured {
  --home-chip-accent: var(--atelier-blue-dark);
  --home-chip-surface: var(--atelier-blue);
  --home-chip-text: var(--atelier-white);
}

.home-ascii-shell .home-provider-specimen-ink {
  --home-chip-accent: var(--atelier-blue);
  --home-chip-surface: var(--home-surface-ink);
  --home-chip-text: var(--atelier-white);
}

.home-ascii-shell .home-provider-specimen-dust {
  --home-chip-accent: var(--atelier-blue-dark);
  --home-chip-surface: var(--home-surface-dust);
}

.home-ascii-shell .home-provider-specimen-muted {
  --home-chip-accent: var(--atelier-dust);
  --home-chip-surface: var(--home-surface-paper-2);
}

.home-provider-swatch {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 132px;
  border-bottom: 1px solid var(--atelier-ink);
  background:
    radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--home-chip-accent) 42%, transparent), transparent 28%),
    color-mix(in srgb, var(--home-chip-accent) 18%, var(--home-chip-surface));
}

.home-provider-specimen-featured .home-provider-swatch {
  background: var(--atelier-blue);
}

.home-provider-swatch::before {
  content: attr(data-id);
  position: absolute;
  top: 14px;
  left: 14px;
  color: color-mix(in srgb, currentColor 72%, transparent);
  font-family: var(--atelier-font-mono);
  font-size: 10px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-provider-swatch::after {
  content: attr(data-hex);
  position: absolute;
  right: 14px;
  bottom: 14px;
  color: currentColor;
  opacity: 0.82;
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  letter-spacing: 0;
}

.home-provider-mark {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border: 0;
  border-radius: 0;
  color: var(--atelier-white);
  background: transparent;
  font-family: var(--atelier-font-serif);
  font-size: 52px;
  font-style: italic;
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
  color: var(--atelier-white) !important;
}

.home-provider-meta {
  display: grid;
  align-content: start;
  gap: 7px;
  padding: clamp(14px, 1.6vw, 18px);
}

.home-provider-section .home-section-label {
  color: rgba(255, 250, 240, 0.72);
}

.home-provider-section .home-section-label::before,
.home-provider-section .home-section-label::after {
  background: repeating-linear-gradient(to right, rgba(255, 250, 240, 0.42), rgba(255, 250, 240, 0.42) 2px, transparent 2px, transparent 8px);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;
  width: min(1040px, calc(100% - var(--home-gutter) * 2));
  max-width: calc(100% - var(--home-gutter) * 2);
  margin: 0 auto;
  padding: 28px clamp(18px, 3vw, 34px);
  border-top: 0;
  background: #050505;
  color: rgba(255, 250, 240, 0.92);
  font-family: var(--atelier-font-mono);
  font-size: 11px;
  line-height: 1.45;
  letter-spacing: 0;
  text-transform: uppercase;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.home-footer .home-footer-text,
.home-footer .home-footer-link {
  color: rgba(255, 250, 240, 0.92);
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
    grid-template-columns: 1fr;
  }

  .home-masthead-meta {
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

@media (max-width: 720px) {
  .home-display {
    font-size: 58px;
  }

  .home-section {
    padding: 54px var(--home-gutter);
  }

  .home-capability-grid,
  .home-capability-kicker,
  .home-provider-specimen-grid,
  .home-rings {
    grid-template-columns: 1fr;
  }

  .home-terminal-stage {
    min-height: 0;
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

  .home-ascii-shell .home-cap-card h2,
  .home-ascii-shell .home-cap-card h3 {
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
    justify-content: center;
    text-align: center;
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
  background: #171512;
}

:global(.dark .home-ascii-shell .home-nav-icon),
:global(.dark .home-ascii-shell .home-nav-action),
:global(.dark .home-ascii-shell .home-cap-card),
:global(.dark .home-ascii-shell .home-provider-specimen),
:global(.dark .home-ascii-shell .home-ring) {
  border-color: rgba(255, 250, 240, 0.28);
}

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

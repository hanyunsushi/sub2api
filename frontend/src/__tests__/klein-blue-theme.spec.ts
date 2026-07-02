import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const kleinBlue = '#002FA7'

const themeFiles = [
  'index.html',
  'public/site.webmanifest',
  'tailwind.config.js',
  'src/style.css',
  'src/styles/codex-theme.css',
  'src/styles/onboarding.css',
  'src/assets/icons/stripe.svg',
  'src/components/common/ModelIcon.vue',
  'src/components/layout/AppLayout.vue',
  'src/components/payment/StripePaymentInline.vue',
  'src/components/payment/PaymentMethodSelector.vue',
  'src/components/account/AccountStatsModal.vue',
  'src/components/admin/account/AccountStatsModal.vue',
  'src/views/HomeView.vue',
  'src/views/KeyUsageView.vue',
  'src/views/admin/DashboardView.vue',
  'src/views/admin/SettingsView.vue',
  'src/views/admin/ops/components/OpsDashboardHeader.vue',
  'src/views/admin/ops/components/OpsErrorDistributionChart.vue',
  'src/views/admin/ops/components/OpsErrorTrendChart.vue',
  'src/views/admin/ops/components/OpsLatencyChart.vue',
  'src/views/admin/ops/components/OpsThroughputTrendChart.vue',
  'src/views/user/StripePaymentView.vue',
  'src/views/user/StripePopupView.vue',
  'src/i18n/locales/en.ts',
  'src/i18n/locales/zh.ts',
] as const

const legacyThemeColors = [
  '#0033ff',
  '#002cd6',
  '#001fb8',
  '#001f66',
  '#00184d',
  '#001133',
  '#00091f',
  '#002780',
  '#2e58ff',
  '#4f73e6',
  '#8aa1ff',
  '#b7c6ff',
  '#e5eaff',
  '#8aa8ff',
  '#b8c9ff',
  '#0b46c5',
  '#3f63d8',
  '#5f7ee8',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#4f46e5',
  '#4338ca',
  '#6366f1',
  '#7c3aed',
  '#8b5cf6',
  '#a5b4fc',
  '#635bff',
  '#5851ea',
  '#7a73ff',
  '#676be5',
  '#eff6ff',
  '#dbeafe',
  '#e0e7ff',
  '#f3e8ff',
] as const

const readThemeFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('Klein blue theme', () => {
  it('declares Klein blue as the app install and browser chrome color', () => {
    const html = readThemeFile('index.html')
    const manifest = JSON.parse(readThemeFile('public/site.webmanifest'))

    expect(html).toContain(`<meta name="theme-color" content="${kleinBlue}" />`)
    expect(manifest.theme_color).toBe(kleinBlue)
  })

  it('uses Klein blue as the primary Tailwind token while shared charts use a separate data palette', () => {
    const tailwindConfig = readThemeFile('tailwind.config.js')
    const chartColors = readThemeFile('src/utils/chartColors.ts')

    expect(tailwindConfig).toContain(`const kleinBlue = '${kleinBlue}'`)
    expect(tailwindConfig).toContain("50: '#f3efe5'")
    expect(tailwindConfig).toContain("100: '#e9e1d2'")
    expect(tailwindConfig).toContain("200: '#d8dade'")
    expect(tailwindConfig).toContain("300: '#bec5d7'")
    expect(tailwindConfig).not.toContain("50: '#f7f9ff'")
    expect(tailwindConfig).not.toContain("100: '#eef3ff'")
    expect(tailwindConfig).not.toContain("200: '#dce7ff'")
    expect(tailwindConfig).not.toContain("300: '#c6d8ff'")
    for (const step of ['400', '500', '600', '700', '800', '900', '950']) {
      expect(tailwindConfig).toContain(`${step}: kleinBlue`)
    }
    expect(tailwindConfig).toContain("'gradient-primary': 'linear-gradient(135deg, #002FA7 0%, #002FA7 100%)'")
    expect(tailwindConfig).toContain('Klein blue theme')
    expect(chartColors).toContain('chartCategoricalColors')
    expect(chartColors).toContain("'#4290F0'")
    expect(chartColors).not.toContain(`'${kleinBlue}'`)
  })

  it('maps the light UI surfaces to the Atelier Zero palette with warm paper as the dominant canvas', () => {
    const tailwindConfig = readThemeFile('tailwind.config.js')
    const globalStyle = readThemeFile('src/style.css')
    const codexTheme = readThemeFile('src/styles/codex-theme.css')
    const appHeader = readThemeFile('src/components/layout/AppHeader.vue')
    const notFoundView = readThemeFile('src/views/NotFoundView.vue')
    const legalDocumentView = readThemeFile('src/views/public/LegalDocumentView.vue')

    for (const color of ['#f3efe5', '#e9e1d2', '#171512', '#70685c', '#c79a3a']) {
      expect(tailwindConfig).toContain(color)
      expect(globalStyle).toContain(color)
    }

    expect(globalStyle).toContain('--atelier-paper: #f3efe5;')
    expect(globalStyle).toContain('--atelier-ease: cubic-bezier(0.2, 0.8, 0.2, 1);')
    expect(globalStyle).toContain('--atelier-blue-dark: #001E6E;')
    expect(globalStyle).toContain('--atelier-butter-dark: #8e6c1f;')
    expect(globalStyle).toContain('--atelier-canvas: var(--atelier-paper);')
    expect(globalStyle).toContain('--atelier-surface-panel: var(--atelier-paper-2);')
    expect(globalStyle).toContain('--atelier-surface-dust: color-mix(in srgb, var(--atelier-dust) 18%, var(--atelier-paper));')
    expect(globalStyle).toContain('--atelier-material-butter: color-mix(in srgb, var(--atelier-butter) 18%, var(--atelier-paper));')
    expect(globalStyle).toContain('--atelier-material-butter-strong: color-mix(in srgb, var(--atelier-butter) 34%, var(--atelier-paper));')
    expect(tailwindConfig).toContain("butter: '#c79a3a'")
    expect(tailwindConfig).not.toContain('#eef3ff')
    expect(tailwindConfig).not.toContain('#f7f9ff')
    expect(tailwindConfig).not.toContain('#dce7ff')
    expect(tailwindConfig).not.toContain('#c6d8ff')
    expect(globalStyle).not.toContain('--atelier-surface-butter:')
    expect(globalStyle).toContain('--atelier-material-1: var(--atelier-paper-2);')
    expect(globalStyle).toContain('--atelier-material-2: var(--atelier-paper-2);')
    expect(globalStyle).not.toContain('--atelier-canvas: #d9deee;')
    expect(globalStyle).not.toContain('body {\n    @apply bg-accent-50 text-gray-950 dark:bg-dark-950 dark:text-gray-100;\n    @apply min-h-screen;\n    overscroll-behavior-y: none;\n    color: var(--atelier-ink);\n    background: #d9deee;')
    expect(globalStyle).not.toContain('radial-gradient(circle at 78% 6%, rgba(79, 106, 140, 0.08), transparent 24rem)')
    expect(globalStyle).not.toContain('radial-gradient(circle at 90% 36%, rgba(199, 154, 58, 0.045), transparent 20rem)')
    expect(globalStyle).toContain('--atelier-material-grid: none;')
    expect(globalStyle).toContain('--atelier-component-warning: var(--atelier-dust);')
    expect(codexTheme).toContain('--codex-bg: var(--atelier-paper);')
    expect(codexTheme).toContain('--codex-surface-soft: color-mix(in srgb, var(--atelier-dust) 16%, var(--atelier-paper));')
    expect(codexTheme).toContain('--material-card-surface: var(--atelier-paper-2);')
    expect(codexTheme).not.toContain('#eef3ff')
    expect(codexTheme).not.toContain('#edf2fb')
    expect(codexTheme).not.toContain('#dce6ee')
    expect(codexTheme).not.toContain('#e8eef8')
    expect(codexTheme).not.toContain('#dbe5fa')
    expect(codexTheme).toContain('--codex-text: #111827;')
    expect(appHeader).toContain('--buzz-balance-yellow: #c79a3a;')
    expect(appHeader).toContain('--buzz-balance-yellow-dark: #8e6c1f;')
    expect(globalStyle).toContain('.balance-buzz-text')
    expect(globalStyle).toContain('color: var(--atelier-dust) !important;')
    expect(notFoundView).not.toContain('background-size: auto, auto, auto, 32px 32px, 32px 32px, auto;')
    expect(legalDocumentView).not.toContain('background-size: auto, auto, auto, 32px 32px, 32px 32px, auto;')
    expect(legalDocumentView).not.toContain('background-size: 28px 28px, 28px 28px, auto;')
    expect(legalDocumentView).not.toContain('rgba(233, 225, 210')
    expect(legalDocumentView).not.toContain('linear-gradient(90deg')
    expect(legalDocumentView).not.toContain('linear-gradient(0deg')
  })

  it('keeps the onboarding popover from adding grid texture over the main interface', () => {
    const onboardingStyle = readThemeFile('src/styles/onboarding.css')

    expect(onboardingStyle).toContain('background: var(--atelier-paper-2) !important;')
    expect(onboardingStyle).not.toContain('background: var(--atelier-surface-strong) !important;')
    expect(onboardingStyle).not.toContain('background: #111827 !important;')
    expect(onboardingStyle).not.toContain('background-size: 32px 32px, 32px 32px, auto !important;')
    expect(onboardingStyle).not.toContain('linear-gradient(90deg, rgba(23, 21, 18, 0.032) 1px, transparent 1px)')
    expect(onboardingStyle).not.toContain('linear-gradient(0deg, rgba(23, 21, 18, 0.024) 1px, transparent 1px)')
  })

  it('does not keep legacy blue-purple theme literals in runtime theme files', () => {
    for (const file of themeFiles) {
      let lowerContent = readThemeFile(file).toLowerCase()
      if (file === 'tailwind.config.js') {
        lowerContent = lowerContent.replace(
          /const kleinbluescale = \{[\s\S]*?\n\}/,
          ''
        )
      }
      if (file === 'src/style.css') {
        lowerContent = lowerContent
          .replace(
            /\/\* final eof upstream sub2 status\/platform palette lock\. \*\/[\s\S]*/i,
            ''
          )
          .replace(
            /\/\* account platform\/type\/group badges keep upstream sub2 colors outside theme repaint\. \*\/[\s\S]*?\/\* final filter and badge lock:/i,
            '/* final filter and badge lock:'
          )
      }
      const leakedColor = legacyThemeColors.find((color) => lowerContent.includes(color))

      expect(leakedColor, `${file} still contains ${leakedColor}`).toBeUndefined()
    }
  })
})

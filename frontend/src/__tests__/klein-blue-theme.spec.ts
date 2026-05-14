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
  'src/utils/chartColors.ts',
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
  '#2e58ff',
  '#8aa1ff',
  '#b7c6ff',
  '#e5eaff',
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

  it('uses Klein blue as the primary Tailwind token and visible chart accent', () => {
    const tailwindConfig = readThemeFile('tailwind.config.js')
    const chartColors = readThemeFile('src/utils/chartColors.ts')

    expect(tailwindConfig).toContain(`500: '${kleinBlue}'`)
    expect(tailwindConfig).toContain('Klein blue theme')
    expect(chartColors).toContain(`'${kleinBlue}'`)
  })

  it('does not keep legacy blue-purple theme literals in runtime theme files', () => {
    for (const file of themeFiles) {
      const lowerContent = readThemeFile(file).toLowerCase()
      const leakedColor = legacyThemeColors.find((color) => lowerContent.includes(color))

      expect(leakedColor, `${file} still contains ${leakedColor}`).toBeUndefined()
    }
  })
})

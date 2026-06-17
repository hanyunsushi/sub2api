import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

describe('site branding source contracts', () => {
  it('updates the favicon from injected site settings before the app is mounted', () => {
    const main = readFile('src/main.ts')
    const app = readFile('src/App.vue')
    const favicon = readFile('src/utils/favicon.ts')

    expect(main).toContain("import { updateFavicon } from '@/utils/favicon'")
    expect(main).toContain('if (appStore.siteLogo) {')
    expect(main).toContain('updateFavicon(appStore.siteLogo)')
    expect(app).toContain("import { updateFavicon } from '@/utils/favicon'")
    expect(app).toContain('watch(\n  () => appStore.siteLogo,')
    expect(favicon).toContain('link[rel="icon"][data-site-favicon="true"], link[rel="icon"]')
    expect(favicon).toContain("link.dataset.siteFavicon = 'true'")
    expect(favicon).toContain("link.type = normalizedLogoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'")
  })

  it('removes the 300KB client cap from the website logo uploader only', () => {
    const settings = readFile('src/views/admin/SettingsView.vue')
    const imageUpload = readFile('src/components/common/ImageUpload.vue')
    const zh = readFile('src/i18n/locales/zh.ts')
    const en = readFile('src/i18n/locales/en.ts')

    expect(settings).toContain(':max-size="null"')
    expect(settings).not.toContain(':max-size="300 * 1024"')
    expect(imageUpload).toContain('maxSize?: number | null')
    expect(imageUpload).toContain("typeof props.maxSize === 'number' && props.maxSize > 0 && file.size > props.maxSize")
    expect(zh).toContain("logoHint: 'PNG、JPG 或 SVG 格式。建议：80x80px 正方形图片。'")
    expect(en).toContain("logoHint: 'PNG, JPG, or SVG. Recommended: 80x80px square image.'")
    expect(zh).not.toContain('最大 300KB')
    expect(en).not.toContain('Max 300KB')
  })

  it('styles the release update button as a terracotta action with white text', () => {
    const versionBadge = readFile('src/components/common/VersionBadge.vue')

    expect(versionBadge).toContain('class="version-update-action flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"')
    expect(versionBadge).toContain('.version-update-action {')
    expect(versionBadge).toContain('background: var(--atelier-terracotta-action, #c96442);')
    expect(versionBadge).toContain('color: var(--atelier-paper-2, #fffaf0);')
    expect(versionBadge).toContain('.version-update-action:hover:not(:disabled)')
    expect(versionBadge).not.toContain('bg-primary-500 px-4 py-2 text-sm font-medium text-white')
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const backupViewSource = readFileSync(resolve(__dirname, '../BackupView.vue'), 'utf8')
const backupApiSource = readFileSync(resolve(__dirname, '../../../api/admin/backup.ts'), 'utf8')
const zhLocaleSource = readFileSync(resolve(__dirname, '../../../i18n/locales/zh.ts'), 'utf8')
const enLocaleSource = readFileSync(resolve(__dirname, '../../../i18n/locales/en.ts'), 'utf8')

describe('BackupView has no Cloudflare AI Search management contract', () => {
  it('keeps the data backup screen focused on backups only', () => {
    expect(backupViewSource).not.toContain('admin.backup.aiSearch')
    expect(backupViewSource).not.toContain('aiSearchForm')
    expect(backupViewSource).not.toContain('CLOUDFLARE_ACCOUNT_ID_PATTERN')
    expect(backupViewSource).not.toContain('validateAISearchAccountID')
    expect(backupViewSource).not.toContain('saveAISearchConfig')
    expect(backupViewSource).not.toContain('testAISearchConfig')
    expect(backupViewSource).not.toContain('syncAISearchKnowledge')
    expect(backupViewSource).not.toContain('apiTokenConfigured')
    expect(backupViewSource).not.toContain('sub2api-user-knowledge.md')
  })

  it('does not expose admin backup API calls for AI Search config or manual sync', () => {
    expect(backupApiSource).not.toContain('interface AISearchBackendConfig')
    expect(backupApiSource).not.toContain("'/admin/backups/ai-search-config'")
    expect(backupApiSource).not.toContain("'/admin/backups/ai-search-config/test'")
    expect(backupApiSource).not.toContain("'/admin/backups/ai-search-sync'")
    expect(backupApiSource).not.toContain('getAISearchConfig')
    expect(backupApiSource).not.toContain('updateAISearchConfig')
    expect(backupApiSource).not.toContain('testAISearchConfig')
    expect(backupApiSource).not.toContain('syncAISearchKnowledge')
  })

  it('removes stale backup settings locale copy for Cloudflare AI Search', () => {
    expect(zhLocaleSource).not.toContain('Cloudflare AI Search 后端设置')
    expect(enLocaleSource).not.toContain('Cloudflare AI Search Backend')
    expect(zhLocaleSource).not.toContain('AI Search 知识库同步完成')
    expect(enLocaleSource).not.toContain('AI Search knowledge sync completed')
  })
})

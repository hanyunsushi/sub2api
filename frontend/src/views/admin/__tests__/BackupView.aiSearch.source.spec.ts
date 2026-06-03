import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const backupViewSource = readFileSync(resolve(__dirname, '../BackupView.vue'), 'utf8')
const backupApiSource = readFileSync(resolve(__dirname, '../../../api/admin/backup.ts'), 'utf8')

describe('BackupView AI Search backend settings contract', () => {
  it('adds Cloudflare AI Search backend settings to the data backup screen', () => {
    expect(backupViewSource).toContain('admin.backup.aiSearch.title')
    expect(backupViewSource).toContain('aiSearchForm.account_id')
    expect(backupViewSource).toContain('CLOUDFLARE_ACCOUNT_ID_PATTERN')
    expect(backupViewSource).toContain('validateAISearchAccountID')
    expect(backupViewSource).toContain('admin.backup.aiSearch.accountIdHint')
    expect(backupViewSource).toContain('admin.backup.aiSearch.accountIdInvalid')
    expect(backupViewSource).toContain('aiSearchForm.api_token')
    expect(backupViewSource).toContain('aiSearchForm.instance_id')
    expect(backupViewSource).toContain('ai-search')
    expect(backupViewSource).toContain('sub2api-user-knowledge.md')
    expect(backupViewSource).toContain('20 3 */3 * *')
    expect(backupViewSource).toContain('saveAISearchConfig')
    expect(backupViewSource).toContain('testAISearchConfig')
    expect(backupViewSource).toContain('syncAISearchKnowledge')
    expect(backupViewSource).toContain('apiTokenConfigured')
  })

  it('exposes admin backup API calls for AI Search config and manual sync', () => {
    expect(backupApiSource).toContain('interface AISearchBackendConfig')
    expect(backupApiSource).toContain("'/admin/backups/ai-search-config'")
    expect(backupApiSource).toContain("'/admin/backups/ai-search-config/test'")
    expect(backupApiSource).toContain("'/admin/backups/ai-search-sync'")
    expect(backupApiSource).toContain('getAISearchConfig')
    expect(backupApiSource).toContain('updateAISearchConfig')
    expect(backupApiSource).toContain('testAISearchConfig')
    expect(backupApiSource).toContain('syncAISearchKnowledge')
  })
})

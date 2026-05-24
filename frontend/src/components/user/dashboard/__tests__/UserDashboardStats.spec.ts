import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const statsSource = readFileSync(resolve(testDir, '../UserDashboardStats.vue'), 'utf8')
const quickActionsSource = readFileSync(resolve(testDir, '../UserDashboardQuickActions.vue'), 'utf8')
const recentUsageSource = readFileSync(resolve(testDir, '../UserDashboardRecentUsage.vue'), 'utf8')
const styleSource = readFileSync(resolve(testDir, '../../../../style.css'), 'utf8')

describe('user dashboard stat icons', () => {
  it('uses the shared atelier stat icon material instead of legacy solid color blocks', () => {
    expect(statsSource).toContain('class="dashboard-stat-icon"')
    expect(quickActionsSource).toContain('dashboard-stat-icon dashboard-stat-icon-lg')
    expect(recentUsageSource).toContain('class="dashboard-stat-icon"')
    expect(statsSource).not.toContain('rounded-lg bg-primary-100 p-2')
    expect(quickActionsSource).not.toContain('rounded-xl bg-primary-100')
    expect(recentUsageSource).not.toContain('rounded-xl bg-primary-100')
    expect(styleSource).toContain('.dashboard-stat-icon {')
    expect(styleSource).toContain('background: var(--atelier-material-1);')
    expect(styleSource).toContain('.dashboard-stat-icon svg,')
    expect(styleSource).toContain('.dashboard-stat-icon svg *')
    expect(styleSource).toContain('.dashboard-stat-icon path')
    expect(styleSource).toContain('fill: none !important;')
    expect(styleSource).toContain('stroke: currentColor !important;')
  })
})

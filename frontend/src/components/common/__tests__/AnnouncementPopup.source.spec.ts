import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const popupSource = readFileSync(resolve(__dirname, '../AnnouncementPopup.vue'), 'utf8')
const bellSource = readFileSync(resolve(__dirname, '../AnnouncementBell.vue'), 'utf8')

describe('announcement popup terracotta controls', () => {
  it('uses terracotta surfaces for user-visible announcement actions instead of blue primary utilities', () => {
    expect(popupSource).toContain('announcement-popup-icon')
    expect(popupSource).toContain('announcement-popup-badge')
    expect(popupSource).toContain('announcement-popup-accent')
    expect(popupSource).toContain('announcement-popup-dismiss')
    expect(popupSource).not.toContain('bg-primary-600 px-6 py-2.5')
    expect(popupSource).not.toContain('hover:bg-primary-700')

    expect(bellSource).toContain('announcement-bell-header-icon')
    expect(bellSource).toContain('announcement-bell-mark-all')
    expect(bellSource).toContain('announcement-bell-detail-icon')
    expect(bellSource).toContain('announcement-bell-detail-badge')
    expect(bellSource).toContain('announcement-bell-detail-mark')
  })
})

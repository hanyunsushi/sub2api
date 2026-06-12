import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../../../components/user/MonitorDetailDialog.vue'), 'utf8')

describe('MonitorDetailDialog layout source', () => {
  it('keeps channel monitor detail columns stable while the table scrolls', () => {
    expect(source).toContain('monitor-detail-table-scroll')
    expect(source).toContain('monitor-detail-table min-w-[760px] w-full table-fixed')
    expect(source).toContain('<colgroup>')
    expect(source).toContain('scrollbar-gutter: stable;')
    expect(source).toContain('white-space: nowrap;')
  })
})

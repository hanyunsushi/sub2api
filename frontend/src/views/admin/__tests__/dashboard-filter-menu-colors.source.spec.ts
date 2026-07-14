import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const selectSource = readFileSync(resolve(__dirname, '../../../components/common/Select.vue'), 'utf8')
const dateRangePickerSource = readFileSync(resolve(__dirname, '../../../components/common/DateRangePicker.vue'), 'utf8')

describe('dashboard filter menu colors', () => {
  it('keeps selected dropdown options readable with the same bright surface as hover', () => {
    expect(selectSource).toContain('--select-option-selected-surface: var(--anthropic-cookbook-hover, var(--atelier-ui-hover-surface));')
    expect(selectSource).toContain('--select-option-selected-text: var(--atelier-ink);')
    expect(selectSource).toContain('background: var(--select-option-selected-surface);')
    expect(selectSource).toContain('color: var(--select-option-selected-text);')
    expect(dateRangePickerSource).toContain('--date-picker-active-surface: var(--anthropic-cookbook-hover, var(--anthropic-raised));')
    expect(dateRangePickerSource).toContain('--date-picker-active-text: var(--anthropic-fg);')
    expect(selectSource).not.toContain('--select-option-selected-surface: var(--atelier-blue);')
    expect(selectSource).not.toContain('--select-option-selected-text: var(--atelier-white);')
    expect(dateRangePickerSource).not.toContain('--date-picker-active-surface: var(--atelier-blue);')
    expect(dateRangePickerSource).not.toContain('--date-picker-active-text: var(--atelier-white);')
  })

  it('does not force dashboard date menu text to paper white on light themes', () => {
    expect(selectSource).toContain('--select-option-text: var(--atelier-muted);')
    expect(selectSource).toContain('color: var(--atelier-ink);')
    expect(dateRangePickerSource).toContain('--date-picker-muted-text: var(--atelier-muted);')
    expect(dateRangePickerSource).toContain('color: var(--atelier-ink);')
    expect(selectSource).not.toContain('--select-option-text: var(--atelier-paper);')
    expect(dateRangePickerSource).not.toContain('--date-picker-muted-text: var(--atelier-paper);')
  })

  it('does not retain a Cloudflare-specific portal override', () => {
    for (const source of [styleSource, selectSource, dateRangePickerSource]) {
      expect(source).not.toContain('theme-cloudflare')
      expect(source).not.toContain('[data-theme="cloudflare"]')
    }
  })
})

import { describe, expect, it, vi } from 'vitest'

import {
  accountStatsChartColors,
  chartCategoricalColors,
  getOpsChartColors,
  getThemeAccent,
  tokenTrendColors,
  withChartAlpha,
} from '@/utils/chartColors'

describe('chartColors', () => {
  it('uses the Anthropic auxiliary palette with distinct semantic companions', () => {
    expect(chartCategoricalColors.slice(0, 6)).toEqual([
      '#6a9bcc',
      '#d1a24a',
      '#c46686',
      '#cbcadb',
      '#788c5d',
      '#d97757',
    ])
    expect(new Set(chartCategoricalColors).size).toBe(chartCategoricalColors.length)
  })

  it('uses functional token trend colors instead of a single brand hue', () => {
    expect(tokenTrendColors).toEqual({
      input: '#6a9bcc',
      output: '#d1a24a',
      cacheCreation: '#c46686',
      cacheRead: '#788c5d',
      cacheHitRate: '#d97757',
    })
  })

  it('exposes account statistics colors from the same chart palette', () => {
    expect(accountStatsChartColors).toEqual({
      accountBilled: '#6a9bcc',
      userBilled: '#788c5d',
      requests: '#d97757',
    })
  })

  it('exposes the Anthropic semantic palette for ops status lines', () => {
    expect(getOpsChartColors()).toMatchObject({
      brand: '#d97757',
      throughput: '#6396d6',
      tokenRate: '#eda100',
      switchRate: '#788c5d',
      requestError: '#b53333',
      upstreamError: '#6396d6',
      businessLimited: '#eda100',
      critical: '#b53333',
      warning: '#eda100',
      success: '#6ea100',
      neutral: '#e8e6dc',
    })
  })

  it('uses Slate as theme-accent fallback and alpha source', () => {
    expect(getThemeAccent()).toBe('#141413')
    expect(withChartAlpha('#141413', 0.2)).toBe('rgba(20, 20, 19, 0.2)')
  })

  it('reads the runtime accent when a browser-like document is available', () => {
    vi.stubGlobal('document', { documentElement: {} })
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => ' #6a9bcc ',
    }))

    expect(getThemeAccent()).toBe('#6a9bcc')

    vi.unstubAllGlobals()
  })
})

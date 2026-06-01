import { describe, expect, it, vi } from 'vitest'

import {
  chartCategoricalColors,
  getOpsChartColors,
  getThemeAccent,
  tokenTrendColors,
  withChartAlpha,
} from '@/utils/chartColors'

describe('chartColors', () => {
  it('uses a Cloudflare-informed categorical palette with distinct semantic companions', () => {
    expect(chartCategoricalColors.slice(0, 6)).toEqual([
      '#4290F0',
      '#F5B647',
      '#E8649D',
      '#8D58EE',
      '#50C3B6',
      '#D37536',
    ])
    expect(new Set(chartCategoricalColors).size).toBe(chartCategoricalColors.length)
  })

  it('uses functional token trend colors instead of a single brand hue', () => {
    expect(tokenTrendColors).toEqual({
      input: '#4290F0',
      output: '#F5B647',
      cacheCreation: '#E8649D',
      cacheRead: '#50C3B6',
      cacheHitRate: '#D37536',
    })
  })

  it('exposes an ops semantic palette for request, error and neutral chart lines', () => {
    expect(getOpsChartColors()).toMatchObject({
      brand: '#F48120',
      throughput: '#4290F0',
      tokenRate: '#F5B647',
      switchRate: '#50C3B6',
      requestError: '#F8A054',
      upstreamError: '#FC574A',
      businessLimited: '#B9D6FF',
      critical: '#FC574A',
      warning: '#F8A054',
      success: '#00A63E',
    })
  })

  it('uses official Cloudflare orange as theme-accent fallback and alpha source', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration)

    expect(getThemeAccent()).toBe('#F48120')
    expect(withChartAlpha('#F48120', 0.2)).toBe('rgba(244, 129, 32, 0.2)')
  })
})

import { describe, expect, it } from 'vitest'

import {
  aiLogoPresets,
  aiLogoUrlForProvider,
  providerBrandInfo,
  providerBrandModel
} from '../providerBrandIcon'

describe('provider brand icon resolution', () => {
  it('uses provider-first seeds for stable color brand icons', () => {
    expect(providerBrandModel('openai', 'gpt-5.5')).toBe('gpt')
    expect(providerBrandModel('anthropic', 'claude-sonnet-4-5')).toBe('claude')
    expect(providerBrandModel('gemini', 'gemini-2.5-pro')).toBe('gemini')
    expect(providerBrandModel('deepseek', 'deepseek-chat')).toBe('deepseek')
    expect(providerBrandModel('volcengine', 'doubao-seed-1-6')).toBe('doubao')
  })

  it('resolves shared AI logo CDN images for picker and pricing icons', () => {
    expect(aiLogoPresets.length).toBeGreaterThan(60)
    expect(aiLogoPresets[0]).toMatchObject({
      id: 'openai',
      label: 'OpenAI',
      url: 'https://unpkg.com/@lobehub/icons-static-png@1.91.0/light/openai.png'
    })
    expect(aiLogoPresets.some((preset) => preset.id === 'bailian' && preset.url.endsWith('/bailian-color.png'))).toBe(true)
    expect(aiLogoPresets.some((preset) => preset.id === 'claudecode' && preset.url.endsWith('/claudecode-color.png'))).toBe(true)
    expect(aiLogoPresets.some((preset) => preset.id === 'cursor' && preset.url.endsWith('/cursor.png'))).toBe(true)
    expect(aiLogoUrlForProvider('openai', 'gpt-5.5')).toBe(aiLogoPresets[0].url)
    expect(aiLogoUrlForProvider('anthropic', 'claude-sonnet-4-5')).toContain('/claude-color.png')
    expect(aiLogoUrlForProvider('gemini', 'gemini-2.5-pro')).toContain('/gemini-color.png')
    expect(aiLogoUrlForProvider('dashscope', 'qwen-max')).toContain('/qwen-color.png')
    expect(aiLogoUrlForProvider('bailian', 'qwen-max')).toContain('/bailian-color.png')
    expect(aiLogoUrlForProvider('claude-code-router', 'claude-sonnet-4-5')).toContain('/claudecode-color.png')
    expect(aiLogoUrlForProvider('cursor', 'claude-sonnet-4-5')).toContain('/cursor.png')
    expect(aiLogoUrlForProvider('gemini-cli', 'gemini-2.5-pro')).toContain('/geminicli-color.png')
    expect(providerBrandInfo('openrouter')?.iconUrl).toContain('/openrouter.png')
  })

  it('covers common LiteLLM and vendor aliases with recognizable icon seeds', () => {
    expect(providerBrandModel('text-completion-openai', '')).toBe('gpt')
    expect(providerBrandModel('openrouter', '')).toBe('openrouter')
    expect(providerBrandModel('mistral', '')).toBe('mistral')
    expect(providerBrandModel('qwen', '')).toBe('qwen')
    expect(providerBrandModel('cohere', '')).toBe('command')
    expect(providerBrandModel('perplexity', '')).toBe('perplexity')
    expect(providerBrandModel('moonshot', '')).toBe('moonshot')
    expect(providerBrandModel('zhipu', '')).toBe('glm')
    expect(providerBrandModel('cloudflare', '')).toBe('@cf/')
  })

  it('uses colored provider tiles for platforms without dedicated SVG model icons', () => {
    expect(providerBrandInfo('bedrock')?.label).toBe('AWS')
    expect(providerBrandInfo('bedrock')?.iconModel).toBeNull()
    expect(providerBrandInfo('vertex_ai-language-models')?.label).toBe('G')
    expect(providerBrandInfo('azure')?.label).toBe('Az')
    expect(providerBrandInfo('groq')?.label).toBe('GQ')
  })

  it('falls back to deterministic colored initials for unknown providers', () => {
    const brand = providerBrandInfo('new-provider-x')
    expect(brand.label).toBe('NP')
    expect(brand.iconModel).toBeNull()
    expect(brand.background).toMatch(/^#/)
    expect(brand.color).toMatch(/^#/)
  })
})

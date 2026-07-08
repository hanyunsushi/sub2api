import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const createAccountModalSource = readFileSync(
  resolve(__dirname, '../CreateAccountModal.vue'),
  'utf8',
)

const sourceSlice = (startText: string, endText: string) => {
  const startIndex = createAccountModalSource.indexOf(startText)
  expect(startIndex, `start marker not found: ${startText}`).toBeGreaterThan(-1)
  const endIndex = createAccountModalSource.indexOf(endText, startIndex)
  expect(endIndex, `end marker not found: ${endText}`).toBeGreaterThan(startIndex)
  return createAccountModalSource.slice(startIndex, endIndex)
}

describe('CreateAccountModal visual source contracts', () => {
  it('keeps Anthropic account choices on the terracotta platform accent', () => {
    const anthropicSection = sourceSlice(
      '<!-- Account Type Selection (Anthropic) -->',
      '<!-- Account Type Selection (OpenAI) -->',
    )

    expect(anthropicSection).toContain('text-[var(--anthropic-accent)]')
    expect(anthropicSection).toContain('border-[var(--anthropic-accent)]')
    expect(anthropicSection).toContain('bg-[var(--anthropic-accent)]')
    expect(anthropicSection).toContain('color-mix(in_srgb,var(--anthropic-accent)_12%,var(--anthropic-page))')
    expect(anthropicSection).not.toMatch(/border-(orange|purple|amber|sky|blue)-500/)
    expect(anthropicSection).not.toMatch(/hover:border-(orange|purple|amber|sky|blue)-300/)
    expect(anthropicSection).not.toMatch(/bg-(orange|purple|amber|sky|blue)-50/)
  })

  it('does not use the old blue border interaction for Gemini OAuth choices', () => {
    const geminiSection = sourceSlice(
      '<!-- Account Type Selection (Gemini) -->',
      '<!-- Advanced Options Toggle -->',
    )

    expect(geminiSection).not.toContain('border-blue-500')
    expect(geminiSection).not.toContain('hover:border-blue-300')
    expect(geminiSection).not.toContain('bg-blue-500')
    expect(geminiSection).not.toContain('bg-blue-50')
    expect(geminiSection).toContain('border-[var(--anthropic-fg)]')
    expect(geminiSection).toContain('hover:border-[var(--anthropic-border-hover)]')
  })
})

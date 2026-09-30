/**
 * Shared platform presentation helpers.
 *
 * Platform identity remains visible through labels and icons. Surfaces,
 * borders, and text use the Anthropic semantic palette so shared badges do
 * not reintroduce provider-specific theme ramps.
 */

export type Platform =
  | 'anthropic'
  | 'openai'
  | 'antigravity'
  | 'gemini'
  | 'grok'
  | 'kimi'
  | 'zhipu'
  | 'deepseek'
  | 'minimax'
  | 'opencode_go'
  | 'composite'

type SemanticTone = 'success' | 'info' | 'warning' | 'neutral'

const PLATFORM_TONE: Record<Platform, SemanticTone> = {
  anthropic: 'warning',
  openai: 'success',
  antigravity: 'info',
  gemini: 'info',
  grok: 'neutral',
  kimi: 'info',
  zhipu: 'info',
  deepseek: 'success',
  minimax: 'warning',
  opencode_go: 'warning',
  composite: 'info',
}

const TONE_TEXT: Record<SemanticTone, string> = {
  success: 'var(--anthropic-success)',
  info: 'var(--anthropic-info)',
  warning: 'var(--anthropic-warning)',
  neutral: 'var(--anthropic-muted)',
}

const TONE_TEXT_CLASS: Record<SemanticTone, string> = {
  success: 'text-[var(--anthropic-success)]',
  info: 'text-[var(--anthropic-info)]',
  warning: 'text-[var(--anthropic-warning)]',
  neutral: 'text-[var(--anthropic-muted)]',
}
const TONE_BORDER_CLASS: Record<SemanticTone, string> = {
  success: 'border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)]',
  info: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
  warning: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)]',
  neutral: 'border-[var(--anthropic-border-subtle)]',
}
const TONE_STRONG_BORDER_CLASS: Record<SemanticTone, string> = {
  success: 'border-[color-mix(in_srgb,var(--anthropic-success)_48%,transparent)]',
  info: 'border-[color-mix(in_srgb,var(--anthropic-info)_48%,transparent)]',
  warning: 'border-[color-mix(in_srgb,var(--anthropic-warning)_48%,transparent)]',
  neutral: 'border-[var(--anthropic-border-hover)]',
}
const TONE_BAR_CLASS: Record<SemanticTone, string> = {
  success: 'bg-[var(--anthropic-success)]',
  info: 'bg-[var(--anthropic-info)]',
  warning: 'bg-[var(--anthropic-warning)]',
  neutral: 'bg-[var(--anthropic-raised)]',
}
const TONE_BUTTON_CLASS: Record<SemanticTone, string> = {
  success: 'bg-[var(--anthropic-success)] text-[var(--anthropic-page)] hover:bg-[color-mix(in_srgb,var(--anthropic-success)_82%,var(--anthropic-fg))]',
  info: 'bg-[var(--anthropic-info)] text-[var(--anthropic-page)] hover:bg-[color-mix(in_srgb,var(--anthropic-info)_82%,var(--anthropic-fg))]',
  warning: 'bg-[var(--anthropic-warning)] text-[var(--anthropic-page)] hover:bg-[color-mix(in_srgb,var(--anthropic-warning)_82%,var(--anthropic-fg))]',
  neutral: 'bg-[var(--anthropic-muted)] text-[var(--anthropic-page)] hover:bg-[var(--anthropic-fg)]',
}
const TONE_GRADIENT_CLASS: Record<SemanticTone, string> = {
  success: 'from-[var(--anthropic-success)] to-[var(--anthropic-success)]',
  info: 'from-[var(--anthropic-info)] to-[var(--anthropic-info)]',
  warning: 'from-[var(--anthropic-warning)] to-[var(--anthropic-warning)]',
  neutral: 'from-[var(--anthropic-muted)] to-[var(--anthropic-muted)]',
}
const semanticText = (tone: SemanticTone) => TONE_TEXT_CLASS[tone]
const semanticBorder = (tone: SemanticTone) => TONE_BORDER_CLASS[tone]
const semanticStrongBorder = (tone: SemanticTone) => TONE_STRONG_BORDER_CLASS[tone]

const BADGE: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => {
    const tone = PLATFORM_TONE[platform]
    return [platform, 'bg-transparent ' + semanticText(tone) + ' ' + semanticBorder(tone)]
  }),
) as Record<Platform, string>

const BADGE_LIGHT = BADGE
const BORDER: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    semanticBorder(PLATFORM_TONE[platform]),
  ]),
) as Record<Platform, string>
const BORDER_STRONG: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    semanticStrongBorder(PLATFORM_TONE[platform]),
  ]),
) as Record<Platform, string>

const ACCENT: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    TONE_TEXT[PLATFORM_TONE[platform]],
  ]),
) as Record<Platform, string>

const ACCENT_BAR: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    TONE_BAR_CLASS[PLATFORM_TONE[platform]],
  ]),
) as Record<Platform, string>

const TEXT: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    semanticText(PLATFORM_TONE[platform]),
  ]),
) as Record<Platform, string>
const ICON = TEXT

const BUTTON: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => {
    return [platform, TONE_BUTTON_CLASS[PLATFORM_TONE[platform]]]
  }),
) as Record<Platform, string>

const DISCOUNT: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    'bg-transparent ' + semanticText(PLATFORM_TONE[platform]) + ' ' + semanticBorder(PLATFORM_TONE[platform]),
  ]),
) as Record<Platform, string>

const GRADIENT: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => {
    return [platform, TONE_GRADIENT_CLASS[PLATFORM_TONE[platform]]]
  }),
) as Record<Platform, string>
const GRADIENT_TEXT: Record<Platform, string> = TEXT
const GRADIENT_SUBTEXT: Record<Platform, string> = Object.fromEntries(
  (Object.keys(PLATFORM_TONE) as Platform[]).map((platform) => [
    platform,
    'text-[var(--anthropic-raised)]',
  ]),
) as Record<Platform, string>

const BADGE_DEFAULT = 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]'
const BORDER_DEFAULT = 'border-[var(--anthropic-border)]'
const BORDER_STRONG_DEFAULT = 'border-[var(--anthropic-border-hover)]'
const ACCENT_DEFAULT = 'var(--anthropic-info)'
const ACCENT_BAR_DEFAULT = 'bg-[var(--anthropic-raised)]'
const TEXT_DEFAULT = 'text-[var(--anthropic-fg)]'
const BUTTON_DEFAULT = 'bg-[var(--anthropic-fg)] text-[var(--anthropic-page)] hover:bg-[var(--anthropic-fg-hover)]'
const DISCOUNT_DEFAULT = 'bg-transparent text-[var(--anthropic-muted)] border border-[var(--anthropic-border-subtle)]'
const GRADIENT_DEFAULT = 'from-[var(--anthropic-fg)] to-[var(--anthropic-fg)]'
const GRADIENT_TEXT_DEFAULT = 'text-[var(--anthropic-page)]'
const GRADIENT_SUBTEXT_DEFAULT = 'text-[var(--anthropic-raised)]'

function isPlatform(p: string): p is Platform {
  return Object.prototype.hasOwnProperty.call(PLATFORM_TONE, p)
}

export function platformBadgeClass(p: string): string {
  return isPlatform(p) ? BADGE[p] : BADGE_DEFAULT
}

export function platformBadgeLightClass(p: string): string {
  return isPlatform(p) ? BADGE_LIGHT[p] : BADGE_DEFAULT
}

export function platformBorderClass(p: string): string {
  return isPlatform(p) ? BORDER[p] : BORDER_DEFAULT
}

export function platformBorderStrongClass(p: string): string {
  return isPlatform(p) ? BORDER_STRONG[p] : BORDER_STRONG_DEFAULT
}

export function platformAccentColor(p: string): string {
  return isPlatform(p) ? ACCENT[p] : ACCENT_DEFAULT
}

export function platformAccentBarClass(p: string): string {
  return isPlatform(p) ? ACCENT_BAR[p] : ACCENT_BAR_DEFAULT
}

export function platformTextClass(p: string): string {
  return isPlatform(p) ? TEXT[p] : TEXT_DEFAULT
}

export function platformIconClass(p: string): string {
  return isPlatform(p) ? ICON[p] : TEXT_DEFAULT
}

export function platformButtonClass(p: string): string {
  return isPlatform(p) ? BUTTON[p] : BUTTON_DEFAULT
}

export function platformDiscountClass(p: string): string {
  return isPlatform(p) ? DISCOUNT[p] : DISCOUNT_DEFAULT
}

export function platformGradientClass(p: string): string {
  return isPlatform(p) ? GRADIENT[p] : GRADIENT_DEFAULT
}

export function platformGradientTextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_TEXT[p] : GRADIENT_TEXT_DEFAULT
}

export function platformGradientSubtextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_SUBTEXT[p] : GRADIENT_SUBTEXT_DEFAULT
}

export function platformLabel(p: string): string {
  switch (p) {
    case 'anthropic': return 'Anthropic'
    case 'openai': return 'OpenAI'
    case 'antigravity': return 'Antigravity'
    case 'gemini': return 'Gemini'
    case 'grok': return 'Grok'
    case 'kimi': return 'Kimi'
    case 'zhipu': return 'Zhipu GLM'
    case 'deepseek': return 'DeepSeek'
    case 'minimax': return 'MiniMax'
    case 'opencode_go': return 'OpenCode'
    case 'composite': return 'Composite'
    default: return p || 'API'
  }
}

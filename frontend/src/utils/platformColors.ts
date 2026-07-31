/**
 * Centralized platform color definitions.
 *
 * All components that need platform-specific styling should import from here
 * instead of defining their own color mappings.
 */

export type Platform = 'anthropic' | 'openai' | 'antigravity' | 'gemini' | 'grok' | 'composite'

// ── Badge (bg + text + border, for inline badges with border) ───────
const BADGE: Record<Platform, string> = {
  anthropic: 'bg-transparent text-[var(--anthropic-accent)] border-[color-mix(in_srgb,var(--anthropic-accent)_32%,transparent)]',
  openai: 'bg-transparent text-[var(--anthropic-success)] border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)]',
  antigravity: 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]',
  gemini: 'bg-transparent text-[var(--anthropic-info)] border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
  grok: 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]',
  composite: 'bg-transparent text-[var(--anthropic-info)] border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
}
const BADGE_DEFAULT = 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]'

// ── Light badge (transparent surface + semantic hairline) ───────────
const BADGE_LIGHT: Record<Platform, string> = {
  anthropic: 'bg-transparent text-[var(--anthropic-accent)] border-[color-mix(in_srgb,var(--anthropic-accent)_32%,transparent)]',
  openai: 'bg-transparent text-[var(--anthropic-success)] border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)]',
  antigravity: 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]',
  gemini: 'bg-transparent text-[var(--anthropic-info)] border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
  grok: 'bg-transparent text-[var(--anthropic-muted)] border-[var(--anthropic-border-subtle)]',
  composite: 'bg-transparent text-[var(--anthropic-info)] border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
}

// ── Border ──────────────────────────────────────────────────────────
const BORDER: Record<Platform, string> = {
  anthropic: 'border-[var(--atelier-line)]',
  openai: 'border-[var(--atelier-line)]',
  antigravity: 'border-[var(--atelier-line)]',
  gemini: 'border-[var(--atelier-line)]',
  grok: 'border-[var(--atelier-line)]',
  composite: 'border-[var(--atelier-line)]',
}
const BORDER_DEFAULT = 'border-[var(--atelier-line)] dark:border-[var(--anthropic-border)]'

// ── Border strong (higher-contrast platform tint, e.g. plaza group cards) ──
const BORDER_STRONG: Record<Platform, string> = {
  anthropic: 'border-orange-500/35 dark:border-orange-500/30',
  openai: 'border-green-500/35 dark:border-green-500/30',
  antigravity: 'border-purple-500/35 dark:border-purple-500/30',
  gemini: 'border-blue-500/35 dark:border-blue-500/30',
  grok: 'border-zinc-800/35 dark:border-zinc-500/35',
  composite: 'border-cyan-500/35 dark:border-cyan-500/30',
}
const BORDER_STRONG_DEFAULT = 'border-gray-300 dark:border-dark-600'

// ── Accent (single raw color per platform; consumers derive washes/tints
//    from it via CSS color-mix, e.g. plaza paid-price zone) ──
const ACCENT: Record<Platform, string> = {
  anthropic: '#f97316', // orange-500
  openai: '#22c55e', // green-500
  antigravity: '#a855f7', // purple-500
  gemini: '#3b82f6', // blue-500
  grok: '#71717a', // zinc-500
  composite: '#06b6d4', // cyan-500
}
const ACCENT_DEFAULT = '#14b8a6' // primary-500 (teal)

// ── Accent bar (gradient) ───────────────────────────────────────────
const ACCENT_BAR: Record<Platform, string> = {
  anthropic: 'bg-[var(--anthropic-accent)]',
  openai: 'bg-[var(--anthropic-success)]',
  antigravity: 'bg-[var(--anthropic-raised)]',
  gemini: 'bg-[var(--anthropic-info)]',
  grok: 'bg-[var(--anthropic-raised)]',
  composite: 'bg-[var(--anthropic-info)]',
}
const ACCENT_BAR_DEFAULT = 'bg-[var(--anthropic-raised)]'

// ── Text (price, icon) ─────────────────────────────────────────────
const TEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--anthropic-accent)]',
  openai: 'text-[var(--anthropic-success)]',
  antigravity: 'text-[var(--anthropic-muted)]',
  gemini: 'text-[var(--anthropic-info)]',
  grok: 'text-[var(--anthropic-muted)]',
  composite: 'text-[var(--anthropic-info)]',
}
const TEXT_DEFAULT = 'text-[var(--anthropic-fg)]'

// ── Icon (check mark etc.) ──────────────────────────────────────────
const ICON: Record<Platform, string> = {
  anthropic: 'text-[var(--anthropic-accent)]',
  openai: 'text-[var(--anthropic-success)]',
  antigravity: 'text-[var(--anthropic-muted)]',
  gemini: 'text-[var(--anthropic-info)]',
  grok: 'text-[var(--anthropic-muted)]',
  composite: 'text-[var(--anthropic-info)]',
}
const ICON_DEFAULT = 'text-[var(--anthropic-fg)]'

// ── Button (solid bg) ───────────────────────────────────────────────
const BUTTON: Record<Platform, string> = {
  anthropic: 'bg-[var(--anthropic-clay-interactive)] text-[var(--anthropic-page)] hover:bg-[var(--anthropic-accent-hover)] active:bg-[var(--anthropic-accent-hover)]',
  openai: 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)] active:bg-[var(--atelier-dark)]',
  antigravity: 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)] active:bg-[var(--atelier-dark)]',
  gemini: 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)] active:bg-[var(--atelier-dark)]',
  grok: 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)] active:bg-[var(--atelier-dark)]',
  composite: 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)] active:bg-[var(--atelier-dark)]',
}
const BUTTON_DEFAULT = 'bg-[var(--atelier-ink)] text-[var(--atelier-paper)] hover:bg-[var(--atelier-dark)]'

// ── Discount badge ──────────────────────────────────────────────────
const DISCOUNT: Record<Platform, string> = {
  anthropic: 'bg-transparent text-[var(--anthropic-accent)] border border-[color-mix(in_srgb,var(--anthropic-accent)_32%,transparent)]',
  openai: 'bg-transparent text-[var(--anthropic-success)] border border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)]',
  antigravity: 'bg-transparent text-[var(--anthropic-muted)] border border-[var(--anthropic-border-subtle)]',
  gemini: 'bg-transparent text-[var(--anthropic-info)] border border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
  grok: 'bg-transparent text-[var(--anthropic-muted)] border border-[var(--anthropic-border-subtle)]',
  composite: 'bg-transparent text-[var(--anthropic-info)] border border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
}
const DISCOUNT_DEFAULT = 'bg-transparent text-[var(--anthropic-muted)] border border-[var(--anthropic-border-subtle)]'

// ── Header gradient (subscription confirm) ─────────────────────────
const GRADIENT: Record<Platform, string> = {
  anthropic: 'from-[var(--anthropic-clay-interactive)] to-[var(--anthropic-accent-hover)]',
  openai: 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]',
  antigravity: 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]',
  gemini: 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]',
  grok: 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]',
  composite: 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]',
}
const GRADIENT_DEFAULT = 'from-[var(--atelier-ink)] to-[var(--atelier-dark)]'

// ── Header text (light text on gradient bg) ────────────────────────
const GRADIENT_TEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--anthropic-page)]',
  openai: 'text-[var(--anthropic-page)]',
  antigravity: 'text-[var(--anthropic-page)]',
  gemini: 'text-[var(--anthropic-page)]',
  grok: 'text-[var(--anthropic-page)]',
  composite: 'text-[var(--anthropic-page)]',
}
const GRADIENT_TEXT_DEFAULT = 'text-[var(--anthropic-page)]'

const GRADIENT_SUBTEXT: Record<Platform, string> = {
  anthropic: 'text-[var(--anthropic-raised)]',
  openai: 'text-[var(--anthropic-raised)]',
  antigravity: 'text-[var(--anthropic-raised)]',
  gemini: 'text-[var(--anthropic-raised)]',
  grok: 'text-[var(--anthropic-raised)]',
  composite: 'text-[var(--anthropic-raised)]',
}
const GRADIENT_SUBTEXT_DEFAULT = 'text-[var(--anthropic-raised)]'

// ── Public API ──────────────────────────────────────────────────────

function isPlatform(p: string): p is Platform {
  return p === 'anthropic' || p === 'openai' || p === 'antigravity' || p === 'gemini' || p === 'grok' || p === 'composite'
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
  return isPlatform(p) ? ICON[p] : ICON_DEFAULT
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
    case 'composite': return 'Composite'
    default: return p || 'API'
  }
}

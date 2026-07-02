export type SemanticBadgeTone = 'success' | 'info' | 'warning' | 'error' | 'neutral'

const BORDER_BY_TONE: Record<SemanticBadgeTone, string> = {
  success: 'border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)]',
  info: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)]',
  warning: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)]',
  error: 'border-[color-mix(in_srgb,var(--anthropic-error)_32%,transparent)]',
  neutral: 'border-[var(--anthropic-border-subtle)]',
}

const TEXT_BY_TONE: Record<SemanticBadgeTone, string> = {
  success: 'text-[var(--anthropic-success)]',
  info: 'text-[var(--anthropic-info)]',
  warning: 'text-[var(--anthropic-warning)]',
  error: 'text-[var(--anthropic-error)]',
  neutral: 'text-[var(--anthropic-muted)]',
}

export const semanticBadgeClass = (tone: SemanticBadgeTone): string =>
  `border bg-transparent ${TEXT_BY_TONE[tone]} ${BORDER_BY_TONE[tone]}`

export const semanticBadgeTextClass = (tone: SemanticBadgeTone): string => TEXT_BY_TONE[tone]

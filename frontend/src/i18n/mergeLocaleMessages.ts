export type LocaleMessageTree = Record<string, unknown>

function isMessageTree(value: unknown): value is LocaleMessageTree {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function mergeLocaleMessages(
  base: LocaleMessageTree,
  overrides: LocaleMessageTree
): LocaleMessageTree {
  const merged: LocaleMessageTree = { ...base }

  for (const [key, value] of Object.entries(overrides)) {
    const current = merged[key]
    merged[key] = isMessageTree(current) && isMessageTree(value)
      ? mergeLocaleMessages(current, value)
      : value
  }

  return merged
}

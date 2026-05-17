const CHUNK_RELOAD_KEY = 'chunk_reload_attempted'
const CHUNK_RELOAD_COOLDOWN_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  const maybeError = error as { message?: string; name?: string } | undefined
  const message = maybeError?.message || String(error || '')
  const name = maybeError?.name || ''

  return (
    name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('dynamically imported module')
  )
}

export function reloadAfterChunkLoadError(now = Date.now()): boolean {
  const lastReload = sessionStorage.getItem(CHUNK_RELOAD_KEY)

  if (!lastReload || now - Number.parseInt(lastReload, 10) > CHUNK_RELOAD_COOLDOWN_MS) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString())
    window.location.reload()
    return true
  }

  return false
}

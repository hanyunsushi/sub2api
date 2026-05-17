import { afterEach, describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadAfterChunkLoadError } from '../chunkLoadRecovery'

describe('chunkLoadRecovery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('recognizes common dynamic import failures', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true)
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'Loading chunk 42 failed' })).toBe(true)
    expect(isChunkLoadError(new Error('network request failed'))).toBe(false)
  })

  it('reloads once per cooldown window after a chunk load failure', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })

    expect(reloadAfterChunkLoadError(1_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)

    expect(reloadAfterChunkLoadError(5_000)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)

    expect(reloadAfterChunkLoadError(12_001)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})

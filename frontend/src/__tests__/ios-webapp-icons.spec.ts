import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function readPngSize(path: string): { width: number; height: number } {
  const data = readFileSync(path)
  expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  }
}

describe('iOS web app icons', () => {
  it('declares stable iOS and PWA icon paths in the document head', () => {
    const html = readFileSync(resolve(frontendRoot, 'index.html'), 'utf8')

    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />')
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Sub2API" />')
  })

  it('ships square PNG assets for iOS and PWA install surfaces', () => {
    expect(readPngSize(resolve(frontendRoot, 'public/apple-touch-icon.png'))).toEqual({
      width: 180,
      height: 180
    })
    expect(readPngSize(resolve(frontendRoot, 'public/icon-192.png'))).toEqual({
      width: 192,
      height: 192
    })
    expect(readPngSize(resolve(frontendRoot, 'public/icon-512.png'))).toEqual({
      width: 512,
      height: 512
    })
  })

  it('lists the install icons in the web app manifest', () => {
    const manifest = JSON.parse(readFileSync(resolve(frontendRoot, 'public/site.webmanifest'), 'utf8'))

    expect(manifest.name).toBe('Sub2API')
    expect(manifest.icons).toEqual([
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ])
  })
})

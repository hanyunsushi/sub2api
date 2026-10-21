import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const root = process.env.CONSOLE_MFE_OUT_DIR ? pathToFileURL(path.resolve(process.env.CONSOLE_MFE_OUT_DIR) + path.sep) : new URL('../output/microfrontend/', import.meta.url)
const css = fs.readFileSync(new URL('style.css', root), 'utf8')
if (!css.includes('@scope (.console-kreepai-surface)')) throw new Error('Microfrontend stylesheet is not isolated')
const entry = fs.readFileSync(new URL('kreepai-microfrontend.js', root), 'utf8')
if (!/as mount/.test(entry)) throw new Error('Public mount export is missing')
const javascript = fs.readdirSync(root, { recursive: true }).filter(name => name.endsWith('.js')).map(name => fs.readFileSync(new URL(name, root), 'utf8')).join('\n')
if (!javascript.includes('/api/kreepai/api/v1')) throw new Error('Console API namespace is missing')
if (!javascript.includes('#console-kreepai-overlays')) throw new Error('Teleport target adapter is missing')
console.log('Kreepai microfrontend artifact: scoped CSS, ESM entry, API and Teleport namespaces verified')

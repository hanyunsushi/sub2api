import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const srcRoot = resolve(__dirname, '..')
const nativeInteractiveTags = new Set(['button', 'input', 'select', 'textarea'])

const walkVueFiles = (dir: string, acc: string[] = []) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      walkVueFiles(fullPath, acc)
    } else if (fullPath.endsWith('.vue')) {
      acc.push(fullPath)
    }
  }
  return acc
}

const templateBlocks = (source: string) => source.match(/<template[\s\S]*?<\/template>/g) ?? []

const hasTestId = (attrs: string) => /\b:?data-testid\s*=/.test(attrs)
const hasClickBehavior = (attrs: string) => /(?:@click|v-on:click)(?:\b|[.:])/.test(attrs)
const hasButtonRole = (attrs: string) => /\brole\s*=\s*["']button["']/.test(attrs)
const hasHref = (attrs: string) => /\bhref\s*=|:href\s*=/.test(attrs)

const isInteractiveElement = (tagName: string, attrs: string) => {
  if (nativeInteractiveTags.has(tagName)) return true
  if (tagName === 'a' && (hasHref(attrs) || hasClickBehavior(attrs) || hasButtonRole(attrs))) return true
  return /^[a-z][\w-]*$/.test(tagName) && (hasClickBehavior(attrs) || hasButtonRole(attrs))
}

describe('data-testid coverage', () => {
  it('keeps every native interactive Vue template element addressable for browser verification', () => {
    const missing = []

    for (const file of walkVueFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      for (const template of templateBlocks(source)) {
        const tagPattern = /<([A-Za-z][\w.:-]*)(\s[\s\S]*?)(?:\/?)>/g
        let match: RegExpExecArray | null

        while ((match = tagPattern.exec(template))) {
          const [, tagName, attrs = ''] = match
          if (!isInteractiveElement(tagName, attrs) || hasTestId(attrs)) continue

          const line = source.slice(0, source.indexOf(template) + match.index).split('\n').length
          missing.push(`${relative(srcRoot, file)}:${line} <${tagName}>`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})

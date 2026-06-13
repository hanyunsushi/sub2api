#!/usr/bin/env node
/**
 * build-frontend-index.mjs — Frontend locator index generator (READ-ONLY analysis).
 *
 * Purpose: give an automated agent a reliable "change map" of the frontend so it can
 * precisely locate which file/line owns any class, component, route, or test anchor
 * BEFORE editing. This is the cross-reference layer that a symbol graph (codegraph /
 * LSP) does NOT provide: it links global CSS selectors to the templates that use them.
 *
 * It produces (under frontend/.frontend-index/, git-ignored):
 *   - class-xref.json          CSS class -> {definedAt:[style.css lines], usedIn:[vue files]}
 *   - component-route-map.json route path -> component file -> imported child components
 *   - testid-registry.json     data-testid -> [files]; plus per-file coverage gaps
 *   - INDEX.md                 human/agent-readable summary + how-to
 *
 * Constraints: no external deps (Node built-ins only), never writes into src/, pure read.
 * Parsing is regex-based and intentionally conservative; treat output as a high-recall
 * starting point, then confirm exact spots with ast-grep / Read before editing.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = resolve(__dirname, '..')
const SRC = join(FRONTEND_ROOT, 'src')
const OUT_DIR = join(FRONTEND_ROOT, '.frontend-index')
const STYLE_CSS = join(SRC, 'style.css')
const ROUTER_INDEX = join(SRC, 'router', 'index.ts')
const ROUTER_CODEX = join(SRC, 'router', 'codex.ts')

const rel = (p) => relative(FRONTEND_ROOT, p).split('\\').join('/')

/** Recursively list files under dir matching a predicate. */
function walk(dir, test, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.frontend-index' || entry.startsWith('.git')) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, test, acc)
    else if (test(full)) acc.push(full)
  }
  return acc
}

const vueFiles = walk(SRC, (f) => f.endsWith('.vue'))

// ---------------------------------------------------------------------------
// 1) class-xref: CSS class -> where defined (style.css lines) + where used (.vue)
// ---------------------------------------------------------------------------
function buildClassXref() {
  const defined = new Map() // class -> Set(lineNumbers)
  if (existsSync(STYLE_CSS)) {
    const lines = readFileSync(STYLE_CSS, 'utf8').split('\n')
    // Match class tokens in selectors only (skip declaration bodies). Heuristic:
    // collect .class-name occurrences on lines that look like selectors (contain '{'
    // on this or a recent line is hard with regex; instead capture every .token but
    // ignore ones inside url()/strings by simple filtering).
    lines.forEach((line, i) => {
      const lineNo = i + 1
      // crude selector detection: lines that are not pure declarations
      const isDeclaration = /^\s*[a-z-]+\s*:/i.test(line)
      if (isDeclaration) return
      const re = /\.([a-zA-Z_][\w-]*)/g
      let m
      while ((m = re.exec(line))) {
        const cls = m[1]
        if (!defined.has(cls)) defined.set(cls, new Set())
        defined.get(cls).add(lineNo)
      }
    })
  }

  const usedIn = new Map() // class -> Set(file)
  for (const file of vueFiles) {
    const src = readFileSync(file, 'utf8')
    // template region only: between first <template> and its close (greedy ok for SFC)
    const tplMatch = src.match(/<template[\s\S]*?<\/template>/g) || []
    const tpl = tplMatch.join('\n')
    if (!tpl) continue
    // class="..." and :class with string literals
    const attrRe = /class\s*=\s*"([^"]*)"|:class\s*=\s*"([^"]*)"|'([a-zA-Z][\w-]*)'/g
    let m
    while ((m = attrRe.exec(tpl))) {
      const blob = m[1] || m[2] || m[3] || ''
      for (const tok of blob.split(/[\s'"`{}[\],?:]+/)) {
        const cls = tok.trim()
        if (!cls || !/^[a-zA-Z_][\w-]*$/.test(cls)) continue
        if (!usedIn.has(cls)) usedIn.set(cls, new Set())
        usedIn.get(cls).add(rel(file))
      }
    }
  }

  const allClasses = new Set([...defined.keys(), ...usedIn.keys()])
  const xref = {}
  for (const cls of [...allClasses].sort()) {
    const def = defined.get(cls)
    const use = usedIn.get(cls)
    xref[cls] = {
      definedAt: def ? [...def].sort((a, b) => a - b).map((l) => `style.css:${l}`) : [],
      usedIn: use ? [...use].sort() : [],
    }
  }
  return {
    generatedFrom: rel(STYLE_CSS),
    classCount: allClasses.size,
    definedOnlyCount: [...allClasses].filter((c) => defined.has(c) && !usedIn.has(c)).length,
    usedOnlyCount: [...allClasses].filter((c) => !defined.has(c) && usedIn.has(c)).length,
    note: 'definedAt = selector lines in style.css (heuristic). usedIn = .vue templates with a matching class/literal token. Confirm exact match with ast-grep/Read before editing.',
    classes: xref,
  }
}

// ---------------------------------------------------------------------------
// 2) component-route-map: route path -> component file -> imported children
// ---------------------------------------------------------------------------
function resolveAlias(spec) {
  // '@/views/...' -> src/views/...
  if (spec.startsWith('@/')) return join(SRC, spec.slice(2))
  return null
}

function importedComponents(file) {
  if (!file || !existsSync(file)) return []
  const src = readFileSync(file, 'utf8')
  const out = new Set()
  const re = /import\s+([A-Z][\w]*)\s+from\s+['"](@\/[^'"]+\.vue)['"]/g
  let m
  while ((m = re.exec(src))) out.add(m[2])
  // also dynamic: () => import('@/.../X.vue')
  const re2 = /import\(\s*['"](@\/[^'"]+\.vue)['"]\s*\)/g
  while ((m = re2.exec(src))) out.add(m[1])
  return [...out].sort()
}

function buildRouteMap() {
  const routes = []
  for (const routerFile of [ROUTER_INDEX, ROUTER_CODEX]) {
    if (!existsSync(routerFile)) continue
    const src = readFileSync(routerFile, 'utf8')
    // pair path + nearest following component import
    const re = /path:\s*['"]([^'"]+)['"][\s\S]{0,400}?import\(\s*['"](@\/[^'"]+\.vue)['"]\s*\)/g
    let m
    while ((m = re.exec(src))) {
      const path = m[1]
      const compSpec = m[2]
      const compFile = resolveAlias(compSpec)
      routes.push({
        path,
        component: compSpec.replace('@/', 'src/'),
        children: importedComponents(compFile).map((c) => c.replace('@/', 'src/')),
        source: rel(routerFile),
      })
    }
  }
  return {
    routeCount: routes.length,
    note: 'children = .vue components statically imported by the top-level view (one level deep). Use as an entry map, not a full tree.',
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
  }
}

// ---------------------------------------------------------------------------
// 3) testid-registry: data-testid -> files; coverage gaps
// ---------------------------------------------------------------------------
function buildTestidRegistry() {
  const idToFiles = new Map()
  const filesWithTestid = new Set()
  const nativeInteractiveTags = new Set(['button', 'input', 'select', 'textarea'])
  const interactiveElements = []
  const interactiveMissingTestid = []

  const hasTestid = (attrs) => /\b:?data-testid\s*=/.test(attrs)
  const hasClickBehavior = (attrs) => /(?:@click|v-on:click)(?:\b|[.:])/.test(attrs)
  const hasButtonRole = (attrs) => /\brole\s*=\s*["']button["']/.test(attrs)
  const hasHref = (attrs) => /\bhref\s*=|:href\s*=/.test(attrs)

  const isInteractiveElement = (tagName, attrs) => {
    if (nativeInteractiveTags.has(tagName)) return true
    if (tagName === 'a' && (hasHref(attrs) || hasClickBehavior(attrs) || hasButtonRole(attrs))) return true
    return /^[a-z][\w-]*$/.test(tagName) && (hasClickBehavior(attrs) || hasButtonRole(attrs))
  }

  for (const file of vueFiles) {
    const src = readFileSync(file, 'utf8')
    const tpl = (src.match(/<template[\s\S]*?<\/template>/g) || []).join('\n')
    const tagRe = /<([A-Za-z][\w.:-]*)(\s[\s\S]*?)(?:\/?)>/g
    let tagMatch
    while ((tagMatch = tagRe.exec(tpl))) {
      const [, tagName, attrs = ''] = tagMatch
      if (!isInteractiveElement(tagName, attrs)) continue

      const line = tpl.slice(0, tagMatch.index).split('\n').length
      const item = { file: rel(file), line, tag: tagName }
      interactiveElements.push(item)
      if (!hasTestid(attrs)) interactiveMissingTestid.push(item)
    }

    const re = /data-testid\s*=\s*"([^"]+)"|:data-testid\s*=\s*"([^"]+)"/g
    let m
    let has = false
    while ((m = re.exec(src))) {
      const id = (m[1] || m[2] || '').trim()
      if (!id) continue
      has = true
      if (!idToFiles.has(id)) idToFiles.set(id, new Set())
      idToFiles.get(id).add(rel(file))
    }
    if (has) filesWithTestid.add(rel(file))
  }
  // interactive files lacking testids = candidate coverage gaps
  const interactiveNoTestid = []
  for (const file of vueFiles) {
    const r = rel(file)
    if (filesWithTestid.has(r)) continue
    const src = readFileSync(file, 'utf8')
    const tpl = (src.match(/<template[\s\S]*?<\/template>/g) || []).join('\n')
    const buttons = (tpl.match(/<button\b/g) || []).length
    const inputs = (tpl.match(/<(input|select|textarea)\b/g) || []).length
    if (buttons + inputs >= 2) interactiveNoTestid.push({ file: r, buttons, inputs })
  }
  const registry = {}
  for (const id of [...idToFiles.keys()].sort()) registry[id] = [...idToFiles.get(id)].sort()
  return {
    testidCount: idToFiles.size,
    filesWithTestid: filesWithTestid.size,
    totalVueFiles: vueFiles.length,
    coveragePct: Math.round((filesWithTestid.size / vueFiles.length) * 1000) / 10,
    interactiveElementCount: interactiveElements.length,
    interactiveElementMissingTestidCount: interactiveMissingTestid.length,
    interactiveElementCoveragePct: interactiveElements.length
      ? Math.round(((interactiveElements.length - interactiveMissingTestid.length) / interactiveElements.length) * 1000) / 10
      : 100,
    note: 'data-testid are the most reliable agent anchors and are reusable for Playwright verification. interactiveMissingTestid lists native/clickable template elements still lacking data-testid. coverageGaps keeps the legacy per-file view.',
    coverageGaps: interactiveNoTestid.sort((a, b) => b.buttons + b.inputs - (a.buttons + a.inputs)),
    interactiveMissingTestid,
    registry,
  }
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true })
const classXref = buildClassXref()
const routeMap = buildRouteMap()
const testids = buildTestidRegistry()

writeFileSync(join(OUT_DIR, 'class-xref.json'), JSON.stringify(classXref, null, 2))
writeFileSync(join(OUT_DIR, 'component-route-map.json'), JSON.stringify(routeMap, null, 2))
writeFileSync(join(OUT_DIR, 'testid-registry.json'), JSON.stringify(testids, null, 2))

const indexMd = `# Frontend Locator Index (generated)

> Generated by \`scripts/build-frontend-index.mjs\`. READ-ONLY analysis. Do not edit by hand.
> Regenerate after structural changes: \`node scripts/build-frontend-index.mjs\`

## What this is for
A change map so an automated agent can precisely locate the owner of any class, component,
route, or test anchor BEFORE editing. This supplies the layer a symbol graph (codegraph/LSP)
does not: the link between global CSS selectors and the templates that use them.

## Files
- \`class-xref.json\` — ${classXref.classCount} classes. Each: \`definedAt\` (style.css lines) + \`usedIn\` (.vue templates).
- \`component-route-map.json\` — ${routeMap.routeCount} routes -> view file -> statically imported child components.
- \`testid-registry.json\` — ${testids.testidCount} data-testid anchors across ${testids.filesWithTestid}/${testids.totalVueFiles} files (${testids.coveragePct}% coverage).

## Quick stats
- CSS classes defined-only (in style.css, no template hit): ${classXref.definedOnlyCount}
- CSS classes used-only (in templates, not in style.css — Tailwind/scoped/dynamic): ${classXref.usedOnlyCount}
- testid coverage: ${testids.coveragePct}% — ${testids.coverageGaps.length} interactive files lack anchors.
- interactive element coverage: ${testids.interactiveElementCoveragePct}% — ${testids.interactiveElementMissingTestidCount}/${testids.interactiveElementCount} native/clickable template elements lack anchors.

## How an agent should use it
1. **Changing a CSS rule?** Look up the class in \`class-xref.json\` -> see every \`definedAt\` line in style.css AND every \`usedIn\` template (blast radius) before editing.
2. **Changing a page?** Find the route in \`component-route-map.json\` -> jump to the view file and its child components.
3. **Need a stable target / verification anchor?** Check \`testid-registry.json\`. If missing, add a \`data-testid\` (also reusable in Playwright).
4. **Precise structural match?** Use ast-grep (see \`sgconfig.yml\` at repo root) instead of plain grep.

Heuristic, high-recall output. Always confirm the exact line with ast-grep / Read before editing.
`
writeFileSync(join(OUT_DIR, 'INDEX.md'), indexMd)

console.log(`[frontend-index] classes=${classXref.classCount} routes=${routeMap.routeCount} testids=${testids.testidCount} (coverage ${testids.coveragePct}%)`)
console.log(`[frontend-index] written to ${rel(OUT_DIR)}/`)

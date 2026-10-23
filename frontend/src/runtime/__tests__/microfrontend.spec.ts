import { describe, it, expect } from 'vitest'
import { beginEmbeddedRequests, endEmbeddedRequests, embeddedRequestSignal } from '../environment'
import { scopeMicrofrontendCss, microfrontendTeleportTransform } from '../../../scripts/microfrontend-css-scope.mjs'
import { consolePublicNavigation } from '../console-navigation'
import postcss from 'postcss'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Console public navigation follows original feature and authentication boundaries', () => {
  it('keeps home, key usage and public model plaza reachable for anonymous visitors', () => {
    expect(consolePublicNavigation(false, { model_plaza_enabled: true }).map(item => item.path)).toEqual(['/home', '/key-usage', '/model-plaza'])
    expect(consolePublicNavigation(false, null).some(item => item.path === '/model-plaza')).toBe(false)
  })
  it('does not expose disabled features, closed registration or authenticated plaza', () => {
    const items = consolePublicNavigation(false, { model_plaza_require_auth: true, registration_enabled: false })
    expect(items.map(item => item.path)).toEqual(['/home', '/key-usage'])
    expect(consolePublicNavigation(true, { model_plaza_enabled: true, model_plaza_require_auth: true }).find(item => item.path === '/model-plaza')?.public).toBe(false)
    expect(consolePublicNavigation(true, { model_plaza_enabled: false }).some(item => item.path === '/model-plaza')).toBe(false)
    expect(consolePublicNavigation(false, { registration_enabled: true }).some(item => ['/register', '/login'].includes(item.path!))).toBe(false)
  })
  it('retains the original backend mode restrictions', () => {
    expect(consolePublicNavigation(false, { backend_mode_enabled: true, registration_enabled: true }).map(item => item.path)).toEqual(['/key-usage'])
  })
})

describe('Console opt-in artifact adapters', () => {
  it('keeps the real route overlay fixed on the CSS scope root, including reduced motion', () => {
    const motionCss = readFileSync(resolve(__dirname, '../../styles/design-system/motion.css'), 'utf8')
    const css = postcss.parse(scopeMicrofrontendCss(motionCss, 'kreepai'))
    const overlays: import('postcss').Rule[] = []
    css.walkRules(':scope.qz-shift5-route-transition', rule => { overlays.push(rule) })
    expect(overlays.some(rule => rule.nodes.some(node => node.type === 'decl' && node.prop === 'position' && node.value === 'fixed'))).toBe(true)
    expect(overlays.some(rule => rule.parent?.type === 'atrule' && rule.parent.params.includes('prefers-reduced-motion') && rule.nodes.some(node => node.type === 'decl' && node.prop === 'display' && node.value === 'none'))).toBe(true)
  })
  it('scopes Tailwind resets and public root styles without leaking into the Host', () => {
    const css = scopeMicrofrontendCss('html,body{font-size:14px}*{box-sizing:border-box}.btn{color:blue}@keyframes spin{to{transform:rotate(360deg)}}', 'kreepai')
    expect(css).toContain('@scope (.console-kreepai-surface)')
    expect(css).toContain(':scope,:scope')
    expect(css).toContain('*{box-sizing:border-box}')
    expect(css).toContain('@keyframes spin{to{transform:rotate(360deg)}}')
  })
  it('only rewrites static body Teleports in the microfrontend build', () => {
    const transform = microfrontendTeleportTransform('kreepai')
    const node = { type: 1, tag: 'Teleport', props: [{ type: 6, name: 'to', value: { content: 'body' } }] }
    transform(node)
    expect(node.props[0].value.content).toBe('#console-kreepai-overlays')
    const custom = { type: 1, tag: 'Teleport', props: [{ type: 6, name: 'to', value: { content: '#custom' } }] }
    transform(custom)
    expect(custom.props[0].value.content).toBe('#custom')
  })
})

it('unmount aborts its request scope without aborting an independent caller', () => {
  const parent = new AbortController()
  beginEmbeddedRequests()
  const scoped = embeddedRequestSignal()!
  expect(scoped.aborted).toBe(false)
  endEmbeddedRequests()
  expect(scoped.aborted).toBe(true)
  expect(parent.signal.aborted).toBe(false)
  expect(embeddedRequestSignal(parent.signal)).toBe(parent.signal)
})

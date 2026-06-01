import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const forgotSource = readFileSync(resolve(__dirname, '../ForgotPasswordView.vue'), 'utf8')
const resetSource = readFileSync(resolve(__dirname, '../ResetPasswordView.vue'), 'utf8')

describe('password recovery auth theme source', () => {
  it('uses the shared recovery shell on both forgot and reset password pages', () => {
    for (const source of [forgotSource, resetSource]) {
      expect(source).toContain('auth-recovery-panel')
      expect(source).toContain('auth-recovery-heading')
      expect(source).toContain('auth-recovery-copy')
      expect(source).toContain('auth-recovery-action')
      expect(source).toContain('auth-recovery-status')
    }
  })

  it('styles recovery states with Atelier and Cloudflare theme tokens instead of fixed Tailwind color panels', () => {
    for (const source of [forgotSource, resetSource]) {
      expect(source).toContain('var(--atelier-paper')
      expect(source).toContain('var(--atelier-blue')
      expect(source).toContain(':global(.theme-cloudflare .auth-recovery')
      expect(source).not.toContain('bg-green-50')
      expect(source).not.toContain('bg-amber-50')
      expect(source).not.toContain('dark:bg-green-900/20')
      expect(source).not.toContain('dark:bg-amber-900/20')
    }
  })

  it('scopes theme recovery overrides to descendants instead of restyling the root theme class', () => {
    for (const source of [forgotSource, resetSource]) {
      expect(source).toContain(':global(.theme-cloudflare .auth-recovery-kicker)')
      expect(source).toContain(':global(.theme-cloudflare .auth-recovery-status-icon)')
      expect(source).toContain(':global(.dark .auth-recovery-heading)')
      expect(source).toContain(':global(.dark .auth-recovery-status)')
      expect(source).not.toContain(':global(.theme-cloudflare) .auth-recovery')
      expect(source).not.toContain(':global(.dark) .auth-recovery')
    }
  })

  it('keeps password recovery forms available on existing routes instead of requiring a new backend page', () => {
    expect(forgotSource).toContain('forgotPassword({')
    expect(resetSource).toContain('resetPassword({')
    expect(resetSource).toContain("route.query.token")
    expect(resetSource).toContain("route.query.email")
  })
})

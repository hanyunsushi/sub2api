import { describe, it, expect, vi } from 'vitest'
import { consoleTopbarActions } from '../console-topbar'

const defaults = () => ({ authenticated: false, isAdmin: false, settings: { registration_enabled: true }, docUrl: '', locale: 'zh', switchingLocale: false, path: '/home', publicPage: true, navigate: vi.fn(), openDocument: vi.fn(), switchLocale: vi.fn() })

describe('current application topbar', () => {
  it('keeps registration gating and model plaza return route in original application handlers', () => {
    const options = defaults()
    expect(consoleTopbarActions(options).map(item => item.label)).toEqual(['English', '登录', '注册'])
    consoleTopbarActions(options).find(item => item.key === 'console.register')!.run()
    expect(options.navigate).toHaveBeenCalledWith('/register')
    expect(consoleTopbarActions({ ...options, path: '/login' }).map(item => item.label)).toEqual(['English', '注册'])
    expect(consoleTopbarActions({ ...options, settings: { registration_enabled: false } }).some(item => item.key === 'console.register')).toBe(false)
    expect(consoleTopbarActions({ ...options, settings: { registration_enabled: true, backend_mode_enabled: true } }).some(item => item.key === 'console.register')).toBe(false)
    consoleTopbarActions({ ...options, path: '/model-plaza' }).find(item => item.key === 'console.login')!.run()
    expect(options.navigate).toHaveBeenCalledWith('/login?redirect=%2Fmodel-plaza')
    consoleTopbarActions({ ...options, authenticated: true, isAdmin: true }).find(item => item.key === 'console.dashboard')!.run()
    expect(options.navigate).toHaveBeenCalledWith('/admin/dashboard')
    expect(consoleTopbarActions({ ...options, authenticated: true, publicPage: false }).map(item => item.key)).toEqual(['console.language'])
  })
  it('preserves safe documentation and language handlers', () => {
    const options = { ...defaults(), docUrl: 'https://docs.example.test/' }
    const actions = consoleTopbarActions(options)
    actions.find(item => item.key === 'console.docs')!.run()
    expect(options.openDocument).toHaveBeenCalledWith(options.docUrl)
    actions.find(item => item.key === 'console.language')!.run()
    expect(options.switchLocale).toHaveBeenCalledWith('en')
    expect(consoleTopbarActions({ ...options, docUrl: 'javascript:alert(1)' }).some(item => item.key === 'console.docs')).toBe(false)
    expect(consoleTopbarActions({ ...options, locale: 'en' })[0].label).toBe('中文')
    expect(consoleTopbarActions({ ...options, switchingLocale: true })[0].loading?.()).toBe(true)
  })
})

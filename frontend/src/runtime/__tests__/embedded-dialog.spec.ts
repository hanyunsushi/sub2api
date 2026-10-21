import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, it, expect, vi } from 'vitest'
import BaseDialog from '@/components/common/BaseDialog.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
enableAutoUnmount(afterEach)
afterEach(() => { globalThis.__SUB2API_MICROFRONTEND__ = undefined; document.documentElement.style.overflow = '' })
it('shares the embedded scroll lock across dialogs and restores the Host inline style', async () => {
  globalThis.__SUB2API_MICROFRONTEND__ = true
  document.documentElement.style.overflow='auto'
  const one=mount(BaseDialog,{props:{show:true,title:'one'},global:{stubs:{Icon:true}}})
  const two=mount(BaseDialog,{props:{show:true,title:'two'},global:{stubs:{Icon:true}}})
  await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'))
  one.unmount()
  await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'))
  two.unmount()
  await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe('auto'))
})

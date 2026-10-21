import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NavigationProgress from '../NavigationProgress.vue'
import { beginPageLoad, cancelPageLoad, finishPageLoad } from '@/utils/page-loading'
vi.mock('vue-i18n', () => ({useI18n:()=>({t:(key:string)=>key})}))
beforeEach(() => cancelPageLoad())
afterEach(()=>{cancelPageLoad();globalThis.__SUB2API_MICROFRONTEND__=undefined})
describe('actual page readiness waiting',()=>{
 it('shows only during real waiting and never reports fabricated progress',async()=>{
  const wrapper=mount(NavigationProgress)
  expect(wrapper.find('[role=status]').exists()).toBe(false)
  const token=beginPageLoad();await nextTick()
  expect(wrapper.find('[role=status]').attributes('aria-label')).toBe('common.loading')
  expect(wrapper.find('[role=progressbar]').exists()).toBe(false)
  finishPageLoad(token);await nextTick()
  expect(wrapper.find('[role=status]').exists()).toBe(false);wrapper.unmount()
 })
 it('continues content feedback in embedded mode until page readiness completes',async()=>{
  globalThis.__SUB2API_MICROFRONTEND__=true
  const token=beginPageLoad()
  const wrapper=mount(NavigationProgress)
  expect(wrapper.find('[role=status]').exists()).toBe(true)
  finishPageLoad(token);await nextTick()
  expect(wrapper.find('[role=status]').exists()).toBe(false);wrapper.unmount()
 })
})

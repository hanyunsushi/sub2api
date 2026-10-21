import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import Input from '../Input.vue'
import TextArea from '../TextArea.vue'
import Pagination from '../Pagination.vue'
import EmptyState from '../EmptyState.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key, locale: ref('en') }) }))
enableAutoUnmount(afterEach)
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe.each([
  ['input', Input],
  ['textarea', TextArea]
] as const)('%s field contract', (tag, component) => {
  it('associates validation and help text without changing raw input events', async () => {
    const wrapper = mount(component, {
      props: { id: 'field', modelValue: 'old', label: 'Label', hint: 'Help', error: 'Invalid' }
    })
    const field = wrapper.get(tag)
    expect(field.attributes('aria-invalid')).toBe('true')
    expect(field.attributes('aria-describedby')).toBe('field-feedback')
    expect(wrapper.get('#field-feedback').text()).toBe('Invalid')
    await field.setValue('中文')
    expect(wrapper.emitted('update:modelValue')).toEqual([['中文']])
    expect(wrapper.emitted('change')).toEqual([['中文']])
    await wrapper.setProps({ error: undefined })
    expect(field.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('#field-feedback').text()).toBe('Help')
    await wrapper.setProps({ hint: undefined, readonly: true })
    expect(field.attributes('aria-describedby')).toBeUndefined()
    expect((field.element as HTMLInputElement).readOnly).toBe(true)
  })
})

describe('controls inside native forms', () => {
  it('keeps page navigation and empty-state actions from submitting the enclosing form', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    const onAction = vi.fn()
    const wrapper = mount({
      components: { Pagination, EmptyState },
      setup: () => ({ onSubmit, onAction }),
      template: '<form @submit="onSubmit"><Pagination :total="100" :page="1" :page-size="20" :show-page-size-selector="false" /><EmptyState action-text="Create" @action="onAction" /></form>'
    }, { attachTo: document.body })
    wrapper.get<HTMLButtonElement>('[aria-label="pagination.next"]').element.click()
    wrapper.get<HTMLButtonElement>('.empty-state button').element.click()
    await nextTick()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.getComponent(Pagination).emitted('update:page')).toEqual([[2]])
    expect(onAction).toHaveBeenCalledOnce()
  })


})

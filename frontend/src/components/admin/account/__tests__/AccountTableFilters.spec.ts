import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AccountTableFilters from '../AccountTableFilters.vue'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

const SelectStub = {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue', 'change'],
  template: `
    <select
      :value="modelValue"
      @change="
        $emit('update:modelValue', $event.target.value);
        $emit('change', $event.target.value, null)
      "
    >
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  `
}

const SearchInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'search'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
}

describe('AccountTableFilters', () => {
  it('adds account name and priority sort controls to the filter bar', async () => {
    const wrapper = mount(AccountTableFilters, {
      props: {
        searchQuery: '',
        groups: [],
        filters: {
          platform: '',
          type: '',
          status: '',
          privacy_mode: '',
          group: '',
          sort_by: 'name',
          sort_order: 'asc'
        }
      },
      global: {
        stubs: {
          Select: SelectStub,
          SearchInput: SearchInputStub
        }
      }
    })

    const sortSelects = wrapper.findAll('select').slice(-2)
    expect(sortSelects).toHaveLength(2)
    expect(sortSelects[0].text()).toContain('admin.accounts.sortOptions.name')
    expect(sortSelects[0].text()).toContain('admin.accounts.sortOptions.priority')
    expect(sortSelects[1].text()).toContain('admin.accounts.sortDirections.asc')
    expect(sortSelects[1].text()).toContain('admin.accounts.sortDirections.desc')

    await sortSelects[0].setValue('priority')
    expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toMatchObject({
      sort_by: 'priority',
      sort_order: 'asc'
    })

    await sortSelects[1].setValue('desc')
    expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toMatchObject({
      sort_by: 'name',
      sort_order: 'desc'
    })
  })
})

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
  it('combines account name and priority sort direction into one filter control', async () => {
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

    const selects = wrapper.findAll('select')
    expect(selects).toHaveLength(6)

    const sortSelect = selects.at(-1)!
    expect(sortSelect.text()).toContain('admin.accounts.sortOptions.nameAsc')
    expect(sortSelect.text()).toContain('admin.accounts.sortOptions.nameDesc')
    expect(sortSelect.text()).toContain('admin.accounts.sortOptions.priorityAsc')
    expect(sortSelect.text()).toContain('admin.accounts.sortOptions.priorityDesc')

    await sortSelect.setValue('priority:desc')
    expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toMatchObject({
      sort_by: 'priority',
      sort_order: 'desc'
    })

    await sortSelect.setValue('name:desc')
    expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toMatchObject({
      sort_by: 'name',
      sort_order: 'desc'
    })
  })
})

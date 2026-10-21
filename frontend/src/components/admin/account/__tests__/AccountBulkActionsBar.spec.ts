import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import AccountBulkActionsBar from '../AccountBulkActionsBar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}))

describe('AccountBulkActionsBar', () => {
  it('keeps neutral selection controls and every selected-account action available', async () => {
    const wrapper = mount(AccountBulkActionsBar, { props: { selectedIds: [1, 2], totalResults: 45, selectingAll: false, allResultsSelected: false } })
    expect(wrapper.get('.account-bulk-controls').classes()).toContain('bg-[var(--card)]')
    expect(wrapper.get('.account-bulk-controls').classes().join(' ')).not.toContain('bg-primary')
    for (const [key, event] of [
      ['selectCurrentPage', 'select-page'], ['selectAllResults', 'select-all-results'],
      ['clear', 'clear'], ['delete', 'delete'], ['resetStatus', 'reset-status'],
      ['refreshToken', 'refresh-token'], ['probeUpstreamBilling', 'probe-upstream-billing'],
      ['edit', 'edit-selected']
    ]) {
      const button = wrapper.findAll('button').find(item => item.text() === `admin.accounts.bulkActions.${key}`)!
      await button.trigger('click')
      expect(wrapper.emitted(event)).toHaveLength(1)
    }
    for (const [key, value] of [['enableScheduling', true], ['disableScheduling', false]] as const) {
      const button = wrapper.findAll('button').find(item => item.text() === `admin.accounts.bulkActions.${key}`)!
      await button.trigger('click')
      expect(wrapper.emitted('toggle-schedulable')!.at(-1)).toEqual([value])
    }
    const filtered = wrapper.findAll('button').find(item => item.text() === 'admin.accounts.bulkEdit.submit')!
    await filtered.trigger('click')
    expect(wrapper.emitted('edit-filtered')).toHaveLength(1)
    await wrapper.setProps({ selectingAll: true })
    expect(wrapper.findAll<HTMLButtonElement>('button').find(item => item.text() === 'admin.accounts.bulkActions.selectingAll')!.element.disabled).toBe(true)
  })

  it('allows selecting all results before any row is selected', async () => {
    const wrapper = mount(AccountBulkActionsBar, {
      props: {
        selectedIds: [],
        totalResults: 45,
        selectingAll: false,
        allResultsSelected: false
      }
    })

    const button = wrapper.findAll('button').find(item =>
      item.text().includes('admin.accounts.bulkActions.selectAllResults')
    )

    expect(button).toBeDefined()
    await button!.trigger('click')
    expect(wrapper.emitted('select-all-results')).toHaveLength(1)
  })

  it('preserves the upstream billing probe action from v0.1.166', async () => {
    const wrapper = mount(AccountBulkActionsBar, {
      props: {
        selectedIds: [1],
        totalResults: 45,
        selectingAll: false,
        allResultsSelected: false
      }
    })

    const button = wrapper.findAll('button').find(item =>
      item.text().includes('admin.accounts.bulkActions.probeUpstreamBilling')
    )

    expect(button).toBeDefined()
    await button!.trigger('click')
    expect(wrapper.emitted('probe-upstream-billing')).toHaveLength(1)
  })
})

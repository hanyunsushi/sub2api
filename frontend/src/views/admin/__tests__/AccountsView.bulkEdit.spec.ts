import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'

import AccountsView from '../AccountsView.vue'

const {
  listAccounts,
  listWithEtag,
  getUpstreamBillingRatesWithEtag,
  getBatchTodayStats,
  getUpstreamBillingProbeSettings,
  getAllProxies,
  getAllGroups,
  probeUpstreamBilling,
  probeUpstreamBillingBatch,
  externalStatuses,
  saveQuotaPreference,
  authState,
  showError,
  showSuccess
} = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  listWithEtag: vi.fn(),
  getUpstreamBillingRatesWithEtag: vi.fn(),
  getBatchTodayStats: vi.fn(),
  getUpstreamBillingProbeSettings: vi.fn(),
  getAllProxies: vi.fn(),
  getAllGroups: vi.fn(),
  probeUpstreamBilling: vi.fn(),
  probeUpstreamBillingBatch: vi.fn(),
  externalStatuses: vi.fn(),
  saveQuotaPreference: vi.fn(),
  authState: { token: 'test-token', isAdmin: false, user: { id: 1 } },
  showError: vi.fn(),
  showSuccess: vi.fn()
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: {
      list: listAccounts,
      listWithEtag,
      getUpstreamBillingRatesWithEtag,
      getBatchTodayStats,
      getUpstreamBillingProbeSettings,
      delete: vi.fn(),
      batchClearError: vi.fn(),
      batchRefresh: vi.fn(),
      probeUpstreamBilling,
      probeUpstreamBillingBatch,
      toggleSchedulable: vi.fn()
    },
    proxies: {
      getAll: getAllProxies
    },
    groups: {
      getAll: getAllGroups
    }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError,
    showSuccess,
    showInfo: vi.fn()
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

vi.mock('@/api/admin/externalSubscriptions', () => ({ default: {
  getDisplayStatuses: externalStatuses,
  subscribeDisplayStatuses: () => () => {},
} }))
vi.mock('@/composables/useAccountExternalQuotaProgressSettings', () => ({
  buildAccountExternalQuotaProgressPreferenceKey: () => '101:pixel',
  useAccountExternalQuotaProgressSettings: () => ({
    loadAccountExternalQuotaProgressSettings: async () => ({}),
    getAccountExternalQuotaProgressPreference: () => ({ enabled: true, mode: 'status_total' }),
    setAccountExternalQuotaProgressPreference: saveQuotaPreference,
  }),
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

const DataTableStub = {
  props: ['columns', 'data'],
  template: `
    <div data-test="data-table">
      <span v-for="column in columns" :key="column.key" data-test="column-key">{{ column.key }}</span>
      <div v-for="row in data" :key="row.id">
        <div data-test="select-row"><slot name="cell-select" :row="row" /></div>
        <slot name="cell-created_at" :value="row.created_at" :row="row" />
        <div data-test="account-rate"><slot name="cell-rate_multiplier" :row="row" /></div>
      </div>
    </div>
  `
}

const ProbeDataTableStub = {
  props: ['data'],
  template: `
    <div>
      <div v-for="row in data" :key="row.id">
        <div data-test="account-rate"><slot name="cell-rate_multiplier" :row="row" /></div>
        <slot name="cell-upstream_billing_rate" :row="row" />
      </div>
    </div>
  `
}

const AccountBulkActionsBarStub = {
  props: ['selectedIds'],
  emits: ['edit-filtered', 'probe-upstream-billing'],
  template: `
    <div>
      <button data-test="edit-filtered" @click="$emit('edit-filtered')">edit filtered</button>
      <button data-test="probe-upstream-billing" @click="$emit('probe-upstream-billing')">probe</button>
    </div>
  `
}

const PaginationStub = {
  emits: ['update:page'],
  template: '<button data-test="next-page" @click="$emit(\'update:page\', 2)">next</button>'
}

const BulkEditAccountModalStub = {
  props: ['show', 'target'],
  template: '<div data-test="bulk-edit-modal" :data-show="String(show)" :data-target-mode="target?.mode ?? \'\'"></div>'
}

describe('admin AccountsView bulk edit scope', () => {
  beforeEach(() => {
    localStorage.clear()
    authState.isAdmin = false
    externalStatuses.mockReset().mockResolvedValue([])
    saveQuotaPreference.mockReset().mockResolvedValue(undefined)

    listAccounts.mockReset()
    listWithEtag.mockReset()
    getUpstreamBillingRatesWithEtag.mockReset()
    getBatchTodayStats.mockReset()
    getUpstreamBillingProbeSettings.mockReset()
    getAllProxies.mockReset()
    getAllGroups.mockReset()
    probeUpstreamBilling.mockReset()
    probeUpstreamBillingBatch.mockReset()
    showError.mockReset()
    showSuccess.mockReset()

    listAccounts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      pages: 0
    })
    listWithEtag.mockResolvedValue({
      notModified: true,
      etag: null,
      data: null
    })
    getUpstreamBillingRatesWithEtag.mockResolvedValue({
      notModified: true,
      etag: null,
      data: null
    })
    getBatchTodayStats.mockResolvedValue({ stats: {} })
    getUpstreamBillingProbeSettings.mockResolvedValue({ enabled: true, interval_minutes: 30 })
    getAllProxies.mockResolvedValue([])
    getAllGroups.mockResolvedValue([])
    probeUpstreamBilling.mockResolvedValue({})
    probeUpstreamBillingBatch.mockResolvedValue([])
  })

  it.each([false, true])('keeps external quota matching and the settings action usable (saveFails=%s)', async saveFails => {
    authState.isAdmin = true
    const account = { id: 101, name: 'Pixel Key', platform: 'openai', type: 'apikey', credentials: {}, extra: {}, status: 'active' }
    const status = {
      provider: 'pixel', name: 'Pixel', template: 'pixel_access_token', balance_strategy: 'pixel_user_quota',
      enabled: true, configured: true, match_keywords: ['pixel'], sort_order: 0, currency: 'CNY',
      site_url: 'https://example.com', total_limit_usd: 30, used_usd: 10, remaining_usd: 20,
      subscriptions: [], active_count: 0,
    }
    externalStatuses.mockResolvedValue([status])
    listAccounts.mockResolvedValue({ items: [account], total: 1, page: 1, page_size: 20, pages: 1 })
    if (saveFails) saveQuotaPreference.mockRejectedValue(new Error('failed to save'))
    const wrapper = shallowMount(AccountsView, { global: { stubs: {
      AppLayout: { template: '<div><slot /></div>' },
      TablePageLayout: { template: '<div><slot name="table" /></div>' },
      DataTable: false,
      HelpTooltip: { template: '<span><slot /></span>' },
    } } })
    await flushPromises()
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.get('[data-row-id="101"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="account-external-quota"]').text()).toContain('¥20.00 / ¥30.00')
    await wrapper.get('[data-testid="account-select-page"]').setValue(true)
    expect(wrapper.get('[data-row-id="101"] [data-field="select"] input').element).toHaveProperty('checked', true)
    await wrapper.get('[data-testid="account-card-sort"]').setValue('priority')
    await wrapper.get('[data-testid="account-card-sort-order"]').trigger('click')
    await flushPromises()
    expect(listAccounts).toHaveBeenLastCalledWith(1, 20, expect.objectContaining({ sort_by: 'priority', sort_order: 'desc' }), expect.anything())
    expect(JSON.parse(localStorage.getItem('account-table-sort') || '{}')).toEqual({ key: 'priority', order: 'desc' })
    await wrapper.get('[data-testid="account-external-quota-progress-action"]').trigger('click')
    const modal = wrapper.findComponent({ name: 'ExternalQuotaProgressSettingsModal' })
    expect(modal.props('show')).toBe(true)
    expect(modal.props('subscription')).toMatchObject({ provider: 'pixel' })
    const preference = { enabled: true, mode: 'custom_total', customTotal: 50 }
    modal.vm.$emit('save', preference)
    await flushPromises()
    expect(saveQuotaPreference).toHaveBeenCalledWith(expect.objectContaining({ id: 101 }), expect.objectContaining({ provider: 'pixel' }), preference)
    expect(modal.props('show')).toBe(saveFails)
    if (saveFails) expect(showError).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('opens bulk edit in filtered-results mode from the bulk actions dropdown', async () => {
    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: {
            template: '<div><slot name="filters" /><slot name="table" /><slot name="pagination" /></div>'
          },
          DataTable: DataTableStub,
          Pagination: true,
          ConfirmDialog: true,
          AccountTableActions: { template: '<div><slot name="beforeCreate" /><slot name="after" /></div>' },
          AccountTableFilters: { template: '<div></div>' },
          AccountBulkActionsBar: AccountBulkActionsBarStub,
          AccountActionMenu: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: BulkEditAccountModalStub,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-test="edit-filtered"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="bulk-edit-modal"]').attributes('data-show')).toBe('true')
    expect(wrapper.get('[data-test="bulk-edit-modal"]').attributes('data-target-mode')).toBe('filtered')
  })

  it('renders the created_at column by default', async () => {
    listAccounts.mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'test-account',
          platform: 'anthropic',
          type: 'oauth',
          status: 'active',
          schedulable: true,
          created_at: '2026-03-07T10:00:00Z',
          updated_at: '2026-03-07T10:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: {
            template: '<div><slot name="filters" /><slot name="table" /><slot name="pagination" /></div>'
          },
          DataTable: DataTableStub,
          Pagination: true,
          ConfirmDialog: true,
          AccountTableActions: { template: '<div><slot name="beforeCreate" /><slot name="after" /></div>' },
          AccountTableFilters: { template: '<div></div>' },
          AccountBulkActionsBar: AccountBulkActionsBarStub,
          AccountActionMenu: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: BulkEditAccountModalStub,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()

    const columnKeys = wrapper.findAll('[data-test="column-key"]').map(node => node.text())
    expect(columnKeys).toContain('created_at')
    const columns = wrapper.getComponent(DataTableStub).props('columns') as Array<{ key: string; label: string; sortable: boolean }>
    expect(columns.find(column => column.key === 'created_at')).toMatchObject({
      label: 'admin.accounts.columns.createdAt',
      sortable: true
    })
  })

  it('passes the loaded global probe state to every upstream billing cell', async () => {
    listAccounts.mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'upstream',
          platform: 'openai',
          type: 'apikey',
          status: 'active',
          schedulable: true,
          created_at: '2026-07-13T00:00:00Z',
          updated_at: '2026-07-13T00:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })
    getUpstreamBillingProbeSettings.mockResolvedValue({ enabled: false, interval_minutes: 30 })

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="table" /></div>' },
          DataTable: {
            props: ['data'],
            template: '<div><div v-for="row in data" :key="row.id"><slot name="cell-upstream_billing_rate" :row="row" /></div></div>'
          },
          UpstreamBillingRateCell: {
            props: ['globalProbeEnabled'],
            template: '<span data-test="upstream-billing-cell" :data-global-enabled="String(globalProbeEnabled)"></span>'
          },
          Pagination: true,
          ConfirmDialog: true,
          AccountTableActions: true,
          AccountTableFilters: true,
          AccountBulkActionsBar: true,
          AccountActionMenu: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: true,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()

    expect(getUpstreamBillingProbeSettings).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="upstream-billing-cell"]').attributes('data-global-enabled')).toBe('false')
  })

  it('submits selected account IDs from every page for backend eligibility checks', async () => {
    const account = (id: number) => ({
      id,
      name: `account-${id}`,
      platform: 'openai',
      type: 'apikey',
      status: 'active',
      schedulable: true,
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z'
    })
    listAccounts
      .mockResolvedValueOnce({ items: [account(7)], total: 2, page: 1, page_size: 1, pages: 2 })
      .mockResolvedValueOnce({ items: [account(11)], total: 2, page: 2, page_size: 1, pages: 2 })

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="table" /><slot name="pagination" /></div>' },
          DataTable: DataTableStub,
          Pagination: PaginationStub,
          ConfirmDialog: true,
          AccountTableActions: true,
          AccountTableFilters: true,
          AccountBulkActionsBar: AccountBulkActionsBarStub,
          AccountActionMenu: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: BulkEditAccountModalStub,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-test="select-row"] input').trigger('change')
    await wrapper.get('[data-test="next-page"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="select-row"] input').trigger('change')
    await wrapper.get('[data-test="probe-upstream-billing"]').trigger('click')
    await flushPromises()

    expect(probeUpstreamBillingBatch).toHaveBeenCalledWith([7, 11])
  })

  it('updates the current page locally after a batch probe', async () => {
    const account = (id: number, rateMultiplier: number) => ({
      id,
      name: `account-${id}`,
      platform: 'openai',
      type: 'apikey',
      status: 'active',
      schedulable: true,
      rate_multiplier: rateMultiplier,
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z'
    })
    listAccounts
      .mockResolvedValueOnce({ items: [account(7, 0.25)], total: 2, page: 1, page_size: 1, pages: 2 })
      .mockResolvedValueOnce({ items: [account(11, 0.25)], total: 2, page: 2, page_size: 1, pages: 2 })
      .mockResolvedValueOnce({ items: [account(11, 0.065)], total: 2, page: 2, page_size: 1, pages: 2 })
    probeUpstreamBillingBatch.mockResolvedValue([
      {
        account_id: 11,
        snapshot: {
          status: 'ok',
          data: { effective_rate_multiplier: 0.065 },
          synced_rate_multiplier: 0.065,
          last_attempt_at: '2026-07-13T00:00:00Z',
          next_probe_at: '2026-07-13T00:30:00Z'
        }
      }
    ])

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="table" /><slot name="pagination" /></div>' },
          DataTable: DataTableStub,
          AccountBulkActionsBar: AccountBulkActionsBarStub,
          AccountTableActions: true,
          AccountTableFilters: true,
          AccountActionMenu: true,
          Pagination: PaginationStub,
          ConfirmDialog: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: BulkEditAccountModalStub,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-test="next-page"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="select-row"] input').trigger('change')
    await wrapper.get('[data-test="probe-upstream-billing"]').trigger('click')
    await flushPromises()

    expect(probeUpstreamBillingBatch).toHaveBeenCalledWith([11])
    expect(listAccounts).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-test="account-rate"]').text()).toBe('0.065x')
  })

  it('does not report a successful batch probe as failed when reconciliation is skipped', async () => {
    const account = {
      id: 7,
      name: 'account-7',
      platform: 'openai',
      type: 'apikey',
      status: 'active',
      schedulable: true,
      rate_multiplier: 0.25,
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z'
    }
    listAccounts
      .mockResolvedValueOnce({ items: [account], total: 1, page: 1, page_size: 20, pages: 1 })
    probeUpstreamBillingBatch.mockResolvedValue([
      {
        account_id: 7,
        snapshot: {
          status: 'ok',
          data: { effective_rate_multiplier: 0.065 },
          last_attempt_at: '2026-07-13T00:00:00Z',
          next_probe_at: '2026-07-13T00:30:00Z'
        }
      }
    ])
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="table" /></div>' },
          DataTable: DataTableStub,
          AccountBulkActionsBar: AccountBulkActionsBarStub,
          AccountTableActions: true,
          AccountTableFilters: true,
          AccountActionMenu: true,
          Pagination: true,
          ConfirmDialog: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: BulkEditAccountModalStub,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-test="select-row"] input').trigger('change')
    await wrapper.get('[data-test="probe-upstream-billing"]').trigger('click')
    await flushPromises()

    expect(showError).not.toHaveBeenCalled()
    expect(showSuccess).toHaveBeenCalledWith('admin.accounts.upstreamBilling.batchCompleted')
    consoleError.mockRestore()
  })

  it('updates the account row after a successful single-account probe', async () => {
    const account = (rateMultiplier: number) => ({
      id: 7,
      name: 'account-7',
      platform: 'openai',
      type: 'apikey',
      status: 'active',
      schedulable: true,
      rate_multiplier: rateMultiplier,
      extra: { upstream_billing_probe_enabled: true },
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z'
    })
    listAccounts
      .mockResolvedValueOnce({ items: [account(0.25)], total: 1, page: 1, page_size: 20, pages: 1 })
      .mockResolvedValueOnce({ items: [account(0.065)], total: 1, page: 1, page_size: 20, pages: 1 })
    probeUpstreamBilling.mockResolvedValue({
      account_id: 7,
      snapshot: {
        status: 'ok',
        data: { effective_rate_multiplier: 0.065 },
        synced_rate_multiplier: 0.065,
        last_attempt_at: '2026-07-13T00:00:00Z',
        next_probe_at: '2026-07-13T00:30:00Z'
      }
    })

    const wrapper = mount(AccountsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="table" /></div>' },
          DataTable: ProbeDataTableStub,
          AccountBulkActionsBar: true,
          AccountTableActions: true,
          AccountTableFilters: true,
          AccountActionMenu: true,
          Pagination: true,
          ConfirmDialog: true,
          ImportDataModal: true,
          ReAuthAccountModal: true,
          AccountTestModal: true,
          AccountStatsModal: true,
          ScheduledTestsPanel: true,
          SyncFromCrsModal: true,
          TempUnschedStatusModal: true,
          ErrorPassthroughRulesModal: true,
          TLSFingerprintProfilesModal: true,
          CreateAccountModal: true,
          EditAccountModal: true,
          BulkEditAccountModal: true,
          PlatformTypeBadge: true,
          AccountCapacityCell: true,
          AccountStatusIndicator: true,
          AccountTodayStatsCell: true,
          AccountGroupsCell: true,
          AccountUsageCell: true,
          Icon: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('[data-testid="upstream-billing-probe"]').trigger('click')
    await flushPromises()

    expect(probeUpstreamBilling).toHaveBeenCalledWith(7)
    expect(listAccounts).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="account-rate"]').text()).toBe('0.065x')
  })
})

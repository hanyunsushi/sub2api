<template>
  <AppLayout>
    <TablePageLayout scroll-mode="page" class="accounts-table-page">
      <template #filters>
        <div class="table-filter-shell accounts-filter-shell flex flex-col gap-3 lg:flex-row lg:items-start">
          <AccountTableFilters
            v-model:searchQuery="params.search"
            :filters="params"
            :groups="groups"
            @update:filters="handleAccountFilterUpdate"
            @change="debouncedReload"
            @update:searchQuery="debouncedReload"
          />
          <AccountTableActions
            :loading="loading"
            @refresh="handleManualRefresh"
            @create="showCreate = true"
          >
            <template #after>
              <!-- Auto Refresh Dropdown -->
              <div
                class="relative"
                ref="autoRefreshDropdownRef"
                @pointerenter="openAutoRefreshDropdown"
                @mouseenter="openAutoRefreshDropdown"
                @mouseleave="scheduleAutoRefreshDropdownClose"
              >
                <button data-testid="admin-accounts-button-button"
                  ref="autoRefreshButtonRef"
                  @click="openAutoRefreshDropdown"
                  class="filter-menu-button filter-menu-button-with-caret"
                  :class="{ 'filter-menu-button-open': showAutoRefreshDropdown }"
                  :title="t('admin.accounts.autoRefresh')"
                >
                  <span>
                    {{
                      autoRefreshEnabled
                        ? t('admin.accounts.autoRefreshCountdown', { seconds: autoRefreshCountdown })
                      : t('admin.accounts.autoRefresh')
                    }}
                  </span>
                  <span class="filter-menu-caret" aria-hidden="true"></span>
                </button>
                <FloatingDropdown
                  :show="showAutoRefreshDropdown"
                  :trigger-el="autoRefreshButtonRef"
                  placement="bottom-end"
                  :offset="8"
                  panel-class="filter-underline-menu w-56 origin-top-right"
                  @mouseenter="cancelAutoRefreshDropdownClose"
                  @mouseleave="scheduleAutoRefreshDropdownClose"
                  @close="showAutoRefreshDropdown = false"
                >
                  <div class="p-2">
                    <button data-testid="admin-accounts-button-set-auto-refresh-enabled-auto-refresh-enabled"
                      @click="setAutoRefreshEnabled(!autoRefreshEnabled)"
                      class="dropdown-item flex w-full items-center justify-between text-left text-sm text-[var(--anthropic-muted)]"
                    >
                      <span>{{ t('admin.accounts.enableAutoRefresh') }}</span>
                      <Icon v-if="autoRefreshEnabled" name="check" size="sm" class="text-[var(--anthropic-fg)]" />
                    </button>
                    <div class="my-1 border-t border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"></div>
                    <button data-testid="admin-accounts-button-set-auto-refresh-interval-sec"
                      v-for="sec in autoRefreshIntervals"
                      :key="sec"
                      @click="setAutoRefreshInterval(sec)"
                      class="dropdown-item flex w-full items-center justify-between text-left text-sm text-[var(--anthropic-muted)]"
                    >
                      <span>{{ autoRefreshIntervalLabel(sec) }}</span>
                      <Icon v-if="autoRefreshIntervalSeconds === sec" name="check" size="sm" class="text-[var(--anthropic-fg)]" />
                    </button>
                  </div>
                </FloatingDropdown>
              </div>

              <!-- More Tools Dropdown -->
              <div
                class="relative"
                ref="accountToolsDropdownRef"
                @pointerenter="openAccountToolsDropdown"
                @mouseenter="openAccountToolsDropdown"
                @mouseleave="scheduleAccountToolsDropdownClose"
              >
                <button data-testid="admin-accounts-button-button-2"
                  ref="accountToolsButtonRef"
                  @click="openAccountToolsDropdown"
                  class="filter-menu-button filter-menu-button-with-caret"
                  :class="{ 'filter-menu-button-open': showAccountToolsDropdown }"
                  :title="t('admin.accounts.moreActions')"
                >
                  <span>{{ t('admin.accounts.moreActions') }}</span>
                  <span class="filter-menu-caret" aria-hidden="true"></span>
                </button>
                <FloatingDropdown
                  :show="showAccountToolsDropdown"
                  :trigger-el="accountToolsButtonRef"
                  placement="bottom-end"
                  :offset="8"
                  panel-class="filter-underline-menu w-[min(20rem,calc(100vw-2rem))] origin-top-right"
                  @mouseenter="cancelAccountToolsDropdownClose"
                  @mouseleave="scheduleAccountToolsDropdownClose"
                  @close="showAccountToolsDropdown = false"
                >
                  <div class="max-h-[70vh] overflow-y-auto p-2">
                    <div class="px-2 py-2">
                      <div class="text-xs font-semibold uppercase tracking-wide text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                        {{ t('admin.accounts.dataActions') }}
                      </div>
                    </div>
                    <button data-testid="admin-accounts-button-open-sync-from-crs" class="account-tools-menu-item" @click="openSyncFromCrs">
                      <span class="account-tools-menu-icon bg-[var(--anthropic-info-bg)] text-[var(--anthropic-info)] dark:bg-[var(--anthropic-info-bg)] dark:text-[var(--anthropic-info)]">
                        <Icon name="sync" size="sm" />
                      </span>
                      <span class="flex-1 text-left">{{ t('admin.accounts.syncFromCrs') }}</span>
                    </button>
                    <button data-testid="admin-accounts-button-open-import-data" class="account-tools-menu-item" @click="openImportData">
                      <span class="account-tools-menu-icon bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <Icon name="upload" size="sm" />
                      </span>
                      <span class="flex-1 text-left">{{ t('admin.accounts.dataImport') }}</span>
                    </button>
                    <button data-testid="admin-accounts-button-open-export-data-dialog-from-menu" class="account-tools-menu-item" @click="openExportDataDialogFromMenu">
                      <span class="account-tools-menu-icon bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-300">
                        <Icon name="download" size="sm" />
                      </span>
                      <span class="flex-1 text-left">
                        {{ selIds.length ? t('admin.accounts.dataExportSelected') : t('admin.accounts.dataExport') }}
                      </span>
                      <span
                        v-if="selIds.length"
                        class="rounded-full bg-[var(--anthropic-section)] px-2 py-0.5 text-xs font-medium text-[var(--anthropic-fg)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-fg)]"
                      >
                        {{ t('admin.accounts.selectedCount', { count: selIds.length }) }}
                      </span>
                    </button>

                    <div class="my-2 border-t border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"></div>
                    <div class="px-2 py-2">
                      <div class="text-xs font-semibold uppercase tracking-wide text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                        {{ t('admin.accounts.toolActions') }}
                      </div>
                    </div>
                    <button data-testid="admin-accounts-button-open-error-passthrough" class="account-tools-menu-item" @click="openErrorPassthrough">
                      <span class="account-tools-menu-icon bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                        <Icon name="shield" size="sm" />
                      </span>
                      <span class="flex-1 text-left">{{ t('admin.errorPassthrough.title') }}</span>
                    </button>
                    <button data-testid="admin-accounts-button-open-tls-fingerprint-profiles" class="account-tools-menu-item" @click="openTLSFingerprintProfiles">
                      <span class="account-tools-menu-icon bg-[var(--anthropic-raised)] text-slate-600 dark:bg-[var(--anthropic-section)] dark:text-slate-200">
                        <Icon name="lock" size="sm" />
                      </span>
                      <span class="flex-1 text-left">{{ t('admin.tlsFingerprintProfiles.title') }}</span>
                    </button>

                    <div class="my-2 border-t border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"></div>
                    <div class="px-2 py-2">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-xs font-semibold uppercase tracking-wide text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                          {{ t('admin.accounts.viewColumns') }}
                        </span>
                        <Icon name="grid" size="sm" class="text-[var(--anthropic-muted)]" />
                      </div>
                    </div>
                    <div class="grid grid-cols-1 gap-1">
                      <button data-testid="admin-accounts-button-toggle-column-col-key"
                        v-for="col in toggleableColumns"
                        :key="col.key"
                        @click="toggleColumn(col.key)"
                      class="dropdown-item flex w-full items-center justify-between text-left text-sm text-[var(--anthropic-muted)]"
                      >
                        <span class="truncate">{{ col.label }}</span>
                        <Icon v-if="isColumnVisible(col.key)" name="check" size="sm" class="text-[var(--anthropic-fg)]" />
                      </button>
                    </div>
                  </div>
                </FloatingDropdown>
              </div>
            </template>
          </AccountTableActions>
        </div>
        <div
          v-if="hasPendingListSync"
          class="mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <span>{{ t('admin.accounts.listPendingSyncHint') }}</span>
          <button data-testid="admin-accounts-button-sync-pending-list-changes"
            class="btn btn-secondary px-2 py-1 text-xs"
            @click="syncPendingListChanges"
          >
            {{ t('admin.accounts.listPendingSyncAction') }}
          </button>
        </div>
      </template>
      <template #table>
        <AccountBulkActionsBar
          :selected-ids="selIds"
          @delete="handleBulkDelete"
          @reset-status="handleBulkResetStatus"
          @refresh-token="handleBulkRefreshToken"
          @edit-selected="openBulkEditSelected"
          @edit-filtered="openBulkEditFiltered"
          @clear="clearSelection"
          @select-page="selectPage"
          @toggle-schedulable="handleBulkToggleSchedulable"
        />
        <div ref="accountTableRef" class="account-card-table-frame flex min-h-fit flex-none flex-col overflow-visible">
          <DataTable
            ref="dataTableRef"
            :columns="cols"
            :data="accounts"
            :loading="loading"
            :row-class="getAccountRowClass"
            row-key="id"
            :server-side-sort="true"
          @sort="handleSort"
          default-sort-key="name"
          default-sort-order="asc"
          :external-sort-key="sortState.sort_by"
          :external-sort-order="sortState.sort_order"
          :sort-storage-key="ACCOUNT_SORT_STORAGE_KEY"
          vertical-scroll-mode="page"
          :estimate-row-height="72"
          :overscan="5"
        >
          <template #header-select>
            <input data-testid="admin-accounts-input-checkbox"
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded border-[var(--anthropic-border)] text-[var(--anthropic-fg)] focus:ring-[var(--atelier-focus)]"
              :checked="allVisibleSelected"
              @click.stop
              @change="toggleSelectAllVisible($event)"
            />
          </template>
          <template #cell-select="{ row }">
            <div data-testid="account-card-controls" class="account-card-controls inline-flex items-center gap-1.5">
              <button
                data-testid="account-rate-quick-adjust"
                type="button"
                class="account-rate-quick-adjust inline-flex h-6 min-w-11 items-center justify-center rounded-md border border-[var(--anthropic-border)] bg-[var(--anthropic-section)] px-1.5 font-mono text-[11px] font-semibold leading-none text-[var(--anthropic-muted)] transition-colors hover:border-[var(--anthropic-fg)] hover:bg-[var(--anthropic-section)] hover:text-[var(--anthropic-fg)] dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:text-dark-300 dark:hover:border-[var(--anthropic-fg)] dark:hover:bg-[var(--anthropic-raised)] dark:hover:text-[var(--anthropic-fg)]"
                :title="localText('调整账号倍率', 'Adjust account rate multiplier')"
                @click.stop="openRateMultiplierMenu(row, $event)"
              >
                x{{ formatAccountRateMultiplier(row.rate_multiplier) }}
              </button>
              <div
                data-testid="account-priority-quick-adjust"
                class="account-priority-quick-adjust inline-flex h-6 items-center overflow-hidden rounded-md border border-[var(--anthropic-border)] bg-[var(--anthropic-section)] font-mono text-[11px] font-semibold leading-none text-[var(--anthropic-muted)] dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:text-dark-300"
                :title="t('admin.accounts.priority')"
              >
                <button data-testid="admin-accounts-button-handle-priority-quick-adjust-row-1"
                  type="button"
                  class="account-priority-step"
                  :title="localText('提高优先级', 'Raise priority')"
                  :disabled="priorityUpdatingIds.has(row.id) || normalizeAccountPriority(row.priority) <= 0"
                  @click.stop="handlePriorityQuickAdjust(row, -1)"
                >
                  <Icon name="chevronUp" size="xs" />
                </button>
                <span data-testid="account-card-priority" class="account-priority-value">
                  P{{ row.priority ?? '-' }}
                </span>
                <button data-testid="admin-accounts-button-handle-priority-quick-adjust-row-1-2"
                  type="button"
                  class="account-priority-step"
                  :title="localText('降低优先级', 'Lower priority')"
                  :disabled="priorityUpdatingIds.has(row.id)"
                  @click.stop="handlePriorityQuickAdjust(row, 1)"
                >
                  <Icon name="chevronDown" size="xs" />
                </button>
              </div>
              <input data-testid="admin-accounts-input-checkbox-2" type="checkbox" :checked="isSelected(row.id)" @change="toggleSel(row.id)" class="rounded border-[var(--anthropic-border)] text-[var(--anthropic-fg)] focus:ring-[var(--atelier-focus)]" />
            </div>
          </template>
          <template #cell-id="{ value }">
            <span class="font-mono text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">#{{ value }}</span>
          </template>
          <template #cell-name="{ row, value }">
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="account-card-name-main flex min-w-0 items-start gap-2">
                <div
                  data-testid="account-provider-logo"
                  class="account-provider-logo"
                  :title="getAccountLogoProvider(row)"
                >
                  <ProviderBrandIcon
                    :provider="getAccountLogoProvider(row)"
                    :model="row.name || row.platform"
                    :logo-url="getAccountCustomLogo(row)"
                  />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ value }}</span>
                  <span
                    v-if="row.extra?.email_address || row.extra?.email || row.credentials?.email"
                    class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)] truncate max-w-[200px]"
                    :title="String(row.extra?.email_address || row.extra?.email || row.credentials?.email)"
                  >
                    {{ row.extra?.email_address || row.extra?.email || row.credentials?.email }}
                  </span>
                </div>
              </div>
              <div
                v-if="getAccountExternalQuota(row)"
                data-testid="account-external-quota"
                class="account-external-quota mt-2 grid gap-1 px-0 py-0.5 text-[11px] leading-4 text-[var(--anthropic-muted)] dark:text-dark-300"
              >
                <div class="account-external-quota-row account-external-quota-row-head">
                  <span class="account-external-quota-label font-semibold text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                    {{ getAccountExternalQuota(row)?.label }}
                  </span>
                  <a data-testid="admin-accounts-link-a"
                    class="account-external-quota-link font-medium text-[var(--anthropic-fg)] hover:text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]"
                    :href="getAccountExternalQuota(row)?.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ localText('前往官网', 'Official site') }}
                  </a>
                </div>
                <div class="account-external-quota-row">
                  <span class="account-external-quota-label">{{ localText('余额', 'Balance') }}</span>
                  <span class="account-external-quota-value font-mono font-semibold">{{ getAccountExternalQuota(row)?.formattedBalance }}</span>
                </div>
                <div class="account-external-quota-row">
                  <span class="account-external-quota-label">{{ localText('期限', 'Expiry') }}</span>
                  <span class="account-external-quota-value font-mono">{{ getAccountExternalQuota(row)?.formattedExpiry }}</span>
                </div>
              </div>
            </div>
          </template>
          <template #cell-notes="{ value }">
            <span v-if="value" :title="value" class="block max-w-xs truncate text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ value }}</span>
            <span v-else class="text-sm text-[var(--anthropic-muted)] dark:text-dark-500">-</span>
          </template>
          <template #cell-platform_type="{ row }">
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex flex-wrap items-center gap-1">
                <PlatformTypeBadge :platform="row.platform" :type="row.type" :plan-type="row.credentials?.plan_type" :privacy-mode="row.extra?.privacy_mode" :subscription-expires-at="row.credentials?.subscription_expires_at" />
                <span
                  v-if="getAntigravityTierLabel(row)"
                  :class="['inline-block rounded px-1.5 py-0.5 text-[10px] font-medium', getAntigravityTierClass(row)]"
                >
                  {{ getAntigravityTierLabel(row) }}
                </span>
              </div>
              <div
                v-if="getOpenAICompactMeta(row)"
                :class="[
                  'inline-flex items-center gap-1.5 pl-0.5 text-[11px] font-medium leading-4',
                  getOpenAICompactMeta(row)?.className
                ]"
                :title="getOpenAICompactTitle(row)"
              >
                <span :class="['h-1.5 w-1.5 rounded-full', getOpenAICompactMeta(row)?.dotClass]" />
                <span>{{ getOpenAICompactMeta(row)?.label }}</span>
              </div>
            </div>
          </template>
          <template #cell-capacity="{ row }">
            <AccountCapacityCell :account="row" />
          </template>
          <template #cell-status="{ row }">
            <div class="flex items-center gap-1.5">
              <AccountStatusIndicator :account="row" @show-temp-unsched="handleShowTempUnsched" />
            </div>
          </template>
          <template #cell-schedulable="{ row }">
            <div class="inline-flex items-center gap-1.5">
              <button data-testid="admin-accounts-button-handle-toggle-schedulable-row" @click="handleToggleSchedulable(row)" :disabled="togglingSchedulable === row.id" class="account-toggle-switch relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--atelier-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-dark-800" :class="[row.schedulable ? 'account-toggle-switch-active bg-[var(--anthropic-focus)] hover:bg-[var(--anthropic-focus)]' : 'bg-[var(--anthropic-raised)] hover:bg-gray-300 dark:bg-[var(--anthropic-section)] dark:hover:bg-dark-500']" :title="row.schedulable ? t('admin.accounts.schedulableEnabled') : t('admin.accounts.schedulableDisabled')">
                <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[var(--anthropic-page)] shadow ring-0 transition duration-200 ease-in-out" :class="[row.schedulable ? 'translate-x-4' : 'translate-x-0']" />
              </button>
              <button
                data-testid="account-schedule-lock-action"
                type="button"
                class="account-schedule-lock-action inline-flex h-6 w-6 items-center justify-center rounded-md border text-[var(--anthropic-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                :class="row.schedule_locked ? 'account-schedule-lock-action-locked border-transparent bg-transparent text-[var(--anthropic-fg)] hover:bg-transparent dark:border-transparent dark:bg-transparent dark:text-[var(--anthropic-fg)]' : 'account-schedule-lock-action-unlocked border-transparent bg-transparent hover:border-transparent hover:bg-transparent hover:text-[var(--anthropic-fg)] dark:border-transparent dark:bg-transparent dark:text-dark-300 dark:hover:bg-transparent dark:hover:text-[var(--anthropic-fg)]'"
                :disabled="togglingScheduleLock === row.id"
                :title="row.schedule_locked ? t('admin.accounts.scheduleLocked') : t('admin.accounts.scheduleUnlocked')"
                @click="handleToggleScheduleLock(row)"
              >
                <Icon :name="row.schedule_locked ? 'lock' : 'unlock'" size="xs" />
              </button>
            </div>
          </template>
          <template #cell-today_stats="{ row }">
            <AccountTodayStatsCell
              :stats="todayStatsByAccountId[String(row.id)] ?? null"
              :loading="todayStatsLoading"
              :error="todayStatsError"
            />
          </template>
          <template #cell-groups="{ row }">
            <AccountGroupsCell :groups="row.groups" :max-display="4" />
          </template>
          <template #header-usage="{ column }">
            <div class="flex items-center">
              <span>{{ column.label }}</span>
              <HelpTooltip :content="t('admin.accounts.usageWindowsHint')" width-class="w-72" />
            </div>
          </template>
          <template #cell-usage="{ row }">
            <div class="account-usage-stack">
              <AccountUsageCell
                :account="row"
                :today-stats="todayStatsByAccountId[String(row.id)] ?? null"
                :today-stats-loading="todayStatsLoading"
                :manual-refresh-token="usageManualRefreshToken"
              />
              <UsageProgressBar
                v-if="getAccountExternalQuotaProgress(row)?.progress"
                data-testid="account-external-quota-usage-progress"
                class="account-external-quota-usage-progress"
                label="EXT"
                :utilization="getAccountExternalQuotaProgress(row)?.progress?.percent ?? 0"
                :title="getAccountExternalQuotaProgress(row)?.formattedUsage"
                color="success"
                :show-now-when-idle="false"
              />
            </div>
          </template>
          <template #cell-proxy="{ row }">
            <div class="flex flex-col gap-1">
              <div v-if="row.proxy" class="flex items-center gap-2">
                <span class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ row.proxy.name }}</span>
                <span v-if="row.proxy.country_code" class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ({{ row.proxy.country_code }})
                </span>
              </div>
              <span v-else class="text-sm text-[var(--anthropic-muted)] dark:text-dark-500">-</span>
              <div v-if="row.proxy && row.proxy.expires_at" class="flex items-center gap-2 text-xs">
                <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatDateTime(row.proxy.expires_at) }}</span>
                <span :class="proxyExpiryBadge(row.proxy)">{{ proxyExpiryText(row.proxy) }}</span>
              </div>
              <div v-if="row.proxy_fallback_origin_id" class="flex items-center gap-1">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :title="t('admin.accounts.fallbackActiveTip', { origin: row.proxy_fallback_origin_name })">
                  {{ t('admin.accounts.fallbackActive') }}
                </span>
                <button data-testid="admin-accounts-button-on-revert-fallback-row" class="text-xs px-1.5 py-0.5 rounded border border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)] text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)] hover:bg-[var(--anthropic-raised)] dark:hover:bg-[var(--anthropic-raised)]" @click="onRevertFallback(row)">{{ t('admin.accounts.revertProxy') }}</button>
              </div>
            </div>
          </template>
          <template #cell-rate_multiplier="{ row }">
            <span class="text-sm font-mono text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
              {{ (row.rate_multiplier ?? 1).toFixed(2) }}x
            </span>
          </template>
          <template #cell-priority="{ value }">
            <span class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ value }}</span>
          </template>
          <template #header-scheduler_score="{ column }">
            <div class="flex items-center">
              <span>{{ column.label }}</span>
              <HelpTooltip :content="t('admin.accounts.schedulerScore.hint')" width-class="w-80" />
            </div>
          </template>
          <template #cell-scheduler_score="{ row }">
            <div v-if="getSchedulerScoreRows(row).length" class="flex min-w-[7rem] flex-col gap-0.5 font-mono text-[11px] leading-4">
              <div
                v-for="score in getSchedulerScoreRows(row)"
                :key="String(score.group_id)"
                class="flex items-center gap-1 whitespace-nowrap text-gray-700 dark:text-gray-300"
                :title="`${formatSchedulerScoreGroup(score)} / ${formatStickySchedulerScore(score)}`"
              >
                <span class="max-w-[4.75rem] truncate text-gray-500 dark:text-dark-400">{{ formatSchedulerScoreGroup(score) }}</span>
                <span class="text-gray-300 dark:text-gray-600">/</span>
                <span class="text-primary-700 dark:text-primary-300">{{ formatStickySchedulerScore(score) }}</span>
              </div>
            </div>
            <span v-else class="text-sm text-gray-400 dark:text-dark-500">-</span>
          </template>
          <template #cell-last_used_at="{ value }">
            <span class="font-mono text-[11px] leading-4 text-[var(--anthropic-muted)] dark:text-dark-400">{{ formatRelativeTime(value) }}</span>
          </template>
          <template #cell-created_at="{ value }">
            <span class="font-mono text-[11px] leading-4 text-[var(--anthropic-muted)] dark:text-dark-400">{{ formatDateTime(value) }}</span>
          </template>
          <template #cell-expires_at="{ row, value }">
            <div class="flex flex-col items-start gap-1">
              <span class="text-sm text-[var(--anthropic-muted)] dark:text-dark-400">{{ formatExpiresAt(value) }}</span>
              <div v-if="isExpired(value) || (row.auto_pause_on_expired && value)" class="flex items-center gap-1">
                <span
                  v-if="isExpired(value)"
                  class="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {{ t('admin.accounts.expired') }}
                </span>
                <span
                  v-if="row.auto_pause_on_expired && value"
                  class="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  {{ t('admin.accounts.autoPauseOnExpired') }}
                </span>
              </div>
            </div>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex items-center gap-1">
              <button data-testid="admin-accounts-button-handle-edit-row" @click="handleEdit(row)" class="account-card-text-action">
                <span>{{ t('common.edit') }}</span>
              </button>
              <button data-testid="admin-accounts-button-handle-delete-row" @click="handleDelete(row)" class="account-card-text-action account-card-text-action-danger">
                <span>{{ t('common.delete') }}</span>
              </button>
              <button
                data-testid="admin-accounts-button-open-menu-row-event"
                @click="openMenu(row, $event)"
                @mouseenter="openMenu(row, $event)"
                @pointerenter="openMenu(row, $event)"
                @mouseleave="scheduleMenuClose"
                @pointerleave="scheduleMenuClose"
                @focus="openMenu(row, $event)"
                @blur="scheduleMenuClose"
                class="account-card-text-action account-card-more-trigger"
                :class="{ 'account-card-more-trigger-open': menu.show && menu.acc?.id === row.id }"
                aria-haspopup="menu"
                :aria-expanded="menu.show && menu.acc?.id === row.id ? 'true' : 'false'"
              >
                <span>{{ t('common.more') }}</span>
                <span class="account-card-text-caret" aria-hidden="true"></span>
              </button>
              <button
                data-testid="account-external-quota-progress-action"
                type="button"
                class="account-card-text-action"
                :title="localText('额度条', 'Quota bar')"
                @click="openExternalQuotaProgressSettings(row)"
              >
                <span>{{ localText('额度条', 'Quota bar') }}</span>
              </button>
            </div>
          </template>
        </DataTable>
        </div>
      </template>
      <template #pagination><Pagination v-if="pagination.total > 0" :page="pagination.page" :total="pagination.total" :page-size="pagination.page_size" @update:page="handlePageChange" @update:pageSize="handlePageSizeChange" /></template>
    </TablePageLayout>
    <CreateAccountModal :show="showCreate" :proxies="proxies" :groups="groups" @close="showCreate = false" @created="reload" />
    <EditAccountModal :show="showEdit" :account="edAcc" :proxies="proxies" :groups="groups" @close="showEdit = false" @updated="handleAccountUpdated" />
    <ReAuthAccountModal :show="showReAuth" :account="reAuthAcc" @close="closeReAuthModal" @reauthorized="handleAccountUpdated" />
    <AccountTestModal :show="showTest" :account="testingAcc" @close="closeTestModal" />
    <AccountStatsModal :show="showStats" :account="statsAcc" @close="closeStatsModal" />
    <ScheduledTestsPanel :show="showSchedulePanel" :account-id="scheduleAcc?.id ?? null" :model-options="scheduleModelOptions" @close="closeSchedulePanel" />
    <AccountActionMenu
      :show="menu.show"
      :account="menu.acc"
      :position="menu.pos"
      @close="closeMenu"
      @menu-enter="cancelMenuClose"
      @menu-leave="scheduleMenuClose"
      @test="handleTest"
      @stats="handleViewStats"
      @schedule="handleSchedule"
      @reauth="handleReAuth"
      @refresh-token="handleRefresh"
      @recover-state="handleRecoverState"
      @reset-quota="handleResetQuota"
      @set-privacy="handleSetPrivacy"
    />
    <ExternalQuotaProgressSettingsModal
      :show="externalQuotaProgressSettings.show"
      :account="externalQuotaProgressSettings.account"
      :subscription="externalQuotaProgressSettings.subscription"
      :settings="externalQuotaProgressSettings.current"
      @close="closeExternalQuotaProgressSettings"
      @save="saveExternalQuotaProgressSettings"
    />
    <FloatingDropdown
      :show="rateMultiplierMenu.show"
      :trigger-el="rateMultiplierMenu.triggerEl"
      placement="bottom-end"
      :offset="6"
      panel-class="account-rate-menu w-56 rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] p-3 shadow-none dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]"
      @close="closeRateMultiplierMenu"
    >
      <form class="space-y-2" @submit.prevent="handleRateMultiplierSave">
        <div class="flex items-center justify-between gap-3">
          <label class="text-xs font-semibold text-[var(--anthropic-muted)] dark:text-dark-300">
            {{ localText('账号倍率', 'Account rate') }}
          </label>
          <span class="font-mono text-[11px] text-[var(--anthropic-muted)]">
            {{ rateMultiplierMenu.account?.name }}
          </span>
        </div>
        <input data-testid="admin-accounts-input-rate-multiplier-menu-value"
          v-model="rateMultiplierMenu.value"
          type="number"
          min="0"
          step="0.01"
          class="input h-9 font-mono text-sm"
          autocomplete="off"
          :disabled="rateMultiplierMenu.saving"
        />
        <div class="flex justify-end gap-2">
          <button data-testid="admin-accounts-button-close-rate-multiplier-menu"
            type="button"
            class="btn btn-secondary px-2 py-1 text-xs"
            :disabled="rateMultiplierMenu.saving"
            @click="closeRateMultiplierMenu"
          >
            <Icon name="x" size="xs" />
          </button>
          <button data-testid="admin-accounts-button-submit"
            type="submit"
            class="btn btn-primary px-2 py-1 text-xs"
            :disabled="rateMultiplierMenu.saving"
          >
            <Icon name="check" size="xs" />
          </button>
        </div>
      </form>
    </FloatingDropdown>
    <SyncFromCrsModal :show="showSync" @close="showSync = false" @synced="reload" />
    <ImportDataModal :show="showImportData" @close="showImportData = false" @imported="handleDataImported" />
    <BulkEditAccountModal
      :show="showBulkEdit"
      :account-ids="selIds"
      :selected-platforms="selPlatforms"
      :selected-types="selTypes"
      :target="bulkEditTarget ?? undefined"
      :proxies="proxies"
      :groups="groups"
      @close="showBulkEdit = false"
      @updated="handleBulkUpdated"
    />
    <TempUnschedStatusModal :show="showTempUnsched" :account="tempUnschedAcc" @close="showTempUnsched = false" @reset="handleTempUnschedReset" />
    <ConfirmDialog :show="showDeleteDialog" :title="t('admin.accounts.deleteAccount')" :message="t('admin.accounts.deleteConfirm', { name: deletingAcc?.name })" :confirm-text="t('common.delete')" :cancel-text="t('common.cancel')" :danger="true" @confirm="confirmDelete" @cancel="showDeleteDialog = false" />
    <ConfirmDialog :show="showExportDataDialog" :title="t('admin.accounts.dataExport')" :message="t('admin.accounts.dataExportConfirmMessage')" :confirm-text="t('admin.accounts.dataExportConfirm')" :cancel-text="t('common.cancel')" @confirm="handleExportData" @cancel="showExportDataDialog = false">
      <label class="flex items-center gap-2 text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
        <input data-testid="admin-accounts-input-include-proxy-on-export" type="checkbox" class="h-4 w-4 rounded border-[var(--anthropic-border)] text-[var(--anthropic-fg)] focus:ring-[var(--atelier-focus)]" v-model="includeProxyOnExport" />
        <span>{{ t('admin.accounts.dataExportIncludeProxies') }}</span>
      </label>
    </ConfirmDialog>
    <ErrorPassthroughRulesModal :show="showErrorPassthrough" @close="showErrorPassthrough = false" />
    <TLSFingerprintProfilesModal :show="showTLSFingerprintProfiles" @close="showTLSFingerprintProfiles = false" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, toRaw, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { adminAPI } from '@/api/admin'
import externalSubscriptionsAPI, { type ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import { useTableLoader } from '@/composables/useTableLoader'
import { useSwipeSelect, type SwipeSelectVirtualContext } from '@/composables/useSwipeSelect'
import { useTableSelection } from '@/composables/useTableSelection'
import { buildAccountExternalQuotaProgressPreferenceKey, useAccountExternalQuotaProgressSettings } from '@/composables/useAccountExternalQuotaProgressSettings'
import { findMatchingExternalSubscription } from '@/utils/externalSubscriptionMatch'
import {
  buildAccountExternalQuotaProgressMeta,
  type AccountExternalQuotaProgressPreference,
  type ExternalQuotaProgressMeta,
} from '@/utils/externalSubscriptionQuotaProgress'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import { CreateAccountModal, EditAccountModal, BulkEditAccountModal, SyncFromCrsModal, TempUnschedStatusModal } from '@/components/account'
import AccountTableActions from '@/components/admin/account/AccountTableActions.vue'
import AccountTableFilters from '@/components/admin/account/AccountTableFilters.vue'
import AccountBulkActionsBar from '@/components/admin/account/AccountBulkActionsBar.vue'
import AccountActionMenu from '@/components/admin/account/AccountActionMenu.vue'
import ImportDataModal from '@/components/admin/account/ImportDataModal.vue'
import ReAuthAccountModal from '@/components/admin/account/ReAuthAccountModal.vue'
import AccountTestModal from '@/components/admin/account/AccountTestModal.vue'
import AccountStatsModal from '@/components/admin/account/AccountStatsModal.vue'
import ScheduledTestsPanel from '@/components/admin/account/ScheduledTestsPanel.vue'
import ExternalQuotaProgressSettingsModal from '@/components/admin/account/ExternalQuotaProgressSettingsModal.vue'
import type { SelectOption } from '@/components/common/Select.vue'
import AccountStatusIndicator from '@/components/account/AccountStatusIndicator.vue'
import AccountUsageCell from '@/components/account/AccountUsageCell.vue'
import UsageProgressBar from '@/components/account/UsageProgressBar.vue'
import AccountTodayStatsCell from '@/components/account/AccountTodayStatsCell.vue'
import AccountGroupsCell from '@/components/account/AccountGroupsCell.vue'
import AccountCapacityCell from '@/components/account/AccountCapacityCell.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import PlatformTypeBadge from '@/components/common/PlatformTypeBadge.vue'
import Icon from '@/components/icons/Icon.vue'
import ErrorPassthroughRulesModal from '@/components/admin/ErrorPassthroughRulesModal.vue'
import TLSFingerprintProfilesModal from '@/components/admin/TLSFingerprintProfilesModal.vue'
import { buildOpenAIUsageRefreshKey } from '@/utils/accountUsageRefresh'
import { formatDateTime, formatRelativeTime } from '@/utils/format'
import { proxyExpiryBadgeClass, proxyExpiryLabelKey } from '@/utils/proxyExpiry'
import type { Account, AccountPlatform, AccountSchedulerGroupScore, AccountType, Proxy as AccountProxy, AdminGroup, WindowStats, ClaudeModel } from '@/types'

const { t, locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

const localText = (zh: string, en: string) => locale?.value?.startsWith('zh') ? zh : en

const proxies = ref<AccountProxy[]>([])
const groups = ref<AdminGroup[]>([])
const accountTableRef = ref<HTMLElement | null>(null)
const dataTableRef = ref<InstanceType<typeof DataTable> | null>(null)
type AccountBulkEditTarget =
  | {
      mode: 'selected'
      accountIds: number[]
      selectedPlatforms: AccountPlatform[]
      selectedTypes: AccountType[]
    }
  | {
      mode: 'filtered'
      filters: {
        platform?: string
        type?: string
        status?: string
        group?: string
        search?: string
        privacy_mode?: string
        sort_by?: string
        sort_order?: AccountSortOrder
      }
      previewCount: number
      selectedPlatforms: AccountPlatform[]
      selectedTypes: AccountType[]
    }
const selPlatforms = computed<AccountPlatform[]>(() => {
  const platforms = new Set(
    accounts.value
      .filter(a => isSelected(a.id))
      .map(a => a.platform)
  )
  return [...platforms]
})
const selTypes = computed<AccountType[]>(() => {
  const types = new Set(
    accounts.value
      .filter(a => isSelected(a.id))
      .map(a => a.type)
  )
  return [...types]
})
const showCreate = ref(false)
const showEdit = ref(false)
const showSync = ref(false)
const showImportData = ref(false)
const showExportDataDialog = ref(false)
const includeProxyOnExport = ref(true)
const showBulkEdit = ref(false)
const bulkEditTarget = ref<AccountBulkEditTarget | null>(null)
const showTempUnsched = ref(false)
const showDeleteDialog = ref(false)
const showReAuth = ref(false)
const showTest = ref(false)
const showStats = ref(false)
const showErrorPassthrough = ref(false)
const showTLSFingerprintProfiles = ref(false)
const edAcc = ref<Account | null>(null)
const tempUnschedAcc = ref<Account | null>(null)
const deletingAcc = ref<Account | null>(null)
const reAuthAcc = ref<Account | null>(null)
const testingAcc = ref<Account | null>(null)
const statsAcc = ref<Account | null>(null)
const showSchedulePanel = ref(false)
const scheduleAcc = ref<Account | null>(null)
const scheduleModelOptions = ref<SelectOption[]>([])
const togglingSchedulable = ref<number | null>(null)
const togglingScheduleLock = ref<number | null>(null)
const priorityUpdatingIds = reactive<Set<number>>(new Set())
const menu = reactive<{show:boolean, acc:Account|null, pos:{top:number, left:number}|null, triggerRect: DOMRect | null}>({ show: false, acc: null, pos: null, triggerRect: null })
let menuCloseTimer: ReturnType<typeof setTimeout> | null = null
const rateMultiplierMenu = reactive<{
  show: boolean
  account: Account | null
  triggerEl: HTMLElement | null
  value: string
  saving: boolean
}>({
  show: false,
  account: null,
  triggerEl: null,
  value: '1.00',
  saving: false
})
const exportingData = ref(false)

// Account tools dropdown
const showAccountToolsDropdown = ref(false)
const accountToolsDropdownRef = ref<HTMLElement | null>(null)
const accountToolsButtonRef = ref<HTMLElement | null>(null)
let accountToolsDropdownCloseTimer: ReturnType<typeof setTimeout> | null = null
const hiddenColumns = reactive<Set<string>>(new Set())
const DEFAULT_HIDDEN_COLUMNS = ['today_stats', 'proxy', 'notes', 'priority', 'scheduler_score', 'rate_multiplier']
const HIDDEN_COLUMNS_KEY = 'account-hidden-columns'
// One-time migration: hide scheduler score for existing admins too, because showing it opt-ins to heavy backend scoring.
const HIDDEN_COLUMNS_VERSION_KEY = 'account-hidden-columns-version'
const HIDDEN_COLUMNS_CURRENT_VERSION = 'scheduler-score-hidden-by-default'

// Sorting settings
const ACCOUNT_SORT_STORAGE_KEY = 'account-table-sort'
type AccountSortOrder = 'asc' | 'desc'
type AccountSortState = {
  sort_by: string
  sort_order: AccountSortOrder
}
const ACCOUNT_SORTABLE_KEYS = new Set([
  'id',
  'name',
  'status',
  'schedulable',
  'priority',
  'rate_multiplier',
  'last_used_at',
  'created_at',
  'expires_at'
])
const loadInitialAccountSortState = (): AccountSortState => {
  const fallback: AccountSortState = { sort_by: 'name', sort_order: 'asc' }
  try {
    const raw = localStorage.getItem(ACCOUNT_SORT_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { key?: string; order?: string }
    const key = typeof parsed.key === 'string' ? parsed.key : ''
    if (!ACCOUNT_SORTABLE_KEYS.has(key)) return fallback
    return {
      sort_by: key,
      sort_order: parsed.order === 'desc' ? 'desc' : 'asc'
    }
  } catch {
    return fallback
  }
}
const sortState = reactive<AccountSortState>(loadInitialAccountSortState())

// Auto refresh settings
const showAutoRefreshDropdown = ref(false)
const autoRefreshDropdownRef = ref<HTMLElement | null>(null)
const autoRefreshButtonRef = ref<HTMLElement | null>(null)
let autoRefreshDropdownCloseTimer: ReturnType<typeof setTimeout> | null = null
const AUTO_REFRESH_STORAGE_KEY = 'account-auto-refresh'
const autoRefreshIntervals = [5, 10, 15, 30] as const
const autoRefreshEnabled = ref(false)
const autoRefreshIntervalSeconds = ref<(typeof autoRefreshIntervals)[number]>(30)
const autoRefreshCountdown = ref(0)
const autoRefreshETag = ref<string | null>(null)
const autoRefreshFetching = ref(false)
const AUTO_REFRESH_SILENT_WINDOW_MS = 15000
const ACCOUNT_CALLING_GRACE_MS = 60_000
const autoRefreshSilentUntil = ref(0)
const hasPendingListSync = ref(false)
const todayStatsByAccountId = ref<Record<string, WindowStats>>({})
const todayStatsLoading = ref(false)
const todayStatsError = ref<string | null>(null)
const todayStatsReqSeq = ref(0)
const pendingTodayStatsRefresh = ref(false)
const usageManualRefreshToken = ref(0)
const externalSubscriptionStatuses = ref<ExternalSubscriptionStatus[]>([])
const {
  loadAccountExternalQuotaProgressSettings,
  getAccountExternalQuotaProgressPreference,
  setAccountExternalQuotaProgressPreference,
} = useAccountExternalQuotaProgressSettings()
const externalQuotaProgressSettings = reactive<{
  show: boolean
  account: Account | null
  subscription: ExternalSubscriptionStatus | null
  current: AccountExternalQuotaProgressPreference | null
}>({
  show: false,
  account: null,
  subscription: null,
  current: null,
})

const cancelAccountToolsDropdownClose = () => {
  if (accountToolsDropdownCloseTimer) {
    clearTimeout(accountToolsDropdownCloseTimer)
    accountToolsDropdownCloseTimer = null
  }
}

const openAccountToolsDropdown = () => {
  cancelAccountToolsDropdownClose()
  showAccountToolsDropdown.value = true
  showAutoRefreshDropdown.value = false
}

const scheduleAccountToolsDropdownClose = () => {
  cancelAccountToolsDropdownClose()
  accountToolsDropdownCloseTimer = setTimeout(() => {
    showAccountToolsDropdown.value = false
    accountToolsDropdownCloseTimer = null
  }, 160)
}

const cancelAutoRefreshDropdownClose = () => {
  if (autoRefreshDropdownCloseTimer) {
    clearTimeout(autoRefreshDropdownCloseTimer)
    autoRefreshDropdownCloseTimer = null
  }
}

const openAutoRefreshDropdown = () => {
  cancelAutoRefreshDropdownClose()
  showAutoRefreshDropdown.value = true
  showAccountToolsDropdown.value = false
}

const scheduleAutoRefreshDropdownClose = () => {
  cancelAutoRefreshDropdownClose()
  autoRefreshDropdownCloseTimer = setTimeout(() => {
    showAutoRefreshDropdown.value = false
    autoRefreshDropdownCloseTimer = null
  }, 160)
}
const accountCallingGraceUntil = reactive(new Map<number, number>())
const accountCallingNow = ref(Date.now())
let accountCallingGraceTimer: ReturnType<typeof setInterval> | null = null

function hasLiveAccountActivity(row: Account) {
  return (row.current_concurrency ?? 0) > 0 || (row.active_sessions ?? 0) > 0
}

function syncAccountCallingGrace() {
  const now = Date.now()
  accountCallingNow.value = now
  const liveAccountIds = new Set<number>()

  for (const account of accounts.value) {
    if (!hasLiveAccountActivity(account)) continue
    liveAccountIds.add(account.id)
    accountCallingGraceUntil.set(account.id, Date.now() + ACCOUNT_CALLING_GRACE_MS)
  }

  for (const [accountId, graceUntil] of accountCallingGraceUntil) {
    if (liveAccountIds.has(accountId)) continue
    if (graceUntil <= now) accountCallingGraceUntil.delete(accountId)
  }
}

const buildDefaultTodayStats = (): WindowStats => ({
  requests: 0,
  tokens: 0,
  cost: 0,
  standard_cost: 0,
  user_cost: 0
})

const refreshTodayStatsBatch = async () => {
  // Why this checks both columns:
  // - today_stats column shows dedicated today's metrics.
  // - usage column also embeds today's stats for Key/Bedrock rows.
  // So we only skip fetching when BOTH columns are hidden.
  if (hiddenColumns.has('today_stats') && hiddenColumns.has('usage')) {
    todayStatsLoading.value = false
    todayStatsError.value = null
    return
  }

  const accountIDs = accounts.value.map(account => account.id)
  const reqSeq = ++todayStatsReqSeq.value
  if (accountIDs.length === 0) {
    todayStatsByAccountId.value = {}
    todayStatsError.value = null
    todayStatsLoading.value = false
    return
  }

  todayStatsLoading.value = true
  todayStatsError.value = null

  try {
    const result = await adminAPI.accounts.getBatchTodayStats(accountIDs)
    if (reqSeq !== todayStatsReqSeq.value) return
    const serverStats = result.stats ?? {}
    const nextStats: Record<string, WindowStats> = {}
    for (const accountID of accountIDs) {
      const key = String(accountID)
      nextStats[key] = serverStats[key] ?? buildDefaultTodayStats()
    }
    todayStatsByAccountId.value = nextStats
  } catch (error) {
    if (reqSeq !== todayStatsReqSeq.value) return
    todayStatsError.value = 'Failed'
    console.error('Failed to load account today stats:', error)
  } finally {
    if (reqSeq === todayStatsReqSeq.value) {
      todayStatsLoading.value = false
    }
  }
}

const autoRefreshIntervalLabel = (sec: number) => {
  if (sec === 5) return t('admin.accounts.refreshInterval5s')
  if (sec === 10) return t('admin.accounts.refreshInterval10s')
  if (sec === 15) return t('admin.accounts.refreshInterval15s')
  if (sec === 30) return t('admin.accounts.refreshInterval30s')
  return `${sec}s`
}

const formatSchedulerScore = (value: unknown): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return num.toFixed(2)
}

const formatStickySchedulerScore = (score: AccountSchedulerGroupScore): string => {
  if (!score) return '-'
  if (score.sticky_score_infinity) return '+∞'
  return formatSchedulerScore(score.sticky_score)
}

const getSchedulerScoreRows = (account: Account): AccountSchedulerGroupScore[] => {
  const groupRows = Array.isArray(account.scheduler_scores)
    ? account.scheduler_scores.filter(score => score.group_id != null)
    : []
  if (groupRows.length) return groupRows
  // 未分组账号没有分组维度分数，回退展示后端返回的基础分
  if (account.scheduler_score) {
    return [{ group_id: null, ...account.scheduler_score }]
  }
  return []
}

const formatSchedulerScoreGroup = (score: AccountSchedulerGroupScore): string => {
  if ('group_name' in score && score.group_name) return score.group_name
  if ('group_id' in score && score.group_id != null) return `#${score.group_id}`
  return t('admin.accounts.schedulerScore.ungrouped')
}

const loadSavedColumns = () => {
  try {
    const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as string[]
      parsed.forEach(key => {
        hiddenColumns.add(key)
      })
      // Older saved column layouts may have scheduler_score visible; migrate them to the new safe default once.
      if (localStorage.getItem(HIDDEN_COLUMNS_VERSION_KEY) !== HIDDEN_COLUMNS_CURRENT_VERSION) {
        hiddenColumns.add('scheduler_score')
        localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify([...hiddenColumns]))
        localStorage.setItem(HIDDEN_COLUMNS_VERSION_KEY, HIDDEN_COLUMNS_CURRENT_VERSION)
      }
    } else {
      DEFAULT_HIDDEN_COLUMNS.forEach(key => {
        hiddenColumns.add(key)
      })
      localStorage.setItem(HIDDEN_COLUMNS_VERSION_KEY, HIDDEN_COLUMNS_CURRENT_VERSION)
    }
  } catch (e) {
    console.error('Failed to load saved columns:', e)
    DEFAULT_HIDDEN_COLUMNS.forEach(key => {
      hiddenColumns.add(key)
    })
  }
}

const saveColumnsToStorage = () => {
  try {
    localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify([...hiddenColumns]))
    localStorage.setItem(HIDDEN_COLUMNS_VERSION_KEY, HIDDEN_COLUMNS_CURRENT_VERSION)
  } catch (e) {
    console.error('Failed to save columns:', e)
  }
}

const loadSavedAutoRefresh = () => {
  try {
    const saved = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved) as { enabled?: boolean; interval_seconds?: number }
    autoRefreshEnabled.value = parsed.enabled === true
    const interval = Number(parsed.interval_seconds)
    if (autoRefreshIntervals.includes(interval as any)) {
      autoRefreshIntervalSeconds.value = interval as any
    }
  } catch (e) {
    console.error('Failed to load saved auto refresh settings:', e)
  }
}

const saveAutoRefreshToStorage = () => {
  try {
    localStorage.setItem(
      AUTO_REFRESH_STORAGE_KEY,
      JSON.stringify({
        enabled: autoRefreshEnabled.value,
        interval_seconds: autoRefreshIntervalSeconds.value
      })
    )
  } catch (e) {
    console.error('Failed to save auto refresh settings:', e)
  }
}

interface AccountExternalQuota {
  label: string
  url: string
  formattedBalance: string
  formattedExpiry: string
  formattedUsage?: string
  progress?: ExternalQuotaProgressMeta | null
}

const formatExternalAmount = (value?: number | null, currency?: string | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = (currency || '').trim().toUpperCase()
  if (normalized === 'CNY' || normalized === 'RMB') return `¥${value.toFixed(2)}`
  if (normalized === 'JPY') return `¥${value.toFixed(0)}`
  if (normalized && normalized !== 'USD') return `${normalized} ${value.toFixed(2)}`
  return `$${value.toFixed(2)}`
}

const formatExternalTokens = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return `${Math.round(value).toLocaleString()} token`
}

const formatExternalDate = (value?: string | null) => {
  if (!value) return localText('长期', 'Long-term')
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return localText('长期', 'Long-term')
  return parsed.toISOString().slice(0, 10)
}

const isExternalSubscriptionInvalidToken = (code?: string | null) => {
  const normalized = (code || '').trim().toUpperCase()
  return normalized === '401' || normalized === 'INVALID_TOKEN' || normalized === 'TOKEN_EXPIRED'
}

const externalSubscriptionLabels: Record<string, string> = {
  buzz: 'Buzz',
  qlhazycoder: 'QL',
  packycode: 'Packy',
  xhyapi: 'XHY',
  pixel: 'Pixel',
  liust: 'LIUST',
  tcdmx: 'TCDMX',
  rawchat: 'RawChat'
}

const getExternalSubscriptionLabel = (subscription: ExternalSubscriptionStatus) => {
  return externalSubscriptionLabels[subscription.provider] || subscription.name || subscription.provider
}

const getMatchedExternalSubscription = (account: Account) => {
  return findMatchingExternalSubscription(account, externalSubscriptionStatuses.value)
}

const buildExternalSubscriptionQuota = (subscription: ExternalSubscriptionStatus, account: Account): AccountExternalQuota => {
  if (subscription.error_code) {
    const isInvalidToken = isExternalSubscriptionInvalidToken(subscription.error_code)
    return {
      label: getExternalSubscriptionLabel(subscription),
      url: subscription.site_url,
      formattedBalance: isInvalidToken
        ? localText('Token 失效', 'Token invalid')
        : localText('读取失败', 'Read failed'),
      formattedExpiry: isInvalidToken
        ? localText('请更新 Token', 'Update token')
        : (subscription.error_message || localText('请检查配置', 'Check settings')),
      progress: null
    }
  }

  const total = formatExternalAmount(subscription.total_limit_usd, subscription.currency)
  const remaining = formatExternalAmount(subscription.remaining_usd, subscription.currency)
  const preference = getAccountExternalQuotaProgressPreference(account, subscription)
  const preferenceKey = buildAccountExternalQuotaProgressPreferenceKey(account, subscription)
  const progress = buildAccountExternalQuotaProgressMeta(subscription, preference, {
    tokenStats: account.external_quota_token_stats?.[preferenceKey] ?? null,
  })
  const used = progress?.unit === 'tokens'
    ? formatExternalTokens(progress.used)
    : progress ? formatExternalAmount(progress.used, subscription.currency) : null
  const progressTotal = progress?.unit === 'tokens'
    ? formatExternalTokens(progress.total)
    : progress ? formatExternalAmount(progress.total, subscription.currency) : null
  return {
    label: getExternalSubscriptionLabel(subscription),
    url: subscription.site_url,
    formattedBalance: remaining && total
      ? `${remaining} / ${total}`
      : remaining || (total ? `${localText('余额未知', 'Balance unknown')} / ${total}` : localText('余额未知', 'Balance unknown')),
    formattedExpiry: formatExternalDate(subscription.expires_at),
    formattedUsage: progress && used && progressTotal ? `${used} / ${progressTotal}` : undefined,
    progress
  }
}

const getAccountExternalQuota = (account: Account): AccountExternalQuota | null => {
  const subscription = getMatchedExternalSubscription(account)
  if (subscription) return buildExternalSubscriptionQuota(subscription, account)
  return null
}

const getAccountExternalQuotaProgress = (account: Account): Pick<AccountExternalQuota, 'formattedUsage' | 'progress'> | null => {
  const subscription = getMatchedExternalSubscription(account)
  const preference = getAccountExternalQuotaProgressPreference(account, subscription ?? null)
  const preferenceKey = buildAccountExternalQuotaProgressPreferenceKey(account, subscription ?? null)
  const progress = buildAccountExternalQuotaProgressMeta(subscription, preference, {
    tokenStats: account.external_quota_token_stats?.[preferenceKey] ?? null,
  })
  if (!progress) return null

  const used = progress.unit === 'tokens'
    ? formatExternalTokens(progress.used)
    : formatExternalAmount(progress.used, subscription?.currency)
  const progressTotal = progress.unit === 'tokens'
    ? formatExternalTokens(progress.total)
    : formatExternalAmount(progress.total, subscription?.currency)

  return {
    formattedUsage: used && progressTotal ? `${used} / ${progressTotal}` : undefined,
    progress
  }
}

const closeExternalQuotaProgressSettings = () => {
  externalQuotaProgressSettings.show = false
  externalQuotaProgressSettings.account = null
  externalQuotaProgressSettings.subscription = null
  externalQuotaProgressSettings.current = null
}

const openExternalQuotaProgressSettings = (account: Account) => {
  const subscription = getMatchedExternalSubscription(account)
  externalQuotaProgressSettings.account = account
  externalQuotaProgressSettings.subscription = subscription
  externalQuotaProgressSettings.current = getAccountExternalQuotaProgressPreference(account, subscription ?? null)
  externalQuotaProgressSettings.show = true
}

const saveExternalQuotaProgressSettings = async (settings: AccountExternalQuotaProgressPreference) => {
  if (!externalQuotaProgressSettings.account) return
  await setAccountExternalQuotaProgressPreference(
    externalQuotaProgressSettings.account,
    externalQuotaProgressSettings.subscription ?? null,
    settings,
  )
  await load()
  closeExternalQuotaProgressSettings()
}

const buildAccountLogoSearchText = (account: Account) => {
  const credentials = account.credentials ?? {}
  const extra = account.extra ?? {}
  return [
    account.name,
    account.notes,
    account.platform,
    account.type,
    account.custom_base_url,
    credentials.base_url,
    credentials.api_base_url,
    credentials.endpoint,
    extra.custom_base_url,
    extra.external_provider
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ')
    .toLowerCase()
}

const getAccountCustomLogo = (account: Account) => {
  const extra = account.extra ?? {}
  const customLogoURL = typeof extra.custom_logo_url === 'string'
    ? extra.custom_logo_url.trim()
    : typeof extra.logo_url === 'string'
      ? extra.logo_url.trim()
      : ''
  return customLogoURL || null
}

const getAccountLogoProvider = (account: Account) => buildAccountLogoSearchText(account) || account.name || account.platform

const fetchExternalQuotaSummaries = async () => {
  if (!authStore.isAdmin) return
  try {
    externalSubscriptionStatuses.value = await externalSubscriptionsAPI.getDisplayStatuses()
  } catch (error) {
    if (externalSubscriptionStatuses.value.length === 0) {
      externalSubscriptionStatuses.value = []
    }
    console.error('Failed to load external subscription quota summaries:', error)
  }
}

const unsubscribeExternalQuotaSummaries = externalSubscriptionsAPI.subscribeDisplayStatuses((statuses) => {
  externalSubscriptionStatuses.value = statuses
})

if (typeof window !== 'undefined') {
  loadSavedColumns()
  loadSavedAutoRefresh()
}

const setAutoRefreshEnabled = (enabled: boolean) => {
  autoRefreshEnabled.value = enabled
  saveAutoRefreshToStorage()
  if (enabled) {
    autoRefreshCountdown.value = autoRefreshIntervalSeconds.value
    resumeAutoRefresh()
  } else {
    pauseAutoRefresh()
    autoRefreshCountdown.value = 0
  }
}

const setAutoRefreshInterval = (seconds: (typeof autoRefreshIntervals)[number]) => {
  autoRefreshIntervalSeconds.value = seconds
  saveAutoRefreshToStorage()
  if (autoRefreshEnabled.value) {
    autoRefreshCountdown.value = seconds
  }
}

const toggleColumn = (key: string) => {
  const wasHidden = hiddenColumns.has(key)
  if (hiddenColumns.has(key)) {
    hiddenColumns.delete(key)
  } else {
    hiddenColumns.add(key)
  }
  saveColumnsToStorage()
  if ((key === 'today_stats' || key === 'usage') && wasHidden) {
    refreshTodayStatsBatch().catch((error) => {
      console.error('Failed to load account today stats after showing column:', error)
    })
  }
  if (key === 'scheduler_score') {
    // The server only returns scheduler scores when this column is visible, so reload the current page immediately.
    syncAccountListDerivedParams()
    load().catch((error) => {
      console.error('Failed to reload accounts after toggling scheduler score column:', error)
    })
  }
}

const isColumnVisible = (key: string) => !hiddenColumns.has(key)
const shouldIncludeSchedulerScore = () => isColumnVisible('scheduler_score')
const syncAccountListDerivedParams = () => {
  // Keep every load path, including auto-refresh and sorting, aligned with the current column visibility.
  const requestParams = params as any
  requestParams.include_scheduler_score = shouldIncludeSchedulerScore() ? '1' : '0'
}

const {
  items: accounts,
  loading,
  params,
  pagination,
  load: baseLoad,
  reload: baseReload,
  debouncedReload: baseDebouncedReload,
  handlePageChange: baseHandlePageChange,
  handlePageSizeChange: baseHandlePageSizeChange
} = useTableLoader<Account, any>({
  fetchFn: adminAPI.accounts.list,
  initialParams: {
    platform: '',
    type: '',
    status: '',
    privacy_mode: '',
    group: '',
    search: '',
    include_scheduler_score: shouldIncludeSchedulerScore() ? '1' : '0',
    sort_by: sortState.sort_by,
    sort_order: sortState.sort_order
  }
})

const {
  selectedIds: selIds,
  allVisibleSelected,
  isSelected,
  setSelectedIds,
  select,
  deselect,
  toggle: toggleSel,
  clear: clearSelection,
  removeMany: removeSelectedAccounts,
  toggleVisible,
  selectVisible: selectPage,
  batchUpdate
} = useTableSelection<Account>({
  rows: accounts,
  getId: (account) => account.id
})

const swipeVirtualContext: SwipeSelectVirtualContext = {
  getVirtualizer: () => dataTableRef.value?.virtualizer ?? null,
  getSortedData: () => dataTableRef.value?.sortedData ?? accounts.value,
  getRowId: (row: any) => row.id,
}

useSwipeSelect(accountTableRef, {
  isSelected,
  select,
  deselect,
  batchUpdate
}, swipeVirtualContext)

const resetAutoRefreshCache = () => {
  autoRefreshETag.value = null
}

const isFirstLoad = ref(true)

const load = async () => {
  const requestParams = params as any
  syncAccountListDerivedParams()
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = false
  if (isFirstLoad.value) {
    requestParams.lite = '1'
  }
  await baseLoad()
  if (isFirstLoad.value) {
    isFirstLoad.value = false
    delete requestParams.lite
  }
  await refreshTodayStatsBatch()
}

const reload = async () => {
  syncAccountListDerivedParams()
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = false
  await baseReload()
  await refreshTodayStatsBatch()
}

const debouncedReload = () => {
  syncAccountListDerivedParams()
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = true
  baseDebouncedReload()
}

const handlePageChange = (page: number) => {
  syncAccountListDerivedParams()
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = true
  baseHandlePageChange(page)
}

const handlePageSizeChange = (size: number) => {
  syncAccountListDerivedParams()
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = true
  baseHandlePageSizeChange(size)
}

const handleSort = (key: string, order: AccountSortOrder) => {
  sortState.sort_by = key
  sortState.sort_order = order
  const requestParams = params as any
  requestParams.sort_by = key
  requestParams.sort_order = order
  syncAccountListDerivedParams()
  pagination.page = 1
  hasPendingListSync.value = false
  resetAutoRefreshCache()
  pendingTodayStatsRefresh.value = true
  load()
}

const handleAccountFilterUpdate = (newFilters: Record<string, any>) => {
  Object.assign(params, newFilters)
  const sortBy = typeof newFilters.sort_by === 'string' && ACCOUNT_SORTABLE_KEYS.has(newFilters.sort_by)
    ? newFilters.sort_by
    : sortState.sort_by
  const sortOrder: AccountSortOrder = newFilters.sort_order === 'desc'
    ? 'desc'
    : newFilters.sort_order === 'asc'
      ? 'asc'
      : sortState.sort_order
  sortState.sort_by = sortBy
  sortState.sort_order = sortOrder
  const requestParams = params as any
  requestParams.sort_by = sortBy
  requestParams.sort_order = sortOrder
}

watch(loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading && pendingTodayStatsRefresh.value) {
    pendingTodayStatsRefresh.value = false
    refreshTodayStatsBatch().catch((error) => {
      console.error('Failed to refresh account today stats after table load:', error)
    })
  }
})

watch(
  () => accounts.value.map(account => [
    account.id,
    account.current_concurrency ?? 0,
    account.active_sessions ?? 0
  ]),
  () => {
    syncAccountCallingGrace()
  },
  { immediate: true }
)

const isAnyModalOpen = computed(() => {
  return (
    showCreate.value ||
    showEdit.value ||
    showSync.value ||
    showImportData.value ||
    showExportDataDialog.value ||
    showBulkEdit.value ||
    showTempUnsched.value ||
    showDeleteDialog.value ||
    showReAuth.value ||
    showTest.value ||
    showStats.value ||
    showSchedulePanel.value ||
    externalQuotaProgressSettings.show ||
    showErrorPassthrough.value ||
    showTLSFingerprintProfiles.value
  )
})

const enterAutoRefreshSilentWindow = () => {
  autoRefreshSilentUntil.value = Date.now() + AUTO_REFRESH_SILENT_WINDOW_MS
  autoRefreshCountdown.value = autoRefreshIntervalSeconds.value
}

const inAutoRefreshSilentWindow = () => {
  return Date.now() < autoRefreshSilentUntil.value
}

const shouldReplaceAutoRefreshRow = (current: Account, next: Account) => {
  return (
    current.updated_at !== next.updated_at ||
    current.current_concurrency !== next.current_concurrency ||
    current.current_window_cost !== next.current_window_cost ||
    current.active_sessions !== next.active_sessions ||
    current.schedulable !== next.schedulable ||
    current.status !== next.status ||
    current.rate_limit_reset_at !== next.rate_limit_reset_at ||
    current.overload_until !== next.overload_until ||
    current.temp_unschedulable_until !== next.temp_unschedulable_until ||
    buildOpenAIUsageRefreshKey(current) !== buildOpenAIUsageRefreshKey(next)
  )
}

const syncAccountRefs = (nextAccount: Account) => {
  if (edAcc.value?.id === nextAccount.id) edAcc.value = nextAccount
  if (reAuthAcc.value?.id === nextAccount.id) reAuthAcc.value = nextAccount
  if (tempUnschedAcc.value?.id === nextAccount.id) tempUnschedAcc.value = nextAccount
  if (deletingAcc.value?.id === nextAccount.id) deletingAcc.value = nextAccount
  if (externalQuotaProgressSettings.account?.id === nextAccount.id) externalQuotaProgressSettings.account = nextAccount
  if (menu.acc?.id === nextAccount.id) menu.acc = nextAccount
  if (rateMultiplierMenu.account?.id === nextAccount.id) rateMultiplierMenu.account = nextAccount
}

const mergeAccountsIncrementally = (nextRows: Account[]) => {
  const currentRows = accounts.value
  const currentByID = new Map(currentRows.map(row => [row.id, row]))
  let changed = nextRows.length !== currentRows.length
  const mergedRows = nextRows.map((nextRow) => {
    const currentRow = currentByID.get(nextRow.id)
    if (!currentRow) {
      changed = true
      return nextRow
    }
    if (shouldReplaceAutoRefreshRow(currentRow, nextRow)) {
      changed = true
      syncAccountRefs(nextRow)
      return nextRow
    }
    return currentRow
  })
  if (!changed) {
    for (let i = 0; i < mergedRows.length; i += 1) {
      if (mergedRows[i].id !== currentRows[i]?.id) {
        changed = true
        break
      }
    }
  }
  if (changed) {
    accounts.value = mergedRows
  }
}

const refreshAccountsIncrementally = async () => {
  if (autoRefreshFetching.value) return
  syncAccountListDerivedParams()
  autoRefreshFetching.value = true
  try {
    const result = await adminAPI.accounts.listWithEtag(
      pagination.page,
      pagination.page_size,
      toRaw(params) as {
        platform?: string
        type?: string
        status?: string
        privacy_mode?: string
        group?: string
        search?: string
        sort_by?: string
        sort_order?: AccountSortOrder

      },
      { etag: autoRefreshETag.value }
    )

    if (result.etag) {
      autoRefreshETag.value = result.etag
    }
    if (!result.notModified && result.data) {
      pagination.total = result.data.total || 0
      pagination.pages = result.data.pages || 0
      mergeAccountsIncrementally(result.data.items || [])
      hasPendingListSync.value = false
    }

    await refreshTodayStatsBatch()
  } catch (error) {
    console.error('Auto refresh failed:', error)
  } finally {
    autoRefreshFetching.value = false
  }
}

const handleManualRefresh = async () => {
  await Promise.all([load(), fetchExternalQuotaSummaries()])
  // Force usage cells to refetch /usage on explicit user refresh.
  usageManualRefreshToken.value += 1
}

const closeAccountToolsDropdown = () => {
  showAccountToolsDropdown.value = false
}

const openSyncFromCrs = () => {
  closeAccountToolsDropdown()
  showSync.value = true
}

const openImportData = () => {
  closeAccountToolsDropdown()
  showImportData.value = true
}

const openExportDataDialogFromMenu = () => {
  closeAccountToolsDropdown()
  openExportDataDialog()
}

const openErrorPassthrough = () => {
  closeAccountToolsDropdown()
  showErrorPassthrough.value = true
}

const openTLSFingerprintProfiles = () => {
  closeAccountToolsDropdown()
  showTLSFingerprintProfiles.value = true
}

const syncPendingListChanges = async () => {
  hasPendingListSync.value = false
  await load()
  // Keep behavior consistent with manual refresh.
  usageManualRefreshToken.value += 1
}

const { pause: pauseAutoRefresh, resume: resumeAutoRefresh } = useIntervalFn(
  async () => {
    if (!autoRefreshEnabled.value) return
    if (document.hidden) return
    if (loading.value || autoRefreshFetching.value) return
    if (isAnyModalOpen.value) return
    if (menu.show || rateMultiplierMenu.show || showAccountToolsDropdown.value || showAutoRefreshDropdown.value) return
    if (inAutoRefreshSilentWindow()) {
      autoRefreshCountdown.value = Math.max(
        0,
        Math.ceil((autoRefreshSilentUntil.value - Date.now()) / 1000)
      )
      return
    }

    if (autoRefreshCountdown.value <= 0) {
      autoRefreshCountdown.value = autoRefreshIntervalSeconds.value
      await refreshAccountsIncrementally()
      return
    }

    autoRefreshCountdown.value -= 1
  },
  1000,
  { immediate: false }
)

// Antigravity 订阅等级辅助函数
function getAntigravityTierFromRow(row: any): string | null {
  if (row.platform !== 'antigravity') return null
  const extra = row.extra as Record<string, unknown> | undefined
  if (!extra) return null
  const lca = extra.load_code_assist as Record<string, unknown> | undefined
  if (!lca) return null
  const paid = lca.paidTier as Record<string, unknown> | undefined
  if (paid && typeof paid.id === 'string') return paid.id
  const current = lca.currentTier as Record<string, unknown> | undefined
  if (current && typeof current.id === 'string') return current.id
  return null
}

function getAntigravityTierLabel(row: any): string | null {
  const tier = getAntigravityTierFromRow(row)
  switch (tier) {
    case 'free-tier': return t('admin.accounts.tier.free')
    case 'g1-pro-tier': return t('admin.accounts.tier.pro')
    case 'g1-ultra-tier': return t('admin.accounts.tier.ultra')
    default: return null
  }
}

type OpenAICompactBadgeState = 'active' | 'blocked' | 'auto'

function getOpenAICompactState(row: any): OpenAICompactBadgeState | null {
  if (row.platform !== 'openai' || (row.type !== 'oauth' && row.type !== 'apikey')) return null
  const extra = row.extra as Record<string, unknown> | undefined
  const mode = typeof extra?.openai_compact_mode === 'string' ? extra.openai_compact_mode : 'auto'
  if (mode === 'force_on') return 'active'
  if (mode === 'force_off') return 'blocked'
  if (typeof extra?.openai_compact_supported === 'boolean') {
    return extra.openai_compact_supported ? 'active' : 'blocked'
  }
  return 'auto'
}

function getOpenAICompactMeta(row: any): { label: string; className: string; dotClass: string } | null {
  const state = getOpenAICompactState(row)
  if (!state) return null
  switch (state) {
    case 'active':
      return {
        label: t('admin.accounts.openai.compactSupported'),
        className: 'text-emerald-600 dark:text-emerald-300',
        dotClass: 'bg-emerald-500'
      }
    case 'blocked':
      return {
        label: t('admin.accounts.openai.compactUnsupported'),
        className: 'text-rose-600 dark:text-rose-300',
        dotClass: 'bg-rose-500'
      }
    case 'auto':
      return {
        label: t('admin.accounts.openai.compactAuto'),
        className: 'text-slate-500 dark:text-slate-400',
        dotClass: 'bg-slate-300 dark:bg-slate-500'
      }
  }
}

function getOpenAICompactTitle(row: any): string {
  const extra = row.extra as Record<string, unknown> | undefined
  const checkedAt = typeof extra?.openai_compact_checked_at === 'string' ? extra.openai_compact_checked_at : ''
  const label = getOpenAICompactMeta(row)?.label || ''
  if (!checkedAt) return label
  return `${label} | ${t('admin.accounts.openai.compactLastChecked')}: ${formatDateTime(new Date(checkedAt))}`
}

function getAntigravityTierClass(row: any): string {
  const tier = getAntigravityTierFromRow(row)
  switch (tier) {
    case 'free-tier': return 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
    case 'g1-pro-tier': return 'bg-[var(--anthropic-info-bg)] text-[var(--anthropic-info)] dark:bg-[var(--anthropic-info-bg)] dark:text-[var(--anthropic-info)]'
    case 'g1-ultra-tier': return 'bg-accent-200 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300'
    default: return ''
  }
}

// All available columns
const allColumns = computed(() => {
  const c = [
    { key: 'select', label: '', sortable: false },
    { key: 'name', label: t('admin.accounts.columns.name'), sortable: true },
    { key: 'id', label: t('admin.accounts.columns.id'), sortable: true },
    { key: 'platform_type', label: t('admin.accounts.columns.platformType'), sortable: false },
    { key: 'capacity', label: t('admin.accounts.columns.capacity'), sortable: false },
    { key: 'status', label: t('admin.accounts.columns.status'), sortable: true },
    { key: 'schedulable', label: t('admin.accounts.columns.schedulable'), sortable: true },
    { key: 'today_stats', label: t('admin.accounts.columns.todayStats'), sortable: false }
  ]
  if (!authStore.isSimpleMode) {
    c.push({ key: 'groups', label: t('admin.accounts.columns.groups'), sortable: false })
  }
  c.push(
    { key: 'usage', label: t('admin.accounts.columns.usageWindows'), sortable: false },
    { key: 'proxy', label: t('admin.accounts.columns.proxy'), sortable: false },
    { key: 'priority', label: t('admin.accounts.columns.priority'), sortable: true },
    { key: 'scheduler_score', label: t('admin.accounts.columns.schedulerScore'), sortable: false },
    { key: 'rate_multiplier', label: t('admin.accounts.columns.billingRateMultiplier'), sortable: true },
    { key: 'last_used_at', label: t('admin.accounts.columns.lastUsed'), sortable: true },
    { key: 'created_at', label: t('admin.accounts.columns.createdAt'), sortable: true },
    { key: 'expires_at', label: t('admin.accounts.columns.expiresAt'), sortable: true },
    { key: 'notes', label: t('admin.accounts.columns.notes'), sortable: false },
    { key: 'actions', label: t('admin.accounts.columns.actions'), sortable: false }
  )
  return c
})

// Columns that can be toggled (exclude select, name, and actions)
const toggleableColumns = computed(() =>
  allColumns.value.filter(col => col.key !== 'select' && col.key !== 'name' && col.key !== 'actions')
)

// Filtered columns based on visibility
const cols = computed(() =>
  allColumns.value.filter(col =>
    col.key === 'select' || col.key === 'name' || col.key === 'actions' || !hiddenColumns.has(col.key)
  )
)

const handleEdit = (a: Account) => { edAcc.value = a; showEdit.value = true }
const cancelMenuClose = () => {
  if (menuCloseTimer) {
    clearTimeout(menuCloseTimer)
    menuCloseTimer = null
  }
}

const closeMenu = () => {
  cancelMenuClose()
  menu.show = false
  menu.triggerRect = null
}

const scheduleMenuClose = () => {
  cancelMenuClose()
  menuCloseTimer = setTimeout(() => {
    menu.show = false
    menuCloseTimer = null
  }, 180)
}

const positionMenuFromTrigger = (triggerRect: DOMRect, panelHeight = 240) => {
  const menuWidth = 208
  const padding = 8
  const offset = 6
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const left = Math.max(padding, Math.min(
    viewportWidth < 768
      ? triggerRect.left + triggerRect.width / 2 - menuWidth / 2
      : triggerRect.right - menuWidth,
    viewportWidth - menuWidth - padding
  ))

  const spaceBelow = viewportHeight - triggerRect.bottom - padding
  const spaceAbove = triggerRect.top - padding
  const opensUpward = panelHeight + offset > spaceBelow && spaceAbove > spaceBelow
  const top = opensUpward
    ? Math.max(padding, triggerRect.top - panelHeight - offset)
    : Math.min(triggerRect.bottom + offset, viewportHeight - panelHeight - padding)

  menu.pos = { top, left }
}

const openMenu = async (a: Account, e: Event) => {
  cancelMenuClose()
  menu.acc = a
  closeRateMultiplierMenu()
  showAccountToolsDropdown.value = false
  showAutoRefreshDropdown.value = false

  const target = e.currentTarget as HTMLElement
  if (target) {
    menu.triggerRect = target.getBoundingClientRect()
    positionMenuFromTrigger(menu.triggerRect)
  } else {
    menu.triggerRect = null
    menu.pos = { top: 8, left: 8 }
  }

  menu.show = true
  await nextTick()
  const panel = document.querySelector<HTMLElement>('[data-testid="admin-account-account-action-menu-div-div"]')
  if (panel && menu.triggerRect) {
    positionMenuFromTrigger(menu.triggerRect, panel.offsetHeight)
  }
}

const formatAccountRateMultiplier = (value?: number | null) => {
  const normalized = typeof value === 'number' && Number.isFinite(value) ? value : 1
  return normalized.toFixed(2)
}

const normalizeAccountPriority = (value?: number | null) => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

const startAccountCallingGraceTicker = () => {
  if (accountCallingGraceTimer) return
  syncAccountCallingGrace()
  accountCallingGraceTimer = setInterval(syncAccountCallingGrace, 1000)
}

const stopAccountCallingGraceTicker = () => {
  if (!accountCallingGraceTimer) return
  clearInterval(accountCallingGraceTimer)
  accountCallingGraceTimer = null
}

const isAccountCalling = (row: Account) => {
  if (hasLiveAccountActivity(row)) return true
  const graceUntil = accountCallingGraceUntil.get(row.id) ?? 0
  return graceUntil > accountCallingNow.value
}

const getAccountRowClass = (row: Account) => {
  return [
    isAccountCalling(row) ? 'codex-account-card-calling' : '',
    row.status === 'active' && !row.schedulable ? 'codex-account-card-paused' : '',
  ].filter(Boolean).join(' ')
}

const handlePriorityQuickAdjust = async (account: Account, delta: number) => {
  if (priorityUpdatingIds.has(account.id)) return
  const nextPriority = Math.max(0, normalizeAccountPriority(account.priority) + delta)
  if (nextPriority === normalizeAccountPriority(account.priority)) return

  priorityUpdatingIds.add(account.id)
  try {
    const updated = await adminAPI.accounts.update(account.id, { priority: nextPriority })
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
    appStore.showSuccess(t('common.success'))
  } catch (error: any) {
    appStore.showError(error?.message || t('common.error'))
  } finally {
    priorityUpdatingIds.delete(account.id)
  }
}

const closeRateMultiplierMenu = () => {
  rateMultiplierMenu.show = false
  rateMultiplierMenu.account = null
  rateMultiplierMenu.triggerEl = null
  rateMultiplierMenu.value = '1.00'
  rateMultiplierMenu.saving = false
}

const openRateMultiplierMenu = (account: Account, event: MouseEvent) => {
  menu.show = false
  rateMultiplierMenu.account = account
  rateMultiplierMenu.triggerEl = event.currentTarget as HTMLElement
  rateMultiplierMenu.value = formatAccountRateMultiplier(account.rate_multiplier)
  rateMultiplierMenu.saving = false
  rateMultiplierMenu.show = true
}

const handleRateMultiplierSave = async () => {
  if (!rateMultiplierMenu.account || rateMultiplierMenu.saving) return
  const nextValue = Number(rateMultiplierMenu.value)
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    appStore.showError(localText('倍率必须大于等于 0', 'Rate multiplier must be >= 0'))
    return
  }
  rateMultiplierMenu.saving = true
  try {
    const updated = await adminAPI.accounts.updateRateMultiplier(rateMultiplierMenu.account.id, nextValue)
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
    appStore.showSuccess(t('common.success'))
    closeRateMultiplierMenu()
  } catch (error: any) {
    appStore.showError(error?.message || t('common.error'))
    rateMultiplierMenu.saving = false
  }
}

const toggleSelectAllVisible = (event: Event) => {
  const target = event.target as HTMLInputElement
  toggleVisible(target.checked)
}
const handleBulkDelete = async () => { if(!confirm(t('common.confirm'))) return; try { await Promise.all(selIds.value.map(id => adminAPI.accounts.delete(id))); clearSelection(); reload() } catch (error) { console.error('Failed to bulk delete accounts:', error) } }
const handleBulkResetStatus = async () => {
  if (!confirm(t('common.confirm'))) return
  try {
    const result = await adminAPI.accounts.batchClearError(selIds.value)
    if (result.failed > 0) {
      appStore.showError(t('admin.accounts.bulkActions.partialSuccess', { success: result.success, failed: result.failed }))
    } else {
      appStore.showSuccess(t('admin.accounts.bulkActions.resetStatusSuccess', { count: result.success }))
      clearSelection()
    }
    reload()
  } catch (error) {
    console.error('Failed to bulk reset status:', error)
    appStore.showError(String(error))
  }
}
const handleBulkRefreshToken = async () => {
  if (!confirm(t('common.confirm'))) return
  try {
    const result = await adminAPI.accounts.batchRefresh(selIds.value)
    if (result.failed > 0) {
      appStore.showError(t('admin.accounts.bulkActions.partialSuccess', { success: result.success, failed: result.failed }))
    } else {
      appStore.showSuccess(t('admin.accounts.bulkActions.refreshTokenSuccess', { count: result.success }))
      clearSelection()
    }
    reload()
  } catch (error) {
    console.error('Failed to bulk refresh token:', error)
    appStore.showError(String(error))
  }
}
const updateSchedulableInList = (accountIds: number[], schedulable: boolean) => {
  if (accountIds.length === 0) return
  const idSet = new Set(accountIds)
  accounts.value = accounts.value.map((account) => (idSet.has(account.id) ? { ...account, schedulable } : account))
}
const updateScheduleLockedInList = (accountIds: number[], scheduleLocked: boolean) => {
  if (accountIds.length === 0) return
  const idSet = new Set(accountIds)
  accounts.value = accounts.value.map((account) => (idSet.has(account.id) ? { ...account, schedule_locked: scheduleLocked } : account))
}
const normalizeBulkSchedulableResult = (
  result: {
    success?: number
    failed?: number
    success_ids?: number[]
    failed_ids?: number[]
    results?: Array<{ account_id: number; success: boolean }>
  },
  accountIds: number[]
) => {
  const responseSuccessIds = Array.isArray(result.success_ids) ? result.success_ids : []
  const responseFailedIds = Array.isArray(result.failed_ids) ? result.failed_ids : []
  if (responseSuccessIds.length > 0 || responseFailedIds.length > 0) {
    return {
      successIds: responseSuccessIds,
      failedIds: responseFailedIds,
      successCount: typeof result.success === 'number' ? result.success : responseSuccessIds.length,
      failedCount: typeof result.failed === 'number' ? result.failed : responseFailedIds.length,
      hasIds: true,
      hasCounts: true
    }
  }

  const results = Array.isArray(result.results) ? result.results : []
  if (results.length > 0) {
    const successIds = results.filter(item => item.success).map(item => item.account_id)
    const failedIds = results.filter(item => !item.success).map(item => item.account_id)
    return {
      successIds,
      failedIds,
      successCount: typeof result.success === 'number' ? result.success : successIds.length,
      failedCount: typeof result.failed === 'number' ? result.failed : failedIds.length,
      hasIds: true,
      hasCounts: true
    }
  }

  const hasExplicitCounts = typeof result.success === 'number' || typeof result.failed === 'number'
  const successCount = typeof result.success === 'number' ? result.success : 0
  const failedCount = typeof result.failed === 'number' ? result.failed : 0
  if (hasExplicitCounts && failedCount === 0 && successCount === accountIds.length && accountIds.length > 0) {
    return {
      successIds: accountIds,
      failedIds: [],
      successCount,
      failedCount,
      hasIds: true,
      hasCounts: true
    }
  }

  return {
    successIds: [],
    failedIds: [],
    successCount,
    failedCount,
    hasIds: false,
    hasCounts: hasExplicitCounts
  }
}
const handleBulkToggleSchedulable = async (schedulable: boolean) => {
  const accountIds = [...selIds.value]
  try {
    const result = await adminAPI.accounts.bulkUpdate(accountIds, { schedulable })
    const { successIds, failedIds, successCount, failedCount, hasIds, hasCounts } = normalizeBulkSchedulableResult(result, accountIds)
    if (!hasIds && !hasCounts) {
      appStore.showError(t('admin.accounts.bulkSchedulableResultUnknown'))
      setSelectedIds(accountIds)
      load().catch((error) => {
        console.error('Failed to refresh accounts:', error)
      })
      return
    }
    if (successIds.length > 0) {
      updateSchedulableInList(successIds, schedulable)
    }
    if (successCount > 0 && failedCount === 0) {
      const message = schedulable
        ? t('admin.accounts.bulkSchedulableEnabled', { count: successCount })
        : t('admin.accounts.bulkSchedulableDisabled', { count: successCount })
      appStore.showSuccess(message)
    }
    if (failedCount > 0) {
      const message = hasCounts || hasIds
        ? t('admin.accounts.bulkSchedulablePartial', { success: successCount, failed: failedCount })
        : t('admin.accounts.bulkSchedulableResultUnknown')
      appStore.showError(message)
      setSelectedIds(failedIds.length > 0 ? failedIds : accountIds)
    } else {
      if (hasIds) clearSelection()
      else setSelectedIds(accountIds)
    }
  } catch (error) {
    console.error('Failed to bulk toggle schedulable:', error)
    appStore.showError(t('common.error'))
  }
}
const buildBulkEditFilterSnapshot = () => {
  const rawParams = toRaw(params) as Record<string, unknown>
  const sortOrder: AccountSortOrder = rawParams.sort_order === 'desc' ? 'desc' : 'asc'
  return {
    platform: typeof rawParams.platform === 'string' ? rawParams.platform : '',
    type: typeof rawParams.type === 'string' ? rawParams.type : '',
    status: typeof rawParams.status === 'string' ? rawParams.status : '',
    group: typeof rawParams.group === 'string' ? rawParams.group : '',
    search: typeof rawParams.search === 'string' ? rawParams.search : '',
    privacy_mode: typeof rawParams.privacy_mode === 'string' ? rawParams.privacy_mode : '',
    sort_by: typeof rawParams.sort_by === 'string' ? rawParams.sort_by : '',
    sort_order: sortOrder
  }
}

const collectSelectionMetadata = (rows: Account[]) => {
  const selectedPlatforms = Array.from(new Set(rows.map(account => account.platform)))
  const selectedTypes = Array.from(new Set(rows.map(account => account.type)))
  return { selectedPlatforms, selectedTypes }
}

const openBulkEditSelected = () => {
  bulkEditTarget.value = {
    mode: 'selected',
    accountIds: [...selIds.value],
    selectedPlatforms: [...selPlatforms.value],
    selectedTypes: [...selTypes.value]
  }
  showBulkEdit.value = true
}

const openBulkEditFiltered = async () => {
  const filters = buildBulkEditFilterSnapshot()
  const preview = await adminAPI.accounts.list(1, 100, filters)
  const { selectedPlatforms, selectedTypes } = collectSelectionMetadata(preview.items)
  bulkEditTarget.value = {
    mode: 'filtered',
    filters,
    previewCount: preview.total,
    selectedPlatforms,
    selectedTypes
  }
  showBulkEdit.value = true
}

const handleBulkUpdated = () => {
  showBulkEdit.value = false
  bulkEditTarget.value = null
  clearSelection()
  reload()
}
const handleDataImported = () => { showImportData.value = false; reload() }
const ACCOUNT_UNGROUPED_GROUP_QUERY_VALUE = 'ungrouped'
const ACCOUNT_PRIVACY_MODE_UNSET_QUERY_VALUE = '__unset__'
const buildAccountQueryFilters = () => ({
  platform: params.platform || '',
  type: params.type || '',
  status: params.status || '',
  group: params.group || '',
  privacy_mode: params.privacy_mode || '',
  search: params.search || '',
  sort_by: sortState.sort_by,
  sort_order: sortState.sort_order
})
const accountMatchesCurrentFilters = (account: Account) => {
  const filters = buildAccountQueryFilters()
  if (filters.platform && account.platform !== filters.platform) return false
  if (filters.type && account.type !== filters.type) return false
  if (filters.status) {
    const now = Date.now()
    const rateLimitResetAt = account.rate_limit_reset_at ? new Date(account.rate_limit_reset_at).getTime() : Number.NaN
    const isRateLimited = Number.isFinite(rateLimitResetAt) && rateLimitResetAt > now
    const tempUnschedUntil = account.temp_unschedulable_until ? new Date(account.temp_unschedulable_until).getTime() : Number.NaN
    const isTempUnschedulable = Number.isFinite(tempUnschedUntil) && tempUnschedUntil > now

    if (filters.status === 'active') {
      if (account.status !== 'active' || isRateLimited || isTempUnschedulable || !account.schedulable) return false
    } else if (filters.status === 'rate_limited') {
      if (account.status !== 'active' || !isRateLimited || isTempUnschedulable) return false
    } else if (filters.status === 'temp_unschedulable') {
      if (account.status !== 'active' || !isTempUnschedulable) return false
    } else if (filters.status === 'unschedulable') {
      if (account.status !== 'active' || account.schedulable || isRateLimited || isTempUnschedulable) return false
    } else if (account.status !== filters.status) {
      return false
    }
  }
  if (filters.group) {
    const groupIds = account.group_ids ?? account.groups?.map((group) => group.id) ?? []
    if (filters.group === ACCOUNT_UNGROUPED_GROUP_QUERY_VALUE) {
      if (groupIds.length > 0) return false
    } else if (!groupIds.includes(Number(filters.group))) {
      return false
    }
  }
  const privacyMode = typeof account.extra?.privacy_mode === 'string' ? account.extra.privacy_mode : ''
  if (filters.privacy_mode) {
    if (filters.privacy_mode === ACCOUNT_PRIVACY_MODE_UNSET_QUERY_VALUE) {
      if (privacyMode.trim() !== '') return false
    } else if (privacyMode !== filters.privacy_mode) {
      return false
    }
  }
  const search = String(filters.search || '').trim().toLowerCase()
  if (search && !account.name.toLowerCase().includes(search)) return false
  return true
}
const mergeRuntimeFields = (oldAccount: Account, updatedAccount: Account): Account => ({
  ...updatedAccount,
  current_concurrency: updatedAccount.current_concurrency ?? oldAccount.current_concurrency,
  current_window_cost: updatedAccount.current_window_cost ?? oldAccount.current_window_cost,
  active_sessions: updatedAccount.active_sessions ?? oldAccount.active_sessions
})

const syncPaginationAfterLocalRemoval = () => {
  const nextTotal = Math.max(0, pagination.total - 1)
  pagination.total = nextTotal
  pagination.pages = nextTotal > 0 ? Math.ceil(nextTotal / pagination.page_size) : 0

  const maxPage = Math.max(1, pagination.pages || 1)

  if (pagination.page > maxPage) {
    pagination.page = maxPage
  }
  // 行被本地移除后不立刻全量补页，改为提示用户手动同步。
  hasPendingListSync.value = nextTotal > 0
}

const patchAccountInList = (updatedAccount: Account) => {
  const index = accounts.value.findIndex(account => account.id === updatedAccount.id)
  if (index === -1) return
  const mergedAccount = mergeRuntimeFields(accounts.value[index], updatedAccount)
  if (!accountMatchesCurrentFilters(mergedAccount)) {
    accounts.value = accounts.value.filter(account => account.id !== mergedAccount.id)
    syncPaginationAfterLocalRemoval()
    removeSelectedAccounts([mergedAccount.id])
    if (menu.acc?.id === mergedAccount.id) {
      menu.show = false
      menu.acc = null
    }
    return
  }
  const nextAccounts = [...accounts.value]
  nextAccounts[index] = mergedAccount
  accounts.value = nextAccounts
  syncAccountRefs(mergedAccount)
}
const handleAccountUpdated = (updatedAccount: Account) => {
  patchAccountInList(updatedAccount)
  enterAutoRefreshSilentWindow()
}
const formatExportTimestamp = () => {
  const now = new Date()
  const pad2 = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
}
const openExportDataDialog = () => {
  includeProxyOnExport.value = true
  showExportDataDialog.value = true
}
const handleExportData = async () => {
  if (exportingData.value) return
  exportingData.value = true
  try {
    const dataPayload = await adminAPI.accounts.exportData(
      selIds.value.length > 0
        ? { ids: selIds.value, includeProxies: includeProxyOnExport.value }
        : {
            includeProxies: includeProxyOnExport.value,
            filters: buildAccountQueryFilters()
          }
    )
    const timestamp = formatExportTimestamp()
    const filename = `sub2api-account-${timestamp}.json`
    const blob = new Blob([JSON.stringify(dataPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    appStore.showSuccess(t('admin.accounts.dataExported'))
  } catch (error: any) {
    appStore.showError(error?.message || t('admin.accounts.dataExportFailed'))
  } finally {
    exportingData.value = false
    showExportDataDialog.value = false
  }
}
const closeTestModal = () => { showTest.value = false; testingAcc.value = null }
const closeStatsModal = () => { showStats.value = false; statsAcc.value = null }
const closeReAuthModal = () => { showReAuth.value = false; reAuthAcc.value = null }
const handleTest = (a: Account) => { testingAcc.value = a; showTest.value = true }
const handleViewStats = (a: Account) => { statsAcc.value = a; showStats.value = true }
const handleSchedule = async (a: Account) => {
  scheduleAcc.value = a
  scheduleModelOptions.value = []
  showSchedulePanel.value = true
  try {
    const models = await adminAPI.accounts.getAvailableModels(a.id)
    scheduleModelOptions.value = models.map((m: ClaudeModel) => ({ value: m.id, label: m.display_name || m.id }))
  } catch {
    scheduleModelOptions.value = []
  }
}
const closeSchedulePanel = () => { showSchedulePanel.value = false; scheduleAcc.value = null; scheduleModelOptions.value = [] }
const handleReAuth = (a: Account) => { reAuthAcc.value = a; showReAuth.value = true }
const handleRefresh = async (a: Account) => {
  try {
    const updated = await adminAPI.accounts.refreshCredentials(a.id)
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
  } catch (error) {
    console.error('Failed to refresh credentials:', error)
  }
}
const handleRecoverState = async (a: Account) => {
  try {
    const updated = await adminAPI.accounts.recoverState(a.id)
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
    appStore.showSuccess(t('admin.accounts.recoverStateSuccess'))
  } catch (error: any) {
    console.error('Failed to recover account state:', error)
    appStore.showError(error?.message || t('admin.accounts.recoverStateFailed'))
  }
}
const handleResetQuota = async (a: Account) => {
  try {
    const updated = await adminAPI.accounts.resetAccountQuota(a.id)
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
    appStore.showSuccess(t('common.success'))
  } catch (error) {
    console.error('Failed to reset quota:', error)
  }
}
const handleSetPrivacy = async (a: Account) => {
  try {
    const updated = await adminAPI.accounts.setPrivacy(a.id)
    patchAccountInList(updated)
    enterAutoRefreshSilentWindow()
    appStore.showSuccess(t('common.success'))
  } catch (error: any) {
    console.error('Failed to set privacy:', error)
    appStore.showError(error?.response?.data?.message || t('admin.accounts.privacyFailed'))
  }
}
const onRevertFallback = async (a: Account) => {
  try {
    await adminAPI.accounts.revertProxyFallback(a.id)
    appStore.showSuccess(t('admin.accounts.revertProxySuccess'))
    reload()
  } catch (error: any) {
    console.error('Failed to revert proxy fallback:', error)
    appStore.showError(error?.response?.data?.message || t('admin.accounts.revertProxyFailed'))
  }
}
const handleDelete = (a: Account) => { deletingAcc.value = a; showDeleteDialog.value = true }
const confirmDelete = async () => { if(!deletingAcc.value) return; try { await adminAPI.accounts.delete(deletingAcc.value.id); showDeleteDialog.value = false; deletingAcc.value = null; reload() } catch (error) { console.error('Failed to delete account:', error) } }
const handleToggleSchedulable = async (a: Account) => {
  const nextSchedulable = !a.schedulable
  togglingSchedulable.value = a.id
  try {
    const updated = await adminAPI.accounts.setSchedulable(a.id, nextSchedulable)
    updateSchedulableInList([a.id], updated?.schedulable ?? nextSchedulable)
    enterAutoRefreshSilentWindow()
  } catch (error) {
    console.error('Failed to toggle schedulable:', error)
    appStore.showError(t('admin.accounts.failedToToggleSchedulable'))
  } finally {
    togglingSchedulable.value = null
  }
}
const handleToggleScheduleLock = async (a: Account) => {
  const nextLocked = !a.schedule_locked
  togglingScheduleLock.value = a.id
  try {
    const updated = await adminAPI.accounts.setScheduleLocked(a.id, nextLocked)
    updateScheduleLockedInList([a.id], updated?.schedule_locked ?? nextLocked)
    enterAutoRefreshSilentWindow()
  } catch (error) {
    console.error('Failed to toggle schedule lock:', error)
    appStore.showError(t('admin.accounts.failedToToggleScheduleLock'))
  } finally {
    togglingScheduleLock.value = null
  }
}
const handleShowTempUnsched = (a: Account) => { tempUnschedAcc.value = a; showTempUnsched.value = true }
const handleTempUnschedReset = async (updated: Account) => {
  showTempUnsched.value = false
  tempUnschedAcc.value = null
  patchAccountInList(updated)
  enterAutoRefreshSilentWindow()
}
const formatExpiresAt = (value: number | null) => {
  if (!value) return '-'
  return formatDateTime(
    new Date(value * 1000),
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    'sv-SE'
  )
}
const isExpired = (value: number | null) => {
  if (!value) return false
  return value * 1000 <= Date.now()
}
// 所绑定代理的有效期(逻辑同 /admin/proxies,见 utils/proxyExpiry)
const proxyExpiryBadge = (p: AccountProxy): string => proxyExpiryBadgeClass(p.expires_at, p.status)
const proxyExpiryText = (p: AccountProxy): string => {
  const { key, params } = proxyExpiryLabelKey(p.expires_at, p.status)
  return params ? t(key, params) : t(key)
}

// 滚动时关闭操作菜单（不关闭列设置下拉菜单）
const handleScroll = () => {
  menu.show = false
  rateMultiplierMenu.show = false
}

// 点击外部关闭顶部下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (rateMultiplierMenu.show && rateMultiplierMenu.triggerEl && !rateMultiplierMenu.triggerEl.contains(target)) {
    closeRateMultiplierMenu()
  }
  if (accountToolsDropdownRef.value && !accountToolsDropdownRef.value.contains(target)) {
    showAccountToolsDropdown.value = false
  }
  if (autoRefreshDropdownRef.value && !autoRefreshDropdownRef.value.contains(target)) {
    showAutoRefreshDropdown.value = false
  }
}

onMounted(async () => {
  startAccountCallingGraceTicker()
  void loadAccountExternalQuotaProgressSettings()
  load()
  fetchExternalQuotaSummaries().catch((error) => {
    console.error('Failed to load external quota summaries:', error)
  })
  try {
    const [p, g] = await Promise.all([adminAPI.proxies.getAll(), adminAPI.groups.getAll()])
    proxies.value = p
    groups.value = g
  } catch (error) {
    console.error('Failed to load proxies/groups:', error)
  }
  window.addEventListener('scroll', handleScroll, true)
  document.addEventListener('click', handleClickOutside)

  if (autoRefreshEnabled.value) {
    autoRefreshCountdown.value = autoRefreshIntervalSeconds.value
    resumeAutoRefresh()
  } else {
    pauseAutoRefresh()
  }
})

onUnmounted(() => {
  cancelMenuClose()
  window.removeEventListener('scroll', handleScroll, true)
  document.removeEventListener('click', handleClickOutside)
  stopAccountCallingGraceTicker()
  unsubscribeExternalQuotaSummaries()
})
</script>

<style scoped>
.account-tools-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border: 0;
  border-radius: 0;
  padding: 0.625rem 0.75rem;
  background: transparent;
  color: var(--anthropic-muted);
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-decoration-line: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.22em;
  box-shadow: none;
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;
}

.account-tools-menu-item:hover,
.account-tools-menu-item:focus-visible {
  border-color: transparent;
  background: transparent;
  color: var(--anthropic-fg);
  text-decoration-color: currentColor;
  box-shadow: none;
}

.account-tools-menu-icon {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--anthropic-border-subtle);
  border-radius: 8px;
  background: var(--anthropic-page);
  color: var(--anthropic-muted);
  box-shadow: none;
}

.account-usage-stack {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.account-external-quota-usage-progress {
  min-width: 0;
}
</style>

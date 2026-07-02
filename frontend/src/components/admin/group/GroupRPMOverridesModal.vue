<template>
  <BaseDialog :show="show" :title="t('admin.groups.rpmOverridesTitle')" width="wide" @close="handleClose">
    <div v-if="group" class="space-y-4">
      <!-- 分组信息 -->
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--anthropic-section)] px-4 py-2.5 text-sm dark:bg-[var(--anthropic-section)]">
        <span class="inline-flex items-center gap-1.5" :class="platformColorClass">
          <PlatformIcon :platform="group.platform" size="sm" />
          {{ t('admin.groups.platforms.' + group.platform) }}
        </span>
        <span class="text-[var(--anthropic-muted)]">|</span>
        <span class="font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ group.name }}</span>
        <span class="text-[var(--anthropic-muted)]">|</span>
        <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ t('admin.groups.groupRpmDefault') }}: {{ group.rpm_limit || 0 }}
        </span>
      </div>

      <!-- 操作区：添加用户 -->
      <div class="rounded-lg border border-[var(--anthropic-border)] p-3 dark:border-[var(--anthropic-border)]">
        <h4 class="mb-2 text-sm font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ t('admin.groups.addUserRpm') }}
        </h4>
        <div class="flex items-end gap-2">
          <div class="relative flex-1">
            <input data-testid="admin-group-group-rpm-overrides-input-search-query"
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              autocomplete="off"
              class="input w-full"
              :placeholder="t('admin.groups.searchUserPlaceholder')"
              @input="handleSearchUsers"
              @focus="showDropdown = true"
            />
            <FloatingDropdown
              :show="showDropdown && searchResults.length > 0"
              :trigger-el="searchInputRef"
              :match-width="true"
              panel-class="max-h-48 overflow-y-auto rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] shadow-none dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]"
            >
              <button data-testid="admin-group-group-rpm-overrides-button-select-user-user"
                v-for="user in searchResults"
                :key="user.id"
                type="button"
                class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--anthropic-section)] dark:hover:bg-[var(--anthropic-raised)]"
                @click="selectUser(user)"
              >
                <span class="text-[var(--anthropic-muted)]">#{{ user.id }}</span>
                <span class="text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ user.username || user.email }}</span>
                <span v-if="user.username" class="text-xs text-[var(--anthropic-muted)]">{{ user.email }}</span>
              </button>
            </FloatingDropdown>
          </div>
          <div class="w-24">
            <input data-testid="admin-group-group-rpm-overrides-input-new-rpm"
              v-model.number="newRpm"
              type="number"
              step="1"
              min="0"
              autocomplete="off"
              class="hide-spinner input w-full"
              placeholder="100"
            />
          </div>
          <button data-testid="admin-group-group-rpm-overrides-button-handle-add-local"
            type="button"
            class="btn btn-primary shrink-0"
            :disabled="!selectedUser || newRpm == null || newRpm < 0"
            @click="handleAddLocal"
          >
            {{ t('common.add') }}
          </button>
        </div>

        <div v-if="localEntries.length > 0" class="mt-3 flex items-center justify-end border-t border-[var(--anthropic-border)] pt-3 dark:border-[var(--anthropic-border)]">
          <button data-testid="admin-group-group-rpm-overrides-button-clear-all-local"
            type="button"
            :disabled="clearing"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            @click="clearAllLocal"
          >
            <Icon v-if="clearing" name="refresh" size="sm" class="mr-1 inline animate-spin" />
            {{ t('admin.groups.clearAll') }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-6">
        <svg class="h-6 w-6 animate-spin text-[var(--anthropic-fg)]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- 列表 -->
      <div v-else>
        <h4 class="mb-2 text-sm font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ t('admin.groups.rpmOverrides') }} ({{ localEntries.length }})
        </h4>

        <div v-if="localEntries.length === 0" class="py-6 text-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ t('admin.groups.noRpmOverrides') }}
        </div>

        <div v-else>
          <div class="overflow-hidden rounded-lg border border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]">
            <div class="max-h-[420px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 z-[1]">
                  <tr class="border-b border-[var(--anthropic-border)] bg-[var(--anthropic-section)] dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]">
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('admin.groups.columns.userEmail') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">ID</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('admin.groups.columns.userName') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('admin.groups.columns.userNotes') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('admin.groups.columns.userStatus') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]" :title="t('admin.groups.columns.rpmOverrideHint')">{{ t('admin.groups.columns.rpmOverride') }}</th>
                    <th class="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-dark-600">
                  <tr
                    v-for="entry in paginatedLocalEntries"
                    :key="entry.user_id"
                    class="hover:bg-[var(--anthropic-section)] dark:hover:bg-[var(--anthropic-raised)]/50"
                  >
                    <td class="px-3 py-2 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ entry.user_email }}</td>
                    <td class="whitespace-nowrap px-3 py-2 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ entry.user_id }}</td>
                    <td class="whitespace-nowrap px-3 py-2 text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ entry.user_name || '-' }}</td>
                    <td class="max-w-[160px] truncate px-3 py-2 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]" :title="entry.user_notes">{{ entry.user_notes || '-' }}</td>
                    <td class="whitespace-nowrap px-3 py-2">
                      <span
                        :class="[
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          entry.user_status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
                        ]"
                      >
                        {{ entry.user_status }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      <input data-testid="admin-group-group-rpm-overrides-input-number"
                        type="number"
                        step="1"
                        min="0"
                        autocomplete="off"
                        :value="entry.rpm_override"
                        class="hide-spinner w-20 rounded border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] px-2 py-1 text-center text-sm font-medium transition-colors focus:border-[var(--atelier-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--atelier-focus)] dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:focus:border-[var(--atelier-focus)]"
                        @change="updateLocalRpm(entry.user_id, ($event.target as HTMLInputElement).value)"
                      />
                    </td>
                    <td class="px-2 py-2">
                      <button data-testid="admin-group-group-rpm-overrides-button-remove-local-entry-user-id"
                        type="button"
                        class="rounded p-1 text-[var(--anthropic-muted)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        @click="removeLocal(entry.user_id)"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            :total="localEntries.length"
            :page="currentPage"
            :page-size="pageSize"
            @update:page="currentPage = $event"
            @update:pageSize="handlePageSizeChange"
          />
        </div>
      </div>

      <!-- 底部 -->
      <div class="flex items-center gap-3 border-t border-[var(--anthropic-border)] pt-4 dark:border-[var(--anthropic-border)]">
        <template v-if="isDirty">
          <span class="text-xs text-amber-600 dark:text-amber-400">{{ t('admin.groups.unsavedChanges') }}</span>
          <button data-testid="admin-group-group-rpm-overrides-button-handle-cancel"
            type="button"
            class="text-xs font-medium text-[var(--anthropic-fg)] hover:text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)] dark:hover:text-[var(--anthropic-fg)]"
            @click="handleCancel"
          >
            {{ t('admin.groups.revertChanges') }}
          </button>
        </template>
        <div class="ml-auto flex items-center gap-3">
          <button data-testid="admin-group-group-rpm-overrides-button-handle-close" type="button" class="btn btn-sm px-4 py-1.5" @click="handleClose">
            {{ t('common.close') }}
          </button>
          <button data-testid="admin-group-group-rpm-overrides-button-handle-save"
            v-if="isDirty"
            type="button"
            class="btn btn-primary btn-sm px-4 py-1.5"
            :disabled="saving"
            @click="handleSave"
          >
            <Icon v-if="saving" name="refresh" size="sm" class="mr-1 animate-spin" />
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { adminAPI } from '@/api/admin'
import type { GroupRPMOverrideEntry } from '@/api/admin/groups'
import type { AdminGroup, AdminUser } from '@/types'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Pagination from '@/components/common/Pagination.vue'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'

interface LocalEntry extends GroupRPMOverrideEntry {}

const props = defineProps<{
  show: boolean
  group: AdminGroup | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { t } = useI18n()
const appStore = useAppStore()

const loading = ref(false)
const saving = ref(false)
const serverEntries = ref<GroupRPMOverrideEntry[]>([])
const localEntries = ref<LocalEntry[]>([])
const searchQuery = ref('')
const searchResults = ref<AdminUser[]>([])
const showDropdown = ref(false)
const searchInputRef = ref<HTMLElement | null>(null)
const selectedUser = ref<AdminUser | null>(null)
const newRpm = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

let searchTimeout: ReturnType<typeof setTimeout>

const platformColorClass = computed(() => {
  switch (props.group?.platform) {
    case 'anthropic': return 'text-orange-700 dark:text-orange-400'
    case 'openai': return 'text-emerald-700 dark:text-emerald-400'
    case 'antigravity': return 'text-accent-700 dark:text-accent-500'
    default: return 'text-[var(--anthropic-info)] dark:text-[var(--anthropic-info)]'
  }
})

const isDirty = computed(() => {
  if (localEntries.value.length !== serverEntries.value.length) return true
  const serverMap = new Map(serverEntries.value.map(e => [e.user_id, e.rpm_override]))
  return localEntries.value.some(e => serverMap.get(e.user_id) !== e.rpm_override)
})

const paginatedLocalEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return localEntries.value.slice(start, start + pageSize.value)
})

const cloneEntries = (entries: GroupRPMOverrideEntry[]): LocalEntry[] => {
  return entries.map(e => ({ ...e }))
}

const loadEntries = async () => {
  if (!props.group) return
  loading.value = true
  try {
    serverEntries.value = await adminAPI.groups.getGroupRPMOverrides(props.group.id)
    localEntries.value = cloneEntries(serverEntries.value)
    adjustPage()
  } catch (error) {
    appStore.showError(t('admin.groups.failedToLoad'))
    console.error('Error loading RPM overrides:', error)
  } finally {
    loading.value = false
  }
}

const adjustPage = () => {
  const totalPages = Math.max(1, Math.ceil(localEntries.value.length / pageSize.value))
  if (currentPage.value > totalPages) currentPage.value = totalPages
}

watch(() => props.show, (val) => {
  if (val && props.group) {
    currentPage.value = 1
    searchQuery.value = ''
    searchResults.value = []
    selectedUser.value = null
    newRpm.value = null
    loadEntries()
  }
})

const handlePageSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleSearchUsers = () => {
  clearTimeout(searchTimeout)
  selectedUser.value = null
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showDropdown.value = false
    return
  }
  searchTimeout = setTimeout(async () => {
    try {
      const res = await adminAPI.users.list(1, 10, { search: searchQuery.value.trim() })
      searchResults.value = res.items
      showDropdown.value = true
    } catch {
      searchResults.value = []
    }
  }, 300)
}

const selectUser = (user: AdminUser) => {
  selectedUser.value = user
  searchQuery.value = user.email
  showDropdown.value = false
  searchResults.value = []
}

const handleAddLocal = () => {
  if (!selectedUser.value || newRpm.value == null || newRpm.value < 0) return
  const user = selectedUser.value
  const idx = localEntries.value.findIndex(e => e.user_id === user.id)
  const entry: LocalEntry = {
    user_id: user.id,
    user_name: user.username || '',
    user_email: user.email,
    user_notes: user.notes || '',
    user_status: user.status || 'active',
    rpm_override: newRpm.value
  }
  if (idx >= 0) {
    localEntries.value[idx] = entry
  } else {
    localEntries.value.push(entry)
  }
  searchQuery.value = ''
  selectedUser.value = null
  newRpm.value = null
  adjustPage()
}

const updateLocalRpm = (userId: number, value: string) => {
  const num = parseInt(value, 10)
  if (isNaN(num) || num < 0) return
  const entry = localEntries.value.find(e => e.user_id === userId)
  if (entry) entry.rpm_override = num
}

const removeLocal = (userId: number) => {
  localEntries.value = localEntries.value.filter(e => e.user_id !== userId)
  adjustPage()
}

const clearing = ref(false)
const clearAllLocal = async () => {
  if (!props.group || clearing.value) return
  clearing.value = true
  try {
    await adminAPI.groups.clearGroupRPMOverrides(props.group.id)
    localEntries.value = []
    serverEntries.value = []
    appStore.showSuccess(t('admin.groups.rpmSaved'))
  } catch (error) {
    appStore.showError(t('admin.groups.failedToSave'))
    console.error('Error clearing RPM overrides:', error)
  } finally {
    clearing.value = false
  }
}

const handleCancel = () => {
  localEntries.value = cloneEntries(serverEntries.value)
  adjustPage()
}

const handleSave = async () => {
  if (!props.group) return
  saving.value = true
  try {
    const entries = localEntries.value.map(e => ({
      user_id: e.user_id,
      rpm_override: e.rpm_override
    }))
    await adminAPI.groups.batchSetGroupRPMOverrides(props.group.id, entries)
    appStore.showSuccess(t('admin.groups.rpmSaved'))
    emit('success')
    emit('close')
  } catch (error) {
    appStore.showError(t('admin.groups.failedToSave'))
    console.error('Error saving RPM overrides:', error)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (isDirty.value) {
    localEntries.value = cloneEntries(serverEntries.value)
  }
  emit('close')
}

const handleClickOutside = () => { showDropdown.value = false }
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped>
.hide-spinner::-webkit-outer-spin-button,
.hide-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hide-spinner {
  -moz-appearance: textfield;
}
</style>

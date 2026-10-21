<template>
  <!-- 复选框 / 展示信息模块：内嵌分组列表保留平台、混合调度和简易模式过滤。 -->
  <div class="group-selector min-w-0 max-w-full">
    <label class="input-label">
      {{ t('admin.users.groups') }}
      <span class="font-normal text-gray-400">{{ t('common.selectedCount', { count: modelValue.length }) }}</span>
    </label>
    <!-- 填写框：搜索接入共享 input，原生 v-model 保留组合输入。 -->
    <div
      v-if="isSearchable"
      class="relative mb-2 flex min-w-0 items-center"
    >
      <Icon name="search" size="sm" class="pointer-events-none absolute left-3 shrink-0 text-gray-400" />
      <input
        v-model="searchText"
        type="text"
        :placeholder="t('common.searchPlaceholder')"
        :aria-label="t('common.searchPlaceholder')"
        class="input min-w-0 flex-1 pl-9"
      />
    </div>
    <div
      :class="[
        'group-selector-options grid max-h-32 grid-cols-2 gap-1 overflow-y-auto p-2',
        isSearchable
          ? 'rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800'
          : 'rounded-lg border border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800'
      ]"
    >
      <!-- 复选框 / 选择下拉菜单：行复用共享选项几何与中性选中面，模型仍为分组 ID 数组。 -->
      <label
        v-for="group in filteredGroups"
        :key="group.id"
        class="select-option flex min-w-0 cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-white dark:hover:bg-dark-700"
        :class="modelValue.includes(group.id) && 'select-option-selected'"
        :title="group.rate_multiplier == null ? group.name : t('admin.groups.rateAndAccounts', { rate: group.rate_multiplier, count: group.account_count || 0 })"
      >
        <input
          type="checkbox"
          :value="group.id"
          :checked="modelValue.includes(group.id)"
          @change="handleChange(group.id, ($event.target as HTMLInputElement).checked)"
          class="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-dark-500"
        />
        <GroupBadge
          :name="group.name"
          :platform="group.platform"
          :logo-url="group.logo_url"
          :subscription-type="group.subscription_type || undefined"
          :rate-multiplier="group.rate_multiplier == null ? undefined : group.rate_multiplier"
          class="min-w-0 flex-1"
        />
        <span class="shrink-0 text-xs text-gray-400">{{ group.account_count || 0 }}</span>
      </label>
      <!-- 提示信息：空列表保留原消息，不伪装成可选分组或加载状态。 -->
      <div
        v-if="filteredGroups.length === 0"
        class="col-span-full py-2 text-center text-sm text-gray-500 dark:text-gray-400"
        role="status"
      >
        {{ t('common.noGroupsAvailable') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GroupBadge from './GroupBadge.vue'
import Icon from '@/components/icons/Icon.vue'
import type { Group, GroupPlatform } from '@/types'
import { useAuthStore } from '@/stores'

const { t } = useI18n()
const authStore = useAuthStore()

interface Props {
  modelValue: number[]
  groups: (Group & { account_count?: number })[]
  platform?: GroupPlatform // Optional platform filter
  mixedScheduling?: boolean // For antigravity accounts: allow anthropic/gemini groups
  searchable?: boolean | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  searchable: 'auto'
})
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const searchText = ref('')

const isSearchable = computed(() => {
  if (props.searchable === 'auto') return props.groups.length > 5
  return props.searchable
})

// Filter groups by platform if specified
const filteredGroups = computed(() => {
  let result = authStore.isSimpleMode
    ? props.groups.filter((g) => g.platform !== 'composite')
    : props.groups
  if (props.platform) {
    // antigravity 账户启用混合调度后，可选择 anthropic/gemini 分组
    if (props.platform === 'antigravity' && props.mixedScheduling) {
      result = result.filter(
        (g) => g.platform === 'antigravity' || g.platform === 'anthropic' || g.platform === 'gemini' || g.platform === 'composite'
      )
    } else {
      // 默认：只能选择同 platform 的分组；composite 分组可接收任意具体平台账号
      result = result.filter((g) => g.platform === props.platform || g.platform === 'composite')
    }
  }
  if (isSearchable.value && searchText.value) {
    const q = searchText.value.toLowerCase()
    result = result.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    )
  }
  return result
})

watch(
  () => [authStore.isSimpleMode, props.groups, props.modelValue] as const,
  () => {
    if (!authStore.isSimpleMode || props.groups.length === 0) return
    const visibleIDs = new Set(props.groups.filter((group) => group.platform !== 'composite').map((group) => group.id))
    const cleaned = props.modelValue.filter((id) => visibleIDs.has(id))
    if (cleaned.length !== props.modelValue.length) emit('update:modelValue', cleaned)
  },
  { immediate: true, deep: true }
)

const handleChange = (groupId: number, checked: boolean) => {
  const newValue = checked
    ? [...props.modelValue, groupId]
    : props.modelValue.filter((id) => id !== groupId)
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
/* 复选框 / 展示信息模块：按列表实际宽度自动换列；滚动只在选项区，不添加浮层定位。 */
:root.kreepai-design-system .group-selector-options {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  border: 1px solid #d1cfc5;
  border-radius: 18px;
  background: var(--bg);
  overscroll-behavior: contain;
}
</style>

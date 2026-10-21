<template>
  <!-- 分页：共享层负责8px角、蓝色选中与32/44px命中；内部换行不裁切表外导航。 -->
  <div
    class="kreepai-pagination flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-dark-700 dark:bg-dark-800 sm:px-6"
  >
    <div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 sm:hidden">
      <!-- 分页：移动端保留上一页、页数和下一页，沿用原禁用边界。 -->
      <button
        type="button"
        @click="goToPage(page - 1)"
        :disabled="page === 1"
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
      >
        {{ t('pagination.previous') }}
      </button>
      <span class="text-sm text-gray-700 dark:text-gray-300">
        {{ t('pagination.pageOf', { page, total: totalPages }) }}
      </span>
      <button
        type="button"
        @click="goToPage(page + 1)"
        :disabled="page === totalPages"
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
      >
        {{ t('pagination.next') }}
      </button>
    </div>

    <div class="hidden min-w-0 flex-wrap gap-3 sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <!-- 数字展示：总数和页数保留完整文本，摘要与筛选按可用宽度换行。 -->
      <div class="flex min-w-0 flex-wrap items-center gap-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ t('pagination.showing') }}
          <span class="font-medium">{{ fromItem }}</span>
          {{ t('pagination.to') }}
          <span class="font-medium">{{ toItem }}</span>
          {{ t('pagination.of') }}
          <span class="font-medium">{{ total }}</span>
          {{ t('pagination.results') }}
        </p>

        <!-- 选择下拉菜单：每页条数沿用 Select 与持久化，不挤压结果摘要。 -->
        <div v-if="showPageSizeSelector" class="flex items-center space-x-2">
          <span class="text-sm text-gray-700 dark:text-gray-300"
            >{{ t('pagination.perPage') }}:</span
          >
          <div class="page-size-select w-20">
            <Select
              :model-value="pageSize"
              :options="pageSizeSelectOptions"
              @update:model-value="handlePageSizeChange"
            />
          </div>
        </div>

        <!-- 分页 / 填写框：跳转字段与动作同高，数字范围及 Enter 提交沿用原逻辑。 -->
        <div v-if="showJump" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('pagination.jumpTo') }}</span>
          <input
            v-model="jumpPage"
            type="number"
            min="1"
            :max="totalPages"
            class="input pagination-jump-input min-w-0 w-20 text-sm"
            :aria-label="t('pagination.jumpTo')"
            :placeholder="t('pagination.jumpPlaceholder')"
            @keyup.enter="submitJump"
          />
          <button type="button" class="btn btn-ghost btn-sm" @click="submitJump">
            {{ t('pagination.jumpAction') }}
          </button>
        </div>
      </div>

      <!-- 分页：页码、不可选省略号与前后翻页保留 aria-current 和禁用语义。 -->
      <nav
        class="relative z-0 inline-flex max-w-full -space-x-px rounded-md shadow-sm"
        aria-label="Pagination"
      >
        <!-- Previous button -->
        <button
          type="button"
          @click="goToPage(page - 1)"
          :disabled="page === 1"
          class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
          :aria-label="t('pagination.previous')"
        >
          <Icon name="chevronLeft" size="md" />
        </button>

        <!-- Page numbers -->
        <button
          type="button"
          v-for="(pageNum, index) in visiblePages"
          :key="`${pageNum}-${index}`"
          @click="typeof pageNum === 'number' && goToPage(pageNum)"
          :disabled="typeof pageNum !== 'number'"
          :class="[
            'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
            pageNum === page
              ? 'z-10 border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600',
            typeof pageNum !== 'number' && 'cursor-default'
          ]"
          :aria-label="
            typeof pageNum === 'number' ? t('pagination.goToPage', { page: pageNum }) : undefined
          "
          :aria-current="pageNum === page ? 'page' : undefined"
        >
          {{ pageNum }}
        </button>

        <!-- Next button -->
        <button
          type="button"
          @click="goToPage(page + 1)"
          :disabled="page === totalPages"
          class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
          :aria-label="t('pagination.next')"
        >
          <Icon name="chevronRight" size="md" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import Select from './Select.vue'
import { getConfiguredTablePageSizeOptions, normalizeTablePageSize } from '@/utils/tablePreferences'
import { setPersistedPageSize } from '@/composables/usePersistedPageSize'

const { t } = useI18n()

interface Props {
  total: number
  page: number
  pageSize: number
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showJump?: boolean
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => getConfiguredTablePageSizeOptions(),
  showPageSizeSelector: true,
  showJump: false
})

const emit = defineEmits<Emits>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const fromItem = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const toItem = computed(() => {
  const to = props.page * props.pageSize
  return to > props.total ? props.total : to
})

const pageSizeSelectOptions = computed(() => {
  const options = Array.from(
    new Set([
      ...getConfiguredTablePageSizeOptions(),
      normalizeTablePageSize(props.pageSize)
    ])
  ).sort((a, b) => a - b)

  return options.map((size) => ({
    value: size,
    label: String(size)
  }))
})

const jumpPage = ref('')

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 7
  const total = totalPages.value

  if (total <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    const start = Math.max(2, props.page - 2)
    const end = Math.min(total - 1, props.page + 2)

    // Add ellipsis before if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis after if needed
    if (end < total - 1) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

const goToPage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value && newPage !== props.page) {
    emit('update:page', newPage)
  }
}

const handlePageSizeChange = (value: string | number | boolean | null) => {
  if (value === null || typeof value === 'boolean') return
  const newPageSize = normalizeTablePageSize(typeof value === 'string' ? parseInt(value, 10) : value)
  setPersistedPageSize(newPageSize)
  emit('update:pageSize', newPageSize)
}

const submitJump = () => {
  const value = String(jumpPage.value).trim()
  if (!value) return
  const pageNum = Number.parseInt(value, 10)
  if (Number.isNaN(pageNum)) return
  const nextPage = Math.min(Math.max(pageNum, 1), totalPages.value)
  jumpPage.value = ''
  goToPage(nextPage)
}
</script>

<style scoped>
/* 选择下拉菜单：原条数选择器兜底；系统模式只把内嵌控件与分页按钮对齐。 */
.page-size-select :deep(.select-trigger) {
  @apply px-3 py-1.5 text-sm;
}

/* 分页：共享层已有圆角、选中、禁用与最小命中；这里只消除旧 py-2 造成的额外高度。 */
:root.kreepai-design-system .kreepai-pagination button {
  padding: 5px 10px;
  font-size: 13px;
  line-height: 20px;
  transform: none;
}

:root.kreepai-design-system .kreepai-pagination nav > button:first-child,
:root.kreepai-design-system .kreepai-pagination nav > button:last-child {
  padding-inline: 5px;
}

/* 填写框 / 分页：跳转与条数选择器跟随同组按钮高度，触摸自动使用44px。 */
:root.kreepai-design-system .pagination-jump-input,
:root.kreepai-design-system .page-size-select :deep(.select-trigger) {
  height: var(--button-height);
  min-height: var(--button-height);
  padding-block: 5px;
}
</style>

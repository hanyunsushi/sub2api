<template>
  <div
    class="table-page-layout"
    :class="{
      'mobile-mode': isMobile,
      'table-page-layout--page-scroll': scrollMode === 'page'
    }"
  >
    <!-- 固定区域：操作按钮 -->
    <div v-if="$slots.actions" class="layout-section-fixed table-page-actions-section">
      <slot name="actions" />
    </div>

    <!-- 固定区域：搜索和过滤器 -->
    <div v-if="$slots.filters" class="layout-section-fixed table-page-filter-section">
      <slot name="filters" />
    </div>

    <!-- 滚动区域：表格 -->
    <div class="layout-section-scrollable">
      <div class="card table-scroll-container">
        <slot name="table" />
      </div>
    </div>

    <!-- 固定区域：分页器 -->
    <div v-if="$slots.pagination" class="layout-section-fixed table-page-pagination-section">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { scrollMode = 'internal' } = defineProps<{
  scrollMode?: 'internal' | 'page'
}>()

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* 桌面端：Flexbox 布局 */
.table-page-layout {
  @apply flex flex-col gap-6;
  height: calc(100vh - 64px - 4rem); /* 减去 header + lg:p-8 的上下padding */
}

.layout-section-fixed {
  @apply flex-shrink-0;
  border-color: var(--anthropic-border-subtle, var(--atelier-line));
  background: var(--anthropic-section, var(--atelier-paper-2));
}

.layout-section-scrollable {
  @apply flex-1 min-h-0 flex flex-col;
}

/* 表格滚动容器 - 增强版表体滚动方案 */
.table-scroll-container {
  @apply flex flex-col overflow-hidden h-full rounded-lg;
  border-color: var(--atelier-line);
  background: var(--atelier-surface);
}

.table-scroll-container :deep(.table-wrapper) {
  @apply flex-1 overflow-x-auto overflow-y-auto;
  /* 确保横向滚动条显示在最底部 */
  scrollbar-gutter: stable;
}

.table-scroll-container :deep(table) {
  @apply w-full;
  min-width: max-content; /* 关键：确保表格宽度根据内容撑开，从而触发横向滚动 */
  display: table; /* 使用标准 table 布局以支持 sticky 列 */
}

.table-scroll-container :deep(thead) {
  @apply dark:bg-dark-800/80;
  background: var(--anthropic-page, var(--atelier-surface));
}

.table-scroll-container :deep(tbody) {
  /* 保持默认 table-row-group 显示，不使用 block */
}

.table-scroll-container :deep(th) {
  @apply px-5 py-4 text-left text-sm font-medium dark:text-dark-300 border-b border-accent-200 dark:border-dark-700;
  border-color: var(--anthropic-cookbook-border, var(--atelier-line));
  background: var(--anthropic-page, var(--atelier-surface));
  color: var(--anthropic-muted, var(--atelier-muted));
}

.table-scroll-container :deep(td) {
  @apply px-5 py-4 text-sm dark:text-gray-300 border-b border-accent-100 dark:border-dark-800;
  border-color: var(--anthropic-border-soft, var(--atelier-line));
  color: var(--atelier-ink);
}

.table-page-layout--page-scroll {
  height: auto;
  min-height: 0;
}

.table-page-layout--page-scroll .layout-section-scrollable {
  @apply flex-none min-h-fit;
}

.table-page-layout--page-scroll .table-scroll-container {
  @apply h-auto overflow-visible;
}

.table-page-layout--page-scroll .table-scroll-container :deep(.table-wrapper) {
  overflow-x: auto;
  overflow-y: visible;
}

/* 移动端：恢复正常滚动 */
.table-page-layout.mobile-mode {
  height: auto;
  min-height: 0;
}

.table-page-layout.mobile-mode .table-scroll-container {
  @apply h-auto overflow-visible border-none shadow-none bg-transparent;
}

.table-page-layout.mobile-mode .layout-section-scrollable {
  @apply flex-none min-h-fit;
}

.table-page-layout.mobile-mode .table-scroll-container :deep(.table-wrapper) {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.table-page-layout.mobile-mode .table-scroll-container :deep(table) {
  @apply flex-none;
  display: table;
  min-width: 100%;
}
</style>

<template>
  <!-- 加载反馈：独立站与Console共用固定16/20px点阵；大小不随请求阶段改变。 -->
  <span class="dot-matrix-loader" :class="colorClass" :style="{ '--loader-size': size === 'sm' ? '16px' : '20px' }" role="status" :aria-label="t('common.loading')" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
}>(), { size: 'md', color: 'primary' })
const colorClass = computed(() => {
  const colors: Record<'primary' | 'secondary' | 'white' | 'gray', string> = {
    primary: 'kreepai-loader-primary',
    secondary: 'text-gray-500 dark:text-dark-400',
    white: 'text-white',
    gray: 'text-gray-400 dark:text-dark-500'
  }
  return colors[props.color]
})
</script>
<style scoped>
/* 加载反馈：页面/内容使用系统加载蓝；按钮内跟随所属按钮前景。 */
.kreepai-loader-primary { color: var(--accent, #007aff); }
:global(.btn) .kreepai-loader-primary { color: inherit; }
</style>

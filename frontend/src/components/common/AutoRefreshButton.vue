<template>
  <!-- 普通按钮 / 选择下拉菜单：定时刷新是配置选择，启用轮询不冒充请求loading。 -->
  <div class="relative kreepai-auto-refresh" ref="dropdownRef" @keydown.esc="showDropdown = false" @focusout="!dropdownRef?.contains($event.relatedTarget as Node) && (showDropdown = false)">
    <button
      type="button" @click="showDropdown = !showDropdown"
      :aria-expanded="showDropdown" aria-haspopup="menu"
      class="btn btn-secondary"
      :title="t('common.autoRefresh.title')"
    >
      <Icon name="refresh" :filled="showDropdown" class="h-3.5 w-3.5" />
      <span class="auto-refresh-label">
        <span class="auto-refresh-reserve" aria-hidden="true">{{ enabled ? t('common.autoRefresh.countdown', { seconds: intervalSeconds }) : t('common.autoRefresh.title') }}</span>
        <span class="auto-refresh-value">
        {{ enabled
          ? t('common.autoRefresh.countdown', { seconds: countdown })
          : t('common.autoRefresh.title')
        }}
      </span></span>
    </button>

    <div
      v-if="showDropdown" role="menu"
      class="dropdown absolute right-0 z-20 mt-2 w-44"
    >
      <div class="grid gap-0.5">
        <button
          @click="$emit('update:enabled', !enabled)"
          :aria-checked="enabled"
          type="button" role="menuitemradio" class="dropdown-item flex w-full items-center justify-between"
        >
          <span>{{ t('common.autoRefresh.enable') }}</span>
          <Icon name="check" filled v-if="enabled" class="h-4 w-4 text-primary-500" />
        </button>
        <div class="my-1 border-t border-gray-100 dark:border-dark-700"></div>
        <button
          v-for="sec in intervals"
          :key="sec"
          @click="$emit('update:interval', sec)"
          :aria-checked="intervalSeconds === sec"
          type="button" role="menuitemradio" class="dropdown-item flex w-full items-center justify-between"
        >
          <span>{{ t('common.autoRefresh.seconds', { n: sec }) }}</span>
          <Icon name="check" filled v-if="intervalSeconds === sec" class="h-4 w-4 text-primary-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  enabled: boolean
  intervalSeconds: number
  countdown: number
  intervals: readonly number[]
}>()

defineEmits<{
  (e: 'update:enabled', value: boolean): void
  (e: 'update:interval', value: number): void
}>()

const { t } = useI18n()
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
/* 普通按钮 / 数字展示：倒计时占同一网格格，按完整interval预留宽度，不逐秒推动邻居。 */
.auto-refresh-label { display:inline-grid; font-variant-numeric:tabular-nums; }
.auto-refresh-label > span { grid-area:1/1; white-space:nowrap; }
.auto-refresh-reserve { visibility:hidden; pointer-events:none; }
.auto-refresh-value { justify-self:start; }
</style>

<template>
  <!-- 普通按钮 / 悬浮效果：新版刷新透明无外框、accent图形；保留真实loading与400/800ms旋转。 -->
  <button type="button" class="kreeper-refresh" :disabled="disabled || loading" :aria-label="label" :title="label" :aria-busy="loading" @click="$emit('refresh')">
    <!-- 卡片SVG：SF ArrowClockwiseCircle Regular；真实请求loading才Fill，原旋转合同保持。 -->
    <Icon name="refresh" size="sm" :filled="loading" class="kreeper-refresh-svg" :class="{ 'is-loading': loading }" />
  </button>
</template>
<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
withDefaults(defineProps<{ label?: string; loading?: boolean; disabled?: boolean }>(), { label: '立即刷新', loading: false, disabled: false })
defineEmits<{ refresh: [] }>()
</script>
<style scoped>
/* 普通按钮：中性32px刷新入口；SVG悬浮转180度并同速回转，不引入位移、缩放或彩色光晕。 */
.kreeper-refresh { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; flex: 0 0 auto; border-radius: 18px; border: 0; background: transparent; color: var(--accent); cursor: pointer; }
.kreeper-refresh:hover:not(:disabled) { color: var(--accent); }
.kreeper-refresh:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.kreeper-refresh:disabled { opacity: .5; cursor: not-allowed; }
.kreeper-refresh-svg { transform-origin: center; transform-box: view-box; transition: transform .4s linear; }
.kreeper-refresh:hover:not(:disabled) .kreeper-refresh-svg, .kreeper-refresh:focus-visible:not(:disabled) .kreeper-refresh-svg { transform: rotate(180deg); }
.kreeper-refresh-svg.is-loading { animation: kreeper-refresh-turn .8s linear infinite; }
@keyframes kreeper-refresh-turn { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .kreeper-refresh .kreeper-refresh-svg { animation: none !important; transition: none !important; transform: none !important; } }
@media (pointer: coarse) { .kreeper-refresh { width: 44px; height: 44px; } }
</style>

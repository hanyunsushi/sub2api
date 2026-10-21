<script setup lang="ts">
// 加载反馈：路由模块、初始接口和首屏媒体共用同一次真实等待，点阵移除后才播放入场。
import { useI18n } from 'vue-i18n'
import { pageLoading, usePageLoadingPosition } from '@/utils/page-loading'
const { t } = useI18n()
const position = usePageLoadingPosition(() => document.querySelector<HTMLElement>('.console-remote-application')?.closest<HTMLElement>('.layout-content') || document.querySelector<HTMLElement>('.kreepai-layout-content'))
</script>
<template>
  <!-- 加载反馈：20px点阵固定占位，正文切换保留导航。 -->
  <span v-if="pageLoading" class="navigation-loading-dot dot-matrix-loader" :style="position" role="status" :aria-label="t('common.loading')" />
</template>
<style scoped>
/* 加载反馈：定位不占布局，不遮挡常驻顶栏/侧栏。 */
.navigation-loading-dot { position: fixed; z-index: 125; color: var(--accent, #007aff); transform: translate(-50%,-50%); pointer-events: none; }
</style>

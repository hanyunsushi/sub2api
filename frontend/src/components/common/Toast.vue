<template>
  <Teleport to="body">
    <!-- 提示信息：自动关闭、关闭入口沿用原store，统一原源码的Motion表面，无确认按钮。 -->
    <FeedbackMessages :entries="entries" @close="appStore.hideToast" />
  </Teleport>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import FeedbackMessages from './feedback/FeedbackMessages.vue'
const appStore = useAppStore()
const entries = computed(() => appStore.toasts.map(item => ({ ...item, closable: true })))
</script>

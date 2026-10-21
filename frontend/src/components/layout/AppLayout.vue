<template>
  <div class="min-h-screen" :class="embedded ? 'sub2api-microfrontend-content' : 'kreepai-layout'">
    <!-- 展示信息模块：页面白底，卡片按深度区分，不叠加背景装饰。 -->

    <!-- Sidebar -->
    <!-- 多项目路由导航：嵌入只发布原菜单；导航 DOM 由宿主独占。 -->
    <AppSidebar v-if="!embedded" />

    <!-- Main Content Area -->
    <div
      class="relative min-h-screen transition-all duration-300"
      :class="embedded ? '' : ['kreepai-layout-main', { 'is-collapsed': sidebarCollapsed }]"
    >
      <!-- Header -->
      <AppHeader />

      <!-- Main Content -->
      <!-- 组件绘制动画：正文是唯一加载/揭示目标，顶栏与侧栏不进入切屏。 -->
      <!-- 展示信息模块：原应用管理正文宽度和留白，独立站/嵌入共用，不套青舟内容容器。 -->
      <main class="kreepai-page-content kreepai-layout-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { isMicrofrontend } from '@/runtime/environment'

const appStore = useAppStore()
const embedded = isMicrofrontend()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
</script>

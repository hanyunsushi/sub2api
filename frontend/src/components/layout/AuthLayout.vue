<template>
  <!-- 展示信息模块 / 品牌标识：独立站与Console共用认证白底，业务表单与登录方式仍由原页面提供。 -->
  <template v-if="withinAuthShell">
    <slot />
    <div v-if="$slots.footer" class="kreepai-auth-footer"><slot name="footer" /></div>
  </template>
  <section v-else class="kreepai-auth">
    <aside class="kreepai-auth-aside">
      <p class="kreepai-auth-eyebrow">{{ siteName }} / AI API Gateway</p>
      <h1>{{ t('auth.gatewayHeadline') }}</h1>
      <p>{{ siteSubtitle }}</p>
      <ol class="kreepai-auth-features"><li>{{ t('auth.gatewayKeys') }}</li><li>{{ t('auth.gatewayUsage') }}</li><li>{{ t('auth.gatewayModels') }}</li></ol>
    </aside>
    <main class="kreepai-auth-main">
      <div class="kreepai-auth-form">
        <div class="kreepai-auth-brand">
          <img :src="siteLogo || embeddedLogo" alt="Kreepai" width="44" height="44" />
          <span>{{ siteName }}</span>
        </div>
        <AuthModeNavigation />
        <!-- 加载反馈：点阵仅覆盖右侧表单准备区域，保持左侧与品牌可见。 -->
        <div class="kreepai-auth-pane" :aria-busy="isNavigating">
          <div class="kreepai-auth-content" :class="{ 'kreepai-auth-pending': isLoading }" :inert="isNavigating">
            <!-- 填写框 / 高亮弧边按钮 / 提示信息：保留原认证与错误反馈插槽。 -->
            <slot />
            <div v-if="$slots.footer" class="kreepai-auth-footer"><slot name="footer" /></div>
          </div>
          <span v-if="isLoading" class="kreepai-auth-loading" role="status" :aria-label="t('common.loading')"><span class="dot-matrix-loader" aria-hidden="true" /></span>
        </div>
      </div>
    </main>
  </section>

</template>

<script setup lang="ts">
import { computed, inject, onMounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { embeddedAuthShellKey } from '@/runtime/environment'
import { useNavigationLoadingState } from '@/composables/useNavigationLoading'
import { pageLoading } from '@/utils/page-loading'
import AuthModeNavigation from './AuthModeNavigation.vue'
const withinAuthShell = inject(embeddedAuthShellKey, false)
if (!withinAuthShell) provide(embeddedAuthShellKey, true)
const navigationLoading = useNavigationLoadingState()
const isLoading = computed(() => navigationLoading.isLoading.value || pageLoading.value)
const isNavigating = computed(() => navigationLoading.isNavigating.value || pageLoading.value)
const { t } = useI18n()
// 品牌标识：默认图片随当前嵌入构建的资源版本加载。
const embeddedLogo = `${import.meta.env.BASE_URL}logo.svg`
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')


onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

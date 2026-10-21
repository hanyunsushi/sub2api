<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'

const route = useRoute()
const appStore = useAppStore()
const { t } = useI18n()
const registrationVisible = computed(() => route.name === 'Register' || (
  appStore.publicSettingsLoaded && !appStore.backendModeEnabled
  && appStore.cachedPublicSettings?.registration_enabled === true
))
// 二级切换路由：只保留原本的登录后目标，不携带OAuth回跳材料。
const query = computed(() => typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {})
</script>

<template>
  <!-- 二级切换路由：认证模式共享稳定外壳，使用中性基线和2px活动底线。 -->
  <nav v-if="['Login', 'Register', 'ForgotPassword'].includes(String(route.name))" class="kreepai-auth-mode-nav" :aria-label="`${t('auth.signIn')} / ${t('auth.signUp')}`">
    <RouterLink :to="{ path: '/login', query }" :class="{ active: route.name === 'Login' }">{{ t('auth.signIn') }}</RouterLink>
    <RouterLink v-if="registrationVisible" :to="{ path: '/register', query }" :class="{ active: route.name === 'Register' }">{{ t('auth.signUp') }}</RouterLink>
  </nav>
</template>

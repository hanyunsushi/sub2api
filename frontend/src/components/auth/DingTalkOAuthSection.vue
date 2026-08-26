<template>
  <div class="space-y-4">
    <button data-testid="auth-ding-talk-o-auth-section-button-start-login" type="button" :disabled="disabled" class="btn btn-secondary w-full" @click="startLogin">
      <ProviderLogoMark provider="dingtalk" class="auth-provider-logo-mark mr-2" />
      {{ t('auth.dingtalk.signIn') }}
    </button>

    <div v-if="showDivider" class="flex items-center gap-3">
      <div class="h-px flex-1 bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]"></div>
      <span class="text-xs text-[var(--anthropic-muted)] dark:text-dark-400">
        {{ t('auth.oauthOrContinue') }}
      </span>
      <div class="h-px flex-1 bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { OAuthLoginStart } from '@/api/auth'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  showDivider?: boolean
}>(), {
  showDivider: true
})
const emit = defineEmits<{
  start: [request: OAuthLoginStart]
}>()

const route = useRoute()
const { t } = useI18n()

function startLogin(): void {
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  storeOAuthAffiliateCode(resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code))
  emit('start', { provider: 'dingtalk', params: { redirect: redirectTo } })
}
</script>

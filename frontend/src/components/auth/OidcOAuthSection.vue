<template>
  <div class="space-y-4">
    <button data-testid="auth-oidc-o-auth-section-button-start-login" type="button" :disabled="disabled" class="btn btn-secondary w-full" @click="startLogin">
      <ProviderLogoMark provider="oidc" class="auth-provider-logo-mark mr-2" />
      {{ t('auth.oidc.signIn', { providerName: normalizedProviderName }) }}
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ProviderLogoMark from '@/components/auth/ProviderLogoMark.vue'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  providerName?: string
  showDivider?: boolean
}>(), {
  providerName: 'OIDC',
  showDivider: true
})

const route = useRoute()
const { t } = useI18n()

const normalizedProviderName = computed(() => {
  const name = props.providerName?.trim()
  return name || 'OIDC'
})

function startLogin(): void {
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  storeOAuthAffiliateCode(resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code))
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api/v1'
  const normalized = apiBase.replace(/\/$/, '')
  const startURL = `${normalized}/auth/oauth/oidc/start?redirect=${encodeURIComponent(redirectTo)}`
  window.location.href = startURL
}
</script>

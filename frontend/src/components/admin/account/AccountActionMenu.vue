<template>
  <Teleport to="body">
    <div v-if="show && position">
      <!-- Backdrop: click anywhere outside to close -->
      <div data-testid="admin-account-account-action-menu-div-emit-close" class="fixed inset-0 z-[9998]" @click="emit('close')"></div>
      <div data-testid="admin-account-account-action-menu-div-div"
        class="action-menu-content dropdown-highlight-menu account-card-action-menu fixed z-[9999] w-52"
        :style="{ top: position.top + 'px', left: position.left + 'px' }"
        @mouseenter="emit('menu-enter')"
        @mouseleave="emit('menu-leave')"
        @click.stop
      >
        <div class="py-1">
          <template v-if="account">
            <button data-testid="admin-account-account-action-menu-button-emit-test-account" @click="$emit('test', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm">
              <Icon name="play" size="sm" class="text-green-500" :stroke-width="2" />
              {{ t('admin.accounts.testConnection') }}
            </button>
            <button data-testid="admin-account-account-action-menu-button-emit-stats-account" @click="$emit('stats', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm">
              <Icon name="chart" size="sm" class="text-accent-500" />
              {{ t('admin.accounts.viewStats') }}
            </button>
            <button data-testid="admin-account-account-action-menu-button-emit-schedule-account" @click="$emit('schedule', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm">
              <Icon name="clock" size="sm" class="text-orange-500" />
              {{ t('admin.scheduledTests.schedule') }}
            </button>
            <button v-if="canDuplicate" data-testid="admin-account-account-action-menu-button-duplicate" @click="$emit('duplicate', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm">
              <Icon name="copy" size="sm" class="text-[var(--anthropic-info)]" />
              {{ t('admin.accounts.duplicateAccount') }}
            </button>
            <template v-if="(account.type === 'oauth' || account.type === 'setup-token') && !isShadow">
              <button data-testid="admin-account-account-action-menu-button-emit-reauth-account" @click="$emit('reauth', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-[var(--anthropic-info)]">
                <Icon name="link" size="sm" />
                {{ t('admin.accounts.reAuthorize') }}
              </button>
              <button data-testid="admin-account-account-action-menu-button-emit-refresh-token-account" @click="$emit('refresh-token', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-accent-600">
                <Icon name="refresh" size="sm" />
                {{ t('admin.accounts.refreshToken') }}
              </button>
            </template>
            <button
              v-if="isOpenAIOAuthParent"
              data-testid="admin-account-account-action-menu-button-create-spark-shadow"
              class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-amber-600"
              @click="$emit('create-spark-shadow', account); $emit('close')"
            >
              <Icon name="sparkles" size="sm" />
              {{ t('admin.accounts.createSparkShadow') }}
            </button>
            <button data-testid="admin-account-account-action-menu-button-emit-set-privacy-account" v-if="supportsPrivacy" @click="$emit('set-privacy', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-emerald-600">
              <Icon name="shield" size="sm" />
              {{ t('admin.accounts.setPrivacy') }}
            </button>
            <div v-if="hasRecoverableState" class="my-1 border-t border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"></div>
            <button data-testid="admin-account-account-action-menu-button-emit-recover-state-account" v-if="hasRecoverableState" @click="$emit('recover-state', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-emerald-600">
              <Icon name="sync" size="sm" />
              {{ t('admin.accounts.recoverState') }}
            </button>
            <button data-testid="admin-account-account-action-menu-button-emit-reset-quota-account" v-if="hasQuotaLimit" @click="$emit('reset-quota', account); $emit('close')" class="dropdown-highlight-item flex w-full items-center gap-2 text-sm text-teal-600">
              <Icon name="refresh" size="sm" />
              {{ t('admin.accounts.resetQuota') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@/components/icons'
import type { Account } from '@/types'

const props = defineProps<{ show: boolean; account: Account | null; position: { top: number; left: number } | null }>()
const emit = defineEmits(['close', 'menu-enter', 'menu-leave', 'test', 'stats', 'schedule', 'duplicate', 'reauth', 'refresh-token', 'recover-state', 'reset-quota', 'set-privacy', 'create-spark-shadow'])
const { t } = useI18n()
const canDuplicate = computed(() => {
  if (!props.account || props.account.parent_account_id != null) return false
  return ['apikey', 'upstream', 'bedrock', 'service_account'].includes(props.account.type)
})
const isRateLimited = computed(() => {
  if (props.account?.rate_limit_reset_at && new Date(props.account.rate_limit_reset_at) > new Date()) {
    return true
  }
  const modelLimits = (props.account?.extra as Record<string, unknown> | undefined)?.model_rate_limits as
    | Record<string, { rate_limit_reset_at: string }>
    | undefined
  if (modelLimits) {
    const now = new Date()
    return Object.values(modelLimits).some(info => new Date(info.rate_limit_reset_at) > now)
  }
  return false
})
const isOverloaded = computed(() => props.account?.overload_until && new Date(props.account.overload_until) > new Date())
const isTempUnschedulable = computed(() => props.account?.temp_unschedulable_until && new Date(props.account.temp_unschedulable_until) > new Date())
const hasRecoverableState = computed(() => {
  return props.account?.status === 'error' || Boolean(isRateLimited.value) || Boolean(isOverloaded.value) || Boolean(isTempUnschedulable.value)
})
const isAntigravityOAuth = computed(() => props.account?.platform === 'antigravity' && props.account?.type === 'oauth')
const isOpenAIOAuth = computed(() => props.account?.platform === 'openai' && props.account?.type === 'oauth')
const isShadow = computed(() => props.account?.parent_account_id != null)
const isOpenAIOAuthParent = computed(() => isOpenAIOAuth.value && !isShadow.value)
const supportsPrivacy = computed(() => (isAntigravityOAuth.value || isOpenAIOAuth.value) && !isShadow.value)
const hasQuotaLimit = computed(() => {
  return (props.account?.type === 'apikey' || props.account?.type === 'bedrock') && (
    (props.account?.quota_limit ?? 0) > 0 ||
    (props.account?.quota_daily_limit ?? 0) > 0 ||
    (props.account?.quota_weekly_limit ?? 0) > 0
  )
})

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <span
    :class="[
      'group-token inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
      badgeClass
    ]"
  >
    <!-- Platform logo -->
    <PlatformIcon v-if="platform" :platform="platform" size="sm" />
    <!-- Group name -->
    <span class="truncate">{{ name }}</span>
    <!-- Right side label -->
    <span v-if="showLabel" :class="labelClass">
      <template v-if="hasCustomRate">
        <!-- 原倍率删除线 + 专属倍率高亮 -->
        <span class="line-through opacity-50 mr-0.5">{{ rateMultiplier }}x</span>
        <span class="font-bold">{{ userRateMultiplier }}x</span>
      </template>
      <template v-else>
        {{ labelText }}
      </template>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubscriptionType, GroupPlatform } from '@/types'
import PlatformIcon from './PlatformIcon.vue'

interface Props {
  name: string
  platform?: GroupPlatform
  subscriptionType?: SubscriptionType
  rateMultiplier?: number
  userRateMultiplier?: number | null // 用户专属倍率
  showRate?: boolean
  daysRemaining?: number | null // 剩余天数（订阅类型时使用）
  /**
   * 订阅分组默认在右侧 label 展示"订阅"或剩余天数；
   * 开启后订阅分组也改为显示倍率（保留订阅主题色 label，配合可用渠道这类
   * 只关心费率、不关心有效期的场景）。
   */
  alwaysShowRate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subscriptionType: 'standard',
  showRate: true,
  daysRemaining: null,
  userRateMultiplier: null,
  alwaysShowRate: false
})

const { t } = useI18n()

const isSubscription = computed(() => props.subscriptionType === 'subscription')

// 是否有专属倍率（且与默认倍率不同）
const hasCustomRate = computed(() => {
  return (
    props.userRateMultiplier !== null &&
    props.userRateMultiplier !== undefined &&
    props.rateMultiplier !== undefined &&
    props.userRateMultiplier !== props.rateMultiplier
  )
})

// 是否显示右侧标签
const showLabel = computed(() => {
  if (!props.showRate) return false
  // 订阅类型：显示天数或"订阅"
  if (isSubscription.value) return true
  // 标准类型：显示倍率（包括专属倍率）
  return props.rateMultiplier !== undefined || hasCustomRate.value
})

// Label text
const labelText = computed(() => {
  const rateLabel = props.rateMultiplier !== undefined ? `${props.rateMultiplier}x` : ''
  if (isSubscription.value && !props.alwaysShowRate) {
    // 如果有剩余天数，显示天数
    if (props.daysRemaining !== null && props.daysRemaining !== undefined) {
      if (props.daysRemaining <= 0) {
        return t('admin.users.expired')
      }
      return t('admin.users.daysRemaining', { days: props.daysRemaining })
    }
    // 否则显示"订阅"
    return t('groups.subscription')
  }
  return rateLabel
})

// Label style based on type and days remaining
const labelClass = computed(() => {
  if (!isSubscription.value) {
    return 'group-token-label group-token-label--standard'
  }

  // 订阅类型：根据剩余天数显示不同颜色
  if (props.daysRemaining !== null && props.daysRemaining !== undefined) {
    if (props.daysRemaining <= 0 || props.daysRemaining <= 3) {
      return 'group-token-label group-token-label--error'
    }
    if (props.daysRemaining <= 7) {
      return 'group-token-label group-token-label--warning'
    }
  }

  // 正常状态或无天数：根据平台显示主题色
  if (props.platform === 'anthropic') {
    return 'group-token-label group-token-label--anthropic'
  }
  if (props.platform === 'openai') {
    return 'group-token-label group-token-label--openai'
  }
  if (props.platform === 'gemini') {
    return 'group-token-label group-token-label--gemini'
  }
  return 'group-token-label group-token-label--neutral'
})

const platformClass = computed(() => {
  if (props.platform === 'anthropic') return 'group-token--anthropic'
  if (props.platform === 'openai') return 'group-token--openai'
  if (props.platform === 'gemini') return 'group-token--gemini'
  return 'group-token--fallback'
})

// Badge color based on platform and subscription type
const badgeClass = computed(() => {
  const base = `${platformClass.value} ${isSubscription.value ? 'group-token--subscription' : 'group-token--standard'}`
  return base
})
</script>

<style scoped>
.group-token {
  --group-token-color: var(--anthropic-muted);
  --group-token-border: transparent;
  border: 0;
  background: transparent;
  color: var(--group-token-color);
  box-shadow: none;
  transition: none;
}

.group-token--anthropic {
  --group-token-color: var(--anthropic-warning);
}

.group-token--openai {
  --group-token-color: var(--anthropic-success);
}

.group-token--gemini {
  --group-token-color: var(--anthropic-info);
}

.group-token--fallback {
  --group-token-color: var(--anthropic-muted);
}

.group-token--subscription {
  border-style: solid;
}

.group-token--standard {
  border-style: solid;
}

.group-token-label {
  --group-token-label-color: var(--group-token-color);
  padding: 0.125rem 0.375rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--group-token-label-color);
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
}

.group-token-label--standard,
.group-token-label--neutral {
  --group-token-label-color: var(--anthropic-muted);
}

.group-token-label--anthropic {
  --group-token-label-color: var(--anthropic-warning);
}

.group-token-label--openai {
  --group-token-label-color: var(--anthropic-success);
}

.group-token-label--gemini {
  --group-token-label-color: var(--anthropic-info);
}

.group-token-label--warning {
  --group-token-label-color: var(--anthropic-warning);
}

.group-token-label--error {
  --group-token-label-color: var(--anthropic-error);
}
</style>

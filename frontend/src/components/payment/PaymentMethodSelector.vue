<template>
  <div>
    <label class="mb-2 block text-sm font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
      {{ t('payment.paymentMethod') }}
    </label>
    <div class="grid grid-cols-2 gap-3 sm:flex">
      <button data-testid="payment-payment-method-selector-button-button"
        v-for="method in sortedMethods"
        :key="method.type"
        type="button"
        :disabled="!method.available"
        :class="[
          'relative flex h-[60px] flex-col items-center justify-center rounded-lg border px-3 transition-all sm:flex-1',
          !method.available
            ? 'cursor-not-allowed border-[var(--anthropic-border)] bg-[var(--anthropic-section)] opacity-50 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]'
            : selected === method.type
              ? methodSelectedClass(method.type)
              : 'border-[var(--anthropic-border)] bg-[var(--anthropic-page)] text-[var(--anthropic-muted)] hover:border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)] dark:hover:border-dark-500',
        ]"
        @click="method.available && emit('select', method.type)"
      >
        <span class="flex items-center gap-2">
          <img :src="methodIcon(method.type)" :alt="t(`payment.methods.${method.type}`)" class="h-7 w-7 object-contain" />
          <span class="flex flex-col items-start leading-none">
            <span class="text-base font-semibold">{{ t(`payment.methods.${method.type}`) }}</span>
            <span
              v-if="method.fee_rate > 0"
              class="text-[10px] tracking-wide text-[var(--anthropic-muted)] dark:text-dark-400"
            >
              {{ t('payment.fee') }} {{ method.fee_rate }}%
            </span>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { METHOD_ORDER } from './providerConfig'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'
import stripeIcon from '@/assets/icons/stripe.svg'
import airwallexIcon from '@/assets/icons/airwallex.svg'

export interface PaymentMethodOption {
  type: string
  fee_rate: number
  available: boolean
}

const props = defineProps<{
  methods: PaymentMethodOption[]
  selected: string
}>()

const emit = defineEmits<{
  select: [type: string]
}>()

const { t } = useI18n()

const METHOD_ICONS: Record<string, string> = {
  alipay: alipayIcon,
  wxpay: wxpayIcon,
  stripe: stripeIcon,
  airwallex: airwallexIcon,
}

const sortedMethods = computed(() => {
  const order: readonly string[] = METHOD_ORDER
  return [...props.methods].sort((a, b) => {
    const ai = order.indexOf(a.type)
    const bi = order.indexOf(b.type)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

function methodIcon(type: string): string {
  if (type.includes('alipay')) return METHOD_ICONS.alipay
  if (type.includes('wxpay')) return METHOD_ICONS.wxpay
  if (type === 'airwallex') return METHOD_ICONS.airwallex
  return METHOD_ICONS[type] || alipayIcon
}

function methodSelectedClass(type: string): string {
  if (type.includes('alipay')) return 'border-[#02A9F1] bg-[var(--anthropic-info-bg)] text-[var(--anthropic-fg)] shadow-none dark:bg-[var(--anthropic-info-bg)] dark:text-[var(--anthropic-muted)]'
  if (type.includes('wxpay')) return 'border-[#09BB07] bg-green-50 text-[var(--anthropic-fg)] shadow-none dark:bg-green-950 dark:text-[var(--anthropic-muted)]'
  if (type === 'stripe') return 'border-[#141413] bg-accent-100 text-[var(--anthropic-fg)] shadow-none dark:bg-accent-950 dark:text-[var(--anthropic-muted)]'
  if (type === 'airwallex') return 'border-[#FF6B3D] bg-orange-50 text-[var(--anthropic-fg)] shadow-none dark:border-[#FF8E3C] dark:bg-orange-950 dark:text-[var(--anthropic-muted)]'
  return 'border-[var(--anthropic-fg)] bg-[var(--anthropic-page)] text-[var(--anthropic-fg)] shadow-none'
}
</script>

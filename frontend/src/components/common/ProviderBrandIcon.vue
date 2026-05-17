<template>
  <span
    class="provider-brand-icon"
    :title="title"
    :aria-label="title"
    :style="{
      backgroundColor: brand.background,
      borderColor: brand.border,
      color: brand.color,
    }"
  >
    <ModelIcon
      v-if="brand.iconModel"
      :model="brand.iconModel"
      size="18px"
      aria-hidden="true"
    />
    <span v-else class="provider-brand-tile" aria-hidden="true">
      {{ brand.label }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModelIcon from '@/components/common/ModelIcon.vue'
import { providerBrandInfo } from '@/utils/providerBrandIcon'

const props = defineProps<{
  provider?: string | null
  model?: string | null
}>()

const brand = computed(() => providerBrandInfo(props.provider, props.model))
const title = computed(() => props.provider || props.model || 'Provider')
</script>

<style scoped>
.provider-brand-icon {
  @apply inline-flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-transform duration-150;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 1px 2px rgba(15, 23, 42, 0.08);
}

.provider-brand-icon :deep(svg) {
  @apply flex-shrink-0;
}

.provider-brand-icon :deep(svg path) {
  fill: currentColor !important;
}

.provider-brand-tile {
  @apply inline-flex h-[18px] min-w-[18px] items-center justify-center px-0.5 text-[9px] font-bold leading-none;
  letter-spacing: 0;
}
</style>

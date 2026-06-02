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
      v-if="!brand.iconUrl && brand.iconModel"
      :model="brand.iconModel"
      size="95%"
      aria-hidden="true"
    />
    <img
      v-else-if="brand.iconUrl"
      class="provider-brand-image"
      :src="brand.iconUrl"
      alt=""
      loading="lazy"
      aria-hidden="true"
    >
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
  logoUrl?: string | null
}>()

const brand = computed(() => {
  const info = providerBrandInfo(props.provider, props.model)
  const logoUrl = props.logoUrl?.trim()
  if (!logoUrl) return info
  return {
    ...info,
    iconModel: null,
    iconUrl: logoUrl,
  }
})
const title = computed(() => props.provider || props.model || 'Provider')
</script>

<style scoped>
.provider-brand-icon {
  @apply inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-md transition-transform duration-150;
}

.provider-brand-icon :deep(.model-icon),
.provider-brand-icon :deep(svg) {
  @apply flex-shrink-0;
  width: 95%;
  height: 95%;
}

.provider-brand-icon :deep(svg path) {
  fill: currentColor !important;
}

.provider-brand-image {
  @apply flex-shrink-0 object-cover;
  width: 95%;
  height: 95%;
}

.provider-brand-tile {
  @apply inline-flex h-[18px] min-w-[18px] items-center justify-center px-0.5 text-[9px] font-bold leading-none;
  letter-spacing: 0;
}
</style>

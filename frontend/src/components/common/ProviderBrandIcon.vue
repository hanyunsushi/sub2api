<template>
  <span
    :class="[
      'provider-brand-icon',
      shouldUseTransparentShell ? 'provider-brand-transparent-shell' : '',
    ]"
    :title="title"
    :aria-label="title"
    :style="{
      backgroundColor: shouldUseTransparentShell ? 'transparent' : brand.background,
      borderColor: shouldUseTransparentShell ? 'transparent' : brand.border,
      color: brand.color,
    }"
  >
    <ModelIcon
      v-if="shouldRenderModelIcon || (!brand.iconUrl && brand.iconModel)"
      :model="brand.iconModel || ''"
      size="100%"
      aria-hidden="true"
    />
    <img
      v-else-if="brand.iconUrl"
      :class="[
        'provider-brand-image',
        imageMode === 'system' ? 'provider-brand-image-system' : 'provider-brand-image-custom',
      ]"
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
import { isSystemAILogoPresetURL, providerBrandInfo } from '@/utils/providerBrandIcon'

const props = defineProps<{
  provider?: string | null
  model?: string | null
  logoUrl?: string | null
  preferModelIcon?: boolean
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
const shouldRenderModelIcon = computed(() => props.preferModelIcon && brand.value.iconModel)
const imageMode = computed(() => isSystemAILogoPresetURL(brand.value.iconUrl) ? 'system' : 'custom')
const transparentSystemLogoIds = ['openai', 'claude', 'anthropic']
const shouldUseTransparentShell = computed(() => {
  const usesTransparentSystemLogo = imageMode.value === 'system' || Boolean(brand.value.iconModel)
  if (!usesTransparentSystemLogo) return false
  const value = `${props.provider || ''} ${props.model || ''} ${brand.value.iconModel || ''} ${brand.value.iconUrl || ''}`.toLowerCase()
  return transparentSystemLogoIds.some((id) => value.includes(id))
})
</script>

<style scoped>
.provider-brand-icon {
  @apply inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-md transition-transform duration-150;
}

.provider-brand-icon :deep(.model-icon),
.provider-brand-icon :deep(svg) {
  @apply flex-shrink-0;
  width: 100%;
  height: 100%;
}

.provider-brand-icon :deep(svg path) {
  fill: currentColor !important;
}

.provider-brand-image {
  @apply flex-shrink-0;
}

.provider-brand-image-system {
  @apply object-contain;
  width: 1.25rem;
  height: 1.25rem;
}

.provider-brand-image-custom {
  @apply object-cover;
  width: 100%;
  height: 100%;
}

.provider-brand-transparent-shell {
  background: transparent !important;
  border-color: transparent !important;
}

.provider-brand-tile {
  @apply inline-flex h-[18px] min-w-[18px] items-center justify-center px-0.5 text-[9px] font-bold leading-none;
  letter-spacing: 0;
}
</style>

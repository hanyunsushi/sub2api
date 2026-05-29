<template>
  <div class="logo-picker">
    <div class="logo-picker-preview" aria-hidden="true">
      <img v-if="normalizedValue" :src="normalizedValue" alt="" />
      <Icon v-else name="grid" size="sm" />
    </div>
    <div class="logo-picker-field">
      <label v-if="label" class="input-label">{{ label }}</label>
      <input
        :value="modelValue"
        type="url"
        class="input"
        :data-testid="inputTestId"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <p v-if="hint" class="input-hint">{{ hint }}</p>
    </div>
    <div class="logo-picker-presets" aria-label="AI logo presets">
      <button
        v-for="preset in aiLogoPresets"
        :key="preset.id"
        type="button"
        class="logo-picker-preset"
        :class="{ 'logo-picker-preset-active': normalizedValue === preset.url }"
        :title="preset.label"
        @click="selectPreset(preset.url)"
      >
        <img :src="preset.url" :alt="preset.label" loading="lazy" />
      </button>
      <span class="logo-picker-custom-label">Custom URL</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { aiLogoPresets } from '@/utils/providerBrandIcon'

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  hint?: string
  placeholder?: string
  inputTestId?: string
}>(), {
  label: '',
  hint: '',
  placeholder: 'https://unpkg.com/@lobehub/icons-static-png@1.91.0/light/openai.png',
  inputTestId: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const normalizedValue = computed(() => props.modelValue.trim())

function selectPreset(url: string) {
  emit('update:modelValue', url)
}
</script>

<style scoped>
.logo-picker-presets {
  @apply grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2 pt-1;
  flex: 0 0 100%;
}

.logo-picker-preset {
  @apply flex aspect-square items-center justify-center rounded-md border border-gray-200 bg-white p-1 transition dark:border-dark-700 dark:bg-dark-800;
}

.logo-picker-preset:hover,
.logo-picker-preset-active {
  border-color: var(--atelier-line-strong);
  background: var(--atelier-ui-hover-surface, var(--atelier-paper-2));
}

.logo-picker-preset img {
  @apply h-full w-full object-contain;
}

.logo-picker-custom-label {
  @apply col-span-full text-[11px] text-gray-500 dark:text-gray-400;
}
</style>

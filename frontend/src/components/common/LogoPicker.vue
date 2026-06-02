<template>
  <div class="logo-picker">
    <div class="logo-picker-preview" aria-hidden="true">
      <img
        v-if="normalizedValue"
        :class="previewImageClass"
        :src="normalizedValue"
        alt=""
      />
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
        @blur="rememberCurrentValue"
        @change="rememberCurrentValue"
        @input="handleInput(($event.target as HTMLInputElement).value)"
      />
      <p v-if="hint" class="input-hint">{{ hint }}</p>
    </div>
    <div class="logo-picker-presets" aria-label="AI logo presets">
      <button
        v-for="preset in mergedLogoPresets"
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
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { getPublicSettings as fetchPublicSettings } from '@/api/auth'
import { appendCustomAILogoPreset } from '@/api/aiLogoPresets'
import {
  getMergedAILogoPresets,
  isSystemAILogoPresetURL,
  rememberCustomAILogoPreset,
  setAILogoRuntimeConfig,
} from '@/utils/providerBrandIcon'

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
const previewImageClass = computed(() => [
  'logo-picker-preview-image',
  isSystemAILogoPresetURL(normalizedValue.value)
    ? 'logo-picker-preview-image-system'
    : 'logo-picker-preview-image-custom',
])
const logoPresetVersion = ref(0)
const mergedLogoPresets = computed(() => {
  logoPresetVersion.value
  return getMergedAILogoPresets()
})

function refreshMergedLogoPresets() {
  logoPresetVersion.value += 1
}

async function refreshLogoRuntimeConfig() {
  try {
    const settings = await fetchPublicSettings()
    setAILogoRuntimeConfig(settings)
    refreshMergedLogoPresets()
  } catch {
    refreshMergedLogoPresets()
  }
}

async function rememberLogoURL(url: string) {
  const normalized = url.trim()
  if (!normalized) return
  try {
    const result = await appendCustomAILogoPreset(normalized)
    setAILogoRuntimeConfig({
      custom_ai_logo_presets: result.custom_ai_logo_presets,
    })
  } catch {
    rememberCustomAILogoPreset(normalized)
  }
  refreshMergedLogoPresets()
}

function handleInput(value: string) {
  emit('update:modelValue', value)
}

function rememberCurrentValue() {
  void rememberLogoURL(props.modelValue)
}

function selectPreset(url: string) {
  void rememberLogoURL(url)
  emit('update:modelValue', url)
}

onMounted(() => {
  void refreshLogoRuntimeConfig()
})
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

.logo-picker-preview-image {
  display: block;
}

.logo-picker-preview-image-system {
  height: 1.75rem;
  max-width: 1.75rem;
  object-fit: contain;
  width: 1.75rem;
}

.logo-picker-preview-image-custom {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.logo-picker-custom-label {
  @apply col-span-full text-[11px] text-gray-500 dark:text-gray-400;
}
</style>

<template>
  <div class="custom-menu-icon-picker">
    <div class="custom-menu-icon-picker-preview" aria-hidden="true">
      <img
        v-if="isURLValue"
        :src="normalizedValue"
        alt=""
        class="custom-menu-icon-picker-preview-image"
      />
      <span
        v-else-if="normalizedValue"
        class="custom-menu-icon-picker-preview-svg"
        v-html="sanitizeSvg(normalizedValue)"
      ></span>
      <Icon v-else name="grid" size="sm" />
    </div>

    <div class="custom-menu-icon-picker-body">
      <ImageUpload
        :model-value="inlineSVGValue"
        mode="svg"
        size="sm"
        :upload-label="uploadLabel"
        :remove-label="removeLabel"
        @update:model-value="handleUploadValue"
      />

      <div class="custom-menu-icon-picker-url">
        <label class="input-label">{{ urlLabel }}</label>
        <input
          :value="isURLValue ? modelValue : ''"
          type="url"
          class="input font-mono text-sm"
          :placeholder="urlPlaceholder"
          @blur="rememberCurrentValue"
          @change="rememberCurrentValue"
          @input="handleURLInput(($event.target as HTMLInputElement).value)"
        />
        <p v-if="urlHint" class="input-hint mt-1.5">{{ urlHint }}</p>
      </div>

      <div v-if="mergedIconPresets.length" class="custom-menu-icon-picker-presets">
        <span class="custom-menu-icon-picker-presets-label">{{ presetsLabel }}</span>
        <button
          v-for="preset in mergedIconPresets"
          :key="preset.id"
          type="button"
          class="custom-menu-icon-picker-preset"
          :class="{ 'custom-menu-icon-picker-preset-active': normalizedValue === preset.url }"
          :title="preset.url"
          @click="selectPreset(preset.url)"
        >
          <img :src="preset.url" :alt="preset.label" loading="lazy" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { getPublicSettings as fetchPublicSettings } from '@/api/auth'
import { appendCustomMenuSVGIconPreset } from '@/api/customMenuIconPresets'
import { sanitizeSvg } from '@/utils/sanitize'
import {
  getMergedCustomMenuSVGIconPresets,
  isCustomMenuIconURL,
  rememberCustomMenuSVGIconPreset,
  setCustomMenuIconRuntimeConfig,
} from '@/utils/customMenuIconPresets'

const props = withDefaults(defineProps<{
  modelValue: string
  uploadLabel?: string
  removeLabel?: string
  urlLabel?: string
  urlPlaceholder?: string
  urlHint?: string
  presetsLabel?: string
}>(), {
  uploadLabel: 'Upload SVG',
  removeLabel: 'Remove',
  urlLabel: 'SVG image URL',
  urlPlaceholder: 'https://img.example.com/icon.svg',
  urlHint: '',
  presetsLabel: 'Saved SVG icons',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'presets-updated': [value: string[]]
}>()

const iconPresetVersion = ref(0)
const normalizedValue = computed(() => props.modelValue.trim())
const isURLValue = computed(() => isCustomMenuIconURL(normalizedValue.value))
const inlineSVGValue = computed(() => isURLValue.value ? '' : props.modelValue)
const mergedIconPresets = computed(() => {
  iconPresetVersion.value
  return getMergedCustomMenuSVGIconPresets()
})

function refreshMergedIconPresets() {
  iconPresetVersion.value += 1
}

async function refreshIconRuntimeConfig() {
  try {
    const settings = await fetchPublicSettings()
    setCustomMenuIconRuntimeConfig(settings)
    emit('presets-updated', settings.custom_menu_svg_icon_presets ?? [])
  } finally {
    refreshMergedIconPresets()
  }
}

async function rememberIconURL(url: string) {
  const normalized = url.trim()
  if (!normalized) return
  try {
    const result = await appendCustomMenuSVGIconPreset(normalized)
    setCustomMenuIconRuntimeConfig({
      custom_menu_svg_icon_presets: result.custom_menu_svg_icon_presets,
    })
    emit('presets-updated', result.custom_menu_svg_icon_presets)
  } catch {
    const presets = rememberCustomMenuSVGIconPreset(normalized)
    emit('presets-updated', presets.map((preset) => preset.url))
  }
  refreshMergedIconPresets()
}

function handleUploadValue(value: string) {
  emit('update:modelValue', value)
}

function handleURLInput(value: string) {
  emit('update:modelValue', value)
}

function rememberCurrentValue() {
  if (isURLValue.value) {
    void rememberIconURL(props.modelValue)
  }
}

function selectPreset(url: string) {
  void rememberIconURL(url)
  emit('update:modelValue', url)
}

onMounted(() => {
  void refreshIconRuntimeConfig()
})
</script>

<style scoped>
.custom-menu-icon-picker {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
}

.custom-menu-icon-picker-preview {
  align-items: center;
  background: rgba(255, 250, 240, 0.72);
  border: 1px solid rgba(23, 21, 18, 0.16);
  border-radius: 0.375rem;
  display: inline-flex;
  flex: 0 0 3.5rem;
  height: 3.5rem;
  justify-content: center;
  overflow: hidden;
  width: 3.5rem;
}

.custom-menu-icon-picker-preview-image {
  display: block;
  height: 1.75rem;
  object-fit: contain;
  width: 1.75rem;
}

.custom-menu-icon-picker-preview-svg {
  color: currentColor;
  display: block;
  height: 1.75rem;
  width: 1.75rem;
}

.custom-menu-icon-picker-preview-svg :deep(svg) {
  display: block;
  height: 100%;
  width: 100%;
}

.custom-menu-icon-picker-body {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 0.75rem;
}

.custom-menu-icon-picker-url {
  min-width: 0;
}

.custom-menu-icon-picker-presets {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr));
}

.custom-menu-icon-picker-presets-label {
  grid-column: 1 / -1;
  font-size: 0.6875rem;
  color: rgb(107 114 128);
}

.custom-menu-icon-picker-preset {
  align-items: center;
  aspect-ratio: 1;
  background: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  display: flex;
  justify-content: center;
  padding: 0.375rem;
}

.custom-menu-icon-picker-preset:hover,
.custom-menu-icon-picker-preset-active {
  border-color: var(--atelier-line-strong);
  background: var(--atelier-ui-hover-surface, var(--atelier-paper-2));
}

.custom-menu-icon-picker-preset img {
  display: block;
  height: 100%;
  object-fit: contain;
  width: 100%;
}
</style>

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
        <input data-testid="common-custom-menu-icon-picker-input-url"
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
        <div
          v-for="preset in mergedIconPresets"
          :key="preset.id"
          class="custom-menu-icon-picker-preset-frame"
        >
          <button data-testid="common-custom-menu-icon-picker-button-select-preset-preset-url"
            type="button"
            class="custom-menu-icon-picker-preset"
            :class="{ 'custom-menu-icon-picker-preset-active': normalizedValue === preset.url }"
            :title="preset.url"
            @click="selectPreset(preset.url)"
          >
            <img :src="preset.url" :alt="preset.label" loading="lazy" />
          </button>
          <button data-testid="common-custom-menu-icon-picker-button-delete-preset-preset-url"
            type="button"
            class="custom-menu-icon-picker-preset-delete"
            aria-label="Delete custom menu SVG icon"
            title="Delete custom menu SVG icon"
            @click.stop="deletePreset(preset.url)"
          >
            <span aria-hidden="true">×</span>
            <span class="sr-only">Custom menu SVG icon</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { getPublicSettings as fetchPublicSettings } from '@/api/auth'
import { appendCustomMenuSVGIconPreset, deleteCustomMenuSVGIconPreset } from '@/api/customMenuIconPresets'
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

async function deletePreset(url: string) {
  try {
    const result = await deleteCustomMenuSVGIconPreset(url)
    setCustomMenuIconRuntimeConfig({
      custom_menu_svg_icon_presets: result.custom_menu_svg_icon_presets,
    })
    emit('presets-updated', result.custom_menu_svg_icon_presets)
  } catch {
    const presets = getMergedCustomMenuSVGIconPresets()
      .filter((preset) => preset.url !== url)
      .map((preset) => preset.url)
    setCustomMenuIconRuntimeConfig({
      custom_menu_svg_icon_presets: presets,
    })
    emit('presets-updated', presets)
  }
  if (normalizedValue.value === url) {
    emit('update:modelValue', '')
  }
  refreshMergedIconPresets()
}

onMounted(() => {
  void refreshIconRuntimeConfig()
})
</script>

<style scoped>
.custom-menu-icon-picker { @apply flex items-start gap-3; }
.custom-menu-icon-picker-preview { @apply inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800; }
.custom-menu-icon-picker-preview-image { @apply block h-7 w-7 object-contain; }
.custom-menu-icon-picker-preview-svg { @apply block h-7 w-7; color: currentColor; }
.custom-menu-icon-picker-preview-svg :deep(svg) { @apply block h-full w-full; }
.custom-menu-icon-picker-body { @apply grid min-w-0 flex-1 gap-3; }
.custom-menu-icon-picker-url { @apply min-w-0; }
.custom-menu-icon-picker-presets { @apply grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-2; }
.custom-menu-icon-picker-preset-frame { @apply relative aspect-square; }
.custom-menu-icon-picker-presets-label { @apply col-span-full text-xs text-gray-500 dark:text-dark-400; }
.custom-menu-icon-picker-preset { @apply flex aspect-square h-full w-full items-center justify-center rounded-md border border-gray-200 bg-white p-1.5 dark:border-dark-600 dark:bg-dark-800; }
.custom-menu-icon-picker-preset:hover, .custom-menu-icon-picker-preset-active { @apply border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20; }
.custom-menu-icon-picker-preset img { @apply block h-full w-full object-contain; }
.custom-menu-icon-picker-preset-delete { @apply absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-bold leading-none text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-300; }
</style>

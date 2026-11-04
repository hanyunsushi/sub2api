<template>
  <!-- 侧边栏 / 顶栏：专用真实SF Regular默认/Fill；业务图形继续由原Icon与内联SVG负责。 -->
  <svg
    :class="/(?:^|\s)(?:h|size)-/.test(String($attrs.class || '')) ? undefined : sizeClass"
    :viewBox="resolved?.symbol.viewBox || '0 0 24 24'"
    :fill="resolved ? 'currentColor' : 'none'"
    :stroke="resolved ? 'none' : 'currentColor'"
    :stroke-width="resolved ? undefined : strokeWidth"
    :data-icon-library="resolved ? 'SF Symbols' : undefined"
    :data-icon-export="resolved ? `sf${resolved.exportName}` : undefined"
    :data-icon-weight="resolved ? 'Regular' : undefined"
    :data-icon-variant="resolved ? (filled ? 'fill' : 'default') : undefined"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
  >
    <template v-if="resolved">
      <path v-for="(path, index) in resolved.symbol.paths" :key="index" :d="path.d" :fill-opacity="path.fillOpacity" :fill-rule="path.fillRule" :clip-rule="path.clipRule" />
    </template>
    <path v-else stroke-linecap="round" stroke-linejoin="round" :d="preservedIcons[name as keyof typeof preservedIcons]" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveSfIcon, sfIconPairs, type SfIconName } from './sf-symbols'

const props = withDefaults(defineProps<{
  name: SfIconName | keyof typeof preservedIcons
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  strokeWidth?: number
  filled?: boolean
  label?: string
}>(), { size: 'md', strokeWidth: 1.5, filled: false })

const preservedIcons = {
  chevronDown: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
  chevronRight: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  chevronLeft: 'M15.75 19.5L8.25 12l7.5-7.5',
  chevronUp: 'M5 15l7-7 7 7',
  arrowRight: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
  arrowLeft: 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18',
  arrowUp: 'M5 10l7-7m0 0l7 7m-7-7v18',
  arrowDown: 'M19 14l-7 7m0 0l-7-7m7 7V3',
  arrowsUpDown: 'M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5',
  mcp: 'M3.98 11.4L11.59 3.79C12.64 2.74 14.34 2.74 15.39 3.79C16.44 4.84 16.44 6.54 15.39 7.59L9.64 13.34M9.72 13.26L15.39 7.59C16.44 6.54 18.14 6.54 19.2 7.59L19.24 7.63C20.29 8.68 20.29 10.39 19.24 11.44L12.35 18.32C12 18.67 12 19.24 12.35 19.59L13.77 21M13.49 5.69L7.86 11.32C6.81 12.37 6.81 14.07 7.86 15.12C8.91 16.17 10.61 16.17 11.67 15.12L17.29 9.49',
} as const

const resolved = computed(() => props.name in sfIconPairs ? resolveSfIcon(props.name as SfIconName, props.filled) : undefined)
const sizeClass = computed(() => ({ xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6', xl: 'h-8 w-8' }[props.size]))
</script>
